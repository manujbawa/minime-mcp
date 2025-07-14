/**
 * Memory Results Component
 * Displays search results or memory list with appropriate states
 */

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Storage as Database,
  LocalOffer as Tag,
  AccessTime as Clock,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { Memory } from '../../../types';

interface MemoryResultsProps {
  memories: Memory[];
  loading: boolean;
  searchQuery: string;
  selectedProject: string;
}

// Memory type color mapping
const getMemoryTypeColor = (type: string): 'primary' | 'secondary' | 'info' | 'error' | 'default' => {
  const colorMap: Record<string, 'primary' | 'secondary' | 'info' | 'error' | 'default'> = {
    code: 'primary',
    decision: 'secondary',
    rule: 'info',
    note: 'default',
    progress: 'secondary',
    project_brief: 'primary',
  };
  return colorMap[type] || 'default';
};

// Importance score color mapping
const getImportanceColor = (importance?: number): string => {
  if (!importance) return 'text.disabled';
  if (importance >= 8) return 'error.main';
  if (importance >= 6) return 'warning.main';
  if (importance >= 4) return 'info.main';
  return 'success.main';
};

// Processing status color mapping
const getProcessingStatusColor = (status?: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
  const statusMap: Record<string, 'success' | 'warning' | 'info' | 'error' | 'default'> = {
    ready: 'success',
    processing: 'info',
    pending: 'warning',
    failed: 'error',
    failed_permanent: 'error',
  };
  return statusMap[status || ''] || 'default';
};

// Processing status display text
const getProcessingStatusText = (status?: string): string => {
  const statusText: Record<string, string> = {
    ready: 'Ready',
    processing: 'Processing',
    pending: 'Pending',
    failed: 'Failed',
    failed_permanent: 'Failed',
  };
  return statusText[status || ''] || 'Unknown';
};

export const MemoryResults: React.FC<MemoryResultsProps> = ({
  memories,
  loading,
  searchQuery,
  selectedProject,
}) => {
  return (
    <Card>
      <CardContent>
        {/* Results Header */}
        <Typography variant="h6" gutterBottom fontWeight={600}>
          {searchQuery ? `Search Results for "${searchQuery}"` : 'Recent Memories'}
          {selectedProject === '__ALL__' ? ' (All Projects)' : selectedProject ? ` (${selectedProject})` : ''}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {memories.length} memories found{selectedProject === '__ALL__' ? ' across all projects' : ''}
        </Typography>

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">Loading memories...</Typography>
          </Box>
        ) : memories.length === 0 ? (
          /* Empty State */
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <Database sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">
              {searchQuery ? 'No memories found for your search.' : 'No memories in this project yet.'}
            </Typography>
          </Box>
        ) : (
          /* Memory List */
          <Box sx={{ mt: 2 }}>
            {memories.map((memory, index) => (
              <Box key={memory.id}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                <Box 
                  sx={{ 
                    py: 2, 
                    '&:hover': { bgcolor: 'action.hover' }, 
                    borderRadius: 1, 
                    px: 1,
                    transition: 'background-color 0.2s'
                  }}
                >
                  {/* Memory Metadata */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                    {/* Memory Type */}
                    <Chip
                      label={memory.memory_type}
                      color={getMemoryTypeColor(memory.memory_type)}
                      size="small"
                      variant="outlined"
                    />
                    
                    {/* Project Name (for cross-project search) */}
                    {selectedProject === '__ALL__' && (memory as any).project_name && (
                      <Chip
                        label={(memory as any).project_name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                    
                    {/* Importance Score */}
                    {(memory.importance || memory.importance_score) && (
                      <Chip
                        label={`Importance: ${memory.importance || memory.importance_score}/10`}
                        size="small"
                        sx={{ color: getImportanceColor(memory.importance || memory.importance_score) }}
                        variant="outlined"
                      />
                    )}
                    
                    {/* Processing Status */}
                    {memory.processing_status && (
                      <Chip
                        label={getProcessingStatusText(memory.processing_status)}
                        size="small"
                        color={getProcessingStatusColor(memory.processing_status)}
                        variant="outlined"
                      />
                    )}
                    
                    {/* Smart Tags as Chips */}
                    {memory.smart_tags && memory.smart_tags.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                        {memory.smart_tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            variant="filled"
                            color="info"
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem',
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  {/* Summary */}
                  {memory.summary && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: 2, 
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        bgcolor: 'action.hover',
                        p: 1.5,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <strong>Summary:</strong> {memory.summary}
                    </Typography>
                  )}
                  
                  {/* Memory Content */}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      mb: 2, 
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {memory.content}
                  </Typography>
                  
                  {/* Memory Footer */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {/* Created Date */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Clock sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(memory.created_at), 'MMM d, yyyy at h:mm a')}
                      </Typography>
                    </Box>
                    
                    {/* Similarity Score (for search results) */}
                    {memory.similarity && (
                      <Typography variant="caption" color="text.secondary">
                        Similarity: {Math.round(memory.similarity * 100)}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};