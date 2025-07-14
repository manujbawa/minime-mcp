/**
 * Memory Services Module
 * Centralized memory management services for the MiniMe-MCP system
 * 
 * This module provides a complete memory management solution including:
 * - Memory storage and retrieval
 * - Search and similarity matching
 * - Tag generation and classification
 * - Type detection and validation
 * - Batch processing for AI insights
 * - Response formatting for different consumers
 */

// Core memory services
export { MemoryStorageService } from './memory-storage-service.js';
export { MemorySearchService } from './memory-search-service.js';
export { MemoryServiceFactory } from './memory-service-factory.js';

// Processing and enhancement services
export { MemoryTagGenerator } from './memory-tag-generator.js';
export { MemoryBatchBuilder } from './memory-batch-builder.js';

// Formatting and presentation
export { MemoryFormatter } from './memory-formatter.js';

// Default exports for backward compatibility
export { default as MemoryBatchBuilderDefault } from './memory-batch-builder.js'; 