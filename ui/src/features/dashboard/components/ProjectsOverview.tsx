/**
 * Projects Overview Component
 * Displays project cards with details
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar,
  Chip,
  Skeleton 
} from '@mui/material';
import { Grid } from '@mui/material';
import { FolderOpen } from '@mui/icons-material';

interface Project {
  id: number;
  name: string;
  description?: string;
  memory_count?: number;
  session_count?: number;
  thinking_sequence_count?: number;
  last_activity?: string;
  updated_at: string;
  created_at: string;
  settings?: {
    tech_stack?: string[];
  };
}

interface ProjectsOverviewProps {
  projects: Project[];
  selectedProject: string;
  loading?: boolean;
}

export const ProjectsOverview: React.FC<ProjectsOverviewProps> = ({ 
  projects,
  selectedProject,
  loading = false 
}) => {
  const navigate = useNavigate();
  const isAllProjects = selectedProject === 'all';
  const displayProjects = isAllProjects ? projects.slice(0, 6) : projects;

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3].map((i) => (
          <Grid key={i} xs={12} sm={6} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (projects.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <FolderOpen sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          No projects found. Create your first project to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {displayProjects.map((project) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id}>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: isAllProjects ? 2 : 3,
              height: isAllProjects ? 'auto' : '100%',
              minHeight: isAllProjects ? 'auto' : 200,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'primary.50',
                transform: 'translateY(-2px)',
                boxShadow: 2
              }
            }}
            onClick={() => navigate(`/projects/${encodeURIComponent(project.name)}`)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: isAllProjects ? 1 : 2 }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: isAllProjects ? 32 : 48, 
                height: isAllProjects ? 32 : 48, 
                mr: 1.5 
              }}>
                <FolderOpen fontSize={isAllProjects ? 'small' : 'medium'} />
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography 
                  variant={isAllProjects ? 'subtitle2' : 'h6'} 
                  noWrap 
                  fontWeight="600"
                >
                  {project.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isAllProjects 
                    ? `${project.memory_count || 0} memories`
                    : `Created: ${new Date(project.created_at).toLocaleDateString()}`
                  }
                </Typography>
              </Box>
            </Box>

            {/* Enhanced details for single project view */}
            {!isAllProjects && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {project.description || 'No description available'}
                </Typography>
                
                {/* Detailed Statistics */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid xs={4}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {project.memory_count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Memories
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid xs={4}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6" fontWeight="bold" color="secondary.main">
                        {project.session_count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sessions
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid xs={4}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {project.thinking_sequence_count || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Sequences
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Activity Indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Last activity: {new Date(project.last_activity || project.updated_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {/* Tech Stack */}
            {project.settings?.tech_stack && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {project.settings.tech_stack.slice(0, isAllProjects ? 2 : 4).map((tech: string, index: number) => (
                  <Chip
                    key={index}
                    label={tech}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                ))}
                {project.settings.tech_stack.length > (isAllProjects ? 2 : 4) && (
                  <Chip
                    label={`+${project.settings.tech_stack.length - (isAllProjects ? 2 : 4)}`}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            )}
            
            {/* Click indicator */}
            <Typography 
              variant="caption" 
              color="primary.main" 
              sx={{ 
                fontWeight: 500, 
                textAlign: 'center', 
                display: 'block', 
                mt: 1 
              }}
            >
              Click to view project details
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};