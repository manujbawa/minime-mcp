/**
 * Memory Growth Chart Component
 * Displays memory types growth over time
 */

import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp } from '@mui/icons-material';
import { getMemoryTypeIcon } from '../utils/memoryTypeIcons';

interface MemoryType {
  name: string;
  value: number;
  originalName?: string;
}

interface MemoryGrowthChartProps {
  data: any[];
  types: MemoryType[];
  loading?: boolean;
}

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const MemoryGrowthChart: React.FC<MemoryGrowthChartProps> = ({ 
  data, 
  types,
  loading = false 
}) => {
  if (loading || !data || data.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 500,
        color: 'text.secondary'
      }}>
        <TrendingUp sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="body1" gutterBottom>
          No memory types data available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Store memories with different types to see growth trends over time
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 500,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Line chart */}
      <Box sx={{ height: 280, mb: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => Math.round(value).toString()}
            />
            <Tooltip 
              formatter={(value: any, name: any) => [`${value} memories`, name]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            {types.map((type, index) => {
              // Use consistent colors for task completion status
              let strokeColor = CHART_COLORS[index % CHART_COLORS.length];
              if (type.name === 'Tasks (Completed)') {
                strokeColor = '#10B981'; // Green for completed
              } else if (type.name === 'Tasks (Pending)') {
                strokeColor = '#F59E0B'; // Orange for pending
              }
              
              return (
                <Line 
                  key={type.name}
                  type="monotone" 
                  dataKey={type.name} 
                  stroke={strokeColor} 
                  strokeWidth={2} 
                  name={type.name}
                  dot={{ fill: strokeColor, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </Box>
      
      {/* Spacer to push legend down */}
      <Box sx={{ flex: 1 }} />
      
      {/* Summary chips for all memory types */}
      <Box sx={{ 
        flex: '0 0 auto',
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1, 
        p: 2,
        mt: 2,
        bgcolor: 'grey.50',
        borderRadius: 1,
        maxHeight: 120,
        overflow: 'visible'
      }}>
        {types.map((type, index) => {
          // Use consistent colors for task completion status
          let chipColor = CHART_COLORS[index % CHART_COLORS.length];
          if (type.name === 'Tasks (Completed)') {
            chipColor = '#10B981'; // Green for completed
          } else if (type.name === 'Tasks (Pending)') {
            chipColor = '#F59E0B'; // Orange for pending
          }
          
          return (
            <Chip
              key={type.name}
              icon={getMemoryTypeIcon(type.originalName || type.name)}
              label={`${type.name}: ${type.value} total`}
              size="small"
              variant="filled"
              sx={{ 
                fontSize: '0.75rem',
                bgcolor: chipColor,
                color: 'white',
                '& .MuiChip-icon': {
                  fontSize: '0.875rem',
                  color: 'white'
                }
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
};