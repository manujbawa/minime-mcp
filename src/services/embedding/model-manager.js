/**
 * Embedding Model Manager
 * Handles model configuration, availability, and validation
 */

export class EmbeddingModelManager {
    constructor(logger, databaseService) {
        this.logger = logger;
        this.db = databaseService;
        this.modelCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get all available embedding models
     */
    async getAvailableModels() {
        try {
            const result = await this.db.query(`
                SELECT 
                    model_name,
                    provider,
                    dimensions,
                    is_available,
                    last_checked,
                    performance_metrics
                FROM embedding_models 
                WHERE is_available = true
                ORDER BY provider, model_name
            `);
            
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to get available models:', error);
            return [];
        }
    }

    /**
     * Get default embedding model
     */
    async getDefaultModel() {
        try {
            // Check cache first
            const cacheKey = 'default_model';
            const cached = this.modelCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }

            // Try to get from database
            const result = await this.db.query(`
                SELECT model_name 
                FROM embedding_models 
                WHERE is_default = true AND is_available = true
                LIMIT 1
            `);

            let defaultModel;
            if (result.rows.length > 0) {
                defaultModel = result.rows[0].model_name;
            } else {
                // Fallback to first available model
                const availableModels = await this.getAvailableModels();
                defaultModel = availableModels.length > 0 ? availableModels[0].model_name : 'mxbai-embed-large';
            }

            // Cache the result
            this.modelCache.set(cacheKey, {
                data: defaultModel,
                timestamp: Date.now()
            });

            return defaultModel;
        } catch (error) {
            this.logger.error('Failed to get default model:', error);
            return 'mxbai-embed-large'; // Fallback
        }
    }

    /**
     * Get model configuration
     */
    async getModelConfig(modelName) {
        try {
            // Check cache first
            const cacheKey = `model_config_${modelName}`;
            const cached = this.modelCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }

            const result = await this.db.query(`
                SELECT 
                    model_name,
                    provider,
                    dimensions,
                    is_available,
                    is_default,
                    context_length,
                    performance_metrics,
                    created_at,
                    last_checked
                FROM embedding_models 
                WHERE model_name = $1
            `, [modelName]);

            if (result.rows.length === 0) {
                return null;
            }

            const config = result.rows[0];

            // Cache the result
            this.modelCache.set(cacheKey, {
                data: config,
                timestamp: Date.now()
            });

            return config;
        } catch (error) {
            this.logger.error(`Failed to get model config for ${modelName}:`, error);
            return null;
        }
    }

    /**
     * Update model availability
     */
    async updateModelAvailability(modelName, isAvailable) {
        try {
            await this.db.query(`
                UPDATE embedding_models 
                SET 
                    is_available = $2,
                    last_checked = NOW()
                WHERE model_name = $1
            `, [modelName, isAvailable]);

            // Clear cache for this model
            this.modelCache.delete(`model_config_${modelName}`);
            this.modelCache.delete('default_model');

            this.logger.info(`Updated availability for model ${modelName}: ${isAvailable}`);
        } catch (error) {
            this.logger.error(`Failed to update model availability for ${modelName}:`, error);
        }
    }

    /**
     * Test if a model is working
     */
    async testModel(modelName, providers) {
        try {
            const modelConfig = await this.getModelConfig(modelName);
            if (!modelConfig) {
                throw new Error(`Model ${modelName} not found`);
            }

            const providerMethod = providers.getProviderMethod(modelConfig.provider);
            
            // Test with a simple text
            const testText = "Test embedding generation";
            const embedding = await providerMethod(testText, modelName);
            
            if (!Array.isArray(embedding) || embedding.length !== modelConfig.dimensions) {
                throw new Error(`Invalid embedding dimensions: expected ${modelConfig.dimensions}, got ${embedding.length}`);
            }

            // Update availability to true
            await this.updateModelAvailability(modelName, true);
            
            return {
                success: true,
                dimensions: embedding.length,
                model: modelName,
                provider: modelConfig.provider
            };
        } catch (error) {
            // Update availability to false
            await this.updateModelAvailability(modelName, false);
            
            this.logger.error(`Model test failed for ${modelName}:`, error);
            return {
                success: false,
                error: error.message,
                model: modelName
            };
        }
    }

    /**
     * Validate embedding dimensions
     */
    validateEmbedding(embedding, expectedDimensions) {
        if (!Array.isArray(embedding)) {
            throw new Error('Embedding must be an array');
        }
        
        if (embedding.length !== expectedDimensions) {
            throw new Error(`Invalid embedding dimensions: expected ${expectedDimensions}, got ${embedding.length}`);
        }
        
        if (!embedding.every(val => typeof val === 'number' && !isNaN(val))) {
            throw new Error('Embedding must contain only valid numbers');
        }
        
        return true;
    }

    /**
     * Clear model cache
     */
    clearCache() {
        this.modelCache.clear();
        this.logger.info('Model cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.modelCache.size,
            maxAge: this.cacheExpiry,
            entries: Array.from(this.modelCache.keys())
        };
    }
} 