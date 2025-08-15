import { apiClient, ApiResponse } from './client';
import type { Analytics, TimeSeriesData } from '../../types';

export interface TimeSeriesParams {
  metric: string;
  project_name?: string;
  timeRange?: string;
  granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month';
}

export interface DashboardParams {
  project_name?: string;
  timeRange?: string;
}

export interface TokenAnalyticsParams {
  project_name?: string;
  memory_type?: string;
  limit?: number;
}

export interface MemoryTokenDetailsParams {
  project_id?: number;
  limit?: number;
  offset?: number;
}

export interface TokenSummary {
  total_memories: number;
  memories_with_tokens: number;
  total_tokens: number;
  content_tokens: number;
  summary_tokens: number;
  tags_tokens: number;
  avg_tokens_per_memory: number;
}

export interface TokenByType {
  memory_type: string;
  count: number;
  total_tokens: number;
  avg_tokens: number;
}

export interface TokenMemory {
  id: number;
  memory_type: string;
  project_name: string;
  content_preview: string;
  token_metadata: {
    content_tokens: number;
    summary_tokens: number;
    tags_tokens: number;
    total_tokens: number;
    calculation_method: string;
    calculated_at: string;
  };
  created_at: string;
}

export interface TokenTrend {
  date: string;
  memories_created: number;
  tokens_added: number;
}

export class AnalyticsAPI {
  static async getAnalytics(params?: {
    project_name?: string;
    timeframe?: string;
  }): Promise<ApiResponse<Analytics>> {
    const response = await apiClient.get('/api/analytics', { params });
    return response.data;
  }

  static async getTimeSeries(
    params: TimeSeriesParams
  ): Promise<ApiResponse<TimeSeriesData[]>> {
    const response = await apiClient.get('/api/analytics/timeseries', { params });
    return response.data;
  }

  static async getDashboard(
    params?: DashboardParams
  ): Promise<ApiResponse<{
    stats: Analytics;
    recentActivity: any[];
    charts: {
      memoryGrowth: TimeSeriesData[];
      typeDistribution: any[];
      projectActivity: any[];
    };
  }>> {
    const response = await apiClient.get('/api/analytics/dashboard', { params });
    return response.data;
  }

  static async getTokenAnalytics(
    params?: TokenAnalyticsParams
  ): Promise<ApiResponse<{
    summary: TokenSummary;
    byType: TokenByType[];
    topMemories: TokenMemory[];
    trends: TokenTrend[];
    generatedAt: string;
  }>> {
    const response = await apiClient.get('/api/analytics/tokens', { params });
    return response.data;
  }

  static async getMemoryTokenDetails(
    params?: MemoryTokenDetailsParams
  ): Promise<ApiResponse<{
    memories: TokenMemory[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }>> {
    const response = await apiClient.get('/api/analytics/tokens/memories', { params });
    return response.data;
  }
}