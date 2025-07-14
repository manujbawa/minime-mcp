/**
 * Timeline Tab Component
 * Displays aggregated project activities in chronological order
 */

import React, { useMemo } from 'react';
import { Box, Typography, Paper, Chip, LinearProgress } from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Memory as MemoryIcon,
  TrendingUp as ProgressIcon,
  Assignment as TaskIcon,
  Psychology as ThinkingIcon,
  Description as BriefIcon,
  Timeline as TimelineIconSvg,
} from '@mui/icons-material';
import type { Memory, ProgressEntry, TaskItem, ThinkingSequence, ProjectBrief } from '../../../../types';

interface TimelineActivity {
  id: string;
  timestamp: string;
  type: 'memory' | 'progress' | 'task' | 'thinking' | 'brief';
  title: string;
  description: string;
  fullContent?: string;
  metadata?: Record<string, any>;
  icon: React.ReactElement;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

interface TimelineTabProps {
  memories: Memory[];
  progress: ProgressEntry[];
  tasks: TaskItem[];
  thinking: ThinkingSequence[];
  briefs: ProjectBrief[];
  onViewContent: (title: string, content: string, metadata?: any) => void;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ 
  memories, 
  progress, 
  tasks, 
  thinking, 
  briefs, 
  onViewContent 
}) => {
  const timelineActivities = useMemo(() => {
    const activities: TimelineActivity[] = [];

    // Add memories
    memories.forEach(memory => {
      activities.push({
        id: `memory-${memory.id}`,
        timestamp: memory.created_at,
        type: 'memory',
        title: `${memory.memory_type.toUpperCase()} Memory`,
        description: memory.content.substring(0, 150) + (memory.content.length > 150 ? '...' : ''),
        fullContent: memory.content,
        metadata: {
          memory_type: memory.memory_type,
          importance_score: memory.importance_score,
          tags: memory.smart_tags,
          created_at: memory.created_at,
          updated_at: memory.updated_at,
        },
        icon: <MemoryIcon />,
        color: 'primary',
      });
    });

    // Add progress entries
    progress.forEach(entry => {
      activities.push({
        id: `progress-${entry.id}`,
        timestamp: entry.created_at,
        type: 'progress',
        title: `Progress: ${entry.version}`,
        description: entry.progress_description,
        metadata: {
          version: entry.version,
          milestone_type: entry.milestone_type,
          completion_percentage: entry.completion_percentage,
          blockers: entry.blockers,
          next_steps: entry.next_steps,
        },
        icon: <ProgressIcon />,
        color: entry.milestone_type === 'release' ? 'success' : 
               entry.milestone_type === 'bugfix' ? 'error' : 'warning',
      });
    });

    // Add tasks
    tasks.forEach(task => {
      activities.push({
        id: `task-${task.id}`,
        timestamp: task.updated_at,
        type: 'task',
        title: `Task: ${task.title}`,
        description: task.description || 'No description',
        metadata: {
          category: task.category,
          status: task.status,
          priority: task.priority,
          estimated_hours: task.estimated_hours,
        },
        icon: <TaskIcon />,
        color: task.status === 'completed' ? 'success' : 
               task.status === 'blocked' ? 'error' : 'info',
      });
    });

    // Add thinking sequences
    thinking.forEach(sequence => {
      activities.push({
        id: `thinking-${sequence.id}`,
        timestamp: sequence.created_at,
        type: 'thinking',
        title: `Thinking: ${sequence.sequence_name}`,
        description: sequence.description || sequence.goal || 'Reasoning sequence',
        metadata: {
          is_complete: sequence.is_complete,
          goal: sequence.goal,
          thought_count: sequence.thought_count || 0,
        },
        icon: <ThinkingIcon />,
        color: sequence.is_complete ? 'success' : 'primary',
      });
    });

    // Add briefs
    briefs.forEach(brief => {
      activities.push({
        id: `brief-${brief.id}`,
        timestamp: brief.created_at,
        type: 'brief',
        title: 'Project Brief',
        description: brief.content.substring(0, 150) + (brief.content.length > 150 ? '...' : ''),
        fullContent: brief.content,
        metadata: {
          sections: brief.sections,
          auto_tasks_created: brief.auto_tasks_created,
          technical_analysis_included: brief.technical_analysis_included,
          created_at: brief.created_at,
          updated_at: brief.updated_at,
        },
        icon: <BriefIcon />,
        color: 'secondary',
      });
    });

    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [memories, progress, tasks, thinking, briefs]);

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.abs(now.getTime() - activityTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (timelineActivities.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <TimelineIconSvg sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No timeline activities found
        </Typography>
        <Typography color="text.secondary">
          Project activities will appear here as you add memories, tasks, and progress
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Project Timeline
      </Typography>
      
      <Timeline position="alternate">
        {timelineActivities.map((activity, index) => (
          <TimelineItem key={activity.id}>
            <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
              <Typography variant="caption" fontWeight="bold">
                {formatRelativeTime(activity.timestamp)}
              </Typography>
              <br />
              <Typography variant="caption">
                {formatDate(activity.timestamp)}
              </Typography>
            </TimelineOppositeContent>
            
            <TimelineSeparator>
              <TimelineDot color={activity.color} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activity.icon}
              </TimelineDot>
              {index < timelineActivities.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            
            <TimelineContent sx={{ py: '12px', px: 2 }}>
              <Paper 
                sx={{ 
                  p: 2, 
                  border: 1, 
                  borderColor: 'divider',
                  cursor: activity.fullContent ? 'pointer' : 'default',
                  '&:hover': activity.fullContent ? {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50'
                  } : {}
                }}
                onClick={() => {
                  if (activity.fullContent) {
                    onViewContent(activity.title, activity.fullContent, activity.metadata);
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="span" fontWeight="bold">
                    {activity.title}
                  </Typography>
                  <Chip label={activity.type} size="small" color={activity.color} variant="outlined" />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {activity.description}
                </Typography>
                
                {/* Activity-specific metadata displays */}
                {activity.type === 'progress' && activity.metadata?.completion_percentage !== undefined && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Progress: {activity.metadata.completion_percentage}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={activity.metadata.completion_percentage}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                )}
                
                {activity.type === 'memory' && activity.metadata?.importance_score !== undefined && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Importance: {Math.round(activity.metadata.importance_score * 100)}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={activity.metadata.importance_score * 100}
                      sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                    />
                  </Box>
                )}
                
                {activity.type === 'task' && activity.metadata?.estimated_hours && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Estimated: {activity.metadata.estimated_hours} hours
                  </Typography>
                )}
                
                {activity.type === 'thinking' && activity.metadata?.thought_count !== undefined && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {activity.metadata.thought_count} thoughts • {activity.metadata.is_complete ? 'Complete' : 'Active'}
                  </Typography>
                )}
                
                {activity.fullContent && (
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500, textAlign: 'center', display: 'block', mt: 1 }}>
                    Click to view full content
                  </Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </>
  );
};