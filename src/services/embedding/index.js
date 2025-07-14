/**
 * Embedding Services Module
 * Provides vector embedding generation, tag classification, and related functionality
 */

export { EmbeddingService } from './embedding-service.js';
export { HierarchicalTagClassifier } from './tag-classifier.js';
export { OllamaClient } from './ollama-client.js';
export { EmbeddingProviders } from './embedding-providers.js';
export { EmbeddingModelManager } from './model-manager.js';

// Re-export default for backward compatibility
export { EmbeddingService as default } from './embedding-service.js'; 