/**
 * Project Stats Component
 * Displays project statistics overview
 */

import React from 'react';
import { Paper, Typography, Box } from '@mui/material';

interface ProjectStatsProps {
  stats: {
    memories: number;
    completedTasks: number;
    progressEntries: number;
    thinkingSequences: number;
    totalTokens?: number;
  };
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ stats }) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: stats.totalTokens !== undefined ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          {stats.memories}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Memories
        </Typography>
      </Paper>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="success.main">
          {stats.completedTasks}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Completed Tasks
        </Typography>
      </Paper>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="warning.main">
          {stats.progressEntries}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Progress Entries
        </Typography>
      </Paper>
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" color="info.main">
          {stats.thinkingSequences}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Thinking Sequences
        </Typography>
      </Paper>
      {stats.totalTokens !== undefined && (
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="secondary.main">
            {formatNumber(stats.totalTokens)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Tokens
          </Typography>
        </Paper>
      )}
    </Box>
  );
};