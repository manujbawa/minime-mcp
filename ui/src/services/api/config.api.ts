import { apiClient, ApiResponse } from './client';

export interface ConfigItem {
  key: string;
  value: any;
  category?: string;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export interface ConfigCategory {
  name: string;
  description?: string;
  items: ConfigItem[];
}

export interface ConfigUpdate {
  value: any;
  category?: string;
}

export interface BulkConfigUpdate {
  updates: Record<string, any>;
  category?: string;
}

export class ConfigAPI {
  static async getAll(): Promise<ApiResponse<{
    config: Record<string, ConfigItem>;
    categories: ConfigCategory[];
  }>> {
    const response = await apiClient.get('/api/config');
    return response.data;
  }

  static async get(key: string): Promise<ApiResponse<ConfigItem>> {
    const response = await apiClient.get(`/api/config/${encodeURIComponent(key)}`);
    return response.data;
  }

  static async update(
    key: string,
    data: ConfigUpdate
  ): Promise<ApiResponse<{
    message: string;
    config: ConfigItem;
  }>> {
    const response = await apiClient.put(
      `/api/config/${encodeURIComponent(key)}`,
      data
    );
    return response.data;
  }

  static async bulkUpdate(
    updates: Record<string, any>
  ): Promise<ApiResponse<{
    message: string;
    updated: string[];
    errors?: Record<string, string>;
  }>> {
    const response = await apiClient.put('/api/config', updates);
    return response.data;
  }

  static async reset(): Promise<ApiResponse<{
    message: string;
    reset: string[];
  }>> {
    const response = await apiClient.post('/api/config/reset');
    return response.data;
  }
}