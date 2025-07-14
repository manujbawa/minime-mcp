/**
 * Memory Search Controls Component
 * Handles project selection, search input, and memory type filtering
 */

import React from 'react';
import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  InputAdornment,
  Divider,
  Typography,
  Box,
  ListSubheader,
} from '@mui/material';
import { Grid } from '@mui/material';
import { Search } from '@mui/icons-material';
import type { Project } from '../../../types';

interface SearchFilters {
  memory_type?: string;
  importance_min?: number;
  processing_status?: string;
  date_from?: string;
}

interface MemorySearchControlsProps {
  projects: Project[];
  selectedProject: string;
  searchQuery: string;
  filters: SearchFilters;
  loading: boolean;
  onProjectChange: (project: string) => void;
  onSearchQueryChange: (query: string) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

// Memory types organized by category for better UI
// These match all the types that can be stored in the memories table
const memoryTypesByCategory = {
  // Core memory types from store_memory tool
  development: [
    { value: 'code', label: 'Code' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'tech_reference', label: 'Tech Reference' },
    { value: 'tech_context', label: 'Tech Context' },
  ],
  planning: [
    { value: 'decision', label: 'Decision' },
    { value: 'rule', label: 'Rule' },
    { value: 'requirements', label: 'Requirements' },
    { value: 'task', label: 'Task' },  // Created by manage_tasks tool
  ],
  documentation: [
    { value: 'project_brief', label: 'Project Brief' },  // Created by manage_project tool with doc_type='brief'
    { value: 'project_prd', label: 'Project PRD' },      // Created by manage_project tool with doc_type='prd'
    { value: 'project_plan', label: 'Project Plan' },    // Created by manage_project tool with doc_type='plan'
    { value: 'general', label: 'General' },
  ],
  tracking: [
    { value: 'progress', label: 'Progress' },
    { value: 'bug', label: 'Bug' },
  ],
};

export const MemorySearchControls: React.FC<MemorySearchControlsProps> = ({
  projects,
  selectedProject,
  searchQuery,
  filters,
  loading,
  onProjectChange,
  onSearchQueryChange,
  onFiltersChange,
  onSearch,
  onKeyPress,
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          {/* Project Selection */}
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => onProjectChange(e.target.value)}
                label="Project"
              >
                <MenuItem value="">Select a project</MenuItem>
                <MenuItem value="__ALL__">All Projects</MenuItem>
                <Divider />
                {projects.map((project) => (
                  <MenuItem key={project.name} value={project.name}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search Input */}
          <Grid item xs={12} sm={12} md={5} lg={6}>
            <TextField
              fullWidth
              label="Search Memories (optional)"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyPress={onKeyPress}
              placeholder="Search memories by content or leave empty to browse all..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Search Button */}
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={onSearch}
              disabled={!selectedProject || loading}
              sx={{ height: 56 }}
            >
              {searchQuery.trim() ? 'Search' : 'Load Memories'}
            </Button>
          </Grid>
        </Grid>

        {/* Filters Section */}
        <Box sx={{ mt: 3, pt: 3 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Filters
          </Typography>
          <Grid container spacing={3}>
            {/* Memory Type Filter */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <Select
                  value={filters.memory_type || ''}
                  onChange={(e) => 
                    onFiltersChange({ 
                      ...filters, 
                      memory_type: e.target.value || undefined 
                    })
                  }
                  displayEmpty
                  renderValue={(selected) => selected || "All Types"}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.entries(memoryTypesByCategory).map(([category, types]) => [
                    <ListSubheader key={category} sx={{ textTransform: 'capitalize' }}>
                      {category.replace('_', ' ')}
                    </ListSubheader>,
                    ...types.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))
                  ])}
                </Select>
              </FormControl>
            </Grid>

            {/* Importance Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <Select
                  value={filters.importance_min || ''}
                  onChange={(e) => 
                    onFiltersChange({ 
                      ...filters, 
                      importance_min: e.target.value ? parseInt(e.target.value.toString()) : undefined 
                    })
                  }
                  displayEmpty
                  renderValue={(selected) => selected || "Any Confidence"}
                >
                  <MenuItem value="">Any Confidence</MenuItem>
                  <MenuItem value="5">5+ (High)</MenuItem>
                  <MenuItem value="7">7+ (Very High)</MenuItem>
                  <MenuItem value="9">9+ (Critical)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Processing Status Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <Select
                  value={filters.processing_status || ''}
                  onChange={(e) => 
                    onFiltersChange({ 
                      ...filters, 
                      processing_status: e.target.value || undefined 
                    })
                  }
                  displayEmpty
                  renderValue={(selected) => selected || "Any Status"}
                >
                  <MenuItem value="">Any Status</MenuItem>
                  <MenuItem value="ready">✅ Ready</MenuItem>
                  <MenuItem value="processing">🔄 Processing</MenuItem>
                  <MenuItem value="pending">⚠️ Pending</MenuItem>
                  <MenuItem value="failed">❌ Failed</MenuItem>
                  <MenuItem value="failed_permanent">❌ Failed (Permanent)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <Select
                  value={filters.date_from || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const date = value 
                      ? new Date(Date.now() - parseInt(value.toString()) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                      : undefined;
                    onFiltersChange({ ...filters, date_from: date });
                  }}
                  displayEmpty
                  renderValue={(selected) => selected || "Any Timeframe"}
                >
                  <MenuItem value="">Any Timeframe</MenuItem>
                  <MenuItem value="1">Last Day</MenuItem>
                  <MenuItem value="7">Last Week</MenuItem>
                  <MenuItem value="30">Last Month</MenuItem>
                  <MenuItem value="90">Last 3 Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};