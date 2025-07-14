/**
 * Intelligence Tab Component
 * Shows thinking quality radar and intelligence insights
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Grid,
} from '@mui/material';
import {
  Psychology as Brain,
} from '@mui/icons-material';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartEmptyState, ChartContainer, ResponsiveChart } from '../components';
import type { Analytics } from '../../../types';

interface IntelligenceTabProps {
  analytics: Analytics | null;
}

const COLORS = ['#3B82F6', '#10B981'];

export const IntelligenceTab: React.FC<IntelligenceTabProps> = ({ analytics }) => {
  const totalSequences = parseInt(analytics?.database.thinking?.total_sequences || '0');
  const hasThinkingData = totalSequences > 0;

  // Generate thinking quality data from available metrics
  const generateThinkingRadarData = () => {
    if (!hasThinkingData) return [];

    // Calculate metrics based on available data
    const avgConfidence = (analytics?.thinking?.avg_confidence || 0.7) * 100;
    const completionRate = analytics?.thinking?.completion_rate || 75;
    const branchingLogic = Math.min(100, (analytics?.thinking?.total_branches || 0) * 10);
    const revisionQuality = Math.min(100, (analytics?.thinking?.total_revisions || 0) * 8);
    const sequenceLength = Math.min(100, 
      ((analytics?.thinking?.total_thoughts || 0) / Math.max(1, totalSequences)) * 10
    );

    return [
      { 
        subject: 'Analysis Depth', 
        current: avgConfidence,
        target: 85,
        fullMark: 100 
      },
      { 
        subject: 'Completion Rate', 
        current: completionRate,
        target: 90,
        fullMark: 100 
      },
      { 
        subject: 'Branching Logic', 
        current: branchingLogic,
        target: 70,
        fullMark: 100 
      },
      { 
        subject: 'Revision Quality', 
        current: revisionQuality,
        target: 75,
        fullMark: 100 
      },
      { 
        subject: 'Sequence Length', 
        current: sequenceLength,
        target: 80,
        fullMark: 100 
      },
    ];
  };

  const thinkingRadarData = generateThinkingRadarData();

  // Intelligence metrics from API data
  const avgConfidenceValue = Math.round((analytics?.thinking?.avg_confidence || 0.7) * 100);
  const totalBranches = analytics?.thinking?.total_branches || 0;
  const totalRevisions = analytics?.thinking?.total_revisions || 0;
  const completionRateValue = Math.round(analytics?.thinking?.completion_rate || 75);

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 3, 
      flexWrap: 'wrap',
      '& > *': { 
        flex: '1 1 500px',
        minWidth: 0
      }
    }}>
      {/* Thinking Quality Radar */}
      <ChartContainer title="Thinking Quality Radar" height={400}>
        {thinkingRadarData.length > 0 ? (
          <ResponsiveChart height={400}>
            <RadarChart data={thinkingRadarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Current"
                dataKey="current"
                stroke={COLORS[0]}
                fill={COLORS[0]}
                fillOpacity={0.6}
              />
              <Radar
                name="Target"
                dataKey="target"
                stroke={COLORS[1]}
                fill={COLORS[1]}
                fillOpacity={0.3}
                strokeDasharray="5 5"
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveChart>
        ) : (
          <ChartEmptyState 
            icon={<Brain />}
            title="No thinking data to analyze"
            description="Create thinking sequences to see quality analysis"
          />
        )}
      </ChartContainer>

      {/* Intelligence Insights */}
      <Card sx={{ flex: '1 1 500px' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Intelligence Insights
          </Typography>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                  <Typography variant="h4" color="primary.main">
                    {avgConfidenceValue}%
                  </Typography>
                  <Typography variant="caption">
                    Avg Confidence
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                  <Typography variant="h4" color="success.main">
                    {totalBranches}
                  </Typography>
                  <Typography variant="caption">
                    Branch Points
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Typography variant="h4" color="warning.main">
                    {totalRevisions}
                  </Typography>
                  <Typography variant="caption">
                    Revisions Made
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                  <Typography variant="h4" color="info.main">
                    {completionRateValue}%
                  </Typography>
                  <Typography variant="caption">
                    Completion Rate
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};