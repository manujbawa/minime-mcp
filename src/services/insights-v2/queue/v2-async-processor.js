/**
 * V2 Async Processor
 * Processes all unprocessed memories to generate insights
 * Similar to mini-insights processing but for v2
 */

// Using numeric IDs as the table uses SERIAL PRIMARY KEY

export class V2AsyncProcessor {
    constructor(dependencies) {
        this.db = dependencies.db;
        this.logger = dependencies.logger;
        this.unifiedInsightsService = dependencies.unifiedInsightsV2;
        this.processorFactory = dependencies.processorFactory; // Add missing dependency
        this.isProcessing = false;
        this.currentJobId = null;
        this.processingStats = {
            processed: 0,
            errors: 0,
            insights: 0
        };
    }

    /**
     * Main processing method - called by job scheduler
     */
    async processUnprocessedMemories() {
        // Check if already processing
        if (this.isProcessing) {
            this.logger.info('[V2AsyncProcessor] Already processing, skipping run');
            return { skipped: true, reason: 'already_processing' };
        }

        try {
            this.isProcessing = true;
            // We'll get the job ID after inserting into the database
            this.resetStats();

            // Create job record and get the ID
            this.currentJobId = await this.createJobRecord();
            
            this.logger.info(`[V2AsyncProcessor] Starting job ${this.currentJobId}`);

            // Get all unprocessed memories
            const memories = await this.getUnprocessedMemories();
            
            if (memories.length === 0) {
                this.logger.info('[V2AsyncProcessor] No unprocessed memories found');
                await this.completeJob('no_memories');
                return { processed: 0, message: 'No memories to process' };
            }

            this.logger.info(`[V2AsyncProcessor] Found ${memories.length} memories to process`);

            // NEW: Cluster memories before processing
            let clusters = [];
            let unclustered = memories; // Default to all memories unclustered
            
            try {
                const clusterResult = await this.clusterMemories(memories);
                clusters = clusterResult.clusters || [];
                unclustered = clusterResult.unclustered || memories;
                this.logger.info(`[V2AsyncProcessor] Created ${clusters.length} clusters, ${unclustered.length} unclustered memories`);
            } catch (error) {
                this.logger.error('[V2AsyncProcessor] Clustering failed, processing all memories individually:', error);
                unclustered = memories;
            }

            // Process clusters first (higher priority)
            if (clusters.length > 0) {
                this.logger.info(`[V2AsyncProcessor] Processing ${clusters.length} memory clusters`);
                await this.processClusters(clusters);
            }

            // Then process unclustered memories individually
            if (unclustered.length > 0) {
                this.logger.info(`[V2AsyncProcessor] Processing ${unclustered.length} individual memories`);
                
                // Process in parallel batches for efficiency
                const batchSize = 10; // Process 10 memories in parallel
                const batches = this.createBatches(unclustered, batchSize);

                for (const [index, batch] of batches.entries()) {
                    this.logger.info(`[V2AsyncProcessor] Processing batch ${index + 1}/${batches.length} with ${batch.length} memories`);
                    
                    // Process batch in parallel
                    const promises = batch.map(memory => this.processMemory(memory));
                    const results = await Promise.allSettled(promises);
                    
                    // Log batch results
                    const successful = results.filter(r => r.status === 'fulfilled').length;
                    const failed = results.filter(r => r.status === 'rejected').length;
                    this.logger.info(`[V2AsyncProcessor] Batch ${index + 1} results: ${successful} successful, ${failed} failed`);
                    
                    // Update job progress
                    await this.updateJobProgress();
                }
            }

            // Complete job
            await this.completeJob('success');

            const result = {
                jobId: this.currentJobId,
                processed: this.processingStats.processed,
                errors: this.processingStats.errors,
                insights: this.processingStats.insights,
                duration: Date.now() - this.jobStartTime
            };

            this.logger.info('[V2AsyncProcessor] Job completed', result);
            return result;

        } catch (error) {
            this.logger.error('[V2AsyncProcessor] Job failed:', error);
            await this.completeJob('failed', error.message);
            throw error;
        } finally {
            this.isProcessing = false;
            this.currentJobId = null;
        }
    }

