/**
 * Tool Category Section Component
 * Displays tools grouped by category with expandable accordions
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { ToolAccordion } from './ToolAccordion';
import type { MCPTool } from '../../../types';

interface ToolCategorySectionProps {
  category: string;
  tools: MCPTool[];
  expandedTool: string | false;
  onAccordionChange: (toolName: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  onCopyToClipboard: (text: string) => void;
}

const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
  switch (category) {
    case 'Memory Management': return 'primary';
    case 'Sequential Thinking': return 'secondary';
    case 'Task Management': return 'warning';
    case 'Meta-Learning': return 'success';
    default: return 'info';
  }
};

export const ToolCategorySection: React.FC<ToolCategorySectionProps> = ({
  category,
  tools,
  expandedTool,
  onAccordionChange,
  onCopyToClipboard,
}) => {
  return (
    <Box sx={{ mb: 4, maxWidth: '100%', overflow: 'hidden' }}>
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}
      >
        <Chip 
          label={category} 
          color={getCategoryColor(category)} 
          sx={{ flexShrink: 0 }} 
        />
        <Box sx={{ flexShrink: 0 }}>
          {tools.length} tools
        </Box>
      </Typography>
      
      <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        {tools.map((tool) => (
          <ToolAccordion
            key={tool.name}
            tool={tool}
            expanded={expandedTool === tool.name}
            onChange={onAccordionChange(tool.name)}
            onCopyToClipboard={onCopyToClipboard}
          />
        ))}
      </Box>
    </Box>
  );
}; 