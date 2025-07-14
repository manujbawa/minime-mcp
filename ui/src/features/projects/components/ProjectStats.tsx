/**
 * Project Stats Component
 * Displays project statistics overview
 */

import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

interface ProjectStatsProps {
  stats: {
    memories: number;
    completedTasks: number;
    progressEntries: number;
    thinkingSequences: number;
  };
}

export const ProjectStats: React.FC<ProjectStatsProps> = ({ stats }) => {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary">
            {stats.memories}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Memories
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="success.main">
            {stats.completedTasks}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Completed Tasks
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="warning.main">
            {stats.progressEntries}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Progress Entries
          </Typography>
        </Paper>
      </Grid>
      <Grid size={{ xs: 6, sm: 3 }}>
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="info.main">
            {stats.thinkingSequences}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Thinking Sequences
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};