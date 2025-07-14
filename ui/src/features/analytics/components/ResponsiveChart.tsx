/**
 * Responsive Chart Wrapper Component
 * Fixes ResponsiveContainer layout issues and ensures proper chart sizing
 */

import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Box } from '@mui/material';

interface ResponsiveChartProps {
  children: React.ReactElement;
  height?: number;
  width?: string;
  debounceMs?: number;
}

export const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  children,
  height = 400,
  width = '100%',
  debounceMs = 300
}) => {
  return (
    <Box sx={{ 
      width: '100%',
      height: height,
      minHeight: height,
      position: 'relative',
      '& .recharts-responsive-container': {
        width: '100% !important',
        height: '100% !important',
        position: 'absolute !important',
        top: 0,
        left: 0
      },
      '& .recharts-wrapper': {
        width: '100% !important',
        height: '100% !important'
      }
    }}>
      <ResponsiveContainer 
        width={width} 
        height="100%" 
        debounce={debounceMs}
      >
        {children}
      </ResponsiveContainer>
    </Box>
  );
}; 