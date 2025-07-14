/**
 * Memory Type Icons Utility
 * Maps memory types to appropriate Material-UI icons
 */

import React from 'react';
import {
  Assessment,
  Code,
  BugReport,
  Business,
  Lightbulb,
  TrendingUp,
} from '@mui/icons-material';

export const getMemoryTypeIcon = (memoryType: string): React.ReactElement => {
  const type = memoryType.toLowerCase();
  
  switch (type) {
    case 'task':
      return <Assessment />;
    case 'code':
      return <Code />;
    case 'bug':
    case 'bugfix':
      return <BugReport />;
    case 'decision':
    case 'architecture':
      return <Business />;
    case 'insight':
    case 'lessons_learned':
      return <Lightbulb />;
    case 'progress':
    case 'implementation_notes':
      return <TrendingUp />;
    case 'requirements':
    case 'project_brief':
      return <Assessment />;
    default:
      return <Assessment />;
  }
};