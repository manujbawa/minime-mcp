/**
 * Adaptive Temperature Service
 * Dynamically adjusts LLM temperature based on task type, context, and desired outcomes
 * Lower temperatures (0.0-0.3) for factual/analytical tasks
 * Higher temperatures (0.7-1.0) for creative/exploratory tasks
 */

export class AdaptiveTemperatureService {
    constructor(logger, llmService = null) {
        this.logger = logger;
        this.llmService = llmService;
        
        // Temperature profiles for different task types
        this.temperatureProfiles = {
            // Analytical tasks - need consistency and accuracy
            'json_extraction': { base: 0.0, range: [0.0, 0.1], factors: ['precision'] },
            'pattern_analysis': { base: 0.1, range: [0.0, 0.2], factors: ['precision', 'consistency'] },
            'score_calculation': { base: 0.1, range: [0.0, 0.2], factors: ['precision'] },
            'classification': { base: 0.2, range: [0.1, 0.3], factors: ['consistency'] },
            'relevance_scoring': { base: 0.2, range: [0.1, 0.3], factors: ['precision', 'consistency'] },
            
            // Semi-creative tasks - balance accuracy with insight
            'insight_generation': { base: 0.3, range: [0.2, 0.5], factors: ['creativity', 'depth'] },
            'search_strategy': { base: 0.4, range: [0.3, 0.6], factors: ['exploration', 'relevance'] },
            'suggestion_generation': { base: 0.5, range: [0.4, 0.7], factors: ['creativity', 'diversity'] },
            'synthesis': { base: 0.4, range: [0.3, 0.6], factors: ['creativity', 'coherence'] },
            
            // Creative tasks - need variety and exploration
            'brainstorming': { base: 0.7, range: [0.6, 0.9], factors: ['creativity', 'diversity'] },
            'alternative_solutions': { base: 0.8, range: [0.7, 1.0], factors: ['creativity', 'novelty'] },
            'hypothetical_scenarios': { base: 0.8, range: [0.7, 1.0], factors: ['creativity'] },
            
            // Default fallback
            'default': { base: 0.3, range: [0.1, 0.5], factors: ['balance'] }
        };
        
        // Contextual modifiers
        this.contextModifiers = {
            // Increase temperature
            'explore_alternatives': 0.2,
            'generate_ideas': 0.3,
            'find_creative_solutions': 0.3,
            'brainstorm': 0.4,
            
            // Decrease temperature
            'ensure_accuracy': -0.2,
            'extract_facts': -0.3,
            'maintain_consistency': -0.2,
            'follow_format': -0.3,
            'production_environment': -0.2
        };
        
        // Performance tracking
        this.performanceHistory = new Map();
        this.maxHistorySize = 100;
    }
    
    /**
     * Get adaptive temperature for a specific task
     */
    async getTemperature(taskType, context = {}) {
        // Get base profile
        const profile = this.temperatureProfiles[taskType] || this.temperatureProfiles.default;
        let temperature = profile.base;
        
        // Apply contextual modifiers
        temperature = this.applyContextModifiers(temperature, context);
        
        // Apply confidence-based adjustment
        if (context.confidence !== undefined) {
            temperature = this.adjustForConfidence(temperature, context.confidence);
        }
        
        // Apply historical performance adjustment
        temperature = this.adjustForHistoricalPerformance(temperature, taskType);
        
        // Apply dynamic AI adjustment if available
        if (this.llmService && context.useAIAdjustment) {
            temperature = await this.getAIAdjustedTemperature(temperature, taskType, context);
        }
        
        // Ensure within profile bounds
        temperature = Math.max(profile.range[0], Math.min(profile.range[1], temperature));
        
        // Log the decision
        this.logger.debug('Adaptive temperature calculated:', {
            taskType,
            baseTemperature: profile.base,
            finalTemperature: temperature,
            factors: profile.factors
        });
        
        return temperature;
    }
    
    /**
     * Apply contextual modifiers to temperature
     */
    applyContextModifiers(temperature, context) {
        let adjustedTemp = temperature;
        
        // Check for modifier keywords in context
        if (context.requirements) {
            for (const [modifier, adjustment] of Object.entries(this.contextModifiers)) {
                if (context.requirements.toLowerCase().includes(modifier.replace('_', ' '))) {
                    adjustedTemp += adjustment;
                    this.logger.debug(`Applied modifier '${modifier}': ${adjustment}`);
                }
            }
        }
        
        // Adjust based on retry count (lower temp on retries for consistency)
        if (context.retryCount > 0) {
            adjustedTemp -= 0.1 * context.retryCount;
        }
        
        // Adjust based on user preference
        if (context.userPreference) {
            if (context.userPreference === 'conservative') {
                adjustedTemp -= 0.2;
            } else if (context.userPreference === 'creative') {
                adjustedTemp += 0.2;
            }
        }
        
        return adjustedTemp;
    }
    
