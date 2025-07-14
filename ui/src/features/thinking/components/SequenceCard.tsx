/**
 * Sequence Card Component
 * Displays thinking sequence summary
 */

import React from 'react';
import { 
  Card, 
  CardContent, 
  Box, 
  Typography, 
  Avatar, 
  Chip, 
  Divider 
} from '@mui/material';
import { 
  CheckCircle, 
  Schedule as Clock, 
  Lightbulb, 
  Visibility as Eye, 
  ArrowForward 
} from '@mui/icons-material';
import type { ThinkingSequence } from '../types';

interface SequenceCardProps {
  sequence: ThinkingSequence;
  onClick: () => void;
}

export const SequenceCard: React.FC<SequenceCardProps> = ({ sequence, onClick }) => {
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
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: sequence.is_complete ? 'success.main' : 'warning.main' }}>
              {sequence.is_complete ? <CheckCircle /> : <Clock />}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {sequence.sequence_name}
              </Typography>
              {sequence.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {sequence.description}
                </Typography>
              )}
              {sequence.goal && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                  <Lightbulb sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="body2" color="primary.main">
                    Goal: {sequence.goal}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={sequence.is_complete ? 'Completed' : 'In Progress'}
              color={sequence.is_complete ? 'success' : 'warning'}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Created: {formatDate(sequence.created_at)}
            </Typography>
            {sequence.updated_at !== sequence.created_at && (
              <Typography variant="caption" color="text.secondary">
                Updated: {formatDate(sequence.updated_at)}
              </Typography>
            )}
            {sequence.thoughts && sequence.thoughts.length > 0 && (
              <Chip 
                label={`${sequence.thoughts.length} thoughts`}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Eye sx={{ fontSize: 16 }} />
            <Typography variant="caption" color="text.secondary">
              Click to explore
            </Typography>
            <ArrowForward sx={{ fontSize: 16 }} />
          </Box>
        </Box>

        {/* Metadata */}
        {sequence.metadata && Object.keys(sequence.metadata).length > 0 && (
          <Box sx={{ mt: 2, pt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(sequence.metadata).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${String(value)}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};