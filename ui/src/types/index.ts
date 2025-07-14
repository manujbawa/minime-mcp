// API Response Types
import { ReactNode } from 'react';
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'error';
  version: string;
  phase: string;
  services: {
    database: string;
    embeddings: string;
    sequentialThinking: string;
    metaLearning: string;
    defaultEmbeddingModel: string;
    availableEmbeddingModels: number;
  };
  statistics: {
    database: DatabaseStats;
    thinking: ThinkingStats;
  };
  capabilities: {
    memoryManagement: boolean;
    sequentialThinking: boolean;
    metaLearning: boolean;
    patternDetection: boolean;
    crossProjectInsights: boolean;
    vectorSimilarity: boolean;
  };
  timestamp: string;
}

export interface DatabaseStats {
  projects?: number;
  total_memories?: string;
  total_projects?: string;
  total_insights?: string;
  total_patterns?: string;
  total_thinking_sequences?: string;
  memories?: {
    total_memories: string;
    memories_with_embeddings: string;
    avg_importance: number;
    unique_memory_types: string;
  };
  thinking?: {
    total_sequences: string;
    active_sequences: string;
    total_thoughts: string;
  };
}

export interface ThinkingStats {
  total_sequences: number;
  completed_sequences: number;
  total_thoughts: number;
  avg_confidence: number;
  total_branches: number;
  total_revisions: number;
  avg_completion_hours: number;
  completion_rate: number;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  memory_count?: string;
  session_count?: string;
  thinking_sequence_count?: string;
  last_activity?: string;
  stats?: {
    memory_count: number;
    session_count: number;
    thinking_sequences: number;
    last_activity: string;
  };
}

export interface Session {
  id: number;
  project_id: number;
  session_name: string;
  session_type: 'memory' | 'thinking' | 'mixed';
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: number;
  project_id: number;
  session_id?: number;
  content: string;
  memory_type: string;
  importance_score: number;
  importance?: number;
  smart_tags?: string[];
  summary?: string;
  processing_status?: 'pending' | 'processing' | 'ready' | 'failed' | 'failed_permanent';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  similarity?: number;
}

export interface ThinkingSequence {
  id: number;
  project_id: number;
  session_id: number;
  sequence_name: string;
  description?: string;
  goal?: string;
  is_complete: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  thoughts?: Thought[];
}

export interface Thought {
  id: number;
  sequence_id: number;
  thought_number: number;
  total_thoughts: number;
  content: string;
  thought_type?: 'analysis' | 'hypothesis' | 'decision' | 'action' | 'reflection';
  confidence?: number;
  confidence_level?: number;
  next_thought_needed: boolean;
  is_revision: boolean;
  revises_thought_id?: number;
  branch_from_thought_id?: number;
  branch_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface EmbeddingModel {
  model_name: string;
  provider: string;
  dimensions: number;
  is_default: boolean;
  status: string;
}

export interface MemoryDistributionItem {
  name: string;
  value: number;
  percentage?: number;
  avgImportance?: number;
  recentActivity?: number;
}

export interface Analytics {
  database: DatabaseStats;
  thinking: ThinkingStats;
  timeframe: string;
  project: string;
  memoryDistribution?: MemoryDistributionItem[];
  projectBreakdown?: any[];
  timeSeries?: any[];
  healthMetrics?: any;
  insights?: any;
  patterns?: any;
  summary?: {
    totalMemories?: number;
  };
}

// UI State Types
export interface SearchFilters {
  project_name?: string;
  memory_type?: string;
  session_name?: string;
  min_importance?: number;
  max_importance?: number;
  importance_min?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface SearchResult {
  memories: Memory[];
  count: number;
  total: number;
  query?: string;
  filters?: SearchFilters;
}

// Chart Data Types
export interface ChartData {
  name: string;
  value: number;
  label?: string;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  memories: number;
  thinking_sequences: number;
  avg_confidence: number;
}

// Flow Chart Types (for thinking sequences)
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    thought: Thought;
    confidence?: number;
    type?: string;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
}

// Project Brief and Progress Types
export interface ProjectBrief {
  id: number;
  project_name: string;
  content: string;
  sections: string[];
  auto_tasks_created: boolean;
  technical_analysis_included: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProgressEntry {
  id: number;
  project_name: string;
  version: string;
  progress_description: string;
  milestone_type: 'feature' | 'bugfix' | 'deployment' | 'planning' | 'testing' | 'documentation' | 'refactor' | 'optimization' | 'release';
  completion_percentage?: number;
  blockers?: string[];
  next_steps?: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: 'feature' | 'bug' | 'refactor' | 'optimization' | 'documentation' | 'testing';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: {
    urgency: 'low' | 'medium' | 'high' | 'critical';
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
  };
  dependencies?: string[];
  acceptance_criteria?: string[];
  estimated_hours?: number;
  due_date?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Task type alias for API compatibility
export type Task = TaskItem;

// Timeline Activity Types
export interface TimelineActivity {
  id: string;
  timestamp: string;
  type: 'memory' | 'progress' | 'task' | 'thinking' | 'brief';
  title: string;
  description: string;
  fullContent?: string;
  metadata?: Record<string, any>;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  category?: string;
  status?: string;
}

export interface TimelineFilters {
  types: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  searchQuery?: string;
}

// MCP Types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface MCPStatus {
  message: string;
  version: string;
  transport: {
    type: string;
    endpoint: string;
    features: string[];
  };
  capabilities: {
    tools: {
      count: number;
      available: MCPTool[];
    };
  };
  services: Record<string, string>;
}