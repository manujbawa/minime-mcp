/**
 * Configuration Schema
 * Defines the expected configuration structure
 */

export const configSchema = {
    processing: {
        realTimeEnabled: {
            type: 'boolean',
            default: true,
            description: 'Enable real-time processing of memories'
        },
        batchSize: {
            type: 'number',
            default: 10,
            min: 1,
            max: 100,
            description: 'Number of memories to process in a batch'
        },
        maxConcurrent: {
            type: 'number',
            default: 5,
            min: 1,
            max: 20,
            description: 'Maximum concurrent processing tasks'
        },
        timeout: {
            type: 'number',
            default: 30000,
            min: 1000,
            max: 300000,
            description: 'Processing timeout in milliseconds'
        },
        queueEnabled: {
            type: 'boolean',
            default: true,
            description: 'Enable async queue processing'
        }
    },
    
    storage: {
        deduplicationWindow: {
            type: 'string',
            default: '24 hours',
            pattern: '^\\d+\\s*(hours?|days?|minutes?)$',
            description: 'Time window for deduplication'
        },
        archiveAfterDays: {
            type: 'number',
            default: 90,
            min: 1,
            max: 365,
            description: 'Days before archiving insights'
        }
    },
    
    enrichment: {
        enablePatternMatching: {
            type: 'boolean',
            default: true,
            description: 'Enable pattern matching enrichment'
        },
        enableRelationshipFinding: {
            type: 'boolean',
            default: true,
            description: 'Enable relationship discovery'
        },
        enableTechnologyExtraction: {
            type: 'boolean',
            default: true,
            description: 'Enable technology extraction'
        }
    },
    
    quality: {
        minConfidenceScore: {
            type: 'number',
            default: 0.3,
            min: 0,
            max: 1,
            description: 'Minimum confidence score for insights'
        },
        requireValidation: {
            type: 'boolean',
            default: false,
            description: 'Require manual validation of insights'
        }
    },
    
    query: {
        defaultLimit: {
            type: 'number',
            default: 20,
            min: 1,
            max: 100,
            description: 'Default query result limit'
        },
        maxLimit: {
            type: 'number',
            default: 100,
            min: 1,
            max: 1000,
            description: 'Maximum query result limit'
        }
    }
};

export default configSchema;