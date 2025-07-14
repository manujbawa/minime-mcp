/**
 * Embedding Providers Module
 * Handles different embedding providers (Ollama, OpenAI, etc.)
 */

import fetch from 'node-fetch';

export class EmbeddingProviders {
    constructor(logger, config) {
        this.logger = logger;
        this.config = config;
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
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            
            if (!data.embedding || !Array.isArray(data.embedding)) {
                throw new Error('Invalid embedding response from Ollama');
            }
            
            return data.embedding;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Ollama embedding request timed out after ${this.config.ollama.timeout}ms`);
            }
            
            this.logger.error('Ollama embedding generation failed:', error);
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
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.openai.apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    input: text
                }),
                signal: AbortSignal.timeout(this.config.openai.timeout)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
            }
            
            const data = await response.json();
            
            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                throw new Error('Invalid embedding response from OpenAI');
            }
            
            return data.data[0].embedding;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`OpenAI embedding request timed out after ${this.config.openai.timeout}ms`);
            }
            
            this.logger.error('OpenAI embedding generation failed:', error);
            throw error;
        }
    }

    /**
     * Get the appropriate provider method for a model
     */
    getProviderMethod(provider) {
        switch (provider) {
            case 'ollama':
                return this.generateOllamaEmbedding.bind(this);
            case 'openai':
                return this.generateOpenAIEmbedding.bind(this);
            default:
                throw new Error(`Unsupported embedding provider: ${provider}`);
        }
    }
} 