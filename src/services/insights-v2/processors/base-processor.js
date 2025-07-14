/**
 * Base Processor
 * Abstract base class for all insight processors
 */

import { InsightTypes, InsightCategories, DetectionMethods } from '../constants/insight-constants.js';

export class BaseProcessor {
    constructor(dependencies) {
        this.logger = dependencies.logger;
        this.db = dependencies.db;
        this.llmService = dependencies.llmService;
        this.embeddingService = dependencies.embeddingService;
        this.name = dependencies.name || 'unknown';
        
        // Processor configuration
        this.config = {
            maxRetries: 3,
            timeout: 30000,
            ...dependencies.config
        };
        
        // Metrics
        this.metrics = {
            processed: 0,
            errors: 0,
            totalDuration: 0
        };
    }

    /**
     * Process a memory to generate insights
     * Must be implemented by subclasses
     */
    async process(memory, options = {}) {
        throw new Error('process() must be implemented by subclass');
    }

    /**
     * Initialize processor (optional)
     */
    async initialize() {
        // Override in subclass if needed
    }

    /**
     * Cleanup processor resources (optional)
     */
    async cleanup() {
        // Override in subclass if needed
    }

    /**
     * Create base insight object
     */
    createBaseInsight(memory, {
        type = InsightTypes.GENERAL,
        category = InsightCategories.GENERAL,
        subcategory = null,
        title,
        summary,
        confidence = 0.5
    }) {
        return {
            insight_type: type,
            insight_category: category,
            insight_subcategory: subcategory,
            title: title || 'Untitled Insight',
            summary: summary || '',
            detailed_content: {},
            source_type: 'memory',
            source_ids: [memory.id],
            detection_method: this.getDetectionMethod(),
            detection_metadata: {
                processor: this.name,
                memory_type: memory.memory_type,
                timestamp: new Date().toISOString()
            },
            confidence_score: this.normalizeConfidence(confidence),
            project_id: memory.project_id,
            technologies: [],
            patterns: [],
            recommendations: [],
            evidence: [],
            tags: []
        };
    }

    /**
     * Get detection method for this processor
     */
    getDetectionMethod() {
        // Override in subclass
        return DetectionMethods.MANUAL;
    }

    /**
     * Normalize confidence score to 0-1 range
     */
    normalizeConfidence(confidence) {
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Add evidence to insight
     */
    addEvidence(insight, evidence) {
        if (!insight.evidence) {
            insight.evidence = [];
        }
        
        insight.evidence.push({
            type: evidence.type || 'text',
            content: evidence.content,
            source: evidence.source || 'memory',
            confidence: evidence.confidence || insight.confidence_score
        });
    }

    /**
     * Add recommendation to insight
     */
    addRecommendation(insight, recommendation) {
        if (!insight.recommendations) {
            insight.recommendations = [];
        }
        
        insight.recommendations.push({
            action: recommendation.action,
            priority: recommendation.priority || 'medium',
            reasoning: recommendation.reasoning || '',
            impact: recommendation.impact || 'medium'
        });
    }

    /**
     * Add pattern to insight
     */
    addPattern(insight, pattern) {
        if (!insight.patterns) {
            insight.patterns = [];
        }
        
        insight.patterns.push({
            name: pattern.name,
            category: pattern.category,
            signature: pattern.signature || this.generatePatternSignature(pattern),
            confidence: pattern.confidence || insight.confidence_score,
            evidence: pattern.evidence || []
        });
    }

    /**
     * Add technology to insight
     */
    addTechnology(insight, technology) {
        if (!insight.technologies) {
            insight.technologies = [];
        }
        
        // Check if already exists
        const exists = insight.technologies.some(t => 
            t.name === technology.name && t.category === technology.category
        );
        
        if (!exists) {
            insight.technologies.push({
                name: technology.name,
                category: technology.category || 'unknown',
                version: technology.version || null,
                confidence: technology.confidence || insight.confidence_score
            });
        }
    }

    /**
     * Generate pattern signature
     */
    generatePatternSignature(pattern) {
        return `${pattern.category}_${pattern.name}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
    }

    /**
     * Extract text snippet from memory
     */
    extractSnippet(memory, maxLength = 200) {
        const content = memory.content || memory.summary || '';
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + '...';
    }

    /**
     * Update processor metrics
     */
    updateMetrics(duration, success = true) {
        this.metrics.processed++;
        this.metrics.totalDuration += duration;
        if (!success) {
            this.metrics.errors++;
        }
    }

    /**
     * Get processor health
     */
    getHealth() {
        const avgDuration = this.metrics.processed > 0 
            ? this.metrics.totalDuration / this.metrics.processed 
            : 0;
            
        return {
            name: this.name,
            processed: this.metrics.processed,
            errors: this.metrics.errors,
            errorRate: this.metrics.processed > 0 
                ? (this.metrics.errors / this.metrics.processed * 100).toFixed(2) + '%' 
                : '0%',
            avgDuration: Math.round(avgDuration)
        };
    }

    /**
     * Check if memory should be processed
     */
    shouldProcess(memory, options = {}) {
        // Override in subclass for specific logic
        return true;
    }

    /**
     * Handle processing errors
     */
    handleError(error, memory) {
        this.logger.error(`${this.name} processor error for memory ${memory.id}:`, error);
        
        // Return error insight for tracking
        return this.createBaseInsight(memory, {
            type: InsightTypes.GENERAL,
            category: InsightCategories.GENERAL,
            title: `Processing Error in ${this.name}`,
            summary: `Failed to process memory: ${error.message}`,
            confidence: 0.1
        });
    }
}

export default BaseProcessor;