import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  TrendingUp,
  Memory,
  Psychology,
  Analytics as AnalyticsIcon,
  Refresh,
  AutoAwesome,
  Storage,
  FolderOpen,
  FilterList,
  Analytics,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';
import { AnalyticsAPI, ProjectsAPI, HealthAPI } from '../../../services/api';
import { useApp } from '../../../contexts/AppContext';
import { useWebSocket } from '../../../contexts/WebSocketContext';
import { 
  MemoryGrowthChart, 
  MemoryDistributionChart, 
  SystemHealthCard,
  ProjectsOverview 
} from '../components';
import { 
  transformMemoryDistribution, 
  generateMemoryGrowthData 
} from '../utils/dataTransformers';

// Helper functions
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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary.main',
  loading = false,
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color={color}>
            {loading ? <Skeleton width={80} /> : value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

export const DashboardPage: React.FC = () => {
  const { addNotification } = useApp();
  const { subscribe, isConnected } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [data, setData] = useState<any>({
    health: null,
    projects: [],
    analytics: null,
    error: null,
  });

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // Convert project ID to project name for API call
      let projectName: string | undefined = undefined;
      if (selectedProject !== 'all') {
        const selectedProjectObj = data.projects.find((p: any) => p.id?.toString() === selectedProject);
        projectName = selectedProjectObj?.name;
      }
      
      const [healthRes, projectsRes, analyticsRes] = await Promise.all([
        HealthAPI.getDetailedHealth(),
        ProjectsAPI.list(),
        AnalyticsAPI.getAnalytics({
          timeframe: '30 days',
          project_name: projectName,
        }),
      ]);

      setData({
        health: healthRes.data || null,
        projects: projectsRes.data || [],
        analytics: analyticsRes.data || null,
        error: null,
      });
      
      setLastRefresh(new Date());
    } catch (error) {
      setData(prev => ({ ...prev, error: 'Failed to load dashboard data' }));
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reload data when project filter changes (but only after initial load)
  useEffect(() => {
    if (data.projects.length > 0) {
      fetchDashboardData();
    }
  }, [selectedProject]);

  const handleProjectFilter = (event: SelectChangeEvent) => {
    setSelectedProject(event.target.value);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const getFilteredStats = () => {
    if (selectedProject === 'all') {
      return data.health?.statistics;
    }
    
    // Calculate filtered stats for selected project
    const projectData = data.projects.find((p: any) => p.id?.toString() === selectedProject);
    if (!projectData) return data.health?.statistics;
    
    return {
      database: {
        projects: 1,
        memories: {
          total_memories: projectData.memory_count?.toString() || '0',
          memories_with_embeddings: '0',
          avg_importance: 0.5,
          unique_memory_types: '0'
        },
        thinking: {
          total_sequences: projectData.thinking_sequence_count?.toString() || '0',
          active_sequences: '0',
          total_thoughts: '0'
        }
      },
      thinking: data.health?.statistics.thinking || {
        total_sequences: 0,
        completed_sequences: 0,
        total_thoughts: 0,
        avg_confidence: 0,
        total_branches: 0,
        total_revisions: 0,
        avg_completion_hours: 0,
        completion_rate: 0
      }
    };
  };

  const stats = getFilteredStats();
  const filteredProjects = selectedProject === 'all' 
    ? data.projects 
    : data.projects.filter((p: any) => p.id?.toString() === selectedProject);

  // Transform data for charts
  const memoryGrowthResult = generateMemoryGrowthData(data.analytics);
  const memoryDistributionData = transformMemoryDistribution(data.analytics);

  if (loading && !data.health) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {selectedProject === 'all' 
              ? 'Welcome to your Digital Developer Twin' 
              : `Project: ${data.projects.find((p: any) => p.id?.toString() === selectedProject)?.name || 'Unknown'}`
            }
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="project-filter-label">
              <FilterList sx={{ mr: 1, fontSize: 16 }} />
              Filter by Project
            </InputLabel>
            <Select
              labelId="project-filter-label"
              value={selectedProject}
              label="Filter by Project"
              onChange={handleProjectFilter}
              startAdornment={<FilterList sx={{ mr: 1, fontSize: 16 }} />}
            >
              <MenuItem value="all">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Analytics sx={{ mr: 1, fontSize: 16 }} />
                  All Projects
                </Box>
              </MenuItem>
              {data.projects.map((project: any) => (
                <MenuItem key={project.id} value={project.id.toString()}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FolderOpen sx={{ mr: 1, fontSize: 16 }} />
                    {project.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {data.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {data.error}
        </Alert>
      )}

      {/* System Status Cards */}
      {data.health && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title={selectedProject === 'all' ? 'Total Memories' : 'Project Memories'}
              value={stats?.database?.memories?.total_memories || 0}
              icon={<Storage />}
              color="primary.main"
              loading={loading}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title={selectedProject === 'all' ? 'Thinking Sequences' : 'Project Sequences'}
              value={stats?.database?.thinking?.total_sequences || '0'}
              icon={<Psychology />}
              color="secondary.main"
              loading={loading}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title={selectedProject === 'all' ? 'Active Projects' : 'Selected Project'}
              value={selectedProject === 'all' ? data.projects.length : filteredProjects.length}
              icon={<FolderOpen />}
              color="info.main"
              loading={loading}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Completion Rate"
              value={`${Math.round(stats?.thinking?.completion_rate || 0)}%`}
              icon={<TrendingUp />}
              color="warning.main"
              loading={loading}
            />
          </Grid>
        </Grid>
      )}

      {/* System Health Section */}
      {data.health && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom fontWeight="600">
              System Health
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Overall Status</Typography>
                    <Chip
                      icon={getStatusIcon(data.health.status)}
                      label={data.health.status?.toUpperCase() || 'UNKNOWN'}
                      color={getStatusColor(data.health.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Database</Typography>
                    <Chip
                      label={data.health.services?.database || 'Unknown'}
                      color={getStatusColor(data.health.services?.database) as any}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Embeddings</Typography>
                    <Chip
                      label={data.health.services?.embeddings || 'Unknown'}
                      color={getStatusColor(data.health.services?.embeddings) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Embedding Model
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {data.health.services?.defaultEmbeddingModel || 'Not configured'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {data.health.services?.availableEmbeddingModels || 0} models available
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Memory Types Growth (7 Days)
              </Typography>
              <MemoryGrowthChart 
                data={memoryGrowthResult.data} 
                types={memoryGrowthResult.types}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Memory Types Distribution
              </Typography>
              <MemoryDistributionChart 
                data={memoryDistributionData}
                loading={loading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Overview */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="600">
              {selectedProject === 'all' ? 'Projects Overview' : 'Project Details'}
            </Typography>
            {selectedProject !== 'all' && filteredProjects.length > 0 && (
              <Chip 
                label={`Focused View: ${filteredProjects[0].name}`}
                color="primary"
                variant="outlined"
                size="small"
              />
            )}
          </Box>
          <ProjectsOverview 
            projects={filteredProjects}
            selectedProject={selectedProject}
            loading={loading}
          />
        </CardContent>
      </Card>
    </Box>
  );
};