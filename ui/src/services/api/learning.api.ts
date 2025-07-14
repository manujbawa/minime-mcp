import { apiClient, ApiResponse } from './client';

export interface LearningInsight {
  id: string;
  category: string;
  type?: string;
  title?: string;
  insight: string;
  confidence: number;
  key_findings: string[];
  tags?: string[];
  actionable_advice?: string;
  project_name?: string;
  created_at: string;
  // V2 specific fields
  evidence?: any[];
  patterns?: any[];
  technologies?: string[];
  recommendations?: any[];
  // Clustering fields
  source_type?: 'memory' | 'cluster';
  source_ids?: string[];
  detailed_content?: {
    cluster_size?: number;
    memory_type?: string;
    common_themes?: string[];
    time_span?: {
      start: string;
      end: string;
      days: number;
    };
    common_tags?: string[];
    pattern?: string;
    root_cause?: string;
    evolution?: string;
  };
}

export interface CodingPattern {
  id: string;
  pattern_name: string;
  pattern_type: string;
  description: string;
  frequency: number;
  confidence: number;
  project_name: string;
  created_at: string;
}

export interface LearningStatus {
  queue: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  recentCompletions: Array<{
    project_name: string;
    count: number;
    last_processed: string;
  }>;
  serviceHealth: {
    status: string;
    enabled: boolean;
  };
  timestamp: string;
}

export interface InsightFilters {
  category?: string;
  type?: string;
  source_type?: 'memory' | 'cluster' | 'all';
  actionable_only?: boolean;
  min_confidence?: number;
  project_id?: string;
  project_name?: string;
  limit?: number;
  offset?: number;
  search?: string;
  date_range?: {
    start: string;
    end: string;
  };
}

export interface ClusterMetrics {
  total_clusters: number;
  avg_cluster_size: number;
  largest_cluster: {
    size: number;
    type: string;
    id: string;
  };
  time_coverage: {
    start: string;
    end: string;
    days: number;
  };
  common_patterns: Array<{
    pattern: string;
    frequency: number;
    confidence: number;
  }>;
}

export interface InsightMetrics {
  by_category: Record<string, number>;
  by_type: Record<string, number>;
  by_confidence: {
    high: number; // > 0.8
    medium: number; // 0.5-0.8
    low: number; // < 0.5
  };
  by_source: {
    memory: number;
    cluster: number;
  };
  trend: Array<{
    date: string;
    count: number;
    avg_confidence: number;
  }>;
}

export class LearningAPI {
  // Get learning insights with advanced filtering
  static async getInsights(params?: InsightFilters): Promise<ApiResponse<LearningInsight[]>> {
    const response = await apiClient.get('/api/learning/insights', { params });
    return response.data;
  }

  // Get coding patterns
  static async getPatterns(params?: {
    pattern_type?: string;
    min_confidence?: number;
    limit?: number;
  }): Promise<ApiResponse<CodingPattern[]>> {
    const response = await apiClient.get('/api/learning/patterns', { params });
    return response.data;
  }

  // Get learning system status
  static async getStatus(): Promise<ApiResponse<LearningStatus>> {
    const response = await apiClient.get('/api/learning/status');
    return response.data;
  }

  // Get monitoring data
  static async getMonitoring(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/api/learning/monitoring');
    return response.data;
  }

  // Trigger analysis
  static async triggerAnalysis(data: {
    projectName: string;
    analysisType?: 'full' | 'patterns' | 'insights' | 'quick';
    options?: any;
  }): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/api/learning/analyze', data);
    return response.data;
  }

  // Get cluster insights
  static async getClusterInsights(params?: {
    limit?: number;
    min_size?: number;
  }): Promise<ApiResponse<LearningInsight[]>> {
    const response = await apiClient.get('/api/learning/insights', { 
      params: { ...params, source_type: 'cluster' } 
    });
    return response.data;
  }

  // Get insight metrics
  static async getInsightMetrics(params?: {
    project_id?: string;
    date_range?: string; // e.g., '7d', '30d', '3m'
  }): Promise<ApiResponse<InsightMetrics>> {
    const response = await apiClient.get('/api/learning/insights/metrics', { params });
    return response.data;
  }

  // Get cluster metrics
  static async getClusterMetrics(): Promise<ApiResponse<ClusterMetrics>> {
    const response = await apiClient.get('/api/learning/clusters/metrics');
    return response.data;
  }

  // Search insights with semantic search
  static async searchInsights(query: string, params?: {
    limit?: number;
    min_confidence?: number;
  }): Promise<ApiResponse<LearningInsight[]>> {
    const response = await apiClient.post('/api/learning/insights/search', {
      query,
      ...params
    });
    return response.data;
  }

  // Get insight categories
  static async getCategories(): Promise<ApiResponse<Array<{ category: string; count: number }>>> {
    const response = await apiClient.get('/api/learning/categories');
    return response.data;
  }
}