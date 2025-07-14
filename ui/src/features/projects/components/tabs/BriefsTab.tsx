/**
 * Briefs Tab Component
 * Displays all project briefs
 */

import React from 'react';
import { Box, Typography, Paper, Button, Chip } from '@mui/material';
import { Add as AddIcon, Description as DocumentIcon } from '@mui/icons-material';
import type { ProjectBrief } from '../../../../types';

interface BriefsTabProps {
  briefs: ProjectBrief[];
  onCreateBrief: () => void;
  onViewBrief: (brief: ProjectBrief) => void;
}

export const BriefsTab: React.FC<BriefsTabProps> = ({ briefs, onCreateBrief, onViewBrief }) => {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Project Documentation
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onCreateBrief}
        >
          Create Brief
        </Button>
      </Box>

      {briefs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No project briefs yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Create comprehensive project documentation with AI assistance
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateBrief}
          >
            Create First Brief
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {briefs.map((brief) => (
            <Paper 
              key={brief.id} 
              sx={{ 
                p: 3, 
                border: 1, 
                borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.50'
                }
              }}
              onClick={() => onViewBrief(brief)}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Project Brief #{brief.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(brief.created_at)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                {brief.sections.map((section) => (
                  <Chip key={section} label={section} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
              
              <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {brief.content.substring(0, 300)}{brief.content.length > 300 ? '...' : ''}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={brief.auto_tasks_created ? 'Tasks Created' : 'No Tasks'}
                  size="small"
                  color={brief.auto_tasks_created ? 'success' : 'default'}
                />
                <Chip
                  label={brief.technical_analysis_included ? 'Tech Analysis' : 'Basic'}
                  size="small"
                  color={brief.technical_analysis_included ? 'primary' : 'default'}
                />
              </Box>
              
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500, textAlign: 'center', display: 'block' }}>
                Click to view full brief
              </Typography>
            </Paper>
          ))}
        </Box>
      )}
    </>
  );
};