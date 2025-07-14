/**
 * Memory Distribution Chart Component
 * Displays memory types distribution in a bar chart with summary chips
 */

import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Storage } from '@mui/icons-material';
import { getMemoryTypeIcon } from '../utils/memoryTypeIcons';

interface MemoryTypeData {
  name: string;
  value: number;
  percentage: number;
  icon?: React.ReactElement;
}

interface MemoryDistributionChartProps {
  data: MemoryTypeData[];
  loading?: boolean;
}

export const MemoryDistributionChart: React.FC<MemoryDistributionChartProps> = ({ 
  data,
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
        <Storage sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="body1" gutterBottom>
          No memories stored yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Store memories with different types to see distribution analysis
        </Typography>
      </Box>
    );
  }

  // Prepare data for bar chart (top 8 types)
  const chartData = data.slice(0, 8).map(item => ({
    name: item.name,
    value: Number(item.value) || 0,
    percentage: item.percentage
  }));

  return (
    <Box sx={{ 
      height: 500,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Bar chart */}
      <Box sx={{ height: 280, mb: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 10 }}
            />
            <YAxis 
              domain={[0, 'dataMax']}
              tickFormatter={(value) => Math.round(value).toString()}
            />
            <Tooltip 
              formatter={(value: any, name: any) => {
                const item = data.find(d => d.value === value);
                const percentage = item?.percentage || 0;
                return [`${value} memories (${percentage}%)`, 'Count'];
              }}
            />
            <Bar 
              dataKey="value" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              minPointSize={1}
            />
          </BarChart>
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
        {data.map((item, index) => (
          <Chip
            key={item.name}
            icon={item.icon || getMemoryTypeIcon(item.name)}
            label={`${item.name}: ${item.value} (${item.percentage}%)`}
            size="small"
            variant={index < 8 ? "filled" : "outlined"}
            color={index < 8 ? "primary" : "default"}
            sx={{ 
              fontSize: '0.75rem',
              '& .MuiChip-icon': {
                fontSize: '0.875rem'
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};