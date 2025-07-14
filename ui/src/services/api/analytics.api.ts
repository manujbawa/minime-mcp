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
}