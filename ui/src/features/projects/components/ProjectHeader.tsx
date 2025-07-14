/**
 * Project Header Component
 * Displays project title, description and navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, IconButton } from '@mui/material';
import { ArrowBack, FolderOpen } from '@mui/icons-material';
import type { Project } from '../../../types';

interface ProjectHeaderProps {
  project: Project;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate('/projects')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
          <FolderOpen />
        </Avatar>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="bold">
            {project.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {project.description || 'No description available'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};