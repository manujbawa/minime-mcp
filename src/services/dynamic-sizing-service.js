/**
 * Dynamic Sizing Service
 * Intelligently determines batch sizes and processing limits based on:
 * - System resources
 * - Data complexity
 * - LLM token constraints
 * - Historical performance metrics
 */

export class DynamicSizingService {
    constructor(logger, databaseService = null, llmService = null) {
        this.logger = logger;
        this.db = databaseService;
        this.llmService = llmService;
        
        // Default configurations
        this.defaults = {
            batch: {
                min: 3,
                max: 20,
                default: 5,
                optimal: 10
            },
            limits: {
                searchResults: { min: 3, max: 50, default: 10 },
                insights: { min: 5, max: 100, default: 20 },
                related: { min: 3, max: 10, default: 5 }
            },
            factors: {
                complexity: 1.0,
                urgency: 1.0,
                resources: 1.0
            }
        };
        
        // Performance tracking
        this.performanceMetrics = new Map();
    }
    
    /**
     * Get dynamic batch size based on context
     */
    async getDynamicBatchSize(context = {}) {
        const {
            taskType = 'default',
            dataSize = 0,
            complexity = 'medium',
            priority = 'normal',
            useAI = true
        } = context;
        
        // Try AI-based sizing first if available
        if (useAI && this.llmService) {
            try {
                const aiSize = await this.getAIBatchSize(context);
                if (aiSize) return aiSize;
            } catch (error) {
                this.logger.warn('AI batch sizing failed, using fallback:', error.message);
            }
        }
        
        // Fallback to rule-based sizing
        return this.getRuleBasedBatchSize(context);
    }
    
    /**
     * AI-powered batch size determination
     */
    async getAIBatchSize(context) {
        const prompt = `Given the following processing context, determine the optimal batch size:
- Task Type: ${context.taskType}
- Data Size: ${context.dataSize} items
- Complexity: ${context.complexity}
- Priority: ${context.priority}
- Available Memory: ${this.getAvailableMemory()}MB
- Historical Success: ${this.getHistoricalPerformance(context.taskType)}

Consider:
1. LLM token limits (4000 tokens per batch)
2. Processing efficiency 
3. Memory constraints
4. Response time requirements

Return JSON with:
{
    "batchSize": <number between ${this.defaults.batch.min} and ${this.defaults.batch.max}>,
    "reasoning": "<brief explanation>",
    "confidence": <0-1>
}`;

        const response = await this.llmService.analyze(prompt, {
            temperature: 0.3,
            maxTokens: 200,
            systemPrompt: 'You are an expert in system optimization and batch processing.'
        });
        
        if (response.batchSize && response.confidence > 0.7) {
            this.logger.debug('AI batch size recommendation:', response);
            return Math.min(Math.max(response.batchSize, this.defaults.batch.min), this.defaults.batch.max);
        }
        
        return null;
    }
    
    /**
     * Rule-based batch size calculation
     */
    getRuleBasedBatchSize(context) {
        let baseSize = this.defaults.batch.default;
        
        // Adjust based on task type
        const taskMultipliers = {
            'insight_generation': 0.5,     // Smaller batches for complex LLM tasks
            'search_enhancement': 0.8,     // Medium batches for search
            'pattern_analysis': 0.6,       // Smaller for detailed analysis
            'memory_clustering': 1.2,      // Larger for clustering
            'bulk_processing': 1.5,        // Larger for simple bulk tasks
            'default': 1.0
        };
        
        baseSize *= taskMultipliers[context.taskType] || taskMultipliers.default;
        
        // Adjust based on complexity
        const complexityMultipliers = {
            'low': 1.5,
            'medium': 1.0,
            'high': 0.7,
            'very_high': 0.5
        };
        
        baseSize *= complexityMultipliers[context.complexity] || 1.0;
        
        // Adjust based on data size
        if (context.dataSize > 0) {
            if (context.dataSize < 10) {
                baseSize = Math.min(baseSize, context.dataSize);
            } else if (context.dataSize > 100) {
                baseSize *= 1.2; // Increase batch size for large datasets
            }
        }
        
        // Adjust based on priority
        if (context.priority === 'high' || context.priority === 'urgent') {
            baseSize *= 0.8; // Smaller batches for faster initial results
        }
        
        // Apply bounds
        const finalSize = Math.round(baseSize);
        return Math.min(Math.max(finalSize, this.defaults.batch.min), this.defaults.batch.max);
    }
    
