/**
 * Chart Empty State Component
 * Displays consistent empty states for charts when no data is available
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ChartEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      color: 'text.secondary',
      p: 3
    }}>
      <Box sx={{ fontSize: 48, mb: 2, opacity: 0.5 }}>
        {icon}
      </Box>
      <Typography variant="body1" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {description}
      </Typography>
    </Box>
  );
};