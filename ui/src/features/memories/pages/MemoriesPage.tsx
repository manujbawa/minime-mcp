/**
 * Memories Page
 * Browse and search memories with advanced filtering capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { PageLayout } from '../../../components/layout/PageLayout';
import { useApp } from '../../../contexts/AppContext';
import { MemoriesAPI, ProjectsAPI } from '../../../services/api';
import {
  MemorySearchControls,
  MemoryResults,
} from '../components';
import type { Memory, Project } from '../../../types';

interface SearchFilters {
  memory_type?: string;
  importance_min?: number;
  processing_status?: string;
  date_from?: string;
}

export const MemoriesPage: React.FC = () => {
  const { addNotification } = useApp();
  
  // State
  const [memories, setMemories] = useState<Memory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  // Load projects
  const loadProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await ProjectsAPI.list();
      if (response.success && response.data) {
        setProjects(response.data);
        if (response.data.length > 0 && !selectedProject) {
          setSelectedProject(response.data[0].name);
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to load projects',
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  // Load memories for selected project
  const loadMemories = useCallback(async () => {
    if (!selectedProject) return;
    
    console.log('Loading memories for project:', selectedProject);
    console.log('Filters:', filters);
    
    try {
      setLoading(true);
      if (selectedProject === '__ALL__') {
        // List memories across all projects
        const response = await MemoriesAPI.list({
          memory_type: filters.memory_type,
          processing_status: filters.processing_status,
          limit: 50,
        });
        console.log('All projects list response:', response);
        if (response.success) {
          setMemories(response.data || []);
        }
      } else {
        // Load memories for specific project using the unified endpoint
        const response = await MemoriesAPI.list({
          project_name: selectedProject,
          memory_type: filters.memory_type,
          processing_status: filters.processing_status,
          limit: 50,
        });
        console.log('Project memories response:', response);
        if (response.success) {
          setMemories(response.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading memories:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load memories',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProject, filters, addNotification]);

  // Handle search
  const handleSearch = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      // If no search query, load memories for the project (or all projects)
      if (!searchQuery.trim()) {
        await loadMemories();
        return;
      }

      // Perform search with query
      const response = await MemoriesAPI.search(searchQuery, {
        project_name: selectedProject === '__ALL__' ? undefined : selectedProject,
        memory_type: filters.memory_type,
        processing_status: filters.processing_status,
        limit: 50,
      });
      
      if (response.success) {
        setMemories(response.data || []);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Search failed',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Effects
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadMemories();
    }
  }, [selectedProject, filters, loadMemories]);

  return (
    <PageLayout
      title="Memory Explorer"
      subtitle="Search and explore memories within a specific project or across all projects using semantic similarity"
    >
      <Box sx={{ '> *': { mb: 3 } }}>
        {/* Search Controls */}
        <MemorySearchControls
          projects={projects}
          selectedProject={selectedProject}
          searchQuery={searchQuery}
          filters={filters}
          loading={loading}
          onProjectChange={setSelectedProject}
          onSearchQueryChange={setSearchQuery}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onKeyPress={handleKeyPress}
        />

        {/* Results */}
        <MemoryResults
          memories={memories}
          loading={loading || projectsLoading}
          searchQuery={searchQuery}
          selectedProject={selectedProject}
        />
      </Box>
    </PageLayout>
  );
};