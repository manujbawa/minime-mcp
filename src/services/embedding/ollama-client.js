/**
 * Unified Ollama Client Service
 * Single point of interaction with Ollama for all services
 * Handles model listing, invocation, timeouts, and error handling
 */

import fetch from 'node-fetch';

export class OllamaClient {
    constructor(logger) {
        this.logger = logger;
        
        // Determine Ollama host based on environment
        this.host = this.getOllamaHost();
        
        // Default timeouts for different operations
        this.timeouts = {
            list: 10000,          // 10 seconds for listing models
            generate: 300000,     // 5 minutes for generation
            embed: 60000,         // 1 minute for embeddings
            show: 10000,          // 10 seconds for model info
            pull: 600000,         // 10 minutes for pulling models
            delete: 30000         // 30 seconds for deleting models
        };
        
        // Default generation options
        this.defaultOptions = {
            temperature: 0.1,
            top_p: 0.9,
            top_k: 40,
            num_predict: -1,
            stop: []
        };
        
        this.logger.info(`Ollama Client initialized with host: ${this.host}`);
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
            const dockerHost = 'http://host.docker.internal:11434';
            this.logger.info(`Docker environment detected, using: ${dockerHost}`);
            return dockerHost;
        }
        
        // For local use, use localhost
        const localHost = 'http://localhost:11434';
        this.logger.info(`Local environment, using: ${localHost}`);
        return localHost;
    }

    /**
     * Check if Ollama is available
     */
    async isAvailable() {
        try {
            const response = await fetch(`${this.host}/api/version`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch (error) {
            this.logger.warn(`Ollama not available at ${this.host}: ${error.message}`);
            return false;
        }
    }

    /**
     * List all available models
     */
    async listModels() {
        try {
            const response = await fetch(`${this.host}/api/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(this.timeouts.list)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            this.logger.error('Failed to list Ollama models:', error);
            throw new Error(`Ollama list models failed: ${error.message}`);
        }
    }

    /**
     * Get detailed information about a model
     */
    async showModel(modelName) {
        try {
            const response = await fetch(`${this.host}/api/show`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
                signal: AbortSignal.timeout(this.timeouts.show)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get model info: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            this.logger.error(`Failed to get model info for ${modelName}:`, error);
            throw new Error(`Ollama show model failed: ${error.message}`);
        }
    }

    /**
     * Generate text completion
     * @param {Object} params - Generation parameters
     * @param {string} params.model - Model name
     * @param {string} params.prompt - Prompt text
     * @param {string} [params.system] - System prompt
     * @param {Object} [params.options] - Model options (temperature, etc.)
     * @param {boolean} [params.stream=false] - Whether to stream the response
     * @param {string} [params.format] - Output format ('json' for JSON mode)
     * @param {number} [params.timeout] - Custom timeout in milliseconds
     * @param {string} [params.returnType='text'] - Expected return type: 'text', 'json', 'structured'
     */
    async generate(params) {
        const {
            model,
            prompt,
            system,
            options = {},
            stream = false,
            format,
            timeout = this.timeouts.generate,
            returnType = 'text'
        } = params;

        try {
            const startTime = Date.now();
            this.logger.info(`Generating with model ${model}, returnType: ${returnType}`);

            const body = {
                model,
                prompt,
                stream,
                options: { ...this.defaultOptions, ...options }
            };

            if (system) {
                body.system = system;
            }

            if (format === 'json' || returnType === 'json') {
                body.format = 'json';
            }

            const response = await fetch(`${this.host}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(timeout)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            const elapsed = Date.now() - startTime;
            
            this.logger.info(`Generation completed in ${elapsed}ms`);

            // Process response based on return type
            const output = result.response || '';
            
            if (returnType === 'json' || returnType === 'structured') {
                return this.parseJSONResponse(output, returnType === 'structured');
            }

            return {
                output,
                model: result.model,
                created_at: result.created_at,
                done: result.done,
                eval_count: result.eval_count,
                eval_duration: result.eval_duration,
                load_duration: result.load_duration,
                prompt_eval_count: result.prompt_eval_count,
                prompt_eval_duration: result.prompt_eval_duration,
                total_duration: result.total_duration,
                elapsed
            };

        } catch (error) {
            this.logger.error(`Generation failed for model ${model}:`, error);
            
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms. The model may be taking too long to respond.`);
            }
            
            throw new Error(`Ollama generation failed: ${error.message}`);
        }
    }

    /**
     * Parse JSON response with fallback strategies
     */
    parseJSONResponse(output, strict = false) {
        let parsed = null;
        let isValid = false;
        let error = null;

        // Strategy 1: Direct JSON parse
        try {
            parsed = JSON.parse(output);
            isValid = true;
            return { output, parsed, isValid, error };
        } catch (e) {
            error = e.message;
        }

        // Strategy 2: Extract from markdown code blocks
        const codeBlockMatch = output.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            try {
                parsed = JSON.parse(codeBlockMatch[1]);
                isValid = true;
                return { output, parsed, isValid, error: null };
            } catch (e) {
                error = `Code block extraction failed: ${e.message}`;
            }
        }

        // Strategy 3: Find JSON object in text
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            try {
                parsed = JSON.parse(output.substring(jsonStart, jsonEnd + 1));
                isValid = true;
                return { output, parsed, isValid, error: null };
            } catch (e) {
                error = `JSON extraction failed: ${e.message}`;
            }
        }

        // If strict mode, throw error
        if (strict) {
            throw new Error(`Failed to parse JSON response: ${error}`);
        }

        return { output, parsed, isValid, error };
    }

    /**
     * Generate embeddings
     * @param {Object} params - Embedding parameters
     * @param {string} params.model - Model name (must be an embedding model)
     * @param {string} params.prompt - Text to embed
     * @param {number} [params.timeout] - Custom timeout
     */
    async embeddings(params) {
        const {
            model,
            prompt,
            timeout = this.timeouts.embed
        } = params;

        try {
            const response = await fetch(`${this.host}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt }),
                signal: AbortSignal.timeout(timeout)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            return result.embedding;

        } catch (error) {
            this.logger.error(`Embedding generation failed for model ${model}:`, error);
            
            if (error.name === 'AbortError') {
                throw new Error(`Embedding timeout after ${timeout}ms`);
            }
            
            throw new Error(`Ollama embeddings failed: ${error.message}`);
        }
    }

    /**
     * Pull a model from Ollama library
     */
    async pullModel(modelName, onProgress) {
        try {
            const response = await fetch(`${this.host}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName, stream: true }),
                signal: AbortSignal.timeout(this.timeouts.pull)
            });

            if (!response.ok) {
                throw new Error(`Failed to pull model: ${response.status} ${response.statusText}`);
            }

            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let lastStatus = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.status && data.status !== lastStatus) {
                            lastStatus = data.status;
                            this.logger.info(`Pull progress for ${modelName}: ${data.status}`);
                            if (onProgress) {
                                onProgress(data);
                            }
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }

            return { success: true, model: modelName };

        } catch (error) {
            this.logger.error(`Failed to pull model ${modelName}:`, error);
            throw new Error(`Ollama pull failed: ${error.message}`);
        }
    }

    /**
     * Delete a model
     */
    async deleteModel(modelName) {
        try {
            const response = await fetch(`${this.host}/api/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
                signal: AbortSignal.timeout(this.timeouts.delete)
            });

            if (!response.ok) {
                throw new Error(`Failed to delete model: ${response.status} ${response.statusText}`);
            }

            return { success: true, model: modelName };

        } catch (error) {
            this.logger.error(`Failed to delete model ${modelName}:`, error);
            throw new Error(`Ollama delete failed: ${error.message}`);
        }
    }

    /**
     * Test connection and get version info
     */
    async getVersion() {
        try {
            const response = await fetch(`${this.host}/api/version`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error(`Failed to get version: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            this.logger.error('Failed to get Ollama version:', error);
            throw new Error(`Ollama version check failed: ${error.message}`);
        }
    }
}