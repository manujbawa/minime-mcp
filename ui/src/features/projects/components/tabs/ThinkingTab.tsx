/**
 * Thinking Tab Component
 * Displays thinking sequences
 */

import React from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { Psychology as ThinkingIcon } from '@mui/icons-material';
import type { ThinkingSequence } from '../../../../types';

interface ThinkingTabProps {
  sequences: ThinkingSequence[];
  onViewSequence: (sequence: ThinkingSequence) => void;
}

export const ThinkingTab: React.FC<ThinkingTabProps> = ({ sequences, onViewSequence }) => {
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
        Thinking Sequences
      </Typography>
      
      <Grid container spacing={2}>
        {sequences.map((sequence) => (
          <Grid size={{ xs: 12, md: 6 }} key={sequence.id}>
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
              onClick={() => onViewSequence(sequence)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" fontWeight="bold">
                  {sequence.sequence_name}
                </Typography>
                <Chip
                  label={sequence.is_complete ? 'Complete' : 'Active'}
                  size="small"
                  color={sequence.is_complete ? 'success' : 'primary'}
                />
              </Box>
              {sequence.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {sequence.description}
                </Typography>
              )}
              {sequence.goal && (
                <Typography variant="body2" color="text.primary" sx={{ mb: 1, fontStyle: 'italic' }}>
                  Goal: {sequence.goal}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Created {formatDate(sequence.created_at)}
              </Typography>
              {sequence.thoughts && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  • {sequence.thoughts.length} thoughts
                </Typography>
              )}
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500, textAlign: 'center', display: 'block', mt: 2 }}>
                Click to view complete reasoning process
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {sequences.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ThinkingIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No thinking sequences yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Create structured reasoning processes to track complex decisions and analysis
          </Typography>
        </Paper>
      )}
    </>
  );
};