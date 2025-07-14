import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Grid
} from '@mui/material';
import {
  Lightbulb,
  AutoAwesome,
  Refresh,
  BugReport,
  Security,
  Speed,
  Architecture,
  Close,
  CheckCircle,
  Computer,
  Folder,
  Psychology,
  EmojiObjects,
  Dashboard,
  ViewColumn,
  BubbleChart
} from '@mui/icons-material';
import { LearningAPI, InsightFilters } from '../../../services/api/learning.api';
import { ProjectsAPI } from '../../../services/api/projects.api';
import { formatDistanceToNow } from 'date-fns';
import { InsightSearchBar } from '../components/InsightSearchBar';
import { InsightColumns } from '../components/InsightColumns';
import { ClusterVisualization } from '../components/ClusterVisualization';
import { debounce } from 'lodash';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`insights-tabpanel-${index}`}
      aria-labelledby={`insights-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'bug':
      return <BugReport />;
    case 'security_issue':
      return <Security />;
    case 'performance_issue':
      return <Speed />;
    case 'pattern':
      return <Architecture />;
    default:
      return <Lightbulb />;
  }
};

const getInsightColor = (category: string) => {
  switch (category) {
    case 'architectural':
      return 'primary';
    case 'security':
      return 'error';
    case 'performance':
      return 'warning';
    case 'quality':
      return 'info';
    default:
      return 'default';
  }
};

export const InsightsV2Page: React.FC = () => {
  const [tabValue] = useState(0); // Only one tab now
  const [viewMode, setViewMode] = useState<'cards' | 'columns' | 'cluster'>('columns');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [filters, setFilters] = useState<InsightFilters>({
    search: '',
    min_confidence: 0.3,
    limit: 100
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const loadInsights = useCallback(
    debounce(async (currentFilters: InsightFilters) => {
      try {
        setLoading(true);
        setError(null);

        const insightsData = await LearningAPI.getInsights(currentFilters);
        setInsights(insightsData.data || []);
      } catch (err) {
        console.error('Failed to load insights:', err);
        setError('Failed to load insights. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [
        projectsData,
        insightsData,
        categoriesData
      ] = await Promise.all([
        ProjectsAPI.list(),
        LearningAPI.getInsights(filters),
        LearningAPI.getCategories()
      ]);

      setProjects(projectsData.data || []);
      setInsights(insightsData.data || []);
      setCategories(categoriesData.data?.map((c: any) => c.category) || []);
      setTypes([...new Set(insightsData.data?.map((i: any) => i.type).filter(Boolean) || [])]);
    } catch (err) {
      console.error('Failed to load insights data:', err);
      setError('Failed to load insights data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadInsights(filters);
  }, [filters, loadInsights]);


  const handleInsightClick = (insight: any) => {
    setSelectedInsight(insight);
    setDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setSelectedInsight(null);
  };


  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome /> Insights & Meta-Learning
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadData}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Advanced Search Bar */}
      <InsightSearchBar
        onFiltersChange={handleFiltersChange}
        projects={projects}
        categories={categories}
        types={types}
      />

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
          {/* Removed tabs since we only have AI Insights now */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Lightbulb sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" color="primary">
              AI Insights
            </Typography>
          </Box>
          
          <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="cards" aria-label="card view">
                <Dashboard />
              </ToggleButton>
              <ToggleButton value="columns" aria-label="column view">
                <ViewColumn />
              </ToggleButton>
              <ToggleButton value="cluster" aria-label="cluster view">
                <BubbleChart />
              </ToggleButton>
            </ToggleButtonGroup>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {insights.length === 0 ? (
            <Alert severity="info">No insights found matching your filters.</Alert>
          ) : viewMode === 'columns' ? (
            <InsightColumns
              insights={insights}
              onInsightClick={handleInsightClick}
            />
          ) : viewMode === 'cluster' ? (
            <ClusterVisualization
              insights={insights}
              onClusterClick={handleInsightClick}
            />
          ) : (
            <Grid container spacing={2}>
              {insights.map((insight) => (
                <Grid key={insight.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}>
                    <CardActionArea 
                      onClick={() => handleInsightClick(insight)}
                      sx={{ height: '100%', display: 'flex', alignItems: 'flex-start' }}
                    >
                      <CardContent sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getInsightIcon(insight.type)}
                            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
                              {typeof insight.title === 'string' ? insight.title : 
                               (Array.isArray(insight.key_findings) && insight.key_findings[0]) || 
                               insight.category || 'Insight'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={insight.category || 'general'}
                              color={getInsightColor(insight.category)}
                              size="small"
                            />
                            <Chip
                              label={`${(insight.confidence * 100).toFixed(0)}% confidence`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 2, flexGrow: 1 }} color="text.secondary">
                          {typeof insight.insight === 'string' 
                            ? `${insight.insight.substring(0, 150)}${insight.insight.length > 150 ? '...' : ''}`
                            : JSON.stringify(insight.insight).substring(0, 150) + '...'}
                        </Typography>
                        
                        {/* Project and metadata section */}
                        <Box sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Chip
                              icon={<Folder />}
                              label={insight.project_name || 'General'}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {insight.technologies?.length > 0 && (
                              <Stack direction="row" spacing={0.5}>
                                <Computer fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {insight.technologies
                                    .slice(0, 3)
                                    .filter((tech: any) => {
                                      const techName = typeof tech === 'string' ? tech : tech.name;
                                      return techName && techName !== 'Unknown';
                                    })
                                    .map((tech: any) => typeof tech === 'string' ? tech : tech.name)
                                    .join(', ')}
                                  {insight.technologies.length > 3 && ` +${insight.technologies.length - 3}`}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                        
                        {/* Key metrics */}
                        {(insight.evidence?.length > 0 || insight.patterns?.length > 0 || insight.recommendations?.length > 0) && (
                          <Grid container spacing={1} sx={{ mb: 2 }}>
                            {insight.evidence?.length > 0 && (
                              <Grid size={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="body1" color="primary" fontWeight="bold">
                                    {insight.evidence.length}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Evidence
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            {insight.patterns?.length > 0 && (
                              <Grid size={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="body1" color="secondary" fontWeight="bold">
                                    {insight.patterns.length}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Patterns
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            {insight.recommendations?.length > 0 && (
                              <Grid size={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="body1" color="success.main" fontWeight="bold">
                                    {insight.recommendations.length}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Actions
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        )}
                        
                        {insight.actionable_advice && (
                          <Alert severity="success" sx={{ mb: 2, py: 0.5 }} icon={<EmojiObjects />}>
                            <Typography variant="caption">
                              {insight.actionable_advice.substring(0, 80)}...
                            </Typography>
                          </Alert>
                        )}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(insight.created_at))} ago
                          </Typography>
                          {insight.tags && insight.tags.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {insight.tags.slice(0, 3).map((tag: string, index: number) => (
                                <Chip key={index} label={tag} size="small" variant="outlined" />
                              ))}
                              {insight.tags.length > 3 && (
                                <Chip label={`+${insight.tags.length - 3}`} size="small" variant="outlined" />
                              )}
                            </Box>
                          )}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { minHeight: '70vh' } }
        }}
      >
        {selectedInsight && (
          <>
            <DialogTitle sx={{ m: 0, p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getInsightIcon(selectedInsight.type)}
                <Typography variant="h6">
                  {typeof selectedInsight.title === 'string' ? selectedInsight.title : 
                   (Array.isArray(selectedInsight.key_findings) && selectedInsight.key_findings[0]) || 
                   'Insight Details'}
                </Typography>
              </Box>
              <IconButton
                aria-label="close"
                onClick={handleCloseDialog}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
              {/* Metadata */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Chip
                    icon={<Folder />}
                    label={selectedInsight.project_name || 'General'}
                    color="primary"
                  />
                  <Chip
                    label={selectedInsight.category || 'general'}
                    color={getInsightColor(selectedInsight.category)}
                  />
                  <Chip
                    label={`${(selectedInsight.confidence * 100).toFixed(0)}% confidence`}
                    variant="outlined"
                  />
                  <Chip
                    label={formatDistanceToNow(new Date(selectedInsight.created_at)) + ' ago'}
                    variant="outlined"
                  />
                </Stack>
              </Box>

              {/* Main Insight */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Insight
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body1">
                    {typeof selectedInsight.insight === 'string' 
                      ? selectedInsight.insight 
                      : JSON.stringify(selectedInsight.insight, null, 2)}
                  </Typography>
                </Paper>
              </Box>

              {/* Key Findings */}
              {selectedInsight.key_findings?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Key Findings
                  </Typography>
                  <List>
                    {selectedInsight.key_findings.map((finding: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={finding} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Evidence */}
              {selectedInsight.evidence?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Evidence ({selectedInsight.evidence.length})
                  </Typography>
                  <Stack spacing={1}>
                    {selectedInsight.evidence.map((item: any, index: number) => (
                      <Paper key={index} sx={{ p: 2 }} variant="outlined">
                        <Typography variant="body2">
                          {typeof item === 'string' ? item : 
                           (item.description || item.content || JSON.stringify(item))}
                        </Typography>
                        {item.confidence && (
                          <Typography variant="caption" color="text.secondary">
                            Confidence: {(item.confidence * 100).toFixed(0)}%
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Patterns */}
              {selectedInsight.patterns?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <Architecture sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Patterns Detected
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedInsight.patterns.map((pattern: any, index: number) => (
                      <Chip
                        key={index}
                        label={typeof pattern === 'string' ? pattern : 
                               (pattern.pattern || pattern.name || 'Pattern')}
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Technologies */}
              {selectedInsight.technologies?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <Computer sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Technologies
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedInsight.technologies
                      .filter((tech: any) => {
                        const techName = typeof tech === 'string' ? tech : tech.name;
                        return techName && techName !== 'Unknown';
                      })
                      .map((tech: any, index: number) => (
                        <Chip
                          key={index}
                          label={typeof tech === 'string' ? tech : tech.name}
                          size="small"
                          color="info"
                        />
                      ))}
                  </Stack>
                </Box>
              )}

              {/* Recommendations */}
              {selectedInsight.recommendations?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="success.main">
                    <EmojiObjects sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recommendations
                  </Typography>
                  <Stack spacing={2}>
                    {selectedInsight.recommendations.map((rec: any, index: number) => (
                      <Alert key={index} severity="success" icon={<CheckCircle />}>
                        <Typography variant="body2">
                          <strong>
                            {typeof rec === 'string' ? rec : 
                             (rec.action || rec.description || rec.recommendation || 'Recommendation')}
                          </strong>
                          {rec.priority && ` (Priority: ${rec.priority})`}
                        </Typography>
                      </Alert>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Actionable Advice */}
              {selectedInsight.actionable_advice && (
                <Box sx={{ mb: 3 }}>
                  <Alert severity="info" icon={<EmojiObjects />}>
                    <Typography variant="body1">
                      <strong>Actionable Advice:</strong> {selectedInsight.actionable_advice}
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* Tags */}
              {selectedInsight.tags?.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {selectedInsight.tags.map((tag: string, index: number) => (
                      <Chip key={index} label={tag} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}
            </DialogContent>
            <Divider />
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

    </Box>
  );
};