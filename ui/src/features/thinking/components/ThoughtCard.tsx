/**
 * Thought Card Component
 * Displays individual thought details
 */

import React from 'react';
import { Box, Paper, Typography, Chip, LinearProgress } from '@mui/material';
import { Thought, thoughtTypeConfig } from '../types';

interface ThoughtCardProps {
  thought: Thought;
  onClick?: () => void;
}

export const ThoughtCard: React.FC<ThoughtCardProps> = ({ thought, onClick }) => {
  const config = thoughtTypeConfig[thought.thought_type] || thoughtTypeConfig.default;
  
  return (
    <Paper
      sx={{
        p: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: 2,
          borderColor: config.color
        } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box 
          sx={{ 
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Typography sx={{ fontSize: '20px' }}>{config.icon}</Typography>
        </Box>
        
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Thought #{thought.thought_number}
            </Typography>
            <Chip 
              label={config.label} 
              size="small" 
              sx={{ 
                bgcolor: config.color,
                color: 'white',
                fontSize: '0.7rem'
              }}
            />
          </Box>
          
          <Typography variant="body2" sx={{ mb: 1.5 }}>
            {thought.content}
          </Typography>
          
          {thought.confidence_level && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Confidence
                </Typography>
                <Typography variant="caption" fontWeight="bold">
                  {Math.round(thought.confidence_level * 100)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={thought.confidence_level * 100}
                sx={{ 
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: thought.confidence_level > 0.7 ? 'success.main' : 
                             thought.confidence_level > 0.4 ? 'warning.main' : 'error.main'
                  }
                }}
              />
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {new Date(thought.created_at).toLocaleString()}
            </Typography>
            {thought.branch_id && (
              <Chip 
                label={`Branch: ${thought.branch_id}`} 
                size="small" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};