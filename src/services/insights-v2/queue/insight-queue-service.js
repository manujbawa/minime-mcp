/**
 * Insight Queue Service
 * Manages async processing queue for insights
 */

export class InsightQueueService {
    constructor(dependencies) {
        this.db = dependencies.db;
        this.logger = dependencies.logger;
        this.config = dependencies.config || {};
        this.processorFactory = dependencies.processorFactory;
        this.isProcessing = false;
    }

    /**
     * Start queue processing
     */
    async start() {
        this.logger.info('Insight Queue Service started');
        // Queue processing is handled by the job scheduler
    }

    /**
     * Stop queue processing
     */
    async stop() {
        this.isProcessing = false;
        this.logger.info('Insight Queue Service stopped');
    }

    /**
     * Enqueue a task for processing
     */
    async enqueue(task) {
        try {
            const result = await this.db.query(`
                INSERT INTO insight_processing_queue_v2 (
                    task_type,
                    task_priority,
                    source_type,
                    source_ids,
                    task_payload,
                    status,
                    scheduled_for,
                    created_at
                ) VALUES (
                    $1, $2, $3, $4, $5, 'pending', NOW(), NOW()
                ) RETURNING id
            `, [
                task.taskType,
                task.priority || 5,
                task.sourceType || 'memory',
                task.sourceIds,
                task.payload || {}
            ]);

            this.logger.debug(`Enqueued task ${result.rows[0].id} of type ${task.taskType}`);
            return result.rows[0].id;

        } catch (error) {
            this.logger.error('Failed to enqueue task:', error);
            throw error;
        }
    }

    /**
     * Process next task in queue
     */
    async processNext() {
        if (this.isProcessing) {
            return null;
        }

        this.isProcessing = true;

        try {
            // Get next pending task
            const result = await this.db.query(`
                UPDATE insight_processing_queue_v2
                SET 
                    status = 'processing',
                    started_at = NOW(),
                    processor_id = $1
                WHERE id = (
                    SELECT id 
                    FROM insight_processing_queue_v2
                    WHERE status = 'pending'
                        AND scheduled_for <= NOW()
                    ORDER BY task_priority DESC, created_at ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING *
            `, [this.getProcessorId()]);

            if (result.rows.length === 0) {
                return null;
            }

            const task = result.rows[0];
            this.logger.info(`Processing queue task ${task.id} of type ${task.task_type}`);

            // Process based on task type
            try {
                const taskResult = await this.processTask(task);
                
                // Mark as completed
                await this.db.query(`
                    UPDATE insight_processing_queue_v2
                    SET 
                        status = 'completed',
                        completed_at = NOW(),
                        result_summary = $2,
                        insights_generated = $3
                    WHERE id = $1
                `, [
                    task.id,
                    taskResult.summary || {},
                    taskResult.insightsGenerated || 0
                ]);

                return taskResult;

            } catch (error) {
                // Mark as failed
                await this.markTaskFailed(task.id, error.message);
                throw error;
            }

        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process a specific task
     */
    async processTask(task) {
        switch (task.task_type) {
            case 'thinking_sequence_insights':
                return await this.processThinkingSequence(task);
            
            default:
                this.logger.warn(`Task processor for type ${task.task_type} not implemented`);
                return {
                    success: true,
                    summary: { message: 'Task type not implemented' },
                    insightsGenerated: 0
                };
        }
    }

    /**
     * Process thinking sequence insights
     */
    async processThinkingSequence(task) {
        try {
            // Get the thinking sequence processor
            const processor = await this.processorFactory.getProcessor('thinking_sequence');
            
            if (!processor) {
                throw new Error('Thinking sequence processor not available');
            }
            
            // Process the task
            const insights = await processor.process(task);
            
            // Store insights in unified_insights_v2
            let storedCount = 0;
            for (const insight of insights) {
                try {
                    await this.storeInsight(insight, task.project_id);
                    storedCount++;
                } catch (error) {
                    this.logger.error('Failed to store insight:', error);
                }
            }
            
            return {
                success: true,
                summary: {
                    message: `Processed thinking sequence ${task.source_ids[0]}`,
                    thoughtCount: task.payload?.thoughtCount || 0,
                    insightsGenerated: storedCount
                },
                insightsGenerated: storedCount
            };
        } catch (error) {
            this.logger.error('Error processing thinking sequence:', error);
            throw error;
        }
    }

    /**
     * Store insight in unified_insights_v2 table
     */
    async storeInsight(insight, projectId) {
        const query = `
            INSERT INTO unified_insights_v2 (
                insight_type, insight_category, insight_subcategory,
                title, summary, detailed_content,
                source_type, source_ids, detection_method,
                confidence_score, relevance_score, impact_score,
                project_id, tags, technologies, patterns,
                evidence, recommendations, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15, $16,
                $17, $18, NOW()
            )
            RETURNING id
        `;
        
        const result = await this.db.query(query, [
            insight.insight_type,
            insight.insight_category,
            insight.insight_subcategory,
            insight.title,
            insight.summary,
            JSON.stringify(insight.detailed_content || {}),
            insight.source_type,
            insight.source_ids,
            insight.detection_method,
            insight.confidence_score,
            insight.relevance_score,
            insight.impact_score,
            projectId,
            insight.tags || [],
            JSON.stringify(insight.technologies || []),
            JSON.stringify(insight.patterns || []),
            JSON.stringify(insight.evidence || []),
            JSON.stringify(insight.recommendations || [])
        ]);
        
        return result.rows[0].id;
    }

    /**
     * Mark task as failed
     */
    async markTaskFailed(taskId, errorMessage) {
        try {
            await this.db.query(`
                UPDATE insight_processing_queue_v2
                SET 
                    status = CASE 
                        WHEN retry_count >= max_retries THEN 'failed'
                        ELSE 'pending'
                    END,
                    retry_count = retry_count + 1,
                    error_message = $2,
                    scheduled_for = CASE 
                        WHEN retry_count < max_retries 
                        THEN NOW() + INTERVAL '5 minutes' * (retry_count + 1)
                        ELSE scheduled_for
                    END
                WHERE id = $1
            `, [taskId, errorMessage]);

        } catch (error) {
            this.logger.error('Failed to mark task as failed:', error);
        }
    }

    /**
     * Get queue statistics
     */
    async getStats() {
        try {
            const result = await this.db.query(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
                FROM insight_processing_queue_v2
                WHERE created_at > NOW() - INTERVAL '24 hours'
                GROUP BY status
            `);

            const stats = {
                pending: 0,
                processing: 0,
                completed: 0,
                failed: 0,
                avgDuration: 0
            };

            result.rows.forEach(row => {
                stats[row.status] = parseInt(row.count);
                if (row.status === 'completed' && row.avg_duration_seconds) {
                    stats.avgDuration = Math.round(row.avg_duration_seconds);
                }
            });

            return stats;

        } catch (error) {
            this.logger.error('Failed to get queue stats:', error);
            return null;
        }
    }

    /**
     * Get processor ID for this instance
     */
    getProcessorId() {
        return `processor_${process.pid}_${Date.now()}`;
    }
}

export default InsightQueueService;