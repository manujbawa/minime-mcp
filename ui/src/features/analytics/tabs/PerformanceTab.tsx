/**
 * Performance Tab Component
 * Shows project health matrix and activity comparison
 */

import React from 'react';
import {
  Typography,
  Box,
} from '@mui/material';
import {
  Assessment,
  Business,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartEmptyState, ChartContainer, ResponsiveChart } from '../components';
import type { Analytics, Project } from '../../../types';

interface PerformanceTabProps {
  analytics: Analytics | null;
  projects: Project[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ analytics, projects }) => {
  // Generate project health data
  const projectHealthData = projects
    .filter(project => 
      parseInt(project.memory_count || '0') > 0 || 
      parseInt(project.thinking_sequence_count || '0') > 0
    )
    .map(project => ({
      name: project.name.substring(0, 10),
      memories: parseInt(project.memory_count || '0'),
      sequences: parseInt(project.thinking_sequence_count || '0'),
      health: Math.min(100, 
        parseInt(project.memory_count || '0') * 2 + 
        parseInt(project.thinking_sequence_count || '0') * 5
      ),
    }));

  // Generate project activity data
  const projectActivityData = projects
    .filter(p => 
      parseInt(p.memory_count || '0') > 0 || 
      parseInt(p.thinking_sequence_count || '0') > 0 || 
      parseInt(p.session_count || '0') > 0
    )
    .map(project => ({
      name: project.name,
      memories: parseInt(project.memory_count || '0'),
      sequences: parseInt(project.thinking_sequence_count || '0'),
      sessions: parseInt(project.session_count || '0'),
    }));

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 3, 
      flexWrap: 'wrap',
      '& > *': { 
        flex: '1 1 500px',
        minWidth: 0
      }
    }}>
      {/* Project Health Matrix */}
      <ChartContainer title="Project Health Matrix" height={400}>
        {projectHealthData.length > 0 ? (
          <ResponsiveChart height={400}>
            <LineChart data={projectHealthData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="memories" 
                stroke={COLORS[0]} 
                strokeWidth={2}
                name="Memories"
              />
              <Line 
                type="monotone" 
                dataKey="sequences" 
                stroke={COLORS[1]} 
                strokeWidth={2}
                name="Sequences"
              />
              <Line 
                type="monotone" 
                dataKey="health" 
                stroke={COLORS[2]} 
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Health Score"
              />
            </LineChart>
          </ResponsiveChart>
        ) : (
          <ChartEmptyState 
            icon={<Assessment />}
            title="No project data to analyze"
            description="Projects with memories and sequences will appear here"
          />
        )}
      </ChartContainer>

      {/* Project Activity Comparison */}
      <ChartContainer title="Project Activity Comparison" height={400}>
        {projectActivityData.length > 0 ? (
          <ResponsiveChart height={400}>
            <BarChart data={projectActivityData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="memories" fill={COLORS[0]} name="Memories" />
              <Bar dataKey="sequences" fill={COLORS[1]} name="Sequences" />
              <Bar dataKey="sessions" fill={COLORS[2]} name="Sessions" />
            </BarChart>
          </ResponsiveChart>
        ) : (
          <ChartEmptyState 
            icon={<Business />}
            title="No project activity to compare"
            description="Create projects and add data to see activity comparison"
          />
        )}
      </ChartContainer>
    </Box>
  );
};