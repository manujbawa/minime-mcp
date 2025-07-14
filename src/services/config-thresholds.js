/**
 * Configurable Thresholds Service
 * Manages non-semantic thresholds and system parameters that don't require LLM intelligence
 * This provides a hybrid approach where simple numeric decisions use configurable values
 */

export class ConfigThresholdsService {
    constructor(logger, configService = null) {
        this.logger = logger;
        this.configService = configService;
        
        // Default thresholds - can be overridden by config
        this.defaults = {
            // Confidence thresholds
            confidence: {
                high: 0.8,      // High confidence threshold
                medium: 0.7,    // Medium confidence threshold
                low: 0.5,       // Low confidence threshold
                minimum: 0.3    // Minimum acceptable confidence
            },
            
            // Clustering parameters
            clustering: {
                similarityThreshold: 0.7,   // Cosine similarity for clustering
                minClusterSize: 3,          // Minimum memories per cluster
                targetClusterSize: 8,       // Target cluster size
                maxClusterSize: 15,         // Maximum memories per cluster
                crossProjectBonus: 0.1,     // Bonus for cross-project patterns
                maxTokensPerCluster: 8000   // Token limit per cluster
            },
            
            // Learning journey thresholds
            learning: {
                expertLevel: 80,        // Score for expert level
                proficientLevel: 60,    // Score for proficient level
                learningLevel: 30,      // Score for learning level
                minInsightsForPhase: 3  // Minimum insights to determine phase
            },
            
            // Search and relevance
            search: {
                defaultLimit: 10,           // Default search results limit
                batchSize: 5,               // Batch size for LLM scoring
                cacheBoost: 0.15,          // Boost for cached results
                maxBoost: 0.95,            // Maximum boost cap
                overlapBoost: 0.1          // Boost for overlapping terms
            },
            
            // System operations
            system: {
                jobPollInterval: 30000,     // Job polling interval (ms)
                maxConcurrentJobs: 2,       // Max concurrent processing jobs
                stuckJobTimeout: 60,        // Minutes before job is stuck
                cacheExpiry: 30,           // Days for cache expiry
                cleanupAge: 30             // Days before cleanup
            },
            
            // Trend analysis
            trends: {
                increaseThreshold: 1.2,     // 20% increase = increasing trend
                decreaseThreshold: 0.8,     // 20% decrease = decreasing trend
                minDataPoints: 2            // Minimum data points for trend
            }
        };
        
        this.thresholds = { ...this.defaults };
    }
    
    /**
     * Initialize from config service if available
     */
    async initialize() {
        if (this.configService) {
            try {
                const customThresholds = await this.configService.get('thresholds');
                if (customThresholds) {
                    this.thresholds = this.mergeThresholds(this.defaults, customThresholds);
                    this.logger.info('Loaded custom thresholds from config');
                }
            } catch (error) {
                this.logger.warn('Failed to load custom thresholds, using defaults', error);
            }
        }
    }
    
    /**
     * Deep merge thresholds objects
     */
    mergeThresholds(defaults, custom) {
        const merged = { ...defaults };
        
        for (const category in custom) {
            if (typeof custom[category] === 'object' && !Array.isArray(custom[category])) {
                merged[category] = { ...defaults[category], ...custom[category] };
            } else {
                merged[category] = custom[category];
            }
        }
        
        return merged;
    }
    
    /**
     * Get threshold value
     */
    get(path) {
        const parts = path.split('.');
        let value = this.thresholds;
        
        for (const part of parts) {
            value = value[part];
            if (value === undefined) {
                this.logger.warn(`Threshold not found: ${path}`);
                return this.getDefault(path);
            }
        }
        
        return value;
    }
    
    /**
     * Get default threshold value
     */
    getDefault(path) {
        const parts = path.split('.');
        let value = this.defaults;
        
        for (const part of parts) {
            value = value[part];
            if (value === undefined) {
                throw new Error(`Default threshold not found: ${path}`);
            }
        }
        
        return value;
    }
    
    /**
     * Update threshold value
     */
    set(path, value) {
        const parts = path.split('.');
        let target = this.thresholds;
        
        for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) {
                target[parts[i]] = {};
            }
            target = target[parts[i]];
        }
        
        const oldValue = target[parts[parts.length - 1]];
        target[parts[parts.length - 1]] = value;
        
        this.logger.info(`Updated threshold ${path}: ${oldValue} -> ${value}`);
        
        // Persist to config if available
        if (this.configService) {
            this.configService.set('thresholds', this.thresholds).catch(err => {
                this.logger.error('Failed to persist threshold update', err);
            });
        }
    }
    
    /**
     * Get all thresholds
     */
    getAll() {
        return { ...this.thresholds };
    }
    
    /**
     * Reset to defaults
     */
    reset() {
        this.thresholds = { ...this.defaults };
        this.logger.info('Reset all thresholds to defaults');
    }
    
    /**
     * Validate confidence score
     */
    isHighConfidence(score) {
        return score >= this.get('confidence.high');
    }
    
    isMediumConfidence(score) {
        return score >= this.get('confidence.medium');
    }
    
    isLowConfidence(score) {
        return score >= this.get('confidence.low');
    }
    
    /**
     * Determine trend based on values
     */
    determineTrend(recent, older) {
        const increaseThreshold = this.get('trends.increaseThreshold');
        const decreaseThreshold = this.get('trends.decreaseThreshold');
        
        if (recent > older * increaseThreshold) return 'increasing';
        if (recent < older * decreaseThreshold) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Get skill level based on score
     */
    getSkillLevel(score) {
        if (score >= this.get('learning.expertLevel')) return 'expert';
        if (score >= this.get('learning.proficientLevel')) return 'proficient';
        if (score >= this.get('learning.learningLevel')) return 'learning';
        return 'exploring';
    }
}

export default ConfigThresholdsService;