/**
 * LLM Service for MiniMe-MCP
 * Handles large language model interactions for intelligent analysis, reasoning, and insight generation
 * Primary model: deepseek-coder:6.7b via Ollama
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import AdaptiveTemperatureService from './adaptive-temperature-service.js';

export class LLMService {
    constructor(logger, databaseService, configService = null) {
        this.logger = logger;
        this.db = databaseService;
        this.configService = configService;
        this.cache = new Map(); // Simple in-memory cache for analysis results
        this.maxCacheSize = 500; // Smaller cache for LLM responses
        this.temperatureService = new AdaptiveTemperatureService(logger, this);
        
        // Default configuration - connect to host machine Ollama
        this.config = {
            ollama: {
                host: this.getOllamaHost(),
                timeout: 300000, // 5 minutes for LLM responses
                retries: 2
            },
            defaultModel: process.env.LLM_MODEL || 'deepseek-coder:6.7b',
            maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '16000'),
            temperature: 0.1, // Low temperature for analytical consistency
            systemPrompts: {
                patternAnalysis: `You are an expert code analyst. IMPORTANT: You MUST respond with valid JSON only. Do not include any text before or after the JSON. Analyze the given code patterns and provide insights on their quality, effectiveness, and potential improvements in JSON format.`,
                insightGeneration: `You are a senior software architect. IMPORTANT: You MUST respond with valid JSON only. Do not include any text before or after the JSON. Generate insights from development patterns and decisions. Focus on best practices, anti-patterns, and actionable recommendations.`,
                outcomeCorrelation: `You are a data analyst specializing in software development metrics. IMPORTANT: You MUST respond with valid JSON only. Do not include any text before or after the JSON. Analyze the correlation between coding patterns and their outcomes. Provide statistical insights and causal relationships.`,
                jsonExtraction: `You are a JSON extraction specialist. IMPORTANT: You MUST respond with valid JSON only. Do not include any explanations, markdown formatting, or any text before or after the JSON. Your response should start with { and end with }.`
            }
        };
    }

    /**
     * Get Ollama host URL based on environment
     */
    getOllamaHost() {
        // Docker environment detection - check multiple indicators
        const isDocker = process.env.DOCKER_ENV || 
                        process.env.POSTGRES_PASSWORD || // Docker compose sets this
                        (process.env.MCP_PORT && process.env.UI_PORT); // Docker run sets these
        
        if (isDocker) {
            // When running in Docker, always use host.docker.internal
            return 'http://host.docker.internal:11434';
        }
        
        // For local use, use localhost
        return 'http://localhost:11434';
    }

    /**
     * Get the default model from environment, config service, or fallback to hardcoded
     */
    async getDefaultModel() {
        // First check environment variable
        if (process.env.LLM_MODEL) {
            this.logger.info(`Using LLM model from environment: ${process.env.LLM_MODEL}`);
            return process.env.LLM_MODEL;
        }
        
        // Then check config service
        if (this.configService) {
            try {
                const configModel = await this.configService.get('model_llm');
                if (configModel) {
                    this.logger.info(`Using LLM model from config: ${configModel}`);
                    return configModel;
                }
            } catch (error) {
                this.logger.debug('Config service unavailable, checking defaults');
            }
        }
        
        // Finally use hardcoded default
        this.logger.info(`Using default LLM model: ${this.config.defaultModel}`);
        return this.config.defaultModel;
    }

    /**
     * Generate analysis using LLM for various tasks
     */
    async generateAnalysis(prompt, context = {}, analysisType = 'general') {
        try {
            const modelName = context.model || await this.getDefaultModel();
            
            // Check cache first
            const cacheKey = this.getCacheKey(prompt, modelName, analysisType);
            if (this.cache.has(cacheKey)) {
                this.logger.debug(`LLM cache hit for ${analysisType}`);
                return this.cache.get(cacheKey);
            }

            // Verify model availability
            await this.ensureModelAvailable(modelName);

            // Build system prompt based on analysis type
            // For pattern detection and technology extraction, use JSON extraction prompt
            const systemPrompt = (analysisType === 'patternAnalysis' || 
                                 analysisType === 'technologyExtraction' ||
                                 analysisType === 'pattern_detection' ||
                                 analysisType === 'technology_extraction') 
                ? this.config.systemPrompts.jsonExtraction 
                : (this.config.systemPrompts[analysisType] || this.config.systemPrompts.patternAnalysis);
            
            this.logger.debug(`LLM analysis type: ${analysisType}, using system prompt: ${systemPrompt.substring(0, 100)}...`);
            
            // Generate the analysis
            const response = await this.generateOllamaResponse(prompt, {
                model: modelName,
                systemPrompt,
                temperature: context.temperature || this.config.temperature,
                maxTokens: context.maxTokens || this.config.maxTokens
            });

            // Cache the result
            this.cacheResponse(cacheKey, response);

            // Store in database cache if significant
            if (response.content && response.content.length > 100) {
                await this.storeAnalysisCache(prompt, response, analysisType, modelName);
            }

            this.logger.debug(`Generated ${analysisType} analysis using ${modelName}`);
            return response;

        } catch (error) {
            this.logger.error('LLM analysis generation failed:', error);
            throw error;
        }
    }

    /**
     * Analyze coding patterns using LLM
     */
    async analyzeCodePattern(pattern, context = {}) {
        const prompt = this.buildPatternAnalysisPrompt(pattern, context);
        
        return await this.generateAnalysis(prompt, {
            model: context.model,
            temperature: 0.1 // Low temp for consistent analysis
        }, 'patternAnalysis');
    }

    /**
     * Generate insights from development data
     */
    async generateInsights(data, context = {}) {
        const prompt = this.buildInsightGenerationPrompt(data, context);
        
        return await this.generateAnalysis(prompt, {
            model: context.model,
            temperature: 0.1 // Low temperature for factual insights
        }, 'insightGeneration');
    }

    /**
     * Analyze outcome correlations
     */
    async analyzeOutcomeCorrelations(patterns, outcomes, context = {}) {
        const prompt = this.buildCorrelationAnalysisPrompt(patterns, outcomes, context);
        
        return await this.generateAnalysis(prompt, {
            model: context.model,
            temperature: 0.1 // Low temp for statistical accuracy
        }, 'outcomeCorrelation');
    }

    /**
     * Simple response generation wrapper for compatibility
     */
    async generateResponse(prompt, options = {}) {
        // Handle legacy calls where model is passed as second parameter
        if (typeof options === 'string') {
            options = { model: options };
        }
        
        const response = await this.generateOllamaResponse(prompt, options);
        return response.content; // Return just the content string
    }

    /**
     * Generate response using Ollama
     */
    async generateOllamaResponse(prompt, options = {}) {
        const url = `${this.config.ollama.host}/api/generate`;
        const defaultModel = await this.getDefaultModel();
        
        const fullPrompt = this.buildFullPrompt(prompt, options.systemPrompt);
        
        // Log the prompt for debugging
        this.logger.debug('Sending prompt to Ollama:', {
            model: options.model || defaultModel,
            promptLength: fullPrompt.length,
            promptPreview: fullPrompt.substring(0, 200) + '...'
        });
        
        const requestBody = {
            model: options.model || defaultModel,
            prompt: fullPrompt,
            stream: false,
            options: {
                temperature: options.temperature || this.config.temperature,
                num_predict: options.maxTokens || this.config.maxTokens,
                top_p: 0.9,
                top_k: 40
            }
        };

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.ollama.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.response) {
                this.logger.error('Invalid response from Ollama API:', data);
                throw new Error('Invalid response from Ollama API');
            }

            // Log the response for debugging
            this.logger.debug('Received response from Ollama:', {
                responseLength: data.response.length,
                responsePreview: data.response.substring(0, 200) + '...',
                tokensUsed: data.eval_count
            });

            return {
                content: data.response.trim(),
                model: options.model || defaultModel,
                tokens: data.eval_count || 0,
                totalDuration: data.total_duration || 0,
                confidence: this.estimateConfidence(data.response),
                metadata: {
                    eval_count: data.eval_count,
                    eval_duration: data.eval_duration,
                    total_duration: data.total_duration
                }
            };

        } catch (error) {
            clearTimeout(timeoutId);
            this.logger.error('Ollama request failed:', error);
            this.logger.error('Request details:', {
                url,
                model: requestBody.model,
                promptLength: requestBody.prompt.length
            });
            if (error.name === 'AbortError') {
                throw new Error(`LLM request timeout after ${this.config.ollama.timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Build pattern analysis prompt
     */
    buildPatternAnalysisPrompt(pattern, context) {
        return `
Analyze the following coding pattern:

**Pattern Information:**
- Type: ${pattern.pattern_type}
- Name: ${pattern.pattern_name || 'Unnamed'}
- Languages: ${pattern.languages?.join(', ') || 'Unknown'}
- Frequency: ${pattern.frequency_count} occurrences across ${pattern.projects_seen?.length || 0} projects
- Current Confidence: ${pattern.confidence_score}

**Pattern Description:**
${pattern.pattern_description || 'No description available'}

**Example Code:**
\`\`\`
${pattern.example_code || 'No example available'}
\`\`\`

**Context:**
${context.additionalContext || 'General analysis requested'}

Please provide:
1. **Quality Assessment**: Rate the pattern's quality and explain why
2. **Effectiveness Analysis**: How effective is this pattern for its intended purpose?
3. **Best Practices**: Does this follow coding best practices?
4. **Improvements**: Specific suggestions for improvement
5. **Risks**: Potential issues or anti-patterns to watch for
6. **Confidence Score**: Your confidence in this analysis (0.0-1.0)

Format your response as structured analysis with clear sections.
        `.trim();
    }

    /**
     * Build insight generation prompt
     */
    buildInsightGenerationPrompt(data, context) {
        const dataDescription = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        
        return `
Generate actionable insights from the following development data:

**Data Overview:**
${dataDescription}

**Analysis Context:**
- Time Period: ${context.timePeriod || 'Not specified'}
- Projects: ${context.projects || 'Multiple projects'}
- Focus Area: ${context.focusArea || 'General development patterns'}

Please provide:
1. **Key Findings**: Most important discoveries from the data
2. **Trends**: Patterns and trends observed
3. **Best Practices**: Validated practices that work well
4. **Anti-Patterns**: Practices to avoid based on evidence
5. **Recommendations**: Specific actionable recommendations
6. **Impact Assessment**: Potential impact of following these insights
7. **Confidence Level**: Your confidence in these insights (0.0-1.0)

Focus on practical, actionable insights that can improve development practices.
        `.trim();
    }

    /**
     * Build correlation analysis prompt
     */
    buildCorrelationAnalysisPrompt(patterns, outcomes, context) {
        return `
Analyze the correlation between coding patterns and their outcomes:

**Patterns Data:**
${JSON.stringify(patterns, null, 2)}

**Outcomes Data:**
${JSON.stringify(outcomes, null, 2)}

**Analysis Context:**
${JSON.stringify(context, null, 2)}

Please provide:
1. **Correlation Strength**: How strongly are patterns correlated with outcomes?
2. **Causal Relationships**: Which patterns likely cause specific outcomes?
3. **Success Patterns**: Patterns most associated with positive outcomes
4. **Risk Patterns**: Patterns associated with negative outcomes
5. **Statistical Insights**: Statistical observations about the correlations
6. **Predictive Value**: How well can patterns predict outcomes?
7. **Confidence Assessment**: Your confidence in this correlation analysis (0.0-1.0)

Be specific about correlation strength and provide evidence for your conclusions.
        `.trim();
    }

    /**
     * Build full prompt with system context
     */
    buildFullPrompt(userPrompt, systemPrompt) {
        if (!systemPrompt) {
            return userPrompt;
        }
        
        return `${systemPrompt}

${userPrompt}`;
    }

    /**
     * Estimate confidence based on response characteristics
     */
    estimateConfidence(response) {
        let confidence = 0.5; // Base confidence
        
        // Length indicators
        if (response.length > 500) confidence += 0.1;
        if (response.length > 1000) confidence += 0.1;
        
        // Structure indicators
        if (response.includes('1.') || response.includes('##')) confidence += 0.1;
        if (response.includes('confidence') || response.includes('score')) confidence += 0.1;
        
        // Uncertainty indicators
        if (response.includes('might') || response.includes('possibly')) confidence -= 0.1;
        if (response.includes('unclear') || response.includes('unknown')) confidence -= 0.1;
        
        return Math.max(0.0, Math.min(1.0, confidence));
    }

    /**
     * Ensure model is available
     */
    async ensureModelAvailable(modelName) {
        try {
            const url = `${this.config.ollama.host}/api/tags`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to check model availability: ${response.statusText}`);
            }
            
            const data = await response.json();
            const availableModels = data.models?.map(m => m.name) || [];
            
            if (!availableModels.includes(modelName)) {
                this.logger.warn(`Model ${modelName} not found, attempting to pull...`);
                await this.pullModel(modelName);
            }
            
        } catch (error) {
            this.logger.error(`Failed to verify model availability: ${error.message}`);
            throw error;
        }
    }

    /**
     * Pull model from Ollama if not available
     */
    async pullModel(modelName) {
        try {
            const url = `${this.config.ollama.host}/api/pull`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            });

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`);
            }

            this.logger.info(`Successfully pulled model: ${modelName}`);
            
        } catch (error) {
            this.logger.error(`Failed to pull model ${modelName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Store analysis in database cache
     */
    async storeAnalysisCache(prompt, response, analysisType, modelName) {
        try {
            const contentHash = crypto.createHash('sha256').update(prompt).digest('hex');
            
            await this.db.query(`
                INSERT INTO llm_analysis_cache (
                    content_hash, analysis_type, model_used, input_data, 
                    analysis_result, confidence_score, created_at, expires_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW() + INTERVAL '30 days')
                ON CONFLICT (content_hash) DO UPDATE SET
                    analysis_result = EXCLUDED.analysis_result,
                    confidence_score = EXCLUDED.confidence_score,
                    created_at = NOW()
            `, [
                contentHash,
                analysisType,
                modelName,
                JSON.stringify({ prompt }),
                JSON.stringify(response),
                response.confidence || 0.5
            ]);
            
        } catch (error) {
            this.logger.error('Failed to store analysis cache:', error);
            // Don't throw - caching failure shouldn't break the analysis
        }
    }

    /**
     * Get cached analysis from database
     */
    async getCachedAnalysis(prompt, analysisType, modelName) {
        try {
            const contentHash = crypto.createHash('sha256').update(prompt).digest('hex');
            
            const result = await this.db.query(`
                SELECT analysis_result, confidence_score, created_at
                FROM llm_analysis_cache
                WHERE content_hash = $1 
                  AND analysis_type = $2 
                  AND model_used = $3
                  AND expires_at > NOW()
                ORDER BY created_at DESC
                LIMIT 1
            `, [contentHash, analysisType, modelName]);
            
            if (result.rows.length > 0) {
                return JSON.parse(result.rows[0].analysis_result);
            }
            
            return null;
            
        } catch (error) {
            this.logger.error('Failed to get cached analysis:', error);
            return null;
        }
    }

    /**
     * Analyze content with adaptive temperature based on task type
     */
    async analyze(prompt, options = {}) {
        const {
            taskType = null,
            temperature = null,
            maxTokens = this.config.maxTokens,
            systemPrompt = null,
            requirements = null,
            retryCount = 0,
            confidence = null
        } = options;
        
        // Determine task type if not provided
        const actualTaskType = taskType || this.temperatureService.suggestTaskType(prompt);
        
        // Get adaptive temperature if not explicitly provided
        const adaptiveTemp = temperature !== null ? temperature : 
            await this.temperatureService.getTemperature(actualTaskType, {
                requirements,
                confidence,
                retryCount,
                useAIAdjustment: false // Avoid circular dependency
            });
        
        this.logger.debug('Using adaptive temperature:', {
            taskType: actualTaskType,
            temperature: adaptiveTemp
        });
        
        // Generate response with adaptive temperature
        const response = await this.generateOllamaResponse(prompt, {
            ...options,
            temperature: adaptiveTemp,
            systemPrompt: systemPrompt || this.getSystemPromptForTaskType(actualTaskType)
        });
        
        // Track performance for future optimization
        if (response && response.content) {
            const success = response.error === undefined;
            this.temperatureService.trackPerformance(actualTaskType, adaptiveTemp, success, {
                tokensUsed: response.eval_count || 0,
                processingTime: response.total_duration || 0
            });
        }
        
        // Parse JSON if expected
        if (actualTaskType === 'json_extraction' || 
            prompt.toLowerCase().includes('return json') || 
            prompt.toLowerCase().includes('json format')) {
            try {
                return JSON.parse(response.content);
            } catch (error) {
                this.logger.warn('Failed to parse JSON response:', error.message);
                // Try to extract JSON from the response
                const jsonMatch = response.content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        return JSON.parse(jsonMatch[0]);
                    } catch (e) {
                        this.logger.error('Failed to extract JSON from response');
                    }
                }
                return response.content;
            }
        }
        
        return response.content;
    }
    
    /**
     * Get appropriate system prompt for task type
     */
    getSystemPromptForTaskType(taskType) {
        const taskPrompts = {
            'json_extraction': this.config.systemPrompts.jsonExtraction,
            'pattern_analysis': this.config.systemPrompts.patternAnalysis,
            'insight_generation': this.config.systemPrompts.insightGeneration,
            'score_calculation': 'You are a precise scoring assistant. Return numerical scores with clear reasoning.',
            'classification': 'You are an expert classifier. Categorize inputs accurately and consistently.',
            'search_strategy': 'You are a search optimization expert. Suggest effective search strategies.',
            'synthesis': 'You are a synthesis expert. Combine information to create coherent insights.'
        };
        
        return taskPrompts[taskType] || 'You are a helpful AI assistant.';
    }

    /**
     * Generate cache key
     */
    getCacheKey(prompt, model, analysisType) {
        const content = `${prompt}:${model}:${analysisType}`;
        return crypto.createHash('md5').update(content).digest('hex');
    }

    /**
     * Cache response in memory
     */
    cacheResponse(key, response) {
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, response);
    }

    /**
     * Health check for LLM service
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.config.ollama.host}/api/version`);
            
            if (!response.ok) {
                return { healthy: false, error: `Ollama not available: ${response.statusText}` };
            }
            
            const data = await response.json();
            
            // Test with default model
            try {
                const defaultModel = await this.getDefaultModel();
                await this.ensureModelAvailable(defaultModel);
                return { 
                    healthy: true, 
                    ollamaVersion: data.version,
                    defaultModel: defaultModel,
                    cacheSize: this.cache.size
                };
            } catch (modelError) {
                return { 
                    healthy: false, 
                    error: `Default model not available: ${modelError.message}`,
                    ollamaVersion: data.version
                };
            }
            
        } catch (error) {
            return { healthy: false, error: error.message };
        }
    }

    /**
     * Get service statistics
     */
    async getStats() {
        const defaultModel = await this.getDefaultModel();
        return {
            cacheSize: this.cache.size,
            maxCacheSize: this.maxCacheSize,
            defaultModel: defaultModel,
            timeout: this.config.ollama.timeout,
            availableAnalysisTypes: Object.keys(this.config.systemPrompts)
        };
    }
}

export default LLMService;