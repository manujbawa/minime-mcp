import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Stack,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Timeline,
  Speed,
  Psychology,
  AccountTree,
  Lightbulb,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { InsightMetrics, ClusterMetrics } from '../../../services/api/learning.api';
import { formatDistanceToNow } from 'date-fns';

interface InsightMetricsProps {
  metrics: InsightMetrics | null;
  clusterMetrics: ClusterMetrics | null;
  loading?: boolean;
}

export const InsightMetricsDashboard: React.FC<InsightMetricsProps> = ({
  metrics,
  clusterMetrics,
  loading = false
}) => {
  const theme = useTheme();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No metrics data available
        </Typography>
      </Box>
    );
  }

  // Prepare data for charts
  const categoryData = Object.entries(metrics.by_category || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const typeData = Object.entries(metrics.by_type || {}).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value
  }));

  const confidenceData = [
    { name: 'High (>80%)', value: metrics.by_confidence?.high || 0, color: theme.palette.success.main },
    { name: 'Medium (50-80%)', value: metrics.by_confidence?.medium || 0, color: theme.palette.warning.main },
    { name: 'Low (<50%)', value: metrics.by_confidence?.low || 0, color: theme.palette.error.main }
  ];

  const sourceData = [
    { name: 'Individual', value: metrics.by_source?.memory || 0 },
    { name: 'Clusters', value: metrics.by_source?.cluster || 0 }
  ];

  const trendData = metrics.trend || [];

  // Calculate key metrics
  const totalInsights = Object.values(metrics.by_category || {}).reduce((sum, val) => sum + val, 0);
  const avgConfidence = totalInsights > 0 
    ? ((metrics.by_confidence?.high || 0) * 0.9 + 
       (metrics.by_confidence?.medium || 0) * 0.65 + 
       (metrics.by_confidence?.low || 0) * 0.25) / totalInsights
    : 0;

  const trendDirection = trendData.length >= 2 
    ? trendData[trendData.length - 1].count - trendData[trendData.length - 2].count
    : 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Insights
                  </Typography>
                  <Typography variant="h4">
                    {totalInsights}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {trendDirection > 0 ? (
                      <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                    ) : trendDirection < 0 ? (
                      <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                    ) : null}
                    <Typography variant="caption" color={trendDirection > 0 ? 'success.main' : 'error.main'}>
                      {trendDirection > 0 ? '+' : ''}{trendDirection} from yesterday
                    </Typography>
                  </Box>
                </Box>
                <Lightbulb sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Avg Confidence
                  </Typography>
                  <Typography variant="h4">
                    {(avgConfidence * 100).toFixed(0)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={avgConfidence * 100}
                    sx={{
                      mt: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: avgConfidence > 0.8 ? 'success.main' : avgConfidence > 0.5 ? 'warning.main' : 'error.main'
                      }
                    }}
                  />
                </Box>
                <Psychology sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Clusters
                  </Typography>
                  <Typography variant="h4">
                    {clusterMetrics?.total_clusters || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg size: {clusterMetrics?.avg_cluster_size?.toFixed(1) || 0}
                  </Typography>
                </Box>
                <AccountTree sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Categories Covered
                  </Typography>
                  <Typography variant="h4">
                    {Object.keys(metrics.by_category || {}).length}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                    {Object.keys(metrics.by_category || {}).slice(0, 3).map(cat => (
                      <Chip
                        key={cat}
                        label={cat}
                        size="small"
                        sx={{ height: 20 }}
                      />
                    ))}
                  </Stack>
                </Box>
                <Speed sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insights by Category
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill={theme.palette.primary.main} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Confidence Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={confidenceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {confidenceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Timeline /> Insight Generation Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={theme.palette.primary.main}
                    fill={alpha(theme.palette.primary.main, 0.2)}
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avg_confidence" 
                    stroke={theme.palette.secondary.main}
                    fill={alpha(theme.palette.secondary.main, 0.2)}
                    strokeWidth={2}
                    yAxisId="right"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Common Patterns */}
        {clusterMetrics?.common_patterns && clusterMetrics.common_patterns.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Common Patterns Detected
                </Typography>
                <Stack spacing={2}>
                  {clusterMetrics.common_patterns.map((pattern, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{pattern.pattern}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(pattern.frequency / 10) * 100}
                          sx={{
                            mt: 0.5,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(theme.palette.primary.main, 0.1)
                          }}
                        />
                      </Box>
                      <Stack alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Frequency
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {pattern.frequency}
                        </Typography>
                      </Stack>
                      <Stack alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Confidence
                        </Typography>
                        <Chip
                          label={`${(pattern.confidence * 100).toFixed(0)}%`}
                          size="small"
                          color={pattern.confidence > 0.8 ? 'success' : pattern.confidence > 0.5 ? 'warning' : 'error'}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};