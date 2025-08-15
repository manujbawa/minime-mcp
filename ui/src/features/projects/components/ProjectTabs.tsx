/**
 * Project Tabs Component
 * Tab navigation for project details sections
 */

import React from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import {
  Description as DocumentIcon,
  TrendingUp as ProgressIcon,
  Assignment as TaskIcon,
  Code as CodeIcon,
  Psychology as ThinkingIcon,
  Timeline as TimelineIcon,
  Link as LinkIcon,
} from '@mui/icons-material';

interface ProjectTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
}

export const ProjectTabs: React.FC<ProjectTabsProps> = ({ value, onChange }) => {
  return (
    <Paper sx={{ mb: 0 }}>
      <Tabs
        value={value}
        onChange={onChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<DocumentIcon />} label="Project Briefs" />
        <Tab icon={<ProgressIcon />} label="Progress Tracking" />
        <Tab icon={<TaskIcon />} label="Tasks" />
        <Tab icon={<CodeIcon />} label="Memories" />
        <Tab icon={<ThinkingIcon />} label="Thinking" />
        <Tab icon={<TimelineIcon />} label="Timeline" />
        <Tab icon={<LinkIcon />} label="Relationships" />
      </Tabs>
    </Paper>
  );
};