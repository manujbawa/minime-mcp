/**
 * KPI Cards Component
 * Displays key performance indicators with progress bars and icons
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Speed,
  Timeline,
  Insights,
  Assessment,
} from '@mui/icons-material';

interface KPIMetrics {
  productivityScore: number;
  learningVelocity: number;
  knowledgeDepth: number;
  systemHealth: number;
}

interface KPICardsProps {
  metrics: KPIMetrics;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {/* Productivity Score */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ width: '100%', height: '100%', minHeight: 140 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {metrics.productivityScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Productivity Score
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, metrics.productivityScore)}
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Speed />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Learning Velocity */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ width: '100%', height: '100%', minHeight: 140 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="secondary.main">
                  {metrics.learningVelocity}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Learning Velocity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  memories/sequence
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <Timeline />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Knowledge Depth */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ width: '100%', height: '100%', minHeight: 140 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {metrics.knowledgeDepth}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Knowledge Depth
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.knowledgeDepth}
                  color="info"
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <Insights />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* System Health */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ width: '100%', height: '100%', minHeight: 140 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {metrics.systemHealth}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  System Health
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.systemHealth}
                  color="success"
                  sx={{ mt: 1, height: 4, borderRadius: 2 }}
                />
              </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <Assessment />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};