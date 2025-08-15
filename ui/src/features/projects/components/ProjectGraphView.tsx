/**
 * Project Graph View Component
 * Interactive D3 force-directed graph visualization of project relationships
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  ButtonGroup,
  Button,
  Chip,
  Card,
  CardContent,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import type { ProjectLink } from '../../../types';

interface GraphNode {
  id: string;
  name: string;
  group: string;
  isMain?: boolean;
  memory_count?: number;
  link_count?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  visibility: string;
}

interface ProjectGraphViewProps {
  projectId: number;
  projectName: string;
  links: ProjectLink[];
  onNodeClick?: (projectName: string) => void;
}

export const ProjectGraphView: React.FC<ProjectGraphViewProps> = ({
  projectId,
  projectName,
  links,
  onNodeClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || links.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Prepare data
    const nodes: GraphNode[] = [
      {
        id: projectId.toString(),
        name: projectName,
        group: 'main',
        isMain: true,
        memory_count: 0, // Could be passed as prop
        link_count: links.length
      }
    ];

    const graphLinks: GraphLink[] = [];

    // Add linked projects as nodes
    links.forEach(link => {
      if (!nodes.find(n => n.id === link.target_project_id.toString())) {
        nodes.push({
          id: link.target_project_id.toString(),
          name: link.target_project_name,
          group: link.link_type,
          memory_count: link.target_project?.memory_count,
          link_count: link.target_project?.link_count
        });
      }
      graphLinks.push({
        source: projectId.toString(),
        target: link.target_project_id.toString(),
        type: link.link_type,
        visibility: link.visibility
      });
    });

    // Set dimensions
    const width = containerRef.current.clientWidth;
    const height = 500;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create container for zoom
    const g = svg.append('g');

    // Define zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Define color scale for link types
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['related', 'parent', 'child', 'dependency', 'fork', 'template'])
      .range([
        theme.palette.info.main,
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.warning.main,
        theme.palette.success.main,
        theme.palette.error.main
      ]);

    // Create force simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphLinks)
        .id(d => d.id)
        .distance(d => {
          // Vary distance based on link type
          switch (d.type) {
            case 'parent':
            case 'child':
              return 100;
            case 'dependency':
              return 120;
            default:
              return 150;
          }
        }))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create arrow markers for directed edges
    const defs = svg.append('defs');
    
    ['parent', 'child', 'dependency', 'related', 'fork', 'template'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', colorScale(type))
        .attr('d', 'M0,-5L10,0L0,5');
    });

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphLinks)
      .enter().append('line')
      .attr('stroke', d => colorScale(d.type))
      .attr('stroke-opacity', d => d.visibility === 'none' ? 0.3 : 0.6)
      .attr('stroke-width', d => d.visibility === 'full' ? 3 : 2)
      .attr('stroke-dasharray', d => d.visibility === 'metadata_only' ? '5,5' : '0')
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Create link labels
    const linkLabel = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(graphLinks)
      .enter().append('text')
      .attr('font-size', 10)
      .attr('fill', theme.palette.text.secondary)
      .text(d => d.type);

    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add circles for nodes
    node.append('circle')
      .attr('r', d => d.isMain ? 30 : 20)
      .attr('fill', d => d.isMain ? theme.palette.primary.main : colorScale(d.group))
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 3)
      .on('click', (event, d) => {
        setSelectedNode(d.id);
        if (onNodeClick && !d.isMain) {
          onNodeClick(d.name);
        }
      });

    // Add labels
    node.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', d => d.isMain ? 14 : 12)
      .attr('font-weight', d => d.isMain ? 'bold' : 'normal')
      .attr('fill', theme.palette.background.paper)
      .text(d => d.name);

    // Add tooltips
    node.append('title')
      .text(d => `${d.name}\n${d.memory_count || 0} memories\n${d.link_count || 0} links`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as any).x)
        .attr('y1', d => (d.source as any).y)
        .attr('x2', d => (d.target as any).x)
        .attr('y2', d => (d.target as any).y);

      linkLabel
        .attr('x', d => ((d.source as any).x + (d.target as any).x) / 2)
        .attr('y', d => ((d.source as any).y + (d.target as any).y) / 2);

      node.attr('transform', d => `translate(${(d as any).x},${(d as any).y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Center and fit view
    const centerView = () => {
      const bounds = g.node()?.getBBox();
      if (!bounds) return;

      const fullWidth = width;
      const fullHeight = height;
      const widthScale = fullWidth / bounds.width;
      const heightScale = fullHeight / bounds.height;
      const scale = Math.min(widthScale, heightScale) * 0.9;
      
      const tx = (fullWidth - bounds.width * scale) / 2 - bounds.x * scale;
      const ty = (fullHeight - bounds.height * scale) / 2 - bounds.y * scale;

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    };

    // Center view after layout stabilizes
    setTimeout(centerView, 1000);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [links, projectId, projectName, theme, onNodeClick]);

  const handleZoomIn = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      1.3
    );
  };

  const handleZoomOut = () => {
    const svg = d3.select(svgRef.current);
    svg.transition().call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      0.7
    );
  };

  const handleCenter = () => {
    const svg = d3.select(svgRef.current);
    const g = svg.select('g');
    const bounds = g.node()?.getBBox();
    if (!bounds || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 500;
    const widthScale = width / bounds.width;
    const heightScale = height / bounds.height;
    const scale = Math.min(widthScale, heightScale) * 0.9;
    
    const tx = (width - bounds.width * scale) / 2 - bounds.x * scale;
    const ty = (height - bounds.height * scale) / 2 - bounds.y * scale;

    svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity.translate(tx, ty).scale(scale)
      );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Box>
      <Paper
        ref={containerRef}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.default',
          minHeight: 500,
          ...(isFullscreen && {
            height: '100vh',
            width: '100vw',
          })
        }}
      >
        {/* Controls */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1,
            display: 'flex',
            gap: 1,
          }}
        >
          <ButtonGroup size="small" variant="contained">
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn} size="small">
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut} size="small">
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Center View">
              <IconButton onClick={handleCenter} size="small">
                <CenterIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton onClick={toggleFullscreen} size="small">
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Box>

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            zIndex: 1,
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            maxWidth: '300px',
          }}
        >
          <Typography variant="caption" sx={{ width: '100%', mb: 0.5 }}>
            Link Types:
          </Typography>
          {['related', 'parent', 'child', 'dependency', 'fork', 'template'].map(type => (
            <Chip
              key={type}
              label={type}
              size="small"
              sx={{
                bgcolor: type === 'related' ? theme.palette.info.main :
                         type === 'parent' ? theme.palette.primary.main :
                         type === 'child' ? theme.palette.secondary.main :
                         type === 'dependency' ? theme.palette.warning.main :
                         type === 'fork' ? theme.palette.success.main :
                         theme.palette.error.main,
                color: 'white',
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          ))}
        </Box>

        {/* SVG Container */}
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      </Paper>

      {/* Instructions */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            <strong>Interactive Graph:</strong> Drag nodes to reposition • Click nodes to view details • 
            Use mouse wheel to zoom • Double-click to center
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};