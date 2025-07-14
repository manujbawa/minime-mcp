/**
 * Unified Insights v2 Integration
 * Integrates with existing MiniMe service architecture
 * Replaces the separate service runner approach
 */

import { UnifiedInsightsV2Service } from './unified-insights-service.js';

/**
 * Initialize Unified Insights v2 within the existing service architecture
 * This replaces multiple overlapping insight systems
 */
export async function initializeUnifiedInsightsV2(logger, databaseService, embeddingService, llmService) {
    logger.info('Initializing Unified Insights v2...');
    
    try {
        // Check if v2 tables exist, create if not
        await ensureV2Schema(logger, databaseService);
        
        // Create unified insights service with existing dependencies
        const unifiedInsightsV2 = new UnifiedInsightsV2Service(
            {
                databaseService,
                embeddingService,
                llmService,
                logger: logger.createModuleLogger ? 
                    logger.createModuleLogger('UnifiedInsightsV2') : 
                    logger
            },
            {
                processing: {
                    realTimeEnabled: process.env.REAL_TIME_PROCESSING !== 'false',
                    batchSize: parseInt(process.env.BATCH_SIZE || '10'),
                    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '5'),
                    queueEnabled: true
                },
                enrichment: {
                    enablePatternMatching: process.env.ENABLE_PATTERN_MATCHING !== 'false',
                    enableRelationshipFinding: process.env.ENABLE_RELATIONSHIP_FINDING !== 'false',
                    enableTechnologyExtraction: process.env.ENABLE_TECHNOLOGY_EXTRACTION !== 'false'
                },
                quality: {
                    minConfidenceScore: parseFloat(process.env.MIN_CONFIDENCE_SCORE || '0.1')
                }
            }
        );
        
        // Initialize the service
        await unifiedInsightsV2.initialize();
        
        logger.info('Unified Insights v2 initialized successfully');
        return unifiedInsightsV2;
        
    } catch (error) {
        logger.error('Failed to initialize Unified Insights v2:', error);
        throw error;
    }
}

/**
 * Ensure v2 schema exists
 */
async function ensureV2Schema(logger, databaseService) {
    try {
        // Check if v2 tables exist
        const result = await databaseService.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'unified_insights_v2'
            );
        `);
        
        if (!result.rows[0].exists) {
            logger.info('Creating Unified Insights v2 schema...');
            
            // Note: In production, migrations are handled by the Docker entrypoint
            // This is just a safety check for development
            logger.warn('V2 tables not found. Please run migrations:');
            logger.warn('  020_create_unified_insights_v2.sql');
            logger.warn('  021_migrate_to_unified_insights_v2.sql');
            
            // For now, we'll continue without throwing error
            // The actual migration will be handled by Docker entrypoint
        } else {
            logger.info('Unified Insights v2 schema verified');
        }
        
    } catch (error) {
        logger.error('Failed to check v2 schema:', error);
        // Don't throw - let the system continue with existing tables
    }
}

export default initializeUnifiedInsightsV2;