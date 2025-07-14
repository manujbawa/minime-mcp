/**
 * Analytics Filters Component
 * Handles project and timeframe selection for analytics data
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  FilterList as Filter,
  Download,
} from '@mui/icons-material';
import type { Project } from '../../../types';

interface AnalyticsFiltersProps {
  projects: Project[];
  selectedProject: string;
  timeframe: string;
  onProjectChange: (project: string) => void;
  onTimeframeChange: (timeframe: string) => void;
  onExportReport?: () => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  projects,
  selectedProject,
  timeframe,
  onProjectChange,
  onTimeframeChange,
  onExportReport,
}) => {
  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Filter sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Analytics Scope:
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Project</InputLabel>
            <Select
              value={selectedProject}
              onChange={(e) => onProjectChange(e.target.value)}
              label="Project"
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.name} value={project.name}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              label="Timeframe"
            >
              <MenuItem value="7 days">Last 7 days</MenuItem>
              <MenuItem value="30 days">Last 30 days</MenuItem>
              <MenuItem value="90 days">Last 90 days</MenuItem>
              <MenuItem value="1 year">Last year</MenuItem>
            </Select>
          </FormControl>

          {onExportReport && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download />}
              onClick={onExportReport}
              sx={{ ml: 'auto' }}
            >
              Export Report
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};