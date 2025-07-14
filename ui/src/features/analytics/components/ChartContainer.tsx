/**
 * Chart Container Component
 * Standardized container for all charts that handles layout, loading, and error states
 */

import React from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

interface ChartContainerProps {
  title: string;
  height?: number;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
}

const ChartSkeleton: React.FC<{ height: number }> = ({ height }) => (
  <Box sx={{ 
    height, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <CircularProgress />
  </Box>
);

const ChartError: React.FC<{ message: string }> = ({ message }) => (
  <Box sx={{ 
    height: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'column'
  }}>
    <ErrorIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
    <Typography color="error">{message}</Typography>
  </Box>
);

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  height = 400,
  children,
  loading = false,
  error
}) => {
  return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: height + 80 // Account for title and padding
    }}>
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        '&:last-child': { pb: 2 } // Reduce bottom padding
      }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {title}
        </Typography>
        
        <Box sx={{ 
          flex: 1,
          minHeight: height,
          height: height,
          position: 'relative',
          '& .recharts-wrapper': {
            width: '100% !important',
            height: '100% !important'
          },
          '& .recharts-responsive-container': {
            width: '100% !important',
            height: '100% !important'
          }
        }}>
          {loading ? (
            <ChartSkeleton height={height} />
          ) : error ? (
            <ChartError message={error} />
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </Card>
  );
}; 