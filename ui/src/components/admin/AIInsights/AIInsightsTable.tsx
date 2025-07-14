import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import { Edit, Delete as Trash2, Star, Public } from '@mui/icons-material';
import { AIInsightTemplate } from '../../../hooks/admin/useAIInsights';

interface AIInsightsTableProps {
  templates: AIInsightTemplate[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (template: AIInsightTemplate) => void;
  onDelete: (templateId: number) => void;
}

const categoryColors: Record<string, any> = {
  'bugs': 'error',
  'architecture': 'primary',
  'build': 'secondary',
  'rules': 'warning',
  'performance': 'success',
  'process': 'info',
  'technology': 'default',
  'team': 'primary'
};

export function AIInsightsTable({
  templates,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete
}: AIInsightsTableProps) {
  const paginatedTemplates = templates.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Usage</TableCell>
              <TableCell align="center">Rating</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {template.name}
                    </Typography>
                    {template.tags && template.tags.length > 0 && (
                      <Box sx={{ mt: 0.5 }}>
                        {template.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={template.category.charAt(0).toUpperCase() + template.category.slice(1)} 
                    size="small" 
                    color={categoryColors[template.category] || 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      maxWidth: 300, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}
                  >
                    {template.description}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {template.usage_count} times
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {template.avg_rating ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Star fontSize="small" sx={{ color: 'warning.main' }} />
                      <Typography variant="body2">
                        {template.avg_rating.toFixed(1)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No ratings
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Chip 
                      label={template.is_active ? 'Active' : 'Inactive'} 
                      size="small" 
                      color={template.is_active ? 'success' : 'default'}
                    />
                    {template.is_public && (
                      <Tooltip title="Available to all projects">
                        <Badge>
                          <Public fontSize="small" color="primary" />
                        </Badge>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit template">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(template)}
                        disabled={loading}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete template">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(template.id)}
                        disabled={loading}
                        color="error"
                      >
                        <Trash2 fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={templates.length}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
}