    /**
     * Get memories that haven't been processed by v2
     */
    async getUnprocessedMemories() {
        // Get memories that:
        // 1. Are in 'ready' status (have embeddings)
        // 2. Haven't been processed by v2 yet
        // 3. Are not currently being processed by another job
        const result = await this.db.query(`
            WITH processed_memory_ids AS (
                -- Get memory IDs that have already been processed by v2
                SELECT DISTINCT unnest(source_ids) as memory_id
                FROM unified_insights_v2
                WHERE source_type = 'memory'
                AND system_version = 'v2'
            ),
            processing_memory_ids AS (
                -- Get memory IDs currently being processed
                SELECT DISTINCT unnest(source_ids) as memory_id
                FROM insight_processing_queue_v2
                WHERE status IN ('pending', 'processing')
                AND source_type = 'memory'
            )
            SELECT 
                m.id,
                m.content,
                m.memory_type,
                m.project_id,
                m.metadata,
                m.created_at,
                m.importance_score,
                m.smart_tags,
                m.embedding,
                m.summary,
                p.name as project_name
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            WHERE m.processing_status = 'ready'
                AND m.id NOT IN (SELECT memory_id FROM processed_memory_ids)
                AND m.id NOT IN (SELECT memory_id FROM processing_memory_ids)
                AND m.content IS NOT NULL
                AND LENGTH(m.content) > 10
            ORDER BY m.importance_score DESC, m.created_at DESC
            LIMIT 1000
        `);

        return result.rows;
    }

    /**
     * Process a single memory
     */
    async processMemory(memory) {
        try {
            this.logger.info(`[V2AsyncProcessor] Starting to process memory ${memory.id}`, {
                type: memory.memory_type,
                contentLength: memory.content?.length
            });
            
            // Call unified insights service
            const result = await this.unifiedInsightsService.processMemory(memory, {
                realTime: true, // Enable LLM processing
                comprehensive: true,
                processingJobId: this.currentJobId
            });

            this.logger.info(`[V2AsyncProcessor] Memory ${memory.id} processed, got ${result.insights?.length || 0} insights`);

            this.processingStats.processed++;
            this.processingStats.insights += result.insights?.length || 0;

            // Only mark memory as processed if insights were generated
            if (result.insights && result.insights.length > 0) {
                await this.markMemoryProcessed(memory.id);
                this.logger.info(`[V2AsyncProcessor] Memory ${memory.id} marked as processed with ${result.insights.length} insights`);
            } else {
                this.logger.warn(`[V2AsyncProcessor] Memory ${memory.id} NOT marked as processed - no insights generated`);
            }

            return result;

        } catch (error) {
            this.logger.error(`[V2AsyncProcessor] Failed to process memory ${memory.id}:`, error);
            this.processingStats.errors++;
            
            // Record error for retry
            await this.recordProcessingError(memory.id, error.message);
            
            throw error;
        }
    }

    /**
     * Create job record in processing queue
     */
    async createJobRecord() {
        this.jobStartTime = Date.now();
        
        const result = await this.db.query(`
            INSERT INTO insight_processing_queue_v2 (
                task_type,
                task_priority,
                source_type,
                source_ids,
                task_payload,
                status,
                processor_id,
                started_at,
                created_at
            ) VALUES (
                'batch_memory_processing', 1, 'batch', '{}', 
                $1, 'processing', $2, NOW(), NOW()
            )
            RETURNING id
        `, [
            { batchType: 'full_memory_scan', version: 'v2' },
            `v2_processor_${process.pid}`
        ]);
        
        return result.rows[0].id;
    }

