import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import {
  Lightbulb,
  BugReport,
  Security,
  Speed,
  Architecture,
  Code,
  Psychology,
  TrendingUp,
  MoreVert,
  AccountTree,
  CheckCircle,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';
import { LearningInsight } from '../../../services/api/learning.api';
import { formatDistanceToNow } from 'date-fns';

interface InsightColumnsProps {
  insights: LearningInsight[];
  onInsightClick: (insight: LearningInsight) => void;
}

interface ColumnConfig {
  title: string;
  icon: React.ReactNode;
  filter: (insight: LearningInsight) => boolean;
  color: string;
  priority?: (insight: LearningInsight) => number;
}

const getInsightIcon = (type: string, category: string) => {
  // Type-based icons take precedence
  if (type) {
    switch (type) {
      case 'bug': return <BugReport />;
      case 'security_issue': return <Security />;
      case 'performance_issue': return <Speed />;
      case 'pattern': return <Architecture />;
      case 'cluster': return <AccountTree />;
      case 'code_smell': return <Code />;
      default: break;
    }
  }
  
  // Fallback to category-based icons
  switch (category) {
    case 'architectural': return <Architecture />;
    case 'security': return <Security />;
    case 'performance': return <Speed />;
    case 'quality': return <Code />;
    case 'debugging': return <BugReport />;
    default: return <Lightbulb />;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.5) return 'warning';
  return 'error';
};

const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 0.8) return <CheckCircle />;
  if (confidence >= 0.5) return <Warning />;
  return <ErrorIcon />;
};

export const InsightColumns: React.FC<InsightColumnsProps> = ({
  insights,
  onInsightClick
}) => {
  const theme = useTheme();

  const columns: ColumnConfig[] = [
    {
      title: 'Critical Insights',
      icon: <ErrorIcon />,
      filter: (i) => 
        i.confidence >= 0.8 && 
        (i.category === 'security' || 
         i.category === 'performance' || 
         i.type === 'bug' ||
         i.type === 'security_issue' ||
         i.recommendations?.some((r: any) => 
           typeof r === 'object' && r.priority === 'high'
         )),
      color: theme.palette.error.main,
      priority: (i) => {
        let score = i.confidence * 100;
        if (i.category === 'security') score += 50;
        if (i.type === 'security_issue') score += 40;
        if (i.source_type === 'cluster') score += 30;
        if (i.recommendations?.length > 0) score += 20;
        return score;
      }
    },
    {
      title: 'Patterns & Clusters',
      icon: <AccountTree />,
      filter: (i) => 
        i.source_type === 'cluster' || 
        i.type === 'pattern' ||
        i.category === 'architectural' ||
        i.patterns?.length > 0,
      color: theme.palette.primary.main,
      priority: (i) => {
        let score = i.confidence * 100;
        if (i.source_type === 'cluster') score += 50;
        score += (i.detailed_content?.cluster_size || 0) * 5;
        score += (i.patterns?.length || 0) * 10;
        return score;
      }
    },
    {
      title: 'Improvements',
      icon: <TrendingUp />,
      filter: (i) => 
        i.recommendations?.length > 0 ||
        i.actionable_advice ||
        i.category === 'quality' ||
        i.type === 'code_smell' ||
        i.category === 'optimization',
      color: theme.palette.success.main,
      priority: (i) => {
        let score = i.confidence * 100;
        score += (i.recommendations?.length || 0) * 20;
        if (i.actionable_advice) score += 30;
        return score;
      }
    }
  ];

  // Categorize insights
  const categorizedInsights = columns.map(column => ({
    ...column,
    insights: insights
      .filter(column.filter)
      .sort((a, b) => {
        const priorityA = column.priority ? column.priority(a) : a.confidence;
        const priorityB = column.priority ? column.priority(b) : b.confidence;
        return priorityB - priorityA;
      })
      .slice(0, 20) // Limit to top 20 per column
  }));

  const InsightCard: React.FC<{ insight: LearningInsight; columnColor: string }> = ({ 
    insight, 
    columnColor 
  }) => {
    const isCluster = insight.source_type === 'cluster';
    const clusterSize = insight.detailed_content?.cluster_size || 0;
    
    return (
      <Card
        sx={{
          mb: 1.5,
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: `1px solid ${alpha(columnColor, 0.2)}`,
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[4],
            borderColor: columnColor
          }
        }}
        onClick={() => onInsightClick(insight)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ 
              p: 1, 
              borderRadius: 1, 
              bgcolor: alpha(columnColor, 0.1),
              color: columnColor,
              mr: 1.5
            }}>
              {getInsightIcon(insight.type || '', insight.category)}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                {insight.title || insight.key_findings?.[0] || 'Insight'}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title={`${(insight.confidence * 100).toFixed(0)}% confidence`}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getConfidenceIcon(insight.confidence)}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {(insight.confidence * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                </Tooltip>
                {isCluster && (
                  <Chip
                    icon={<AccountTree />}
                    label={`${clusterSize} memories`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>
            <Tooltip title="More options">
              <IconButton size="small" sx={{ ml: 1 }}>
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Summary */}
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {typeof insight.insight === 'string' ? insight.insight : JSON.stringify(insight.insight)}
          </Typography>

          {/* Metadata */}
          <Stack spacing={1}>
            {/* Recommendations count */}
            {insight.recommendations && insight.recommendations.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" color="success.main">
                  {insight.recommendations.length} recommendation{insight.recommendations.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            {/* Patterns */}
            {insight.patterns && insight.patterns.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {insight.patterns.slice(0, 3).map((pattern: any, idx: number) => (
                  <Chip
                    key={idx}
                    label={typeof pattern === 'string' ? pattern : pattern.name}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                ))}
                {insight.patterns.length > 3 && (
                  <Chip
                    label={`+${insight.patterns.length - 3}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                )}
              </Box>
            )}

            {/* Footer */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mt: 1
            }}>
              <Typography variant="caption" color="text.secondary">
                {insight.project_name || 'General'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, height: '100%' }}>
      {categorizedInsights.map((column, index) => (
        <Box key={index} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Column Header */}
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: alpha(column.color, 0.05),
            borderRadius: 2,
            border: `1px solid ${alpha(column.color, 0.2)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ color: column.color }}>
                  {column.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {column.title}
                </Typography>
              </Box>
              <Badge badgeContent={column.insights.length} color="primary">
                <Box />
              </Badge>
            </Box>
            {column.insights.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (column.insights.length / 10) * 100)}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: alpha(column.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: column.color
                    }
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Column Content */}
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: 6
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'action.hover'
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'action.disabled',
              borderRadius: 3
            }
          }}>
            {column.insights.length === 0 ? (
              <Card sx={{ 
                p: 3, 
                textAlign: 'center',
                border: `1px dashed ${alpha(column.color, 0.3)}`,
                bgcolor: alpha(column.color, 0.02)
              }}>
                <Typography variant="body2" color="text.secondary">
                  No {column.title.toLowerCase()} found
                </Typography>
              </Card>
            ) : (
              column.insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  columnColor={column.color}
                />
              ))
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};