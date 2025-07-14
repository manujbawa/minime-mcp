/**
 * Projects Grid Component
 * Displays a grid of project cards with loading and empty states
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Skeleton,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add,
  Search,
  FolderOpen,
} from '@mui/icons-material';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../../../types';

interface ProjectsGridProps {
  projects: Project[];
  loading: boolean;
  searchTerm: string;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onViewProject: (project: Project) => void;
  onClearSearch: () => void;
}

export const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  loading,
  searchTerm,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onViewProject,
  onClearSearch,
}) => {
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.settings?.tech_stack?.some((tech: string) => 
      tech.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[...Array(8)].map((_, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: '100%', minHeight: 320 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="80%" />
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Skeleton variant="rounded" width={100} height={24} />
                  <Skeleton variant="rounded" width={100} height={24} />
                </Box>
              </CardContent>
              <CardActions>
                <Skeleton variant="rounded" width={100} height={36} sx={{ ml: 'auto' }} />
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <Grid container spacing={3}>
        <Grid xs={12}>
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            {searchTerm ? (
              <>
                <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="500">
                  No projects found
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  No projects match your search criteria &ldquo;{searchTerm}&rdquo;
                </Typography>
                <Button
                  variant="outlined"
                  onClick={onClearSearch}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <FolderOpen sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h5" gutterBottom fontWeight="500">
                  No projects yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Get started by creating your first project
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={onCreateProject}
                >
                  Create Project
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {filteredProjects.map((project) => (
        <Grid key={project.name} size={{ xs: 12, sm: 6, lg: 4 }}>
          <ProjectCard
            project={project}
            onEdit={onEditProject}
            onDelete={onDeleteProject}
            onView={onViewProject}
          />
        </Grid>
      ))}
    </Grid>
  );
};