    /**
     * Update job progress
     */
    async updateJobProgress() {
        await this.db.query(`
            UPDATE insight_processing_queue_v2
            SET 
                task_payload = jsonb_set(
                    task_payload, 
                    '{progress}', 
                    $2::jsonb
                ),
                updated_at = NOW()
            WHERE id = $1
        `, [
            this.currentJobId,
            JSON.stringify(this.processingStats)
        ]);
    }

    /**
     * Complete job
     */
    async completeJob(status, errorMessage = null) {
        const finalStatus = status === 'success' ? 'completed' : 'failed';
        
        await this.db.query(`
            UPDATE insight_processing_queue_v2
            SET 
                status = $2,
                completed_at = NOW(),
                result_summary = $3,
                insights_generated = $4,
                error_message = $5
            WHERE id = $1
        `, [
            this.currentJobId,
            finalStatus,
            { 
                processed: this.processingStats.processed,
                errors: this.processingStats.errors,
                duration: Date.now() - this.jobStartTime
            },
            this.processingStats.insights,
            errorMessage
        ]);
    }

    /**
     * Mark memory as processed by v2
     */
    async markMemoryProcessed(memoryId) {
        // Create a tracking record (we could also use a separate tracking table)
        await this.db.query(`
            INSERT INTO unified_insights_v2 (
                insight_type,
                insight_category,
                title,
                summary,
                source_type,
                source_ids,
                detection_method,
                system_version,
                confidence_score,
                custom_metadata
            ) VALUES (
                'processing_marker',
                'system',
                'Memory Processed',
                'Memory processed by v2 async job',
                'memory',
                $1,
                'batch_processing',
                'v2',
                1.0,
                $2
            )
            ON CONFLICT DO NOTHING
        `, [
            [memoryId],
            { 
                processingJobId: this.currentJobId,
                processedAt: new Date().toISOString(),
                isMarker: true
            }
        ]);
    }

    /**
     * Record processing error for retry
     */
    async recordProcessingError(memoryId, errorMessage) {
        await this.db.query(`
            INSERT INTO insight_processing_queue_v2 (
                task_type,
                task_priority,
                source_type,
                source_ids,
                task_payload,
                status,
                error_message,
                created_at
            ) VALUES (
                'memory_retry',
                5,
                'memory',
                $1,
                $2,
                'failed',
                $3,
                NOW()
            )
        `, [
            [memoryId],
            { originalJobId: this.currentJobId },
            errorMessage
        ]);
    }

    /**
     * Create batches for parallel processing
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Reset processing stats
     */
    resetStats() {
        this.processingStats = {
            processed: 0,
            errors: 0,
            insights: 0
        };
    }

    /**
     * Check if processor is currently running
     */
    isRunning() {
        return this.isProcessing;
    }

    /**
     * Get current job status
     */
    getCurrentJobStatus() {
        if (!this.currentJobId) {
            return null;
        }

        return {
            jobId: this.currentJobId,
            isProcessing: this.isProcessing,
            stats: this.processingStats,
            startTime: this.jobStartTime,
            duration: Date.now() - this.jobStartTime
        };
    }

