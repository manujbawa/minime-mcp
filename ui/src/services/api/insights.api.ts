import { apiClient, ApiResponse } from './client';

export interface InsightTemplate {
  id: number;
  name: string;
  category: string;
  template: string;
  description?: string;
  isPublic: boolean;
  projectId?: string;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: number;
  projectId?: string;
  category: string;
  scope: 'project' | 'session' | 'cross-project';
  content: string;
  templateId?: number;
  confidence?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface InsightHistory {
  id: number;
  insightId: number;
  projectId?: string;
  scope: string;
  category: string;
  content: string;
  rating?: number;
  feedback?: string;
  wasActionable?: boolean;
  created_at: string;
}

export interface InsightFeedback {
  insightId: string;
  rating: number;
  feedback?: string;
  wasActionable?: boolean;
}

export interface SchedulerStatus {
  isRunning: boolean;
  isPaused: boolean;
  lastRun?: string;
  nextRun?: string;
  config: {
    interval: number;
    batchSize: number;
    maxConcurrent: number;
  };
  stats: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    averageRunTime: number;
  };
}

export interface SchedulerConfig {
  interval?: number;
  batchSize?: number;
  maxConcurrent?: number;
}

export class InsightsAPI {
  static async getInsights(params?: {
    limit?: number;
    offset?: number;
    projectId?: string;
    crossProject?: boolean;
    category?: string;
  }): Promise<ApiResponse<Insight[]>> {
    const response = await apiClient.get('/api/insights', { params });
    return response.data;
  }

  static async getTemplates(params?: {
    category?: string;
    projectId?: string;
    isPublic?: boolean;
  }): Promise<ApiResponse<InsightTemplate[]>> {
    const response = await apiClient.get('/api/insights/templates', { params });
    return response.data;
  }

  static async createTemplate(data: {
    name: string;
    category: string;
    template: string;
    description?: string;
    isPublic?: boolean;
    projectId?: string;
  }): Promise<ApiResponse<InsightTemplate>> {
    const response = await apiClient.post('/api/insights/templates', data);
    return response.data;
  }

  static async updateTemplate(
    id: number,
    data: Partial<InsightTemplate>
  ): Promise<ApiResponse<InsightTemplate>> {
    const response = await apiClient.put(`/api/insights/templates/${id}`, data);
    return response.data;
  }

  static async deleteTemplate(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/api/insights/templates/${id}`);
    return response.data;
  }

  static async getHistory(params?: {
    limit?: number;
    offset?: number;
    projectId?: string;
    scope?: 'project' | 'session' | 'cross-project';
    category?: string;
  }): Promise<ApiResponse<InsightHistory[]>> {
    const response = await apiClient.get('/api/insights/history', { params });
    return response.data;
  }

  static async generateInsights(data?: {
    projectId?: string;
    scope?: 'project' | 'session' | 'cross-project';
    category?: string;
  }): Promise<ApiResponse<{
    message: string;
    insights: Insight[];
  }>> {
    const response = await apiClient.post('/api/insights/generate', data || {});
    return response.data;
  }

  static async provideFeedback(data: InsightFeedback): Promise<ApiResponse<{
    message: string;
  }>> {
    const response = await apiClient.post('/api/insights/feedback', data);
    return response.data;
  }

  // Scheduler endpoints
  static async getSchedulerStatus(): Promise<ApiResponse<SchedulerStatus>> {
    const response = await apiClient.get('/api/insights/scheduler/status');
    return response.data;
  }

  static async updateSchedulerConfig(
    config: SchedulerConfig
  ): Promise<ApiResponse<{
    message: string;
    config: SchedulerConfig;
  }>> {
    const response = await apiClient.post('/api/insights/scheduler/config', config);
    return response.data;
  }

  static async pauseScheduler(): Promise<ApiResponse<{
    message: string;
  }>> {
    const response = await apiClient.post('/api/insights/scheduler/pause');
    return response.data;
  }

  static async resumeScheduler(): Promise<ApiResponse<{
    message: string;
  }>> {
    const response = await apiClient.post('/api/insights/scheduler/resume');
    return response.data;
  }

  static async triggerScheduler(data?: {
    projectId?: string;
  }): Promise<ApiResponse<{
    message: string;
    jobId?: string;
  }>> {
    const response = await apiClient.post('/api/insights/scheduler/trigger', data || {});
    return response.data;
  }
}