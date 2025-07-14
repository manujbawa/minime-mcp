/**
 * V2 Insight Generation Job
 * Processes all unprocessed memories using the unified insights v2 system
 */

export class V2InsightJob {
    static async execute(services) {
        const logger = services.logger;
        const startTime = Date.now();

        try {
            // Check if v2 is enabled
            if (!services.unifiedInsightsV2) {
                logger.warn('[V2InsightJob] Unified Insights V2 not initialized, skipping');
                return;
            }

            // Get processor from service registry
            const v2AsyncProcessor = services.v2AsyncProcessor || services.registry?.get('v2AsyncProcessor');
            
            if (!v2AsyncProcessor) {
                logger.error('[V2InsightJob] V2 Async Processor not found in services');
                return;
            }

            const processor = v2AsyncProcessor;

            // Check if already processing
            if (processor.isRunning()) {
                logger.info('[V2InsightJob] Previous job still running, skipping');
                return;
            }

            logger.info('[V2InsightJob] Starting v2 insight generation job');

            // Process all unprocessed memories
            const result = await processor.processUnprocessedMemories();

            const duration = Date.now() - startTime;
            
            logger.info('[V2InsightJob] Job completed', {
                ...result,
                duration
            });

            // Emit metrics
            if (services.eventEmitter) {
                services.eventEmitter.emit('job:v2_insights:completed', {
                    ...result,
                    duration
                });
            }

        } catch (error) {
            logger.error('[V2InsightJob] Job failed:', error);
            
            if (services.eventEmitter) {
                services.eventEmitter.emit('job:v2_insights:failed', {
                    error: error.message,
                    duration: Date.now() - startTime
                });
            }
            
            throw error;
        }
    }
}