    /**
     * Cluster memories based on similarity
     */
    async clusterMemories(memories) {
        this.logger.info(`[V2AsyncProcessor] Starting clustering for ${memories.length} memories`);
        const clusters = [];
        const clustered = new Set();
        
        // Get configurable thresholds
        const thresholds = this.dependencies.configThresholds || {
            get: (path) => {
                const defaults = {
                    'clustering.minClusterSize': 2,
                    'clustering.hybridThreshold': 0.5
                };
                return defaults[path];
            }
        };
        
        const minClusterSize = thresholds.get('clustering.minClusterSize');
        const similarityThreshold = thresholds.get('clustering.hybridThreshold');
        
        // Group by memory type first for efficiency
        const typeGroups = memories.reduce((groups, memory) => {
            if (!groups[memory.memory_type]) {
                groups[memory.memory_type] = [];
            }
            groups[memory.memory_type].push(memory);
            return groups;
        }, {});

        // Find clusters within each type
        for (const [type, typeMemories] of Object.entries(typeGroups)) {
            if (typeMemories.length < minClusterSize) continue;

            // Find clusters by smart tag overlap
            for (let i = 0; i < typeMemories.length; i++) {
                if (clustered.has(typeMemories[i].id)) continue;
                
                const cluster = [typeMemories[i]];
                const potentialMembers = new Set([typeMemories[i].id]);
                
                // Find similar memories
                for (let j = i + 1; j < typeMemories.length; j++) {
                    if (clustered.has(typeMemories[j].id)) continue;
                    
                    // Check similarity (tag overlap + time proximity)
                    if (this.areMemoriesSimilar(typeMemories[i], typeMemories[j], similarityThreshold)) {
                        cluster.push(typeMemories[j]);
                        potentialMembers.add(typeMemories[j].id);
                    }
                }
                
                // Only keep clusters that meet minimum size
                if (cluster.length >= minClusterSize) {
                    // Now mark them as clustered
                    potentialMembers.forEach(id => clustered.add(id));
                    
                    clusters.push({
                        id: `cluster_${type}_${Date.now()}_${i}`,
                        type: type,
                        memories: cluster,
                        size: cluster.length,
                        timeSpan: this.calculateTimeSpan(cluster),
                        commonTags: this.getCommonTags(cluster)
                    });
                }
                // If cluster is too small, memories remain unclustered
            }
        }

        // Separate unclustered memories
        const unclustered = memories.filter(m => !clustered.has(m.id));
        
        this.logger.info(`[V2AsyncProcessor] Clustering complete: ${clusters.length} clusters formed, ${unclustered.length} memories unclustered`);
        this.logger.info(`[V2AsyncProcessor] Memory types in unclustered: ${[...new Set(unclustered.map(m => m.memory_type))].join(', ')}`);

        return { clusters, unclustered };
    }

