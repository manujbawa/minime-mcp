/**
 * Memory Batch Builder
 * Responsible for creating optimal batches of memories for processing
 */

import TokenUtils from '../../utils/token-utils.js';

class MemoryBatchBuilder {
  constructor(tokenConfig = {}, logger = null) {
    this.tokenUtils = new TokenUtils(tokenConfig);
    this.logger = logger || console;
  }

  /**
   * Create batches of memories respecting token limits
   * @param {Array} memories - Array of memory objects
   * @param {Object} template - Template object with prompt
   * @returns {Array} Array of batch objects
   */
  createBatches(memories, template) {
    const availableTokens = this.tokenUtils.calculateAvailableTokens(template.template);
    const batches = [];
    let currentBatch = this.initializeBatch();
    let skippedMemories = [];
    
    for (const memory of memories) {
      const memoryContent = memory.summary || memory.content;
      const memoryTokens = this.tokenUtils.estimateTokens(memoryContent);
      
      // Handle memories that are too large on their own
      if (memoryTokens > availableTokens) {
        this.logger.warn(`[MemoryBatchBuilder] Memory ${memory.id} is too large (${memoryTokens} tokens), will truncate or split`);
        
        // Option 1: Truncate the memory to fit
        const truncatedContent = this.tokenUtils.truncateToTokenLimit(memoryContent, availableTokens * 0.8); // Leave some buffer
        const truncatedMemory = {
          ...memory,
          content: truncatedContent,
          summary: memory.summary ? truncatedContent : memory.summary,
          _truncated: true,
          _originalTokens: memoryTokens
        };
        
        // If current batch has room, add truncated memory
        const truncatedTokens = this.tokenUtils.estimateTokens(truncatedContent);
        if (currentBatch.totalTokens + truncatedTokens <= availableTokens) {
          this.addMemoryToBatch(currentBatch, truncatedMemory, truncatedTokens);
        } else {
          // Finalize current batch and start new one with truncated memory
          if (currentBatch.memories.length > 0) {
            batches.push(this.finalizeBatch(currentBatch));
          }
          currentBatch = this.initializeBatch();
          this.addMemoryToBatch(currentBatch, truncatedMemory, truncatedTokens);
        }
        continue;
      }
      
      // Check if adding this memory would exceed the limit
      if (currentBatch.totalTokens + memoryTokens > availableTokens) {
        // Only finalize if batch has memories
        if (currentBatch.memories.length > 0) {
          batches.push(this.finalizeBatch(currentBatch));
          currentBatch = this.initializeBatch();
        }
        
        // Add memory to new batch
        this.addMemoryToBatch(currentBatch, memory, memoryTokens);
      } else {
        // Memory fits in current batch
        this.addMemoryToBatch(currentBatch, memory, memoryTokens);
      }
    }
    
    // Add final batch if it has memories
    if (currentBatch.memories.length > 0) {
      batches.push(this.finalizeBatch(currentBatch));
    }
    
    // Log skipped memories if any
    if (skippedMemories.length > 0) {
      this.logger.warn(`[MemoryBatchBuilder] Skipped ${skippedMemories.length} memories due to size`);
    }
    
    return batches;
  }

  /**
   * Initialize a new batch
   */
  initializeBatch() {
    return {
      memories: [],
      memoryIds: [],
      totalTokens: 0,
      smartTags: new Set(),
      memoryTypes: new Set(),
      timeRange: {
        earliest: null,
        latest: null
      },
      stats: {
        totalImportance: 0,
        memoryCount: 0
      }
    };
  }

  /**
   * Add a memory to the batch
   */
  addMemoryToBatch(batch, memory, tokenCount) {
    batch.memories.push(memory);
    batch.memoryIds.push(memory.id);
    batch.totalTokens += tokenCount;
    
    // Collect smart tags
    if (memory.smart_tags && Array.isArray(memory.smart_tags)) {
      memory.smart_tags.forEach(tag => batch.smartTags.add(tag.toLowerCase()));
    }
    
    // Track memory types
    if (memory.memory_type) {
      batch.memoryTypes.add(memory.memory_type);
    }
    
    // Update time range
    const memoryDate = new Date(memory.created_at);
    if (!batch.timeRange.earliest || memoryDate < batch.timeRange.earliest) {
      batch.timeRange.earliest = memoryDate;
    }
    if (!batch.timeRange.latest || memoryDate > batch.timeRange.latest) {
      batch.timeRange.latest = memoryDate;
    }
    
    // Update stats
    batch.stats.totalImportance += memory.importance_score || 0;
    batch.stats.memoryCount += 1;
  }

  /**
   * Finalize a batch with computed statistics
   */
  finalizeBatch(batch) {
    return {
      ...batch,
      smartTags: Array.from(batch.smartTags).sort(),
      memoryTypes: Array.from(batch.memoryTypes).sort(),
      stats: {
        ...batch.stats,
        avgImportance: batch.stats.memoryCount > 0 
          ? batch.stats.totalImportance / batch.stats.memoryCount 
          : 0,
        timeSpanDays: batch.timeRange.earliest && batch.timeRange.latest
          ? Math.ceil((batch.timeRange.latest - batch.timeRange.earliest) / (1000 * 60 * 60 * 24))
          : 0
      }
    };
  }

  /**
   * Validate batch has minimum requirements
   */
  isValidBatch(batch) {
    return batch.memories.length > 0 && batch.totalTokens > 0;
  }

  /**
   * Split a large memory into smaller chunks
   * @param {Object} memory - Memory object to split
   * @param {number} maxTokensPerChunk - Maximum tokens per chunk
   * @returns {Array} Array of memory chunks
   */
  splitMemoryIntoChunks(memory, maxTokensPerChunk) {
    const memoryContent = memory.summary || memory.content;
    const totalTokens = this.tokenUtils.estimateTokens(memoryContent);
    
    if (totalTokens <= maxTokensPerChunk) {
      return [memory];
    }
    
    const chunks = [];
    const charsPerToken = 4; // Approximate
    const maxCharsPerChunk = maxTokensPerChunk * charsPerToken * 0.9; // Safety margin
    
    // Split content into sentences for better chunking
    const sentences = memoryContent.match(/[^.!?]+[.!?]+/g) || [memoryContent];
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxCharsPerChunk && currentChunk.length > 0) {
        // Create chunk from current content
        chunks.push({
          ...memory,
          id: `${memory.id}_chunk_${chunkIndex}`,
          content: currentChunk.trim(),
          summary: memory.summary ? `${memory.summary} (Part ${chunkIndex + 1})` : currentChunk.trim(),
          _isChunk: true,
          _chunkIndex: chunkIndex,
          _totalChunks: null, // Will be set after all chunks are created
          _originalId: memory.id
        });
        currentChunk = sentence;
        chunkIndex++;
      } else {
        currentChunk += sentence;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim().length > 0) {
      chunks.push({
        ...memory,
        id: `${memory.id}_chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        summary: memory.summary ? `${memory.summary} (Part ${chunkIndex + 1})` : currentChunk.trim(),
        _isChunk: true,
        _chunkIndex: chunkIndex,
        _totalChunks: null,
        _originalId: memory.id
      });
    }
    
    // Update total chunks count
    chunks.forEach(chunk => {
      chunk._totalChunks = chunks.length;
    });
    
    this.logger.info(`[MemoryBatchBuilder] Split memory ${memory.id} into ${chunks.length} chunks`);
    return chunks;
  }
}

export { MemoryBatchBuilder };
export default MemoryBatchBuilder;