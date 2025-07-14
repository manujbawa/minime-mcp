import { apiClient, ApiResponse } from './client';
import type { Project, Session, Memory, ThinkingSequence, Task } from '../../types';

export class ProjectsAPI {
  static async list(): Promise<ApiResponse<Project[]>> {
    const response = await apiClient.get('/api/projects');
    return response.data;
  }

  static async get(projectName: string): Promise<ApiResponse<Project>> {
    const response = await apiClient.get(`/api/projects/${encodeURIComponent(projectName)}`);
    return response.data;
  }

  static async create(data: {
    name: string;
    description?: string;
  }): Promise<ApiResponse<Project>> {
    const response = await apiClient.post('/api/projects', data);
    return response.data;
  }

  static async update(
    projectName: string,
    data: Partial<Project>
  ): Promise<ApiResponse<Project>> {
    const response = await apiClient.put(
      `/api/projects/${encodeURIComponent(projectName)}`,
      data
    );
    return response.data;
  }

  static async delete(projectName: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(
      `/api/projects/${encodeURIComponent(projectName)}`
    );
    return response.data;
  }

  // Sessions
  static async getSessions(
    projectName: string,
    params?: { limit?: number; offset?: number }
  ): Promise<ApiResponse<Session[]>> {
    const response = await apiClient.get(
      `/api/projects/${encodeURIComponent(projectName)}/sessions`,
      { params }
    );
    return response.data;
  }

  static async createSession(
    projectName: string,
    data: { sessionName: string; metadata?: any }
  ): Promise<ApiResponse<Session>> {
    const response = await apiClient.post(
      `/api/projects/${encodeURIComponent(projectName)}/sessions`,
      data
    );
    return response.data;
  }

  // Memories
  static async getMemories(
    projectName: string,
    params?: {
      memory_type?: string;
      session_name?: string;
      processing_status?: string;
      importance_min?: number;
      date_from?: string;
      order_by?: string;
      order_direction?: 'ASC' | 'DESC';
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<Memory[]>> {
    const response = await apiClient.get(
      `/api/projects/${encodeURIComponent(projectName)}/memories`,
      { params }
    );
    return response.data;
  }

  static async deleteMemories(
    projectName: string,
    params?: { sessionName?: string; memoryType?: string }
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(
      `/api/projects/${encodeURIComponent(projectName)}/memories`,
      { params }
    );
    return response.data;
  }

  // Thinking
  static async getThinking(
    projectName: string,
    params?: { status?: string; limit?: number; offset?: number }
  ): Promise<ApiResponse<ThinkingSequence[]>> {
    const response = await apiClient.get(
      `/api/projects/${encodeURIComponent(projectName)}/thinking`,
      { params }
    );
    return response.data;
  }

  static async getThinkingSequenceDetails(
    sequenceId: number
  ): Promise<ApiResponse<ThinkingSequence>> {
    const response = await apiClient.get(`/api/thinking/${sequenceId}`);
    return response.data;
  }

  // Tasks
  static async getTasks(
    projectName: string,
    params?: { status?: string; priority?: string; limit?: number; offset?: number }
  ): Promise<ApiResponse<Task[]>> {
    const response = await apiClient.get(
      `/api/projects/${encodeURIComponent(projectName)}/tasks`,
      { params }
    );
    return response.data;
  }

  static async createTask(
    projectName: string,
    data: { content: string; priority?: string; metadata?: any }
  ): Promise<ApiResponse<Task>> {
    const response = await apiClient.post(
      `/api/projects/${encodeURIComponent(projectName)}/tasks`,
      data
    );
    return response.data;
  }
}