    /**
     * Get dynamic limit for queries
     */
    async getDynamicLimit(limitType, context = {}) {
        const limits = this.defaults.limits[limitType] || this.defaults.limits.searchResults;
        
        // For search results, consider query complexity
        if (limitType === 'searchResults' && context.query) {
            const queryLength = context.query.length;
            const hasMultipleTerms = context.query.split(/\s+/).length > 3;
            
            if (queryLength < 20 && !hasMultipleTerms) {
                return limits.min; // Simple queries need fewer results
            } else if (queryLength > 100 || hasMultipleTerms) {
                return Math.min(limits.default * 1.5, limits.max); // Complex queries need more
            }
        }
        
        // For insights, consider time window
        if (limitType === 'insights' && context.timeWindow) {
            if (context.timeWindow <= 7) {
                return limits.min; // Recent insights only
            } else if (context.timeWindow >= 90) {
                return limits.max; // Long-term analysis
            }
        }
        
        return limits.default;
    }
    
    /**
     * Track performance metrics for future optimization
     */
    trackPerformance(taskType, batchSize, metrics) {
        const key = `${taskType}_${batchSize}`;
        
        if (!this.performanceMetrics.has(key)) {
            this.performanceMetrics.set(key, {
                count: 0,
                totalTime: 0,
                successRate: 0,
                avgTokensUsed: 0
            });
        }
        
        const stats = this.performanceMetrics.get(key);
        stats.count++;
        stats.totalTime += metrics.processingTime || 0;
        stats.successRate = (stats.successRate * (stats.count - 1) + (metrics.success ? 1 : 0)) / stats.count;
        stats.avgTokensUsed = (stats.avgTokensUsed * (stats.count - 1) + (metrics.tokensUsed || 0)) / stats.count;
        
        // Cleanup old metrics if map gets too large
        if (this.performanceMetrics.size > 100) {
            const oldestKey = this.performanceMetrics.keys().next().value;
            this.performanceMetrics.delete(oldestKey);
        }
    }
    
    /**
     * Get historical performance for a task type
     */
    getHistoricalPerformance(taskType) {
        const relevantMetrics = [];
        
        for (const [key, metrics] of this.performanceMetrics) {
            if (key.startsWith(taskType)) {
                relevantMetrics.push(metrics);
            }
        }
        
        if (relevantMetrics.length === 0) {
            return 'No historical data';
        }
        
        const avgSuccessRate = relevantMetrics.reduce((sum, m) => sum + m.successRate, 0) / relevantMetrics.length;
        return `${(avgSuccessRate * 100).toFixed(1)}% success rate`;
    }
    
    /**
     * Get available memory (simplified)
     */
    getAvailableMemory() {
        const totalMemory = process.memoryUsage().heapTotal / 1024 / 1024;
        const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        return Math.round(totalMemory - usedMemory);
    }
    
    /**
     * Calculate optimal batch distribution for large datasets
     */
    calculateBatchDistribution(totalItems, context = {}) {
        const batchSize = this.getRuleBasedBatchSize(context);
        const batches = [];
        
        for (let i = 0; i < totalItems; i += batchSize) {
            const currentBatchSize = Math.min(batchSize, totalItems - i);
            batches.push({
                start: i,
                end: i + currentBatchSize,
                size: currentBatchSize
            });
        }
        
        return {
            batchSize,
            totalBatches: batches.length,
            batches
        };
    }
}

export default DynamicSizingService;