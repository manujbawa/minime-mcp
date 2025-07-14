/**
 * Unified Insights v2 Service
 * 
 * Core orchestrator that coordinates all insight operations
 * Uses dependency injection and plugin architecture
 */

import { EventEmitter } from 'events';
import { InsightProcessorFactory } from './processors/processor-factory.js';
import { InsightEnricherFactory } from './enrichers/enricher-factory.js';
import { InsightStorageService } from './storage/insight-storage-service.js';
import { InsightQueryService } from './query/insight-query-service.js';
import { InsightQueueService } from './queue/insight-queue-service.js';
import { validateConfig } from './config/config-validator.js';
// Logger is passed via dependency injection

export class UnifiedInsightsV2Service extends EventEmitter {
    constructor(dependencies, config = {}) {
        super();
        
        // Validate configuration
        const validatedConfig = validateConfig(config);
        
        // Use injected logger
        this.logger = dependencies.logger;
        
        // Core dependencies
        this.db = dependencies.databaseService;
        this.embeddingService = dependencies.embeddingService;
        this.llmService = dependencies.llmService;
        
        // Configuration
        this.config = {
            ...this.getDefaultConfig(),
            ...validatedConfig
        };
        
        // Initialize services
        this.initializeServices(dependencies);
        
        // State management
        this.isInitialized = false;
        this.metrics = {
            processed: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    getDefaultConfig() {
        return {
            processing: {
                realTimeEnabled: true,
                batchSize: 10,
                maxConcurrent: 5,
                timeout: 30000
            },
            storage: {
                deduplicationWindow: '24 hours',
                archiveAfterDays: 90
            },
            enrichment: {
                enablePatternMatching: true,
                enableRelationshipFinding: true,
                enableTechnologyExtraction: true
            },
            quality: {
                minConfidenceScore: 0.3,
                requireValidation: false
            }
        };
    }

    initializeServices(dependencies) {
        // Storage service
        this.storage = new InsightStorageService({
            db: this.db,
            logger: this.logger,
            config: this.config.storage
        });
        
        // Query service
        this.query = new InsightQueryService({
            db: this.db,
            embeddingService: this.embeddingService,
            logger: this.logger,
            config: this.config.query
        });
        
        // Queue service for async processing
        this.queue = new InsightQueueService({
            db: this.db,
            logger: this.logger,
            config: this.config.queue
        });
        
        // Processor factory - handles different insight generation methods
        this.processorFactory = new InsightProcessorFactory({
            llmService: this.llmService,
            embeddingService: this.embeddingService,
            db: this.db,
            logger: this.logger
        });
        
        // Enricher factory - adds context and relationships
        this.enricherFactory = new InsightEnricherFactory({
            db: this.db,
            embeddingService: this.embeddingService,
            logger: this.logger
        });
    }

    /**
     * Initialize the service and all components
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        try {
            this.logger.info('Initializing Unified Insights v2 Service...');
            
            // Initialize processors
            await this.processorFactory.initialize();
            
            // Initialize enrichers
            await this.enricherFactory.initialize();
            
            // Start queue processor if enabled
            if (this.config.processing.queueEnabled) {
                await this.queue.start();
            }
            
            this.isInitialized = true;
            this.emit('initialized');
            
            this.logger.info('Unified Insights v2 Service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize Unified Insights v2:', error);
            throw error;
        }
    }

    /**
     * Process a memory to generate insights
     * @param {Object} memory - Memory object to process
     * @param {Object} options - Processing options
     */
    async processMemory(memory, options = {}) {
        const startTime = Date.now();
        const processingId = this.generateProcessingId();
        
        try {
            this.logger.info(`[UnifiedInsightsV2] Starting to process memory ${memory.id}`, {
                memoryType: memory.memory_type,
                contentLength: memory.content?.length,
                options: options
            });
            
            // Determine processing strategy
            const strategy = this.determineStrategy(memory, options);
            this.logger.info(`[UnifiedInsightsV2] Strategy determined for memory ${memory.id}:`, {
                processors: strategy.processors,
                priority: strategy.priority
            });
            
            // Get appropriate processors
            const processors = await this.processorFactory.getProcessors(strategy);
            this.logger.info(`[UnifiedInsightsV2] Got ${processors.length} processors for memory ${memory.id}`);
            
            // Process with each processor
            const insights = [];
            for (const processor of processors) {
                try {
                    this.logger.info(`[UnifiedInsightsV2] Running processor ${processor.name} on memory ${memory.id}`);
                    const processorInsights = await processor.process(memory, {
                        ...options,
                        processingId
                    });
                    this.logger.info(`[UnifiedInsightsV2] Processor ${processor.name} returned ${processorInsights.length} insights`);
                    insights.push(...processorInsights);
                } catch (error) {
                    this.logger.error(`[UnifiedInsightsV2] Processor ${processor.name} failed:`, error);
                    this.metrics.errors++;
                }
            }
            
            // Deduplicate insights
            this.logger.info(`[UnifiedInsightsV2] Total insights before deduplication: ${insights.length}`);
            const uniqueInsights = await this.deduplicateInsights(insights);
            this.logger.info(`[UnifiedInsightsV2] Insights after deduplication: ${uniqueInsights.length}`);
            
            // Enrich insights
            const enrichedInsights = await this.enrichInsights(uniqueInsights, memory);
            this.logger.info(`[UnifiedInsightsV2] Insights after enrichment: ${enrichedInsights.length}`);
            
            // Validate insights
            const validInsights = await this.validateInsights(enrichedInsights);
            this.logger.info(`[UnifiedInsightsV2] Valid insights after validation: ${validInsights.length}`);
            
            // Store insights
            const storedInsights = await this.storage.storeInsights(validInsights, {
                processingId,
                memoryId: memory.id
            });
            this.logger.info(`[UnifiedInsightsV2] Stored ${storedInsights.length} insights for memory ${memory.id}`);
            
            // Update metrics
            this.metrics.processed++;
            
            // Emit event
            this.emit('memory:processed', {
                memoryId: memory.id,
                insightsGenerated: storedInsights.length,
                duration: Date.now() - startTime,
                processingId
            });
            
            return {
                success: true,
                insights: storedInsights,
                metrics: {
                    duration: Date.now() - startTime,
                    insightsGenerated: storedInsights.length
                }
            };
            
        } catch (error) {
            this.logger.error(`Failed to process memory ${memory.id}:`, error);
            this.metrics.errors++;
            
            this.emit('memory:error', {
                memoryId: memory.id,
                error: error.message,
                processingId
            });
            
            throw error;
        }
    }

    /**
     * Process multiple memories in batch
     */
    async processBatch(memories, options = {}) {
        const results = {
            successful: 0,
            failed: 0,
            insights: []
        };

        // Process in controlled concurrency
        const concurrency = options.concurrency || this.config.processing.maxConcurrent;
        const chunks = this.chunkArray(memories, concurrency);

        for (const chunk of chunks) {
            const promises = chunk.map(memory => 
                this.processMemory(memory, options)
                    .then(result => {
                        results.successful++;
                        results.insights.push(...result.insights);
                    })
                    .catch(error => {
                        results.failed++;
                        this.logger.error(`Batch processing error for memory ${memory.id}:`, error);
                    })
            );
            
            await Promise.all(promises);
        }

        return results;
    }

    /**
     * Query insights with flexible filtering
     */
    async queryInsights(criteria = {}, options = {}) {
        return await this.query.search(criteria, options);
    }

    /**
     * Get insights using analysis type (for MCP compatibility)
     */
    async getInsights(analysisType, filters = {}) {
        // Map analysis types to query criteria
        const criteriaMap = {
            comprehensive: {
                includeAllCategories: true,
                includeRelationships: true
            },
            patterns: {
                categories: ['architectural', 'design', 'api'],
                insightTypes: ['pattern']
            },
            learning: {
                categories: ['learning', 'progress'],
                includeTimeline: true
            },
            progress: {
                insightTypes: ['progress', 'milestone'],
                includeMetrics: true
            },
            quality: {
                categories: ['quality', 'testing', 'code_quality'],
                insightTypes: ['bug', 'code_smell', 'improvement']
            },
            productivity: {
                categories: ['productivity', 'efficiency'],
                includeMetrics: true
            },
            technical_debt: {
                categories: ['debt', 'refactoring', 'maintenance'],
                insightTypes: ['debt', 'anti_pattern']
            }
        };

        const criteria = {
            ...criteriaMap[analysisType] || {},
            ...filters
        };

        const results = await this.queryInsights(criteria, {
            includeEvidence: true,
            includeRecommendations: true,
            limit: filters.limit || 50
        });

        return this.formatInsightsResponse(results, analysisType);
    }

    /**
     * Queue insights for async processing
     */
    async queueForProcessing(taskType, sourceIds, options = {}) {
        return await this.queue.enqueue({
            taskType,
            sourceIds,
            priority: options.priority || 5,
            payload: options.payload || {}
        });
    }

    /**
     * Determine processing strategy based on memory and options
     */
    determineStrategy(memory, options) {
        const strategy = {
            processors: [],
            priority: 'normal'
        };

        // Real-time processing
        if (options.realTime || this.config.processing.realTimeEnabled) {
            strategy.processors.push('llm_category');
            strategy.priority = 'high';
        }

        // Memory type specific processors - comprehensive mapping for all types
        const typeProcessorMap = {
            // Legacy types
            'code': ['pattern_detector', 'code_analyzer'],
            'bug': ['bug_analyzer', 'pattern_detector'],
            'decision': ['decision_analyzer'],
            'insight': ['pattern_detector', 'llm_category'],
            'general': ['llm_category', 'pattern_detector'],
            'progress': ['pattern_detector', 'llm_category'],
            'summary': ['pattern_detector', 'llm_category'],
            'release_version': ['pattern_detector'],
            'prd': ['pattern_detector', 'llm_category'],
            
            // Memory Bank types
            'project_brief': ['pattern_detector', 'llm_category'],
            'product_context': ['pattern_detector', 'llm_category'],
            'active_context': ['llm_category', 'pattern_detector'],
            'system_patterns': ['pattern_detector', 'code_analyzer'],
            'tech_context': ['pattern_detector', 'code_analyzer'],
            'tech_reference': ['pattern_detector', 'code_analyzer'],
            'architecture': ['pattern_detector', 'code_analyzer'],
            'requirements': ['pattern_detector', 'llm_category'],
            'design_decisions': ['decision_analyzer', 'pattern_detector'],
            'implementation_notes': ['pattern_detector', 'code_analyzer'],
            'lessons_learned': ['pattern_detector', 'llm_category'],
            'task': ['llm_category'],
            'rule': ['pattern_detector', 'llm_category'],
            'reasoning': ['pattern_detector', 'llm_category'],
            'project_brief_doc': ['pattern_detector', 'llm_category'],
            'project_prd': ['pattern_detector', 'llm_category'],
            'project_plan': ['pattern_detector', 'llm_category'],
            
            // Additional types that might exist
            'thinking_sequence': ['pattern_detector', 'llm_category'],
            'pattern_library_v2': ['pattern_detector', 'code_analyzer']
        };

        const typeProcessors = typeProcessorMap[memory.memory_type] || [];
        strategy.processors.push(...typeProcessors);

        // Template-based processing for comprehensive analysis
        if (options.comprehensive || memory.importance_score > 0.8) {
            strategy.processors.push('template_processor');
        }

        // Ensure llm_category runs by default if no processors selected
        if (strategy.processors.length === 0) {
            this.logger.warn(`No processors found for memory type: ${memory.memory_type}, using llm_category as default`);
            strategy.processors.push('llm_category');
        }

        // Remove duplicates
        strategy.processors = [...new Set(strategy.processors)];

        return strategy;
    }

    /**
     * Deduplicate insights based on content similarity
     */
    async deduplicateInsights(insights) {
        const unique = [];
        const seen = new Set();

        for (const insight of insights) {
            const signature = this.generateInsightSignature(insight);
            
            if (!seen.has(signature)) {
                seen.add(signature);
                unique.push(insight);
            } else {
                // Merge confidence scores if duplicate
                const existing = unique.find(i => 
                    this.generateInsightSignature(i) === signature
                );
                if (existing) {
                    existing.confidence_score = Math.max(
                        existing.confidence_score,
                        insight.confidence_score
                    );
                }
            }
        }

        return unique;
    }

    /**
     * Enrich insights with additional context
     */
    async enrichInsights(insights, memory) {
        const enrichers = await this.enricherFactory.getEnrichers(
            this.config.enrichment
        );

        const enrichedInsights = [];

        for (const insight of insights) {
            let enriched = { ...insight };

            for (const enricher of enrichers) {
                try {
                    enriched = await enricher.enrich(enriched, memory);
                } catch (error) {
                    this.logger.error(`Enricher ${enricher.name} failed:`, error);
                }
            }

            enrichedInsights.push(enriched);
        }

        return enrichedInsights;
    }

    /**
     * Validate insights meet quality standards
     */
    async validateInsights(insights) {
        const beforeCount = insights.length;
        const validated = [];
        
        for (const insight of insights) {
            // Start with pending validation status
            insight.validation_status = 'pending';
            insight.validation_stage = 'quality_check';
            
            // Check minimum confidence
            if (insight.confidence_score < this.config.quality.minConfidenceScore) {
                this.logger.info(`[UnifiedInsightsV2] Insight rejected - low confidence: ${insight.confidence_score} < ${this.config.quality.minConfidenceScore}`);
                insight.validation_status = 'rejected';
                insight.validation_reason = `Confidence score ${insight.confidence_score} below minimum ${this.config.quality.minConfidenceScore}`;
                continue;
            }

            // Check required fields
            const requiredFields = ['title', 'summary', 'insight_type', 'insight_category'];
            let missingField = null;
            for (const field of requiredFields) {
                if (!insight[field]) {
                    missingField = field;
                    break;
                }
            }
            
            if (missingField) {
                this.logger.info(`[UnifiedInsightsV2] Insight rejected - missing field: ${missingField}`);
                insight.validation_status = 'rejected';
                insight.validation_reason = `Missing required field: ${missingField}`;
                continue;
            }

            // Check for minimum content quality
            if (insight.summary && insight.summary.length < 10) {
                this.logger.info(`[UnifiedInsightsV2] Insight rejected - summary too short`);
                insight.validation_status = 'rejected';
                insight.validation_reason = 'Summary too short (< 10 characters)';
                continue;
            }
            
            // Check for duplicate signatures within this batch
            const signature = this.generateInsightSignature(insight);
            const isDuplicate = validated.some(v => 
                this.generateInsightSignature(v) === signature
            );
            
            if (isDuplicate) {
                this.logger.info(`[UnifiedInsightsV2] Insight rejected - duplicate in batch`);
                insight.validation_status = 'rejected';
                insight.validation_reason = 'Duplicate insight in current batch';
                continue;
            }

            // Passed all validation checks
            insight.validation_status = 'validated';
            insight.validation_stage = 'completed';
            insight.validation_reason = null;
            validated.push(insight);
        }
        
        this.logger.info(`[UnifiedInsightsV2] Validation: ${validated.length} passed out of ${beforeCount} (rejected: ${beforeCount - validated.length})`);
        return validated;
    }

    /**
     * Generate unique signature for insight
     */
    generateInsightSignature(insight) {
        const key = `${insight.insight_type}_${insight.insight_category}_${insight.title}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
        return key;
    }

    /**
     * Generate processing ID for tracking
     */
    generateProcessingId() {
        return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Format insights response for API
     */
    formatInsightsResponse(results, analysisType) {
        return {
            analysis_type: analysisType,
            insights: results.insights,
            metadata: {
                total_found: results.total,
                confidence_distribution: this.calculateConfidenceDistribution(results.insights),
                categories: this.extractCategories(results.insights),
                time_range: results.timeRange,
                processing_version: 'v2'
            },
            recommendations: this.extractRecommendations(results.insights),
            evidence: this.extractEvidence(results.insights)
        };
    }

    /**
     * Calculate confidence distribution
     */
    calculateConfidenceDistribution(insights) {
        const ranges = {
            high: 0,    // 0.8-1.0
            medium: 0,  // 0.5-0.8
            low: 0      // 0-0.5
        };

        insights.forEach(insight => {
            if (insight.confidence_score >= 0.8) ranges.high++;
            else if (insight.confidence_score >= 0.5) ranges.medium++;
            else ranges.low++;
        });

        return ranges;
    }

    /**
     * Extract unique categories from insights
     */
    extractCategories(insights) {
        const categories = new Set();
        insights.forEach(insight => {
            categories.add(insight.insight_category);
            if (insight.insight_subcategory) {
                categories.add(insight.insight_subcategory);
            }
        });
        return Array.from(categories);
    }

    /**
     * Extract recommendations from insights
     */
    extractRecommendations(insights) {
        const recommendations = [];
        insights.forEach(insight => {
            if (insight.recommendations && Array.isArray(insight.recommendations)) {
                recommendations.push(...insight.recommendations);
            }
        });
        return recommendations;
    }

    /**
     * Extract evidence from insights
     */
    extractEvidence(insights) {
        const evidence = [];
        insights.forEach(insight => {
            if (insight.evidence && Array.isArray(insight.evidence)) {
                evidence.push(...insight.evidence);
            }
        });
        return evidence;
    }

    /**
     * Chunk array for concurrent processing
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Get service health and metrics
     */
    getHealth() {
        const uptime = Date.now() - this.metrics.startTime;
        const processingRate = this.metrics.processed / (uptime / 1000);

        return {
            status: this.isInitialized ? 'healthy' : 'not_initialized',
            version: 'v2',
            uptime,
            metrics: {
                processed: this.metrics.processed,
                errors: this.metrics.errors,
                processingRate: processingRate.toFixed(2),
                errorRate: (this.metrics.errors / Math.max(1, this.metrics.processed) * 100).toFixed(2) + '%'
            },
            config: {
                realTimeEnabled: this.config.processing.realTimeEnabled,
                enrichmentEnabled: Object.values(this.config.enrichment).some(v => v === true)
            }
        };
    }

    /**
     * Shutdown service gracefully
     */
    async shutdown() {
        this.logger.info('Shutting down Unified Insights v2 Service...');
        
        // Stop queue processing
        if (this.queue) {
            await this.queue.stop();
        }
        
        // Cleanup processors
        if (this.processorFactory) {
            await this.processorFactory.cleanup();
        }
        
        // Cleanup enrichers
        if (this.enricherFactory) {
            await this.enricherFactory.cleanup();
        }
        
        this.isInitialized = false;
        this.emit('shutdown');
        
        this.logger.info('Unified Insights v2 Service shut down complete');
    }
}

export default UnifiedInsightsV2Service;