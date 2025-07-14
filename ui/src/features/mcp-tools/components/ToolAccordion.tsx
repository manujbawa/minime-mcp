/**
 * Tool Accordion Component
 * Displays individual MCP tool with expandable details
 */

import React from 'react';
import {
  Box,
  Card,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  ContentCopy,
} from '@mui/icons-material';
import type { MCPTool } from '../../../types';

interface ToolAccordionProps {
  tool: MCPTool;
  expanded: boolean;
  onChange: (event: React.SyntheticEvent, isExpanded: boolean) => void;
  onCopyToClipboard: (text: string) => void;
}

const formatPropertyType = (prop: any): string => {
  if (prop.type === 'array' && prop.items) {
    return `${prop.type}[${prop.items.type || 'any'}]`;
  }
  if (prop.enum) {
    return `enum: ${prop.enum.join(' | ')}`;
  }
  return prop.type || 'any';
};

const generateUsageExample = (tool: MCPTool): string => {
  const requiredParams = tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0
    ? Object.entries(tool.inputSchema.properties)
        .filter(([name]) => tool.inputSchema?.required?.includes(name))
        .map(([name, def]: [string, any]) => {
          const exampleValue = def.type === 'string' ? '"example"' 
            : def.type === 'number' ? '0' 
            : def.type === 'boolean' ? 'true' 
            : '{}';
          return `"${name}": ${exampleValue}`;
        })
        .join(',\n      ')
    : '';

  return `// MCP Tool Call
{
  "method": "tools/call",
  "params": {
    "name": "${tool.name}",
    "arguments": {${requiredParams ? `
      // Add required parameters here
      ${requiredParams}` : ''}
    }
  }
}`;
};

export const ToolAccordion: React.FC<ToolAccordionProps> = ({
  tool,
  expanded,
  onChange,
  onCopyToClipboard,
}) => {
  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      <Accordion 
        expanded={expanded} 
        onChange={onChange}
        sx={{ 
          border: '1px solid', 
          borderColor: 'divider',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ width: '100%', minWidth: 0 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              width: '100%',
              gap: 1
            }}>
              <Typography 
                variant="h6" 
                fontFamily="monospace"
                sx={{ 
                  wordBreak: 'break-word',
                  flexShrink: 1,
                  minWidth: 0
                }}
              >
                {tool.name}
              </Typography>
              <Tooltip title="Copy tool name">
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyToClipboard(tool.name);
                  }}
                  sx={{ flexShrink: 0 }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                wordBreak: 'break-word'
              }}
            >
              {tool.description}
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
            <Typography variant="subtitle1" gutterBottom>
              Input Schema
            </Typography>
            
            {tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0 ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Parameters:</Typography>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    lg: 'repeat(3, 1fr)'
                  },
                  gap: 2,
                  width: '100%',
                  maxWidth: '100%'
                }}>
                  {Object.entries(tool.inputSchema.properties).map(([propName, propDef]: [string, any]) => (
                    <Card 
                      key={propName}
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        height: 'fit-content',
                        minWidth: 0,
                        maxWidth: '100%',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        justifyContent: 'space-between', 
                        mb: 1,
                        flexWrap: 'wrap',
                        gap: 1
                      }}>
                        <Typography 
                          variant="subtitle2" 
                          fontFamily="monospace"
                          sx={{ 
                            wordBreak: 'break-word',
                            flexShrink: 1,
                            minWidth: 0
                          }}
                        >
                          {propName}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          flexWrap: 'wrap',
                          flexShrink: 0
                        }}>
                          {tool.inputSchema?.required?.includes(propName) && (
                            <Chip label="required" size="small" color="error" />
                          )}
                          <Chip 
                            label={formatPropertyType(propDef)} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      {propDef.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ wordBreak: 'break-word' }}
                        >
                          {propDef.description}
                        </Typography>
                      )}
                      {propDef.default !== undefined && (
                        <Typography 
                          variant="caption" 
                          display="block" 
                          sx={{ mt: 1, wordBreak: 'break-word' }}
                        >
                          Default: {JSON.stringify(propDef.default)}
                        </Typography>
                      )}
                      {propDef.minimum !== undefined && (
                        <Typography variant="caption" display="block">
                          Minimum: {propDef.minimum}
                        </Typography>
                      )}
                      {propDef.maximum !== undefined && (
                        <Typography variant="caption" display="block">
                          Maximum: {propDef.maximum}
                        </Typography>
                      )}
                    </Card>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No parameters required
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
              <Typography variant="subtitle2" gutterBottom>Usage Example:</Typography>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: 'grey.50',
                maxWidth: '100%',
                overflow: 'auto',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <Typography 
                  component="pre"
                  variant="body2" 
                  fontFamily="monospace" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    margin: 0,
                    overflow: 'hidden',
                    maxWidth: '100%'
                  }}
                >
                  {generateUsageExample(tool)}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}; 