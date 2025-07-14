import React from 'react';
import { Card, Box } from '@mui/material';

interface FlexFormRowProps {
  children: React.ReactNode;
  gap?: number;
  minItemWidth?: string;
  mx?: number;
  mb?: number;
  p?: number;
}

export function FlexFormRow({ 
  children, 
  gap = 2, 
  minItemWidth = '250px',
  mx = 2,
  mb = 2,
  p = 2
}: FlexFormRowProps) {
  return (
    <Card sx={{ mx, mb, p }}>
      <Box sx={{ 
        display: 'flex', 
        gap, 
        flexWrap: 'wrap',
        flexDirection: { xs: 'column', sm: 'row' },
        '& > *': { 
          flex: { 
            xs: '1 1 100%',
            sm: `1 1 ${minItemWidth}`
          },
          minWidth: { 
            xs: 'auto',
            sm: minItemWidth
          },
          maxWidth: { 
            xs: '100%',
            sm: 'none'
          }
        }
      }}>
        {children}
      </Box>
    </Card>
  );
}