/**
 * Distributions Tab Component
 * Shows memory type distribution and knowledge funnel analysis
 */

import React from 'react';
import {
  Typography,
  Box,
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartEmptyState, ChartContainer, ResponsiveChart } from '../components';
import type { Analytics } from '../../../types';

interface DistributionsTabProps {
  analytics: Analytics | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#6366F1'];

export const DistributionsTab: React.FC<DistributionsTabProps> = ({ analytics }) => {
  const memoryDistribution = analytics?.memoryDistribution || [];
  const hasMemoryData = memoryDistribution.length > 0;
  const totalMemories = parseInt(analytics?.database.total_memories || '0');

  // Generate knowledge funnel data based on actual memory types and counts
  const generateKnowledgeFunnel = () => {
    if (totalMemories === 0) return [];
    
    // Extract actual counts from memory distribution
    const getMemoryCount = (type: string) => {
      const found = memoryDistribution.find(item => item.name === type);
      return found ? found.value : 0;
    };
    
    const noteCount = getMemoryCount('note');
    const progressCount = getMemoryCount('progress');
    const decisionCount = getMemoryCount('decision');
    const projectBriefCount = getMemoryCount('project_brief');
    
    // Create funnel based on actual data with meaningful progression
    const funnelData = [
      { name: 'Total Knowledge', value: totalMemories, fill: COLORS[0] },
      { name: 'Notes & Content', value: noteCount, fill: COLORS[1] },
      { name: 'Progress Tracked', value: progressCount, fill: COLORS[2] },
      { name: 'Decisions Made', value: decisionCount, fill: COLORS[3] },
      { name: 'Projects Defined', value: projectBriefCount, fill: COLORS[4] },
    ];
    
    // Only return items with values > 0 for cleaner visualization
    return funnelData.filter(item => item.value > 0);
  };

  const knowledgeFunnelData = generateKnowledgeFunnel();

  // Custom label for pie chart
  const renderCustomizedLabel = (entry: any) => {
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 3, 
      flexWrap: 'wrap',
      '& > *': { 
        flex: '1 1 450px',
        minWidth: 0
      }
    }}>
      {/* Memory Type Distribution */}
      <ChartContainer title="Memory Type Distribution" height={450}>
                  {hasMemoryData ? (
          <ResponsiveChart height={450}>
            <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 60 }}>
              <Pie
                data={memoryDistribution}
                cx="50%"
                cy="35%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {memoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveChart>
        ) : (
          <ChartEmptyState 
            icon={<PieChartIcon />}
            title="No memory types to analyze"
            description="Store memories with different types to see distribution patterns"
          />
        )}
      </ChartContainer>

      {/* Knowledge Funnel */}
      <ChartContainer title="Knowledge Funnel" height={450}>
                  {knowledgeFunnelData.length > 0 ? (
          <ResponsiveChart height={450}>
            <BarChart 
              data={knowledgeFunnelData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value">
                {knowledgeFunnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveChart>
        ) : (
          <ChartEmptyState 
            icon={<BarChartIcon />}
            title="No knowledge to analyze"
            description="Store memories to see knowledge funnel analysis"
          />
        )}
      </ChartContainer>
    </Box>
  );
};