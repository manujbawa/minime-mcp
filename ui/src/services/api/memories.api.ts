import { apiClient, ApiResponse } from './client';
import type { Memory } from '../../types';

export class MemoriesAPI {
  static async list(params?: {
    memory_type?: string;
    project_name?: string;
    session_name?: string;
    search_query?: string;
    processing_status?: string;
    has_embedding?: boolean;
    order_by?: string;
    order_direction?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Memory[]>> {
    const response = await apiClient.get('/api/memories', { params });
    return response.data;
  }

  static async get(id: string): Promise<ApiResponse<Memory>> {
    const response = await apiClient.get(`/api/memories/${id}`);
    return response.data;
  }

  static async create(data: {
    content: string;
    memory_type?: string;
    project_name: string;
    session_name?: string;
    tags?: string[];
    metadata?: any;
  }): Promise<ApiResponse<Memory>> {
    const response = await apiClient.post('/api/memories', data);
    return response.data;
  }

  static async update(
    id: string,
    data: {
      content?: string;
      memory_type?: string;
      tags?: string[];
      metadata?: any;
      session_name?: string;
    }
  ): Promise<ApiResponse<Memory>> {
    const response = await apiClient.put(`/api/memories/${id}`, data);
    return response.data;
  }

  static async delete(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/api/memories/${id}`);
    return response.data;
  }

  static async search(query: string, params?: {
    project_name?: string;
    memory_type?: string;
    processing_status?: string;
    importance_min?: number;
    date_from?: string;
    limit?: number;
    threshold?: number;
  }): Promise<ApiResponse<Memory[]>> {
    const data = { query, ...params };
    const response = await apiClient.post('/api/memories/search', data);
    return response.data;
  }

  static async searchSimilar(data: {
    query: string;
    limit?: number;
    threshold?: number;
    project_name?: string;
  }): Promise<ApiResponse<Memory[]>> {
    const response = await apiClient.post('/api/memories/search', data);
    return response.data;
  }

  static async bulkCreate(data: {
    memories: Array<{
      content: string;
      memory_type?: string;
      project_name: string;
      session_name?: string;
      tags?: string[];
      metadata?: any;
    }>;
  }): Promise<ApiResponse<{
    created: Memory[];
    errors: any[];
    summary: {
      total: number;
      success: number;
      failed: number;
    };
  }>> {
    const response = await apiClient.post('/api/memories/bulk', data);
    return response.data;
  }
}