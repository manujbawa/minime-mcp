// Export all API services
export { AnalyticsAPI } from './analytics.api';
export { LearningAPI } from './learning.api';
export { InsightsAPI } from './insights.api';
export { AdminAPI } from './admin.api';
export { ConfigAPI } from './config.api';
export { HealthAPI } from './health.api';
export { TasksAPI } from './tasks.api';
export { OllamaAPI } from './ollama.api';
export { ProjectsAPI } from './projects.api';
export { MemoriesAPI } from './memories.api';
export { PromptsApi } from './promptsApi';

// Export types
export type {
  TimeSeriesParams,
  DashboardParams
} from './analytics.api';

export type {
  LearningInsight,
  CodingPattern,
  PromptTemplate,
  PromptExecution,
  LearningStatus,
  LearningMonitoring
} from './learning.api';

export type {
  InsightTemplate,
  Insight,
  InsightHistory,
  InsightFeedback,
  SchedulerStatus,
  SchedulerConfig
} from './insights.api';

export type {
  Job,
  OllamaModel as AdminOllamaModel,
  TestMemory,
  PromptTestResult
} from './admin.api';

export type {
  ConfigItem,
  ConfigCategory,
  ConfigUpdate,
  BulkConfigUpdate
} from './config.api';

export type {
  BasicHealth,
  ServiceHealth,
  DetailedHealth
} from './health.api';

export type {
  TaskExtractionPrompt,
  TaskExtractionExecution,
  TaskUpdate
} from './tasks.api';

export type {
  OllamaInfo,
  OllamaModel,
  OllamaModelConfig,
  OllamaTestResult,
  EmbeddingTestResult,
  SimilarityTestResult,
  LLMConfig
} from './ollama.api';

// Re-export common types from client
export type { ApiResponse } from './client';

// Export prompt types
export type {
  LearningPrompt,
  AIPromptTemplate,
  PromptTestRequest,
  PromptTestResponse,
  CreateLearningPromptRequest,
  UpdateLearningPromptRequest,
  CreateAITemplateRequest,
  UpdateAITemplateRequest
} from './promptsApi';