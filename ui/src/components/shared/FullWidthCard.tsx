import React from 'react';
import { Card, Typography } from '@mui/material';

interface FullWidthCardProps {
  title?: string;
  children: React.ReactNode;
  height?: string | { xs?: string; sm?: string; md?: string };
  mx?: number;
  mb?: number;
  p?: number;
}

export function FullWidthCard({ 
  title, 
  children, 
  height,
  mx = 2,
  mb = 2,
  p = 2
}: FullWidthCardProps) {
  return (
    <Card sx={{ 
      mx, 
      mb, 
      p, 
      height, 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {title && (
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          {title}
        </Typography>
      )}
      {children}
    </Card>
  );
}