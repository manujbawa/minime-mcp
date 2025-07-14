/**
 * MCP Status Overview Component
 * Displays MCP server status, capabilities, and quick stats
 */

import React from 'react';
import {
  Paper,
  Typography,
  Stack,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import {
  Build,
  Info,
  CheckCircle,
} from '@mui/icons-material';
import type { MCPStatus } from '../../../types';

interface MCPStatusOverviewProps {
  status: MCPStatus;
  toolsByCategory: Record<string, any[]>;
}

export const MCPStatusOverview: React.FC<MCPStatusOverviewProps> = ({
  status,
  toolsByCategory,
}) => {
  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 4 }}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
        gap: 3 
      }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
            MCP Server Status
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle sx={{ color: 'success.main', mr: 1, fontSize: 20 }} />
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {status.message}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              Version: {status.version}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              Transport: {status.transport.type}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              Endpoint: {status.transport.endpoint}
            </Typography>
          </Stack>
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
            Quick Stats
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>{status.capabilities.tools.count}</strong> tools available
            </Typography>
            <Typography variant="body2">
              <strong>{Object.keys(toolsByCategory).length}</strong> categories
            </Typography>
            <Typography variant="body2">
              <strong>{status.transport.features.length}</strong> transport features
            </Typography>
          </Stack>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="subtitle2" gutterBottom>Transport Features</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {status.transport.features.map((feature: string) => (
            <Chip key={feature} label={feature} size="small" variant="outlined" />
          ))}
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Services Status</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(status.services).map(([service, serviceStatus]) => (
            <Chip 
              key={service} 
              label={`${service}: ${serviceStatus}`} 
              size="small" 
              color={serviceStatus === 'active' || serviceStatus === 'available' ? 'success' : 'default'}
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
}; 