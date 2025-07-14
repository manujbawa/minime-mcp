/**
 * Configuration Validator
 * Validates and sanitizes configuration options
 */

export function validateConfig(config) {
    const validated = {};
    
    // Processing configuration
    if (config.processing) {
        validated.processing = {
            realTimeEnabled: Boolean(config.processing.realTimeEnabled),
            batchSize: validateNumber(config.processing.batchSize, 1, 100, 10),
            maxConcurrent: validateNumber(config.processing.maxConcurrent, 1, 20, 5),
            timeout: validateNumber(config.processing.timeout, 1000, 300000, 30000),
            queueEnabled: Boolean(config.processing.queueEnabled)
        };
    }
    
    // Storage configuration
    if (config.storage) {
        validated.storage = {
            deduplicationWindow: validateDuration(config.storage.deduplicationWindow, '24 hours'),
            archiveAfterDays: validateNumber(config.storage.archiveAfterDays, 1, 365, 90)
        };
    }
    
    // Enrichment configuration
    if (config.enrichment) {
        validated.enrichment = {
            enablePatternMatching: Boolean(config.enrichment.enablePatternMatching),
            enableRelationshipFinding: Boolean(config.enrichment.enableRelationshipFinding),
            enableTechnologyExtraction: Boolean(config.enrichment.enableTechnologyExtraction)
        };
    }
    
    // Quality configuration
    if (config.quality) {
        validated.quality = {
            minConfidenceScore: validateNumber(config.quality.minConfidenceScore, 0, 1, 0.3),
            requireValidation: Boolean(config.quality.requireValidation)
        };
    }
    
    // Query configuration
    if (config.query) {
        validated.query = {
            defaultLimit: validateNumber(config.query.defaultLimit, 1, 100, 20),
            maxLimit: validateNumber(config.query.maxLimit, 1, 1000, 100)
        };
    }
    
    return validated;
}

function validateNumber(value, min, max, defaultValue) {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
        return defaultValue;
    }
    return num;
}

function validateDuration(value, defaultValue) {
    // Simple validation for duration strings
    if (typeof value === 'string' && /^\d+\s*(hours?|days?|minutes?)$/.test(value)) {
        return value;
    }
    return defaultValue;
}

export default validateConfig;