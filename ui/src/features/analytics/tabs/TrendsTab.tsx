/**
 * Trends Tab Component
 * Shows knowledge evolution over time and growth metrics
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp,
  Psychology as Brain,
  Storage as Database,
  Timeline,
} from '@mui/icons-material';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChartEmptyState, ChartContainer, ResponsiveChart } from '../components';
import type { Analytics } from '../../../types';

interface TrendsTabProps {
  analytics: Analytics | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const TrendsTab: React.FC<TrendsTabProps> = ({ analytics }) => {
  const totalMemories = parseInt(analytics?.database.memories?.total_memories || '0');
  const totalSequences = parseInt(analytics?.database.thinking?.total_sequences || '0');
  const totalProjects = analytics?.database.projects || 0;
  const hasData = totalMemories > 0 || totalSequences > 0;

  // Use only real time series data from analytics
  const timeSeriesData = analytics?.timeSeries || [];

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 3, 
      flexWrap: 'wrap',
      '& > *:first-of-type': { 
        flex: '2 1 600px' // Chart takes more space
      },
      '& > *:last-of-type': { 
        flex: '1 1 300px' // Metrics take less space
      }
    }}>
      {/* Knowledge Evolution Chart */}
      <ChartContainer title="Knowledge Evolution Over Time" height={400}>
        {timeSeriesData.length > 0 ? (
          <ResponsiveChart height={400}>
            <ComposedChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="memories" 
                stackId="1" 
                stroke={COLORS[0]} 
                fill={COLORS[0]} 
                fillOpacity={0.6} 
              />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="sequences" 
                stackId="1" 
                stroke={COLORS[1]} 
                fill={COLORS[1]} 
                fillOpacity={0.6} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="confidence" 
                stroke={COLORS[2]} 
                strokeWidth={3} 
              />
            </ComposedChart>
          </ResponsiveChart>
        ) : (
          <ChartEmptyState 
            icon={<Timeline />}
            title="No historical data yet"
            description="Start storing memories and creating thinking sequences to see knowledge evolution over time"
          />
        )}
      </ChartContainer>

      {/* Growth Metrics */}
      <Card sx={{ flex: '1 1 300px' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Growth Metrics
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <TrendingUp sx={{ color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="Memory Growth Rate"
                secondary={totalMemories > 0 ? `${totalMemories} total memories` : "No memories yet"}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Brain sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="Thinking Complexity"
                secondary={totalSequences > 0 
                  ? `${totalSequences} thinking sequences` 
                  : "No sequences yet"
                }
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Database sx={{ color: 'info.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="Knowledge Density"
                secondary={totalProjects > 0 
                  ? `${Math.round(totalMemories / totalProjects)} memories/project`
                  : "No projects yet"
                }
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};