/**
 * Project Card Component
 * Displays project information in a card format with stats and actions
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  MoreVert,
  Delete,
  Edit,
  TrendingUp,
  FolderOpen,
  BarChart,
  Link,
} from '@mui/icons-material';
import type { Project } from '../../../types';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onView: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getActivityColor = (lastActivity: string) => {
    const daysSince = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince <= 1) return 'success';
    if (daysSince <= 7) return 'warning';
    return 'default';
  };

  const getTechStackColors = (index: number) => {
    const colors = ['primary', 'secondary', 'info', 'warning', 'error'] as const;
    return colors[index % colors.length];
  };

  return (
    <Card
      sx={{
        height: '100%', // Full height of grid cell for uniform cards
        minHeight: 320, // Minimum height for consistency
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Project Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <FolderOpen />
            </Avatar>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="h6" component="h3" noWrap fontWeight="600">
                {project.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created {formatDate(project.created_at)}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Description */}
        {project.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '20px', // Reserve space even if no description
            }}
          >
            {project.description}
          </Typography>
        )}

        {/* Tech Stack */}
        <Box sx={{ mb: 1.5, minHeight: '32px' }}>
          {project.settings?.tech_stack && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {project.settings.tech_stack.slice(0, 2).map((tech: string, index: number) => (
                <Chip
                  key={index}
                  label={tech}
                  size="small"
                  color={getTechStackColors(index)}
                  variant="outlined"
                />
              ))}
              {project.settings.tech_stack.length > 2 && (
                <Chip
                  label={`+${project.settings.tech_stack.length - 2}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          )}
        </Box>

        {/* Statistics */}
        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" fontSize="1rem">
                  {project.memory_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Memories
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" fontSize="1rem">
                  {project.session_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Sessions
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" fontSize="1rem">
                  {project.thinking_sequence_count || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Sequences
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Last Activity and Link Indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp 
              sx={{ 
                fontSize: 14, 
                mr: 0.5,
                color: getActivityColor(project.last_activity || project.updated_at) === 'success' ? 'success.main' :
                       getActivityColor(project.last_activity || project.updated_at) === 'warning' ? 'warning.main' : 'text.secondary'
              }} 
            />
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
              {formatDate(project.last_activity || project.updated_at)}
            </Typography>
          </Box>
          {project.link_count && project.link_count > 0 && (
            <Chip
              icon={<Link sx={{ fontSize: 12 }} />}
              label={project.link_count}
              size="small"
              sx={{ 
                height: 20, 
                fontSize: '0.7rem',
                '& .MuiChip-icon': { 
                  fontSize: 12,
                  marginLeft: '4px'
                }
              }}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      </CardContent>

      <Divider />

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'center', px: 2, py: 1 }}>
        <Button
          size="small"
          startIcon={<BarChart />}
          color="primary"
          onClick={() => onView(project)}
          fullWidth
        >
          View Details
        </Button>
      </CardActions>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleMenuClose(); onEdit(project); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => { handleMenuClose(); onDelete(project); }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Card>
  );
};