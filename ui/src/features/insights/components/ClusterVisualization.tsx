import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  BubbleChart,
  Timeline,
  AccountTree,
  ZoomIn,
  ZoomOut,
  CenterFocusStrong,
  Fullscreen
} from '@mui/icons-material';
import * as d3 from 'd3';
import { LearningInsight } from '../../../services/api/learning.api';

interface ClusterVisualizationProps {
  insights: LearningInsight[];
  onClusterClick?: (cluster: LearningInsight) => void;
}

export const ClusterVisualization: React.FC<ClusterVisualizationProps> = ({
  insights,
  onClusterClick
}) => {
  const theme = useTheme();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filter for cluster insights
  const clusterInsights = insights.filter(i => i.source_type === 'cluster');
  const memoryInsights = insights.filter(i => i.source_type !== 'cluster');

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width - 40, height: height - 40 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || clusterInsights.length === 0) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height);

    // Create zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom as any);

    const g = svg.append('g');

    // Prepare data for visualization
    const nodes = clusterInsights.map(cluster => ({
      id: cluster.id,
      label: cluster.title || 'Cluster',
      size: cluster.detailed_content?.cluster_size || 3,
      confidence: cluster.confidence,
      category: cluster.category,
      type: cluster.detailed_content?.memory_type || 'unknown',
      timeSpan: cluster.detailed_content?.time_span?.days || 1,
      data: cluster
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(d => Math.sqrt(d.size) * 20))
      .force('x', d3.forceX(dimensions.width / 2).strength(0.1))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.1));

    // Create color scale based on category
    const colorScale = d3.scaleOrdinal()
      .domain(['architectural', 'performance', 'security', 'quality', 'pattern', 'general'])
      .range([
        theme.palette.primary.main,
        theme.palette.warning.main,
        theme.palette.error.main,
        theme.palette.info.main,
        theme.palette.secondary.main,
        theme.palette.grey[500]
      ]);

    // Create size scale
    const sizeScale = d3.scaleSqrt()
      .domain([3, d3.max(nodes, d => d.size) || 20])
      .range([20, 80]);

    // Create node groups
    const nodeGroups = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedCluster(d.id);
        if (onClusterClick) {
          onClusterClick(d.data);
        }
      })
      .on('mouseenter', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.size) * 1.1)
          .style('filter', 'brightness(1.2)');
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', sizeScale(d.size))
          .style('filter', 'none');
      });

    // Add circles
    nodeGroups.append('circle')
      .attr('r', d => sizeScale(d.size))
      .style('fill', d => colorScale(d.category) as string)
      .style('opacity', d => 0.3 + (d.confidence * 0.7))
      .style('stroke', d => d.id === selectedCluster ? theme.palette.primary.dark : 'white')
      .style('stroke-width', d => d.id === selectedCluster ? 4 : 2);

    // Add labels
    nodeGroups.append('text')
      .text(d => d.label.length > 20 ? d.label.substring(0, 20) + '...' : d.label)
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', theme.palette.text.primary)
      .style('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('pointer-events', 'none');

    // Add size indicator
    nodeGroups.append('text')
      .text(d => d.size)
      .style('font-size', '10px')
      .style('fill', theme.palette.text.secondary)
      .style('text-anchor', 'middle')
      .attr('dy', '1.5em')
      .style('pointer-events', 'none');

    // Add confidence ring
    nodeGroups.append('circle')
      .attr('r', d => sizeScale(d.size) + 5)
      .style('fill', 'none')
      .style('stroke', d => colorScale(d.category) as string)
      .style('stroke-width', d => d.confidence * 3)
      .style('stroke-dasharray', d => {
        const radius = sizeScale(d.size) + 5;
        const circumference = 2 * Math.PI * radius;
        const dashLength = circumference * d.confidence;
        return `${dashLength} ${circumference - dashLength}`;
      })
      .style('opacity', 0.8);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      nodeGroups.attr('transform', d => `translate(${d.x}, ${d.y})`);
    });

    // Add zoom controls
    const resetZoom = () => {
      svg.transition()
        .duration(750)
        .call(zoom.transform as any, d3.zoomIdentity);
    };

    return () => {
      simulation.stop();
    };
  }, [clusterInsights, dimensions, theme, selectedCluster, onClusterClick]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom().scaleBy as any, 1.3);
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom().scaleBy as any, 0.7);
  };

  const handleResetZoom = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(d3.zoom().transform as any, d3.zoomIdentity);
  };

  // Calculate cluster metrics
  const totalClusters = clusterInsights.length;
  const totalMemoriesInClusters = clusterInsights.reduce(
    (sum, c) => sum + (c.detailed_content?.cluster_size || 0), 
    0
  );
  const avgClusterSize = totalClusters > 0 ? totalMemoriesInClusters / totalClusters : 0;
  const largestCluster = clusterInsights.reduce(
    (max, c) => (c.detailed_content?.cluster_size || 0) > (max.detailed_content?.cluster_size || 0) ? c : max,
    clusterInsights[0] || {}
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with metrics */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BubbleChart /> Cluster Analysis
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Chip
            icon={<AccountTree />}
            label={`${totalClusters} clusters`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`${totalMemoriesInClusters} memories clustered`}
            variant="outlined"
          />
          <Chip
            label={`Avg size: ${avgClusterSize.toFixed(1)}`}
            variant="outlined"
          />
          {largestCluster.id && (
            <Chip
              label={`Largest: ${largestCluster.detailed_content?.cluster_size || 0} memories`}
              variant="outlined"
              onClick={() => {
                setSelectedCluster(largestCluster.id);
                if (onClusterClick) onClusterClick(largestCluster);
              }}
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Stack>
      </Box>

      {/* Visualization */}
      <Paper 
        ref={containerRef}
        sx={{ 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden',
          bgcolor: 'background.default'
        }}
      >
        {clusterInsights.length === 0 ? (
          <Box 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <Typography variant="body1" color="text.secondary">
              No clusters found. Clusters form when 3+ similar memories are detected.
            </Typography>
          </Box>
        ) : (
          <>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
            
            {/* Zoom controls */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 2,
                p: 0.5
              }}
            >
              <Tooltip title="Zoom In">
                <IconButton size="small" onClick={handleZoomIn}>
                  <ZoomIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reset Zoom">
                <IconButton size="small" onClick={handleResetZoom}>
                  <CenterFocusStrong />
                </IconButton>
              </Tooltip>
              <Tooltip title="Zoom Out">
                <IconButton size="small" onClick={handleZoomOut}>
                  <ZoomOut />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Legend */}
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
                p: 2,
                maxWidth: 200
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Legend
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: theme.palette.primary.main,
                      opacity: 0.7
                    }}
                  />
                  <Typography variant="caption">Architectural</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: theme.palette.warning.main,
                      opacity: 0.7
                    }}
                  />
                  <Typography variant="caption">Performance</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: theme.palette.error.main,
                      opacity: 0.7
                    }}
                  />
                  <Typography variant="caption">Security</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Size = cluster size<br />
                  Opacity = confidence<br />
                  Ring = confidence level
                </Typography>
              </Stack>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};