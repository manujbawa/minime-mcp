import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Refresh,
  Download,
  PlayArrow,
  Stop,
  Clear,
} from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';
import axios from 'axios';

interface LogsPageProps {}

interface LogEntry {
  timestamp: string;
  content: string;
  type?: string;
}

export const LogsPage: React.FC<LogsPageProps> = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [startupLogs, setStartupLogs] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<string>('');
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(500);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch startup logs
  const fetchStartupLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/logs/startup?lines=${lineCount}`);
      setStartupLogs(response.data.logs);
    } catch (err) {
      setError('Failed to fetch startup logs');
      console.error('Error fetching startup logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recent logs
  const fetchRecentLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/logs/recent?lines=${lineCount}`);
      setRecentLogs(response.data.logs);
    } catch (err) {
      setError('Failed to fetch recent logs');
      console.error('Error fetching recent logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Connect to live logs
  const connectLiveLogs = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/logs/live');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'connected') {
        setIsLiveConnected(true);
      } else if (data.type === 'log') {
        setLiveLogs(prev => [...prev, { timestamp: data.timestamp, content: data.content }]);
        // Auto-scroll to bottom
        setTimeout(() => {
          logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    eventSource.onerror = () => {
      setIsLiveConnected(false);
      setError('Live connection lost');
    };
  };

  // Disconnect live logs
  const disconnectLiveLogs = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsLiveConnected(false);
  };

  // Clear live logs
  const clearLiveLogs = () => {
    setLiveLogs([]);
  };

  // Download logs
  const downloadLogs = () => {
    let content = '';
    let filename = '';

    switch (activeTab) {
      case 0:
        content = startupLogs;
        filename = 'startup-logs.txt';
        break;
      case 1:
        content = recentLogs;
        filename = 'recent-logs.txt';
        break;
      case 2:
        content = liveLogs.map(log => `[${log.timestamp}] ${log.content}`).join('\n');
        filename = 'live-logs.txt';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Load logs on mount and tab change
  useEffect(() => {
    if (activeTab === 0) {
      fetchStartupLogs();
    } else if (activeTab === 1) {
      fetchRecentLogs();
    }
  }, [activeTab, lineCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectLiveLogs();
    };
  }, []);

  const renderLogContent = (content: string) => (
    <Box
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        p: 2,
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        borderRadius: 1,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 350px)',
        minHeight: '400px',
      }}
    >
      {content || 'No logs available'}
    </Box>
  );

  const renderLiveLogs = () => (
    <Box
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        p: 2,
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        borderRadius: 1,
        overflow: 'auto',
        maxHeight: 'calc(100vh - 350px)',
        minHeight: '400px',
      }}
    >
      {liveLogs.length === 0 ? (
        <Typography color="text.secondary">
          {isLiveConnected ? 'Waiting for logs...' : 'Click "Start" to begin streaming logs'}
        </Typography>
      ) : (
        <>
          {liveLogs.map((log, index) => (
            <Box key={index} sx={{ mb: 0.5 }}>
              <span style={{ color: '#569cd6' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
              <span>{log.content}</span>
            </Box>
          ))}
          <div ref={logsEndRef} />
        </>
      )}
    </Box>
  );

  return (
    <PageLayout
      title="Container Logs"
      subtitle="View startup and runtime logs"
      actions={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {activeTab !== 2 && (
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Lines</InputLabel>
              <Select
                value={lineCount}
                onChange={(e) => setLineCount(e.target.value as number)}
                label="Lines"
              >
                <MenuItem value={100}>100</MenuItem>
                <MenuItem value={500}>500</MenuItem>
                <MenuItem value={1000}>1000</MenuItem>
                <MenuItem value={5000}>5000</MenuItem>
              </Select>
            </FormControl>
          )}
          {activeTab === 2 && (
            <>
              <IconButton onClick={clearLiveLogs} disabled={liveLogs.length === 0}>
                <Clear />
              </IconButton>
              {isLiveConnected ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={disconnectLiveLogs}
                >
                  Stop
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={connectLiveLogs}
                >
                  Start
                </Button>
              )}
            </>
          )}
          {activeTab !== 2 && (
            <IconButton 
              onClick={activeTab === 0 ? fetchStartupLogs : fetchRecentLogs}
              disabled={loading}
            >
              <Refresh />
            </IconButton>
          )}
          <IconButton onClick={downloadLogs}>
            <Download />
          </IconButton>
        </Box>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Startup Logs" />
          <Tab label="Recent Logs" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Live Logs
                {isLiveConnected && (
                  <Chip
                    size="small"
                    label="Connected"
                    color="success"
                    sx={{ height: 20 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {activeTab === 0 && renderLogContent(startupLogs)}
              {activeTab === 1 && renderLogContent(recentLogs)}
              {activeTab === 2 && renderLiveLogs()}
            </>
          )}
        </Box>
      </Paper>
    </PageLayout>
  );
};