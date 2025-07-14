import { apiClient, ApiResponse } from './client';
import type { HealthStatus } from '../../types';

export interface BasicHealth {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'error';
  message?: string;
  details?: Record<string, any>;
}

export interface DetailedHealth extends HealthStatus {
  services: {
    database: string;
    embeddings: string;
    sequentialThinking: string;
    metaLearning: string;
    defaultEmbeddingModel: string;
    availableEmbeddingModels: number;
  };
  serviceDetails?: ServiceHealth[];
  systemInfo?: {
    uptime: number;
    memory: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
    cpu?: {
      model: string;
      cores: number;
      usage: number;
    };
  };
}

export class HealthAPI {
  static async getBasicHealth(): Promise<ApiResponse<BasicHealth>> {
    const response = await apiClient.get('/health');
    return response.data;
  }

  static async getDetailedHealth(): Promise<ApiResponse<DetailedHealth>> {
    const response = await apiClient.get('/api/health');
    return response.data;
  }
}