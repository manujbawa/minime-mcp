/**
 * Project Brief Section Component
 * Displays project brief with preview and full view capability
 */

import React from 'react';
import { Box, Paper, Typography, Button, Chip } from '@mui/material';
import { Description as DocumentIcon } from '@mui/icons-material';
import type { ProjectBrief } from '../../../types';

interface ProjectBriefSectionProps {
  briefs: ProjectBrief[];
  onViewBrief: (brief: ProjectBrief) => void;
  onCreateBrief: () => void;
}

export const ProjectBriefSection: React.FC<ProjectBriefSectionProps> = ({ 
  briefs, 
  onViewBrief,
  onCreateBrief 
}) => {
  if (briefs.length === 0) {
    return (
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <DocumentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            No Project Brief Yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create comprehensive project documentation with AI assistance to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DocumentIcon />}
            onClick={onCreateBrief}
            size="large"
          >
            Create Project Brief
          </Button>
        </Paper>
      </Box>
    );
  }

  const latestBrief = briefs[0];

  return (
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            Project Brief
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => onViewBrief(latestBrief)}
            endIcon={<DocumentIcon />}
          >
            View All Briefs
          </Button>
        </Box>
        
        {/* Brief metadata */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {latestBrief.sections?.map((section) => (
            <Chip key={section} label={section} size="small" variant="outlined" />
          ))}
          {latestBrief.auto_tasks_created && (
            <Chip label="Tasks Created" size="small" color="success" variant="outlined" />
          )}
          {latestBrief.technical_analysis_included && (
            <Chip label="Technical Analysis" size="small" color="primary" variant="outlined" />
          )}
        </Box>

        {/* Brief content preview */}
        <Paper 
          sx={{ 
            p: 3, 
            backgroundColor: 'grey.50', 
            border: 1, 
            borderColor: 'grey.200',
            maxHeight: '300px',
            overflow: 'auto',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50'
            }
          }}
          onClick={() => onViewBrief(latestBrief)}
        >
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {latestBrief.content.substring(0, 500)}
            {latestBrief.content.length > 500 ? '...' : ''}
          </Typography>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
              Click to view full project brief
            </Typography>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {new Date(latestBrief.created_at).toLocaleDateString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};