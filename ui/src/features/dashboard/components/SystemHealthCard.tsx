/**
 * System Health Card Component
 * Displays system health metrics and status
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  LinearProgress,
  CircularProgress 
} from '@mui/material';
import {
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface SystemHealthCardProps {
  health: {
    database?: string;
    system?: {
      memory?: {
        used?: {
          heapUsed?: number;
          heapTotal?: number;
        };
      };
      uptime?: number;
    };
  };
  loading?: boolean;
}

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'healthy': return 'success';
    case 'degraded': return 'warning';
    case 'error': return 'error';
    default: return 'default';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'healthy': return <CheckCircle />;
    case 'degraded': return <Warning />;
    case 'error': return <ErrorIcon />;
    default: return <Warning />;
  }
};

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ 
  health,
  loading = false 
}) => {
  if (loading) {
    return (
      <Box>
        <CircularProgress size={20} sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Loading system health...
        </Typography>
      </Box>
    );
  }

  const memoryUsed = health.system?.memory?.used?.heapUsed || 0;
  const memoryTotal = health.system?.memory?.used?.heapTotal || 1;
  const memoryUsageMB = Math.round(memoryUsed / 1024 / 1024);
  const memoryUsagePercent = (memoryUsed / memoryTotal) * 100;
  
  const uptimeHours = Math.floor((health.system?.uptime || 0) / 3600);
  const uptimeMinutes = Math.floor(((health.system?.uptime || 0) % 3600) / 60);

  return (
    <Box>
      {/* Database Status */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Database</Typography>
          <Chip
            icon={getStatusIcon(health.database)}
            label={health.database || 'Unknown'}
            color={getStatusColor(health.database) as any}
            size="small"
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={health.database === 'healthy' ? 100 : 0}
          color={getStatusColor(health.database) as any}
        />
      </Box>
      
      {/* Memory Usage */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Memory Usage</Typography>
          <Typography variant="body2">
            {memoryUsageMB}MB
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={memoryUsagePercent}
          color={memoryUsagePercent > 80 ? 'warning' : 'primary'}
        />
      </Box>
      
      {/* Uptime */}
      <Box>
        <Typography variant="body2" color="text.secondary">
          Uptime: {uptimeHours}h {uptimeMinutes}m
        </Typography>
      </Box>
    </Box>
  );
};