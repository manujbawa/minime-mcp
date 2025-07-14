/**
 * Type definitions and interfaces for MiniMe-MCP
 */

/**
 * @typedef {Object} Memory
 * @property {number} id
 * @property {number} project_id
 * @property {number} session_id
 * @property {string} content
 * @property {string} memory_type
 * @property {string} summary
 * @property {number[]} embedding
 * @property {string} embedding_model
 * @property {number} embedding_dimensions
 * @property {number} importance_score
 * @property {string[]} tags
 * @property {Object} metadata
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {Object} EmbeddingModel
 * @property {string} model_name
 * @property {number} dimensions
 * @property {string} provider
 * @property {number} model_size_mb
 * @property {string} description
 * @property {boolean} is_available
 * @property {boolean} is_default
 * @property {Object} config
 */

/**
 * @typedef {Object} LearningTask
 * @property {string} task_type
 * @property {number} task_priority
 * @property {Object} task_payload
 * @property {Date} scheduled_for
 * @property {string} status
 * @property {number} retry_count
 * @property {number} max_retries
 */

export {};