import { apiClient, ApiResponse } from './client';

export interface Job {
  id: string;
  name: string;
  description?: string;
  schedule?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'failed';
  stats?: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageRunTime: number;
  };
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

export interface TestMemory {
  id: number;
  content: string;
  memory_type: string;
  project_name: string;
  session_name?: string;
  smart_tags?: string[];
  created_at: string;
}

export interface PromptTestResult {
  success: boolean;
  result?: any;
  error?: string;
  model: string;
  executionTime: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export class AdminAPI {
  // Job management
  static async getJobs(): Promise<ApiResponse<Job[]>> {
    const response = await apiClient.get('/api/admin/jobs');
    return response.data;
  }

  static async triggerJob(jobId: string): Promise<ApiResponse<{
    message: string;
    jobId: string;
  }>> {
    const response = await apiClient.post(`/api/admin/jobs/${jobId}/trigger`);
    return response.data;
  }

  static async triggerAllJobs(exclude?: string[]): Promise<ApiResponse<{
    message: string;
    triggered: string[];
    excluded: string[];
  }>> {
    const response = await apiClient.post('/api/admin/jobs/trigger-all', { exclude });
    return response.data;
  }

  static async toggleJob(
    jobId: string,
    enabled: boolean
  ): Promise<ApiResponse<{
    message: string;
    job: Job;
  }>> {
    const response = await apiClient.post(`/api/admin/jobs/${jobId}/toggle`, { enabled });
    return response.data;
  }

  // Test utilities
  static async deleteTestEmbeddings(count: number): Promise<ApiResponse<{
    message: string;
    deleted: number;
  }>> {
    const response = await apiClient.post('/api/admin/test/delete-embeddings', { count });
    return response.data;
  }

  static async deleteTestLearnings(count: number): Promise<ApiResponse<{
    message: string;
    deleted: number;
  }>> {
    const response = await apiClient.post('/api/admin/test/delete-learnings', { count });
    return response.data;
  }

  static async getTestMemories(): Promise<ApiResponse<TestMemory[]>> {
    const response = await apiClient.get('/api/admin/test-memories');
    return response.data;
  }

  // System maintenance
  static async getOllamaModels(): Promise<ApiResponse<{
    models: OllamaModel[];
    defaultModel?: string;
  }>> {
    const response = await apiClient.get('/api/admin/ollama/models');
    return response.data;
  }

  static async testPromptJson(data: {
    prompt: string;
    model?: string;
    variables?: Record<string, any>;
  }): Promise<ApiResponse<PromptTestResult>> {
    const response = await apiClient.post('/api/admin/prompts/test-json', data);
    return response.data;
  }
}