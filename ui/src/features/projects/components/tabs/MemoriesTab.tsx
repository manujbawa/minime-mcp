/**
 * Memories Tab Component
 * Displays project memories
 */

import React from 'react';
import { Box, Typography, Paper, Grid, Chip, LinearProgress } from '@mui/material';
import { Memory as MemoryIcon } from '@mui/icons-material';
import type { Memory } from '../../../../types';

interface MemoriesTabProps {
  memories: Memory[];
  onViewMemory: (memory: Memory) => void;
}

export const MemoriesTab: React.FC<MemoriesTabProps> = ({ memories, onViewMemory }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Recent Memories
      </Typography>
      
      <Grid container spacing={2}>
        {memories.map((memory) => (
          <Grid size={{ xs: 12, md: 6 }} key={memory.id}>
            <Paper 
              sx={{ 
                p: 3, 
                border: 1, 
                borderColor: 'divider', 
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50'
                }
              }}
              onClick={() => onViewMemory(memory)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Chip label={memory.memory_type} size="small" color="primary" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(memory.created_at)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                {memory.content.substring(0, 200)}{memory.content.length > 200 ? '...' : ''}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={memory.importance_score * 100}
                  sx={{ flexGrow: 1, mr: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(memory.importance_score * 100)}% importance
                </Typography>
              </Box>
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500, textAlign: 'center', display: 'block' }}>
                Click to view full memory
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {memories.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MemoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No memories yet
          </Typography>
          <Typography color="text.secondary">
            Memories will be created as you work on this project
          </Typography>
        </Paper>
      )}
    </>
  );
};