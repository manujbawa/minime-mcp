/**
 * Environment Configuration
 * Simplified production-focused configuration
 */

export const config = {
  // Server Configuration
  port: process.env.PORT || 8000,
  host: process.env.HOST || '0.0.0.0',
  
  // Database Configuration
  database: {
    path: process.env.DATABASE_PATH || './minime.db',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10,
    busyTimeout: parseInt(process.env.DB_BUSY_TIMEOUT) || 5000,
  },
  
  // Ollama Configuration
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'mxbai-embed-large',
    llmModel: process.env.OLLAMA_LLM_MODEL || 'deepseek-coder:6.7b',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 120000,
  },
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
  },
  
  // AI Pipeline Feature Toggles (Environment Variable Control)
  pipelines: {
    // Primary learning pipeline control (existing)
    useLLMLearningPipeline: process.env.USE_LLM_LEARNING_PIPELINE !== 'false',
    
    // Individual pipeline toggles
    embeddingsEnabled: process.env.EMBEDDINGS_ENABLED !== 'false',
    learningPipelineEnabled: process.env.LEARNING_PIPELINE_ENABLED !== 'false', 
    aiInsightsEnabled: process.env.AI_INSIGHTS_ENABLED !== 'false',
    taskDeduplicationEnabled: process.env.TASK_DEDUPLICATION_ENABLED !== 'false',
    analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false',
    sequentialThinkingEnabled: process.env.SEQUENTIAL_THINKING_ENABLED !== 'false',
    
    // Master AI disable switch - when false, disables ALL AI pipelines
    aiPipelinesEnabled: process.env.AI_PIPELINES_ENABLED !== 'false'
  },
  
  // Service Configuration
  services: {
    embeddingBatchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE) || 5,
    embeddingInterval: parseInt(process.env.EMBEDDING_INTERVAL) || 5000,
    configCacheTTL: parseInt(process.env.CONFIG_CACHE_TTL) || 300000,
    insightsCacheTTL: parseInt(process.env.INSIGHTS_CACHE_TTL) || 3600000,
  },
  
  // Security Configuration
  security: {
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:9000',
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  }
};

// Validate required configuration
export function validateConfig() {
  const errors = [];
  
  if (!config.database.path) {
    errors.push('DATABASE_PATH is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

// Helper function to check if a specific pipeline is enabled
export function isPipelineEnabled(pipelineName) {
  // If master AI switch is off, all pipelines are disabled
  if (!config.pipelines.aiPipelinesEnabled) {
    return false;
  }
  
  // Check specific pipeline
  switch (pipelineName) {
    case 'embeddings':
      return config.pipelines.embeddingsEnabled;
    case 'learning':
      return config.pipelines.learningPipelineEnabled;
    case 'ai_insights':
      return config.pipelines.aiInsightsEnabled;
    case 'task_deduplication':
      return config.pipelines.taskDeduplicationEnabled;
    case 'analytics':
      return config.pipelines.analyticsEnabled;
    case 'sequential_thinking':
      return config.pipelines.sequentialThinkingEnabled;
    case 'llm_learning':
      return config.pipelines.useLLMLearningPipeline && config.pipelines.learningPipelineEnabled;
    default:
      return false;
  }
}