    /**
     * Calculate cosine similarity between two embedding vectors
     */
    cosineSimilarity(embedding1, embedding2) {
        if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
            return 0;
        }
        
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;
        
        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }
        
        const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }

    /**
     * Calculate Jaccard similarity between two sets
     */
    jaccardSimilarity(set1, set2) {
        const intersection = [...set1].filter(item => set2.has(item));
        const union = new Set([...set1, ...set2]);
        return union.size === 0 ? 0 : intersection.length / union.size;
    }

    /**
     * Check if two memories are similar using hybrid approach
     */
    areMemoriesSimilar(memory1, memory2, threshold) {
        const thresholds = this.dependencies.configThresholds || {
            get: (path) => {
                // Default values if config service not available
                const defaults = {
                    'clustering.embeddingSimilarityThreshold': 0.65,
                    'clustering.tagSimilarityThreshold': 0.3,
                    'clustering.timeProximityDays': 14,
                    'clustering.embeddingWeight': 0.7,
                    'clustering.tagWeight': 0.2,
                    'clustering.timeWeight': 0.1,
                    'clustering.hybridThreshold': 0.5
                };
                return defaults[path];
            }
        };

        // 1. Calculate embedding similarity (primary factor)
        let embeddingSimilarity = 0;
        if (memory1.embedding && memory2.embedding) {
            embeddingSimilarity = this.cosineSimilarity(memory1.embedding, memory2.embedding);
            
            // If embedding similarity is high enough, consider it a match immediately
            if (embeddingSimilarity >= thresholds.get('clustering.embeddingSimilarityThreshold')) {
                this.logger.debug(`High embedding similarity (${embeddingSimilarity.toFixed(3)}) between memories ${memory1.id} and ${memory2.id}`);
                return true;
            }
        }
        
        // 2. Calculate tag similarity (secondary factor)
        const tags1 = new Set(memory1.smart_tags || []);
        const tags2 = new Set(memory2.smart_tags || []);
        const tagSimilarity = this.jaccardSimilarity(tags1, tags2);
        
        // 3. Calculate time proximity boost
        const timeDiff = Math.abs(new Date(memory1.created_at) - new Date(memory2.created_at));
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        const maxDays = thresholds.get('clustering.timeProximityDays');
        const timeProximity = daysDiff <= maxDays ? 1 - (daysDiff / maxDays) : 0;
        
        // 4. Calculate hybrid score with configurable weights
        const embeddingWeight = thresholds.get('clustering.embeddingWeight');
        const tagWeight = thresholds.get('clustering.tagWeight');
        const timeWeight = thresholds.get('clustering.timeWeight');
        
        const hybridScore = (embeddingSimilarity * embeddingWeight) + 
                          (tagSimilarity * tagWeight) + 
                          (timeProximity * timeWeight);
        
        const hybridThreshold = thresholds.get('clustering.hybridThreshold');
        const isSimilar = hybridScore >= hybridThreshold;
        
        if (isSimilar) {
            this.logger.debug(`Memories ${memory1.id} and ${memory2.id} clustered:`, {
                embeddingSim: embeddingSimilarity.toFixed(3),
                tagSim: tagSimilarity.toFixed(3),
                timeProx: timeProximity.toFixed(3),
                hybridScore: hybridScore.toFixed(3)
            });
        }
        
        return isSimilar;
    }

    /**
     * Calculate time span of cluster
     */
    calculateTimeSpan(memories) {
        const dates = memories.map(m => new Date(m.created_at));
        const min = Math.min(...dates);
        const max = Math.max(...dates);
        const days = (max - min) / (1000 * 60 * 60 * 24);
        return {
            start: new Date(min),
            end: new Date(max),
            days: Math.ceil(days)
        };
    }

    /**
     * Get common tags across cluster
     */
    getCommonTags(memories) {
        if (memories.length === 0) return [];
        
        // Start with first memory's tags
        let commonTags = new Set(memories[0].smart_tags || []);
        
        // Find intersection with all other memories
        for (let i = 1; i < memories.length; i++) {
            const tags = new Set(memories[i].smart_tags || []);
            commonTags = new Set([...commonTags].filter(tag => tags.has(tag)));
        }
        
        return Array.from(commonTags);
    }

    /**
     * Process memory clusters
     */
    async processClusters(clusters) {
        for (const cluster of clusters) {
            try {
                this.logger.info(`[V2AsyncProcessor] Processing cluster ${cluster.id} with ${cluster.size} memories`);
                
                // Get clustering processor
                const clusteringProcessor = await this.processorFactory.getProcessor('clustering');
                
                if (!clusteringProcessor) {
                    this.logger.error('Clustering processor not available');
                    continue;
                }
                
                // Process the cluster
                const insights = await clusteringProcessor.processBatch(cluster.memories, {
                    clusterMetadata: {
                        id: cluster.id,
                        type: cluster.type,
                        size: cluster.size,
                        timeSpan: cluster.timeSpan,
                        commonTags: cluster.commonTags
                    }
                });
                
                this.logger.info(`[V2AsyncProcessor] Cluster ${cluster.id} generated ${insights.length} insights`);
                
                // Validate and store insights
                const validatedInsights = await this.unifiedInsightsService.validateInsights(insights);
                
                for (const insight of validatedInsights) {
                    const storedInsight = await this.unifiedInsightsService.storage.storeInsight(insight);
                    this.processingStats.insights++;
                }
                
                // Update processing stats
                this.processingStats.processed += cluster.size;
                
            } catch (error) {
                this.logger.error(`Failed to process cluster ${cluster.id}:`, error);
                this.processingStats.errors += cluster.size;
            }
        }
    }
}

export default V2AsyncProcessor;