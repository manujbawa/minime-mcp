import { apiClient } from './client';
import { ApiResponse } from './types';

// Types for prompt management
export interface LearningPrompt {
  id: number;
  prompt_name: string;
  prompt_category: string;
  prompt_type: string;
  prompt_template: string;
  description?: string;
  applicable_memory_types?: string[];
  configuration?: {
    temperature?: number;
    max_tokens?: number;
    [key: string]: any;
  };
  variables?: Record<string, any>;
  output_schema?: any;
  is_active: boolean;
  priority?: number;
  created_at: string;
  updated_at: string;
}

export interface AIPromptTemplate {
  id: number;
  name: string;
  category: string;
  template: string;
  variables?: Record<string, any>;
  description?: string;
  is_active: boolean;
  is_public: boolean;
  project_id?: number;
  tags?: string[];
  usage_count: number;
  avg_rating?: number | null;
  created_at: string;
  updated_at: string;
}

export interface PromptTestRequest {
  prompt: string;
  model?: string;
  variables?: Record<string, any>;
  memoryId?: number;
}

export interface PromptTestResponse {
  result: any;
  tokensUsed?: number;
  duration?: number;
  model: string;
  error?: string;
}

export interface CreateLearningPromptRequest {
  promptName: string;
  promptCategory: string;
  promptTemplate: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  variables?: any[];
  outputSchema?: any;
}

export interface UpdateLearningPromptRequest {
  prompt_name?: string;
  prompt_category?: string;
  prompt_template?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  variables?: any[];
  output_schema?: any;
  is_active?: boolean;
}

export interface CreateAITemplateRequest {
  name: string;
  category: string;
  template: string;
  variables?: Record<string, any>;
  description?: string;
  is_active?: boolean;
  is_public?: boolean;
  project_id?: number;
  tags?: string[];
}

export interface UpdateAITemplateRequest {
  name?: string;
  category?: string;
  template?: string;
  variables?: Record<string, any>;
  description?: string;
  is_active?: boolean;
  is_public?: boolean;
  tags?: string[];
}

// API service class
export class PromptsApi {
  // Learning Prompts endpoints
  static async getLearningPrompts(params?: {
    category?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<LearningPrompt[]>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    
    return apiClient.get(`/api/learning/prompts?${queryParams}`);
  }

  static async createLearningPrompt(data: CreateLearningPromptRequest): Promise<ApiResponse<LearningPrompt>> {
    return apiClient.post('/api/learning/prompts', data);
  }

  static async updateLearningPrompt(
    id: number,
    data: UpdateLearningPromptRequest
  ): Promise<ApiResponse<LearningPrompt>> {
    return apiClient.put(`/api/learning/prompts/${id}`, data);
  }

  static async deleteLearningPrompt(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/learning/prompts/${id}`);
  }

  // AI Insight Templates endpoints
  static async getAITemplates(params?: {
    category?: string;
    isActive?: boolean;
    isPublic?: boolean;
    projectId?: number;
  }): Promise<ApiResponse<AIPromptTemplate[]>> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.isPublic !== undefined) queryParams.append('isPublic', String(params.isPublic));
    if (params?.projectId) queryParams.append('projectId', String(params.projectId));
    
    return apiClient.get(`/api/insights/templates?${queryParams}`);
  }

  static async createAITemplate(data: CreateAITemplateRequest): Promise<ApiResponse<AIPromptTemplate>> {
    return apiClient.post('/api/insights/templates', data);
  }

  static async updateAITemplate(
    id: number,
    data: UpdateAITemplateRequest
  ): Promise<ApiResponse<AIPromptTemplate>> {
    return apiClient.put(`/api/insights/templates/${id}`, data);
  }

  static async deleteAITemplate(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/insights/templates/${id}`);
  }

  // Prompt Testing endpoints
  static async testPrompt(data: PromptTestRequest): Promise<ApiResponse<PromptTestResponse>> {
    return apiClient.post('/api/admin/prompts/test-json', data);
  }

  static async getTestMemories(limit: number = 10): Promise<ApiResponse<any[]>> {
    return apiClient.get(`/api/admin/test-memories?limit=${limit}`);
  }

  static async getOllamaModels(): Promise<ApiResponse<{ models: string[] }>> {
    return apiClient.get('/api/admin/ollama/models');
  }
}

// Export for convenience
export default PromptsApi;