    /**
     * Adjust temperature based on confidence requirements
     */
    adjustForConfidence(temperature, requiredConfidence) {
        // Higher confidence requirements need lower temperature
        if (requiredConfidence > 0.9) {
            return temperature * 0.5; // Halve temperature for very high confidence
        } else if (requiredConfidence > 0.8) {
            return temperature * 0.7;
        } else if (requiredConfidence < 0.5) {
            return temperature * 1.3; // Increase for exploratory tasks
        }
        
        return temperature;
    }
    
    /**
     * Adjust based on historical performance
     */
    adjustForHistoricalPerformance(temperature, taskType) {
        const history = this.performanceHistory.get(taskType);
        
        if (!history || history.length < 5) {
            return temperature; // Not enough data
        }
        
        // Calculate recent success rate
        const recentResults = history.slice(-10);
        const successRate = recentResults.filter(r => r.success).length / recentResults.length;
        
        // If success rate is low, try adjusting temperature
        if (successRate < 0.6) {
            // Alternate between lowering and raising to find sweet spot
            const lastAdjustment = recentResults[recentResults.length - 1].adjustment || 0;
            return temperature + (lastAdjustment > 0 ? -0.1 : 0.1);
        }
        
        return temperature;
    }
    
    /**
     * Get AI-powered temperature adjustment
     */
    async getAIAdjustedTemperature(baseTemperature, taskType, context) {
        try {
            const prompt = `Given the following context, suggest an optimal temperature adjustment:
- Task Type: ${taskType}
- Base Temperature: ${baseTemperature}
- Context: ${JSON.stringify(context)}
- Recent Performance: ${this.getRecentPerformanceSummary(taskType)}

Consider:
1. Task requires ${context.requirements || 'balanced approach'}
2. Historical success patterns
3. Optimal balance between consistency and creativity

Return JSON:
{
    "suggestedTemperature": <number between 0 and 1>,
    "adjustment": <number between -0.3 and 0.3>,
    "reasoning": "<brief explanation>"
}`;

            const response = await this.llmService.analyze(prompt, {
                temperature: 0.3, // Use low temp for this meta-task
                maxTokens: 200,
                systemPrompt: 'You are an expert in LLM parameter optimization.'
            });
            
            if (response.suggestedTemperature !== undefined) {
                this.logger.debug('AI temperature suggestion:', response);
                return response.suggestedTemperature;
            }
        } catch (error) {
            this.logger.warn('AI temperature adjustment failed:', error.message);
        }
        
        return baseTemperature;
    }
    
    /**
     * Track task performance for future optimization
     */
    trackPerformance(taskType, temperature, success, metadata = {}) {
        if (!this.performanceHistory.has(taskType)) {
            this.performanceHistory.set(taskType, []);
        }
        
        const history = this.performanceHistory.get(taskType);
        history.push({
            timestamp: Date.now(),
            temperature,
            success,
            ...metadata
        });
        
        // Limit history size
        if (history.length > this.maxHistorySize) {
            history.shift();
        }
    }
    
    /**
     * Get recent performance summary
     */
    getRecentPerformanceSummary(taskType) {
        const history = this.performanceHistory.get(taskType);
        
        if (!history || history.length === 0) {
            return 'No historical data';
        }
        
        const recent = history.slice(-20);
        const avgTemp = recent.reduce((sum, r) => sum + r.temperature, 0) / recent.length;
        const successRate = recent.filter(r => r.success).length / recent.length;
        
        return `Avg temp: ${avgTemp.toFixed(2)}, Success rate: ${(successRate * 100).toFixed(1)}%`;
    }
    
    /**
     * Get recommended temperature range for a task
     */
    getRecommendedRange(taskType) {
        const profile = this.temperatureProfiles[taskType] || this.temperatureProfiles.default;
        return {
            min: profile.range[0],
            max: profile.range[1],
            optimal: profile.base,
            factors: profile.factors
        };
    }
    
    /**
     * Suggest task type based on requirements
     */
    suggestTaskType(requirements) {
        const keywords = requirements.toLowerCase();
        
        // Check for specific patterns
        if (keywords.includes('extract') || keywords.includes('parse')) {
            return 'json_extraction';
        }
        if (keywords.includes('score') || keywords.includes('rank')) {
            return 'score_calculation';
        }
        if (keywords.includes('analyze') && keywords.includes('pattern')) {
            return 'pattern_analysis';
        }
        if (keywords.includes('generate') && keywords.includes('insight')) {
            return 'insight_generation';
        }
        if (keywords.includes('creative') || keywords.includes('brainstorm')) {
            return 'brainstorming';
        }
        
        return 'default';
    }
}

export default AdaptiveTemperatureService;