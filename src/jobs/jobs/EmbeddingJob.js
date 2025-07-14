/**
 * Embedding Generation Job
 * Generates embeddings for memories without them
 */

export class EmbeddingJob {
  static async execute(services) {
    const { database, embedding, config, logger } = services;
    
    // Check if embeddings are enabled
    const enabled = await config.get('embeddings_enabled');
    if (!enabled) {
      logger.debug('[EmbeddingJob] Embeddings disabled, skipping');
      return;
    }
    
    try {
      // Process pending memories using the embedding service
      await embedding.processPendingMemories();
      logger.debug('[EmbeddingJob] Processed pending memories');
    } catch (error) {
      logger.error('[EmbeddingJob] Failed to process pending memories:', error);
    }
  }
}