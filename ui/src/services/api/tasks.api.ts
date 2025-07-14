import { apiClient, ApiResponse } from './client';
import type { Task } from '../../types';

export interface TaskExtractionPrompt {
  id: number;
  name: string;
  category: string;
  promptTemplate: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  outputFormat?: 'json' | 'text' | 'markdown';
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskExtractionExecution {
  id: number;
  promptTemplateId: number;
  input: string;
  output: string;
  extractedTasks?: Task[];
  model: string;
  success: boolean;
  error?: string;
  executionTime: number;
  created_at: string;
}

export interface TaskUpdate {
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  metadata?: Record<string, any>;
}

export class TasksAPI {
  // Task management (through project routes)
  static async updateTask(
    taskId: string,
    data: TaskUpdate
  ): Promise<ApiResponse<Task>> {
    const response = await apiClient.put(`/api/tasks/${taskId}`, data);
    return response.data;
  }

  static async deleteTask(taskId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/api/tasks/${taskId}`);
    return response.data;
  }

  // Task extraction prompts
  static async getExtractionPrompts(params?: {
    category?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<TaskExtractionPrompt[]>> {
    const response = await apiClient.get('/api/task-extraction/prompts', { params });
    return response.data;
  }

  static async createExtractionPrompt(data: {
    name: string;
    category: string;
    promptTemplate: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    outputFormat?: 'json' | 'text' | 'markdown';
  }): Promise<ApiResponse<TaskExtractionPrompt>> {
    const response = await apiClient.post('/api/task-extraction/prompts', data);
    return response.data;
  }

  static async updateExtractionPrompt(
    id: number,
    data: Partial<TaskExtractionPrompt>
  ): Promise<ApiResponse<TaskExtractionPrompt>> {
    const response = await apiClient.put(`/api/task-extraction/prompts/${id}`, data);
    return response.data;
  }

  static async deleteExtractionPrompt(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/api/task-extraction/prompts/${id}`);
    return response.data;
  }

  static async getExtractionExecutions(params?: {
    promptTemplateId?: string;
    limit?: number;
  }): Promise<ApiResponse<TaskExtractionExecution[]>> {
    const response = await apiClient.get('/api/task-extraction/prompts/executions', { params });
    return response.data;
  }
}