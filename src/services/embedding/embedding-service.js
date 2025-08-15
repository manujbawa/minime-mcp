/**
 * Embedding Service for MiniMe-MCP
 * Handles vector embedding generation using various providers (Ollama, OpenAI, etc.)
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import TokenUtils from '../../utils/token-utils.js';

export class EmbeddingService {
    constructor(logger, databaseService) {
        this.logger = logger;
        this.db = databaseService;
        this.tokenUtils = new TokenUtils();
        this.cache = new Map(); // Simple in-memory cache
        this.maxCacheSize = 1000;
        this.tagClassifier = null; // Will be set via setTagClassifier
        
        // Default configuration - connect to host machine Ollama
        this.config = {
            ollama: {
                host: this.getOllamaHost(),
                timeout: 30000,
                retries: 3
            },
            openai: {
                apiKey: process.env.OPENAI_API_KEY,
                baseUrl: 'https://api.openai.com/v1',
                timeout: 30000
            }
        };
        
        // Background processing configuration
        this.processingInterval = parseInt(process.env.ENRICHMENT_INTERVAL_MS || '5000'); // 5 seconds default
        this.batchSize = parseInt(process.env.ENRICHMENT_BATCH_SIZE || '10');
        this.maxRetries = parseInt(process.env.ENRICHMENT_MAX_RETRIES || '3');
        this.isProcessing = false;
        this.processingTimer = null;
    }

    /**
     * Set the tag classifier for enrichment
     */
    setTagClassifier(tagClassifier) {
        this.tagClassifier = tagClassifier;
        this.logger.info('Tag classifier set for embedding service');
    }

    /**
     * Get Ollama host URL based on environment
     */
    getOllamaHost() {
        // Check for explicit override first
        if (process.env.OLLAMA_HOST_URL) {
            return process.env.OLLAMA_HOST_URL;
        }
        
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
     * Generate embedding for given text using specified model
     */
    async generateEmbedding(text, modelName = null) {
        try {
            // Get default model if not specified
            if (!modelName) {
                modelName = await this.getDefaultModel();
            }

            // Check cache first
            const cacheKey = this.getCacheKey(text, modelName);
            if (this.cache.has(cacheKey)) {
                this.logger.debug(`Cache hit for embedding: ${modelName}`);
                return this.cache.get(cacheKey);
            }

            // Get model configuration
            const modelConfig = await this.getModelConfig(modelName);
            if (!modelConfig) {
                throw new Error(`Embedding model not found: ${modelName}`);
            }

            if (!modelConfig.is_available) {
                throw new Error(`Embedding model not available: ${modelName}`);
            }

            let embedding;
            
            // Generate embedding based on provider
            switch (modelConfig.provider) {
                case 'ollama':
                    embedding = await this.generateOllamaEmbedding(text, modelName);
                    break;
                case 'openai':
                    embedding = await this.generateOpenAIEmbedding(text, modelName);
                    break;
                default:
                    throw new Error(`Unsupported embedding provider: ${modelConfig.provider}`);
            }

            // Validate embedding
            if (!Array.isArray(embedding) || embedding.length !== modelConfig.dimensions) {
                throw new Error(`Invalid embedding dimensions: expected ${modelConfig.dimensions}, got ${embedding.length}`);
            }

            // Cache the result
            this.cacheEmbedding(cacheKey, embedding);

            this.logger.debug(`Generated ${modelConfig.dimensions}D embedding using ${modelName}`);
            return embedding;

        } catch (error) {
            this.logger.error('Embedding generation failed:', error);
            throw error;
        }
    }

    /**
     * Generate embedding with optional tags and summary
     * This is the enhanced version that includes enrichment
     */
    async generateEmbeddingWithEnrichment(text, options = {}) {
        const {
            modelName = null,
            memoryType = 'note',
            projectContext = null,
            skipEnrichment = false
        } = options;

        try {
            // Always generate embedding first
            const embedding = await this.generateEmbedding(text, modelName);
            
            // If enrichment is disabled or no classifier, return just embedding
            if (skipEnrichment || !this.tagClassifier) {
                return { embedding, tags: [], summary: null };
            }

            // Run enrichment in parallel for better performance
            const [tagResult, summary] = await Promise.allSettled([
                this.tagClassifier.classifyContent(text, {
                    memoryType,
                    projectContext,
                    quickMode: false
                }),
                this.tagClassifier.generateSummary(text, memoryType, 500)
            ]);

            // Extract results with error handling
            const tags = tagResult.status === 'fulfilled' ? (tagResult.value.tags || []) : [];
            const summaryText = summary.status === 'fulfilled' ? summary.value : null;

            return {
                embedding,
                tags,
                summary: summaryText,
                tagConfidence: tagResult.status === 'fulfilled' ? tagResult.value.confidence : 0
            };

        } catch (error) {
            this.logger.error('Enhanced embedding generation failed:', error);
            // Fallback to basic embedding
            const embedding = await this.generateEmbedding(text, modelName);
            return { embedding, tags: [], summary: null, error: error.message };
        }
    }

    /**
     * Generate embedding using Ollama
     */
    async generateOllamaEmbedding(text, modelName) {
        const url = `${this.config.ollama.host}/api/embeddings`;
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.ollama.timeout);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    prompt: text
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.embedding) {
                throw new Error('No embedding returned from Ollama');
            }

            return data.embedding;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Ollama embedding request timed out after ${this.config.ollama.timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Generate embedding using OpenAI
     */
    async generateOpenAIEmbedding(text, modelName) {
        if (!this.config.openai.apiKey) {
            throw new Error('OpenAI API key not configured');
        }

        const url = `${this.config.openai.baseUrl}/embeddings`;
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.openai.timeout);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.openai.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: modelName,
                    input: text
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.data || !data.data[0] || !data.data[0].embedding) {
                throw new Error('No embedding returned from OpenAI');
            }

            return data.data[0].embedding;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`OpenAI embedding request timed out after ${this.config.openai.timeout}ms`);
            }
            throw error;
        }
    }

    /**
     * Get available embedding models
     */
    async getAvailableModels() {
        try {
            const result = await this.db.query(`
                SELECT model_name, dimensions, provider, description, model_size_mb, is_default
                FROM embedding_models 
                WHERE is_available = true 
                ORDER BY is_default DESC, model_size_mb ASC
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
            const result = await this.db.query(`
                SELECT model_name 
                FROM embedding_models 
                WHERE is_default = true AND is_available = true 
                LIMIT 1
            `);
            
            if (result.rows.length === 0) {
                // Fallback to first available model
                const fallback = await this.db.query(`
                    SELECT model_name 
                    FROM embedding_models 
                    WHERE is_available = true 
                    ORDER BY model_size_mb ASC 
                    LIMIT 1
                `);
                
                if (fallback.rows.length === 0) {
                    throw new Error('No embedding models available');
                }
                
                return fallback.rows[0].model_name;
            }
            
            return result.rows[0].model_name;
        } catch (error) {
            this.logger.error('Failed to get default model:', error);
            throw error;
        }
    }

    /**
     * Get model configuration
     */
    async getModelConfig(modelName) {
        try {
            // Check if database service is available
            if (!this.db || !this.db.query) {
                this.logger.warn('Database service not available, using default model config');
                return {
                    model_name: modelName,
                    vector_dimensions: 1024,
                    is_default: modelName === 'mxbai-embed-large:latest',
                    is_available: true
                };
            }
            
            const result = await this.db.query(`
                SELECT * FROM embedding_models WHERE model_name = $1
            `, [modelName]);
            
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            this.logger.error('Failed to get model config:', error);
            return null;
        }
    }

    /**
     * Update model availability status
     */
    async updateModelAvailability(modelName, isAvailable) {
        try {
            await this.db.query(`
                UPDATE embedding_models 
                SET is_available = $2, updated_at = NOW() 
                WHERE model_name = $1
            `, [modelName, isAvailable]);
            
            this.logger.info(`Updated model availability: ${modelName} = ${isAvailable}`);
        } catch (error) {
            this.logger.error('Failed to update model availability:', error);
        }
    }

    /**
     * Test embedding model
     */
    async testModel(modelName) {
        try {
            const testText = "This is a test embedding to verify the model is working correctly.";
            const embedding = await this.generateEmbedding(testText, modelName);
            
            this.logger.info(`Model test successful: ${modelName} (${embedding.length} dimensions)`);
            return true;
        } catch (error) {
            this.logger.error(`Model test failed for ${modelName}:`, error);
            return false;
        }
    }

    /**
     * Health check for embedding service
     */
    async healthCheck() {
        try {
            const models = await this.getAvailableModels();
            const defaultModel = models.find(m => m.is_default);
            
            if (!defaultModel) {
                return {
                    status: 'degraded',
                    message: 'No default embedding model available',
                    availableModels: models.length
                };
            }

            // Test default model
            const testResult = await this.testModel(defaultModel.model_name);
            
            return {
                status: testResult ? 'healthy' : 'degraded',
                defaultModel: defaultModel.model_name,
                availableModels: models.length,
                cacheSize: this.cache.size
            };
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                availableModels: 0
            };
        }
    }

    /**
     * Calculate similarity between two embeddings
     */
    cosineSimilarity(embeddingA, embeddingB) {
        if (embeddingA.length !== embeddingB.length) {
            throw new Error('Embeddings must have the same dimensions');
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < embeddingA.length; i++) {
            dotProduct += embeddingA[i] * embeddingB[i];
            normA += embeddingA[i] * embeddingA[i];
            normB += embeddingB[i] * embeddingB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Helper methods
     */
    getCacheKey(text, modelName) {
        return crypto.createHash('sha256')
            .update(`${modelName}:${text}`)
            .digest('hex');
    }

    cacheEmbedding(key, embedding) {
        // Simple LRU cache implementation
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, embedding);
    }

    /**
     * Clear embedding cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.info('Embedding cache cleared');
    }

    /**
     * Start background processing of pending memories
     */
    startBackgroundProcessing() {
        if (this.processingTimer) {
            this.logger.warn('Background processing already started');
            return;
        }

        this.logger.info(`Starting enrichment background processor (interval: ${this.processingInterval}ms, batch: ${this.batchSize})`);
        
        // Run immediately on start
        this.processPendingMemories();
        this.processTagEmbeddings();
        
        // Set up recurring interval
        this.processingTimer = setInterval(async () => {
            await this.processPendingMemories();
            await this.processTagEmbeddings();
        }, this.processingInterval);
    }

    /**
     * Stop background processing
     */
    stopBackgroundProcessing() {
        if (this.processingTimer) {
            clearInterval(this.processingTimer);
            this.processingTimer = null;
            this.logger.info('Background processing stopped');
        }
    }

    /**
     * Process pending memories for enrichment
     */
    async processPendingMemories() {
        // Prevent concurrent processing
        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;

        try {
            // Fetch pending memories
            const result = await this.db.query(`
                SELECT m.id, m.content, m.memory_type, p.name as project_name, m.retry_count
                FROM memories m
                JOIN projects p ON m.project_id = p.id
                WHERE m.processing_status = 'pending'
                   OR (m.processing_status = 'failed' AND m.retry_count < $1)
                ORDER BY m.created_at ASC
                LIMIT $2
            `, [this.maxRetries, this.batchSize]);

            if (result.rows.length === 0) {
                return;
            }

            this.logger.debug(`Processing ${result.rows.length} pending memories`);

            // Process each memory
            for (const memory of result.rows) {
                try {
                    // Mark as processing
                    await this.db.query(`
                        UPDATE memories 
                        SET processing_status = 'processing'
                        WHERE id = $1
                    `, [memory.id]);

                    // Generate enrichment
                    const enrichment = await this.generateEmbeddingWithEnrichment(memory.content, {
                        memoryType: memory.memory_type,
                        projectContext: memory.project_name,
                        skipEnrichment: false
                    });

                    // Generate tag embedding if tags are available
                    let tagEmbedding = null;
                    if (enrichment.tags && enrichment.tags.length > 0) {
                        try {
                            const tagText = enrichment.tags.join(' ');
                            tagEmbedding = await this.generateEmbedding(tagText);
                        } catch (tagError) {
                            this.logger.warn(`Failed to generate tag embedding for memory ${memory.id}:`, tagError);
                        }
                    }

                    // Calculate token metadata with new summary and tags
                    const tokenMetadata = this.tokenUtils.calculateTokenMetadata(
                        memory.content,
                        enrichment.summary,
                        enrichment.tags
                    );

                    // Update memory with enrichment including tag embedding
                    await this.db.query(`
                        UPDATE memories
                        SET 
                            embedding = $2,
                            tag_embedding = $3,
                            smart_tags = $4,
                            summary = $5,
                            token_metadata = $6,
                            processing_status = 'ready',
                            processed_at = NOW(),
                            retry_count = 0
                        WHERE id = $1
                    `, [
                        memory.id,
                        JSON.stringify(enrichment.embedding),
                        tagEmbedding ? JSON.stringify(tagEmbedding) : null,
                        enrichment.tags,
                        enrichment.summary,
                        JSON.stringify(tokenMetadata)
                    ]);

                    this.logger.debug(`Memory ${memory.id} enriched successfully`);
                    
                } catch (error) {
                    this.logger.error(`Failed to enrich memory ${memory.id}:`, error);
                    
                    // Update retry count and status
                    const newRetryCount = (memory.retry_count || 0) + 1;
                    const newStatus = newRetryCount >= this.maxRetries ? 'failed_permanent' : 'failed';
                    
                    await this.db.query(`
                        UPDATE memories
                        SET 
                            processing_status = $2,
                            processing_error = $3,
                            retry_count = $4,
                            last_retry_at = NOW()
                        WHERE id = $1
                    `, [memory.id, newStatus, error.message, newRetryCount]);
                }
            }

        } catch (error) {
            this.logger.error('Error in background processing:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate tag embeddings for existing memories that have smart_tags but no tag_embedding
     * Now uses unified processing approach - no separate tag_processing_status
     */
    async processTagEmbeddings() {
        try {
            // Find memories with smart_tags but no tag_embedding
            const result = await this.db.query(`
                SELECT id, smart_tags
                FROM memories
                WHERE smart_tags IS NOT NULL 
                AND array_length(smart_tags, 1) > 0
                AND tag_embedding IS NULL
                AND processing_status IN ('ready', 'pending')
                ORDER BY created_at ASC
                LIMIT $1
            `, [this.batchSize]);

            if (result.rows.length === 0) {
                return { processed: 0, errors: 0 };
            }

            this.logger.info(`Processing tag embeddings for ${result.rows.length} memories`);

            let processed = 0;
            let errors = 0;

            for (const memory of result.rows) {
                try {
                    // Generate tag embedding
                    const tagText = memory.smart_tags.join(' ');
                    const tagEmbedding = await this.generateEmbedding(tagText);

                    // Update with tag embedding
                    await this.db.query(`
                        UPDATE memories
                        SET tag_embedding = $2
                        WHERE id = $1
                    `, [memory.id, JSON.stringify(tagEmbedding)]);

                    processed++;
                    this.logger.debug(`Generated tag embedding for memory ${memory.id}`);

                } catch (error) {
                    this.logger.error(`Failed to generate tag embedding for memory ${memory.id}:`, error);
                    errors++;
                }
            }

            this.logger.info(`Tag embedding processing completed: ${processed} processed, ${errors} errors`);
            return { processed, errors };

        } catch (error) {
            this.logger.error('Tag embedding processing failed:', error);
            throw error;
        }
    }

    /**
     * Get enrichment processing stats with unified processing status
     */
    async getProcessingStats() {
        try {
            const [contentStats, tagStats] = await Promise.all([
                this.db.query(`
                    SELECT 
                        processing_status,
                        COUNT(*) as count
                    FROM memories
                    WHERE processing_status IS NOT NULL
                    GROUP BY processing_status
                `),
                this.db.query(`
                    SELECT 
                        CASE 
                            WHEN smart_tags IS NOT NULL AND array_length(smart_tags, 1) > 0 AND tag_embedding IS NOT NULL THEN 'ready'
                            WHEN smart_tags IS NOT NULL AND array_length(smart_tags, 1) > 0 AND tag_embedding IS NULL THEN 'pending'
                            ELSE 'not_applicable'
                        END as tag_status,
                        COUNT(*) as count
                    FROM memories
                    GROUP BY tag_status
                `)
            ]);

            const stats = {
                content: {
                    pending: 0,
                    processing: 0,
                    ready: 0,
                    failed: 0,
                    failed_permanent: 0
                },
                tags: {
                    pending: 0,
                    ready: 0,
                    not_applicable: 0
                }
            };

            contentStats.rows.forEach(row => {
                stats.content[row.processing_status] = parseInt(row.count);
            });

            tagStats.rows.forEach(row => {
                stats.tags[row.tag_status] = parseInt(row.count);
            });

            return stats;
        } catch (error) {
            this.logger.error('Failed to get processing stats:', error);
            return null;
        }
    }
}

export default EmbeddingService;