/**
 * Tasks Tab Component
 * Displays project tasks
 */

import React from 'react';
import { Box, Typography, Paper, Button, Chip, Grid } from '@mui/material';
import {
  Add as AddIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  PlayArrow as InProgressIcon,
  Block as BlockedIcon,
  BugReport as BugIcon,
  Build as FeatureIcon,
  Speed as OptimizationIcon,
  School as DocumentationIcon,
} from '@mui/icons-material';
import type { TaskItem } from '../../../../types';

interface TasksTabProps {
  tasks: TaskItem[];
  onCreateTask: () => void;
  onViewTask: (task: TaskItem) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({ tasks, onCreateTask, onViewTask }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CompletedIcon color="success" />;
      case 'in_progress': return <InProgressIcon color="primary" />;
      case 'blocked': return <BlockedIcon color="error" />;
      default: return <PendingIcon color="disabled" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return <BugIcon color="error" />;
      case 'feature': return <FeatureIcon color="primary" />;
      case 'optimization': return <OptimizationIcon color="warning" />;
      case 'documentation': return <DocumentationIcon color="info" />;
      default: return <TaskIcon />;
    }
  };

  const getPriorityColor = (priority: any) => {
    if (priority.urgency === 'critical' || priority.impact === 'high') return 'error';
    if (priority.urgency === 'high' || priority.impact === 'medium') return 'warning';
    return 'default';
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Task Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateTask}
        >
          Create Task
        </Button>
      </Box>

      <Grid container spacing={2}>
        {tasks.map((task) => (
          <Grid size={{ xs: 12, md: 6 }} key={task.id}>
            <Paper 
              sx={{ 
                p: 3, 
                border: 1, 
                borderColor: 'divider', 
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50',
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
              onClick={() => onViewTask(task)}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  {getStatusIcon(task.status)}
                  {getCategoryIcon(task.category)}
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.2,
                      maxHeight: '2.4em'
                    }}
                  >
                    {task.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 1,
                      wordBreak: 'break-word',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                      maxHeight: '4.2em'
                    }}
                  >
                    {task.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip
                      label={task.category}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={task.status}
                      size="small"
                      color={getPriorityColor(task.priority)}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Priority: {task.priority.urgency} urgency, {task.priority.impact} impact
                  </Typography>
                  {task.estimated_hours && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      • Est: {task.estimated_hours}h
                    </Typography>
                  )}
                </Box>
              </Box>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500, textAlign: 'center', display: 'block', mt: 1 }}>
                Click to view full task details
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {tasks.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TaskIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No tasks yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Create and manage project tasks with intelligent prioritization
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateTask}
          >
            Create First Task
          </Button>
        </Paper>
      )}
    </>
  );
};