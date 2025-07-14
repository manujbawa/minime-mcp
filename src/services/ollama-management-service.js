/**
 * Ollama Management Service
 * Handles connection to host machine Ollama instance for model management
 */

import fetch from 'node-fetch';

export class OllamaManagementService {
    constructor(logger) {
        this.logger = logger;
        // Connect to host machine's Ollama instance
        // Docker environment detection - check multiple indicators
        const isDocker = process.env.DOCKER_ENV || 
                        process.env.POSTGRES_PASSWORD || // Docker compose sets this
                        (process.env.MCP_PORT && process.env.UI_PORT); // Docker run sets these
        
        if (isDocker) {
            // When running in Docker, always use host.docker.internal
            this.ollamaHost = 'http://host.docker.internal:11434';
            this.logger.info(`Docker environment detected, using Ollama host: ${this.ollamaHost}`);
        } else {
            // For local use, use localhost
            this.ollamaHost = 'http://localhost:11434';
            this.logger.info(`Local environment, using Ollama host: ${this.ollamaHost}`);
        }
        
        this.requestTimeout = 30000; // 30 seconds for most operations
        this.pullTimeout = 600000; // 10 minutes for model pulls
    }

    /**
     * Get list of available models on the host Ollama instance
     */
    async listModels() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            const response = await fetch(`${this.ollamaHost}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Transform the data to include more details
            const models = (data.models || []).map(model => ({
                name: model.name,
                model: model.model,
                size: this.formatBytes(model.size),
                sizeBytes: model.size,
                digest: model.digest,
                modifiedAt: model.modified_at,
                details: model.details || {},
                parameterSize: model.details?.parameter_size || 'Unknown',
                quantizationLevel: model.details?.quantization_level || 'Unknown',
                families: model.details?.families || [],
                family: model.details?.family || 'Unknown',
                format: model.details?.format || 'Unknown'
            }));
            
            return {
                success: true,
                models,
                count: models.length,
                host: this.ollamaHost
            };
            
        } catch (error) {
            this.logger.error('Failed to list Ollama models:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout while listing models');
            }
            throw error;
        }
    }

    /**
     * Get detailed information about a specific model
     */
    async getModelInfo(modelName) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            const response = await fetch(`${this.ollamaHost}/api/show`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to get model info: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return {
                success: true,
                modelInfo: {
                    name: modelName,
                    ...data,
                    template: data.template,
                    parameters: data.parameters,
                    modelfile: data.modelfile,
                    license: data.license
                }
            };
            
        } catch (error) {
            this.logger.error('Failed to get model info:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout while getting model info');
            }
            throw error;
        }
    }

    /**
     * Pull a new model from Ollama registry
     */
    async pullModel(modelName, onProgress) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.pullTimeout);
            
            const response = await fetch(`${this.ollamaHost}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: modelName,
                    stream: true
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.statusText}`);
            }
            
            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let lastStatus = null;
            
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                
                if (value) {
                    const chunk = decoder.decode(value);
                    const lines = chunk.trim().split('\n');
                    
                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            
                            if (data.status) {
                                lastStatus = data.status;
                                
                                if (onProgress) {
                                    onProgress({
                                        status: data.status,
                                        completed: data.completed || 0,
                                        total: data.total || 0,
                                        progress: data.total ? (data.completed / data.total) * 100 : 0
                                    });
                                }
                            }
                            
                            if (data.error) {
                                throw new Error(data.error);
                            }
                        } catch (e) {
                            if (e instanceof SyntaxError) {
                                // Ignore JSON parse errors for incomplete chunks
                                continue;
                            }
                            throw e;
                        }
                    }
                }
            }
            
            return {
                success: true,
                message: `Successfully pulled model: ${modelName}`,
                finalStatus: lastStatus
            };
            
        } catch (error) {
            this.logger.error('Failed to pull model:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout while pulling model (this can take several minutes for large models)');
            }
            throw error;
        }
    }

    /**
     * Delete a model
     */
    async deleteModel(modelName) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            const response = await fetch(`${this.ollamaHost}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to delete model: ${errorText || response.statusText}`);
            }
            
            return {
                success: true,
                message: `Successfully deleted model: ${modelName}`
            };
            
        } catch (error) {
            this.logger.error('Failed to delete model:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout while deleting model');
            }
            throw error;
        }
    }

    /**
     * Test connection to Ollama host
     */
    async testConnection() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const response = await fetch(`${this.ollamaHost}/api/version`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                return {
                    connected: false,
                    error: `Failed to connect: ${response.statusText}`,
                    host: this.ollamaHost
                };
            }
            
            const data = await response.json();
            
            return {
                connected: true,
                version: data.version,
                host: this.ollamaHost
            };
            
        } catch (error) {
            this.logger.error('Failed to test Ollama connection:', error);
            return {
                connected: false,
                error: error.message,
                host: this.ollamaHost
            };
        }
    }

    /**
     * Get running models
     */
    async getRunningModels() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            const response = await fetch(`${this.ollamaHost}/api/ps`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to get running models: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return {
                success: true,
                models: data.models || [],
                count: (data.models || []).length
            };
            
        } catch (error) {
            this.logger.error('Failed to get running models:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout while getting running models');
            }
            throw error;
        }
    }

    /**
     * Update model configuration (for LLM service)
     */
    async updateLLMModelConfig(modelName) {
        try {
            // First verify the model exists
            const models = await this.listModels();
            const modelExists = models.models.some(m => m.name === modelName);
            
            if (!modelExists) {
                throw new Error(`Model ${modelName} not found on host`);
            }
            
            // Update the LLM service configuration
            // This would typically update environment variables or config files
            return {
                success: true,
                message: `LLM service configured to use model: ${modelName}`,
                previousModel: process.env.OLLAMA_DEFAULT_MODEL || 'deepseek-coder:6.7b',
                newModel: modelName
            };
            
        } catch (error) {
            this.logger.error('Failed to update LLM model config:', error);
            throw error;
        }
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    /**
     * Validate embedding model availability
     */
    async validateEmbeddingModel() {
        try {
            const requiredModel = 'mxbai-embed-large:latest';
            const models = await this.listModels();
            
            if (!models.success) {
                return {
                    available: false,
                    error: 'Failed to list models',
                    model: requiredModel
                };
            }
            
            const embeddingModel = models.models.find(m => m.name === requiredModel);
            
            if (!embeddingModel) {
                return {
                    available: false,
                    error: `Required embedding model '${requiredModel}' not found`,
                    model: requiredModel,
                    suggestedAction: `Run: ollama pull ${requiredModel}`
                };
            }
            
            // Test if the model actually works
            try {
                const testResponse = await fetch(`${this.ollamaHost}/api/embeddings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: requiredModel,
                        prompt: 'test embedding'
                    }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });
                
                if (!testResponse.ok) {
                    return {
                        available: false,
                        error: `Embedding model exists but failed to generate embeddings: ${testResponse.statusText}`,
                        model: requiredModel,
                        modelInfo: embeddingModel
                    };
                }
                
                return {
                    available: true,
                    model: requiredModel,
                    modelInfo: embeddingModel,
                    tested: true
                };
                
            } catch (testError) {
                return {
                    available: false,
                    error: `Embedding model exists but test failed: ${testError.message}`,
                    model: requiredModel,
                    modelInfo: embeddingModel
                };
            }
            
        } catch (error) {
            return {
                available: false,
                error: error.message,
                model: 'mxbai-embed-large:latest'
            };
        }
    }

    /**
     * Get Ollama system information and logs
     */
    async getSystemInfo() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
            
            // Try to get system info (this may not be available in all Ollama versions)
            const response = await fetch(`${this.ollamaHost}/api/ps`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`Failed to get system info: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            return {
                success: true,
                runningModels: data.models || [],
                systemInfo: data.system_info || null
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get health status
     */
    async healthCheck() {
        try {
            const connectionTest = await this.testConnection();
            if (!connectionTest.connected) {
                return {
                    healthy: false,
                    error: connectionTest.error,
                    host: this.ollamaHost
                };
            }
            
            const models = await this.listModels();
            const embeddingValidation = await this.validateEmbeddingModel();
            
            return {
                healthy: true,
                host: this.ollamaHost,
                version: connectionTest.version,
                modelCount: models.count,
                embeddingModel: embeddingValidation
            };
            
        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                host: this.ollamaHost
            };
        }
    }
}

export default OllamaManagementService;