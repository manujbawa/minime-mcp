/**
 * Projects Page
 * Main page for managing projects with modular components
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../../components/layout/PageLayout';
import { ProjectsAPI } from '../../../services/api';
import { useApp } from '../../../contexts/AppContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import {
  ProjectsSearch,
  ProjectsGrid,
  ProjectDialogs,
} from '../components';
import type { Project } from '../../../types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification, setCurrentProject } = useApp();
  const { subscribe } = useWebSocket();
  
  // State
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Load projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await ProjectsAPI.list();
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to load projects',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    // Subscribe to project updates
    const unsubscribe = subscribe('project:created', () => {
      fetchProjects();
    });

    return unsubscribe;
  }, []);

  // Handlers
  const handleCreateProject = async () => {
    try {
      const response = await ProjectsAPI.create(formData);
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Project created successfully',
        });
        handleCloseCreateDialog();
        fetchProjects();
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to create project',
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      const response = await ProjectsAPI.delete(selectedProject.name);
      if (response.success) {
        addNotification({
          type: 'success',
          message: 'Project deleted successfully',
        });
        handleCloseDeleteDialog();
        fetchProjects();
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to delete project',
      });
    }
  };

  const handleViewProject = (project: Project) => {
    setCurrentProject(project.name);
    navigate(`/projects/${project.name}`);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setFormData({ name: project.name, description: project.description || '' });
    setCreateDialogOpen(true);
  };

  const handleDeleteProjectClick = (project: Project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setSelectedProject(null);
    setFormData({ name: '', description: '' });
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedProject(null);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  return (
    <PageLayout
      title="Projects"
      subtitle="Manage your development projects and memories"
      actions={
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      }
    >
      {/* Search */}
      <ProjectsSearch 
        searchTerm={searchTerm}
        onChange={setSearchTerm}
      />

      {/* Projects Grid */}
      <ProjectsGrid
        projects={projects}
        loading={loading}
        searchTerm={searchTerm}
        onCreateProject={() => setCreateDialogOpen(true)}
        onEditProject={handleEditProject}
        onDeleteProject={handleDeleteProjectClick}
        onViewProject={handleViewProject}
        onClearSearch={handleClearSearch}
      />

      {/* Dialogs */}
      <ProjectDialogs
        createDialogOpen={createDialogOpen}
        selectedProject={selectedProject}
        formData={formData}
        onFormDataChange={setFormData}
        onCreateProject={handleCreateProject}
        onCloseCreateDialog={handleCloseCreateDialog}
        deleteDialogOpen={deleteDialogOpen}
        onDeleteProject={handleDeleteProject}
        onCloseDeleteDialog={handleCloseDeleteDialog}
      />
    </PageLayout>
  );
};