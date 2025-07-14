import React from 'react';
import { Box, Card } from '@mui/material';

interface SplitContentAreaProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftFlex?: number;
  rightFlex?: number;
  height?: string | { xs?: string; sm?: string; md?: string };
  mx?: number;
  mb?: number;
  p?: number;
  gap?: number;
}

export function SplitContentArea({ 
  leftContent, 
  rightContent, 
  leftFlex = 3, 
  rightFlex = 2,
  height = '400px',
  mx = 2,
  mb = 2,
  p = 2,
  gap = 2
}: SplitContentAreaProps) {
  // Handle responsive height
  const getHeight = () => {
    if (typeof height === 'string') {
      return { xs: 'auto', md: height };
    }
    return {
      xs: height.xs || 'auto',
      sm: height.sm || height.xs || 'auto',
      md: height.md || height.sm || height.xs || '400px'
    };
  };

  return (
    <Box sx={{ 
      mx, 
      mb, 
      display: 'flex', 
      gap, 
      height: getHeight(),
      flexDirection: { xs: 'column', md: 'row' },
      // Ensure equal heights on desktop
      '& > .MuiCard-root': {
        height: { xs: 'auto', md: '100%' }
      }
    }}>
      <Card sx={{ 
        flex: { xs: '1', md: leftFlex }, 
        p, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: { xs: '300px', md: 'auto' }
      }}>
        {leftContent}
      </Card>
      <Card sx={{ 
        flex: { xs: '1', md: rightFlex }, 
        p, 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: { xs: '300px', md: 'auto' }
      }}>
        {rightContent}
      </Card>
    </Box>
  );
}