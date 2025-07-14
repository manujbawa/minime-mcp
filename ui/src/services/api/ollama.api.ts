import { apiClient, ApiResponse } from './client';

export interface OllamaInfo {
  version: string;
  host: string;
  available: boolean;
  models?: string[];
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaModelConfig {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
  modelfile?: string;
  parameters?: string;
  template?: string;
}

export interface OllamaTestResult {
  success: boolean;
  response?: string;
  error?: string;
  model: string;
  executionTime: number;
  stats?: {
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
  };
}

export interface EmbeddingTestResult {
  success: boolean;
  embedding?: number[];
  dimensions?: number;
  model: string;
  executionTime: number;
  error?: string;
}

export interface SimilarityTestResult {
  success: boolean;
  results?: Array<{
    content: string;
    similarity: number;
    memory_type: string;
    project_name: string;
    created_at: string;
  }>;
  queryEmbedding?: {
    dimensions: number;
    sample: number[];
  };
  executionTime: number;
  error?: string;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
}

export class OllamaAPI {
  // System info
  static async getInfo(): Promise<ApiResponse<OllamaInfo>> {
    const response = await apiClient.get('/api/ollama/info');
    return response.data;
  }

  // Model management
  static async listModels(): Promise<ApiResponse<{
    models: OllamaModel[];
  }>> {
    const response = await apiClient.get('/api/ollama/models');
    return response.data;
  }

  static async pullModel(model: string): Promise<ApiResponse<{
    message: string;
    status: string;
  }>> {
    const response = await apiClient.post('/api/ollama/models/pull', { model });
    return response.data;
  }

  static async deleteModel(model: string): Promise<ApiResponse<{
    message: string;
  }>> {
    const response = await apiClient.delete(`/api/ollama/models/${encodeURIComponent(model)}`);
    return response.data;
  }

  static async showModel(model: string): Promise<ApiResponse<OllamaModelConfig>> {
    const response = await apiClient.get(`/api/ollama/models/${encodeURIComponent(model)}`);
    return response.data;
  }

  static async copyModel(data: {
    source: string;
    destination: string;
  }): Promise<ApiResponse<{
    message: string;
  }>> {
    const response = await apiClient.post('/api/ollama/models/copy', data);
    return response.data;
  }

  static async getModelConfig(model: string): Promise<ApiResponse<{
    config: OllamaModelConfig;
    capabilities: {
      embedding: boolean;
      generation: boolean;
      chat: boolean;
    };
  }>> {
    const response = await apiClient.get(`/api/ollama/models/${encodeURIComponent(model)}/config`);
    return response.data;
  }

  // Model testing
  static async testModel(data: {
    model: string;
    prompt: string;
  }): Promise<ApiResponse<OllamaTestResult>> {
    const response = await apiClient.post('/api/ollama/test', data);
    return response.data;
  }

  // LLM configuration
  static async updateLLMConfig(config: Partial<LLMConfig>): Promise<ApiResponse<{
    message: string;
    config: LLMConfig;
  }>> {
    const response = await apiClient.post('/api/ollama/llm-config', config);
    return response.data;
  }

  static async getLLMConfig(): Promise<ApiResponse<LLMConfig>> {
    const response = await apiClient.get('/api/ollama/llm-config');
    return response.data;
  }

  // Embedding testing
  static async testEmbedding(data: {
    text: string;
    model?: string;
  }): Promise<ApiResponse<EmbeddingTestResult>> {
    const response = await apiClient.post('/api/ollama/test/embedding', data);
    return response.data;
  }

  static async testSimilarity(data: {
    query: string;
    projectName?: string;
    limit?: number;
  }): Promise<ApiResponse<SimilarityTestResult>> {
    const response = await apiClient.post('/api/ollama/test/similarity', data);
    return response.data;
  }
}