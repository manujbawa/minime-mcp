/**
 * Token Usage Analytics Tab
 * Shows token consumption metrics and trends
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import {
  DataUsage,
  Memory,
  Label,
  TrendingUp,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AnalyticsAPI } from '../../../services/api/analytics.api';
import type {
  TokenSummary,
  TokenByType,
  TokenMemory,
  TokenTrend,
} from '../../../services/api/analytics.api';

interface TokenUsageTabProps {
  projectName?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export const TokenUsageTab: React.FC<TokenUsageTabProps> = ({ projectName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TokenSummary | null>(null);
  const [byType, setByType] = useState<TokenByType[]>([]);
  const [topMemories, setTopMemories] = useState<TokenMemory[]>([]);
  const [trends, setTrends] = useState<TokenTrend[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<TokenMemory | null>(null);

  useEffect(() => {
    fetchTokenAnalytics();
  }, [projectName]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTokenAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AnalyticsAPI.getTokenAnalytics({
        project_name: projectName || undefined,
        limit: 10,
      });

      if (response.data) {
        setSummary(response.data.summary);
        setByType(response.data.byType);
        setTopMemories(response.data.topMemories);
        setTrends(response.data.trends);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load token analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!summary || summary.total_memories === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <DataUsage sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No token usage data available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Memories will track token usage as they are created
        </Typography>
      </Box>
    );
  }

  const coveragePercentage = ((summary.memories_with_tokens / summary.total_memories) * 100).toFixed(1);

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Tokens
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.total_tokens)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {coveragePercentage}% coverage
                  </Typography>
                </Box>
                <DataUsage sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Content Tokens
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.content_tokens)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((summary.content_tokens / summary.total_tokens) * 100).toFixed(1)}% of total
                  </Typography>
                </Box>
                <Memory sx={{ fontSize: 48, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Summary Tokens
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.summary_tokens)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {((summary.summary_tokens / summary.total_tokens) * 100).toFixed(1)}% of total
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 48, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg per Memory
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(summary.avg_tokens_per_memory)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    tokens/memory
                  </Typography>
                </Box>
                <Label sx={{ fontSize: 48, color: 'secondary.main' }} />
              </Box>
            </CardContent>
          </Card>
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 4 }}>
        {/* Token Distribution by Type */}
        {byType.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Token Distribution by Memory Type
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={byType}
                      dataKey="total_tokens"
                      nameKey="memory_type"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ memory_type, percent }) =>
                        `${memory_type} (${(percent * 100).toFixed(1)}%)`
                      }
                    >
                      {byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        )}

        {/* Token Trends */}
        {trends.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Token Usage Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: number) => formatNumber(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="tokens_added"
                      stroke="#3B82F6"
                      name="Tokens Added"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="memories_created"
                      stroke="#10B981"
                      name="Memories Created"
                      strokeWidth={2}
                      yAxisId="right"
                    />
                    <YAxis yAxisId="right" orientation="right" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        )}
      </Box>

      {/* Type Breakdown Table */}
      {byType.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Token Usage by Type
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Memory Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Total Tokens</TableCell>
                    <TableCell align="right">Avg Tokens</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {byType.map((type) => (
                    <TableRow key={type.memory_type}>
                      <TableCell>
                        <Chip label={type.memory_type} size="small" />
                      </TableCell>
                      <TableCell align="right">{formatNumber(type.count)}</TableCell>
                      <TableCell align="right">{formatNumber(type.total_tokens)}</TableCell>
                      <TableCell align="right">{formatNumber(type.avg_tokens)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Token-Consuming Memories */}
      {topMemories.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Token-Consuming Memories
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Memory</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell align="right">Tokens</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topMemories.map((memory) => (
                    <TableRow key={memory.id} hover>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                          {memory.content_preview}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={memory.memory_type} size="small" />
                      </TableCell>
                      <TableCell>{memory.project_name}</TableCell>
                      <TableCell align="right">
                        <Typography variant="h6">
                          {formatNumber(memory.token_metadata.total_tokens)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => setSelectedMemory(memory)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Memory Details Dialog */}
      <Dialog
        open={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedMemory && (
          <>
            <DialogTitle>Memory Token Details</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Memory ID
                </Typography>
                <Typography gutterBottom>{selectedMemory.id}</Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Type
                </Typography>
                <Chip label={selectedMemory.memory_type} size="small" sx={{ mb: 2 }} />

                <Typography variant="subtitle2" color="text.secondary">
                  Project
                </Typography>
                <Typography gutterBottom>{selectedMemory.project_name}</Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Preview
                </Typography>
                <Typography gutterBottom>{selectedMemory.content_preview}</Typography>

                <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Token Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Content Tokens:</Typography>
                    <Typography fontWeight="medium">
                      {formatNumber(selectedMemory.token_metadata.content_tokens)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Summary Tokens:</Typography>
                    <Typography fontWeight="medium">
                      {formatNumber(selectedMemory.token_metadata.summary_tokens)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Tag Tokens:</Typography>
                    <Typography fontWeight="medium">
                      {formatNumber(selectedMemory.token_metadata.tags_tokens)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      pt: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography fontWeight="bold">Total Tokens:</Typography>
                    <Typography fontWeight="bold">
                      {formatNumber(selectedMemory.token_metadata.total_tokens)}
                    </Typography>
                  </Box>
                </Paper>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3 }}>
                  Calculation Method
                </Typography>
                <Typography gutterBottom>{selectedMemory.token_metadata.calculation_method}</Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Calculated At
                </Typography>
                <Typography>
                  {new Date(selectedMemory.token_metadata.calculated_at).toLocaleString()}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedMemory(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};