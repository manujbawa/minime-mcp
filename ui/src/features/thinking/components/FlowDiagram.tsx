/**
 * Flow Diagram Component
 * Visualizes thought sequences as an interactive flow
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Thought, thoughtTypeConfig } from '../types';

interface FlowDiagramProps {
  thoughts: Thought[];
  width?: number;
  height?: number;
  onThoughtClick?: (thought: Thought) => void;
}

export const FlowDiagram: React.FC<FlowDiagramProps> = ({ 
  thoughts, 
  width = 800, 
  height = 600,
  onThoughtClick 
}) => {
  if (!thoughts || thoughts.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height, 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}>
        <Typography color="text.secondary">No thoughts to visualize</Typography>
      </Box>
    );
  }

  const sortedThoughts = [...thoughts].sort((a, b) => a.thought_number - b.thought_number);
  const nodeWidth = 200;
  const nodeHeight = 80;
  const horizontalSpacing = 250;
  const verticalSpacing = 120;
  const nodesPerRow = 3;
  
  const svgWidth = Math.max(width, nodesPerRow * horizontalSpacing);
  const svgHeight = Math.max(height, Math.ceil(sortedThoughts.length / nodesPerRow) * verticalSpacing + 100);

  return (
    <Box sx={{ 
      width: '100%', 
      height, 
      overflow: 'auto', 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      bgcolor: 'background.default',
      p: 1
    }}>
      <svg width={svgWidth} height={svgHeight}>
        {/* Arrow marker definition */}
        <defs>
          <marker 
            id="arrowhead" 
            markerWidth="10" 
            markerHeight="7" 
            refX="9" 
            refY="3.5" 
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
          </marker>
        </defs>
        
        {/* Draw connections */}
        {sortedThoughts.map((thought, index) => {
          if (index === 0) return null;
          
          const currentRow = Math.floor(index / nodesPerRow);
          const currentCol = index % nodesPerRow;
          const currentX = currentCol * horizontalSpacing + nodeWidth / 2 + 50;
          const currentY = currentRow * verticalSpacing + nodeHeight / 2 + 50;
          
          const prevRow = Math.floor((index - 1) / nodesPerRow);
          const prevCol = (index - 1) % nodesPerRow;
          const prevX = prevCol * horizontalSpacing + nodeWidth / 2 + 50;
          const prevY = prevRow * verticalSpacing + nodeHeight / 2 + 50;
          
          return (
            <g key={`edge-${thought.id}`}>
              <line
                x1={prevX}
                y1={prevY + nodeHeight / 2}
                x2={currentX}
                y2={currentY - nodeHeight / 2}
                stroke="#666"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                opacity={0.6}
              />
            </g>
          );
        })}
        
        {/* Draw nodes */}
        {sortedThoughts.map((thought, index) => {
          const row = Math.floor(index / nodesPerRow);
          const col = index % nodesPerRow;
          const x = col * horizontalSpacing + 50;
          const y = row * verticalSpacing + 50;
          const config = thoughtTypeConfig[thought.thought_type] || thoughtTypeConfig.default;
          
          return (
            <g 
              key={thought.id}
              style={{ cursor: onThoughtClick ? 'pointer' : 'default' }}
              onClick={() => onThoughtClick?.(thought)}
            >
              {/* Node shadow */}
              <rect
                x={x + 2}
                y={y + 2}
                width={nodeWidth}
                height={nodeHeight}
                rx="8"
                fill="#000"
                opacity={0.1}
              />
              
              {/* Node background */}
              <rect
                x={x}
                y={y}
                width={nodeWidth}
                height={nodeHeight}
                rx="8"
                fill={config.color}
                stroke="#fff"
                strokeWidth="2"
              />
              
              {/* Node content */}
              <foreignObject x={x + 10} y={y + 10} width={nodeWidth - 20} height={nodeHeight - 20}>
                <Box sx={{ 
                  color: 'white', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <span style={{ marginRight: '4px', fontSize: '14px' }}>{config.icon}</span>
                    <span>#{thought.thought_number}</span>
                  </Box>
                  <Box sx={{ 
                    fontSize: '10px', 
                    opacity: 0.9, 
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {thought.content}
                  </Box>
                </Box>
              </foreignObject>
              
              {/* Confidence indicator */}
              {thought.confidence_level && (
                <>
                  <circle
                    cx={x + nodeWidth - 15}
                    cy={y + 15}
                    r="10"
                    fill="#fff"
                    stroke="none"
                  />
                  <circle
                    cx={x + nodeWidth - 15}
                    cy={y + 15}
                    r="8"
                    fill={
                      thought.confidence_level > 0.7 ? '#4CAF50' : 
                      thought.confidence_level > 0.4 ? '#FF9800' : '#F44336'
                    }
                    stroke="none"
                  />
                  <text
                    x={x + nodeWidth - 15}
                    y={y + 19}
                    fontSize="10"
                    fill="white"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {Math.round(thought.confidence_level * 100)}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
};