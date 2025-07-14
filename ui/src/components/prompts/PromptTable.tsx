import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
  TablePagination
} from '@mui/material';
import { Edit, Delete, ContentCopy } from '@mui/icons-material';
import { LearningPrompt, AIPromptTemplate } from '../../services/api';

interface PromptTableProps {
  type: 'learning' | 'ai';
  prompts: LearningPrompt[] | AIPromptTemplate[];
  onEdit: (prompt: LearningPrompt | AIPromptTemplate) => void;
  onDelete: (id: number) => void;
  onCopy?: (prompt: LearningPrompt | AIPromptTemplate) => void;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalCount?: number;
}

export const PromptTable: React.FC<PromptTableProps> = ({
  type,
  prompts,
  onEdit,
  onDelete,
  onCopy,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  totalCount
}) => {
  const renderPromptRow = (prompt: LearningPrompt | AIPromptTemplate) => {
    if (type === 'learning') {
      const learningPrompt = prompt as LearningPrompt;
      return (
        <TableRow key={learningPrompt.id} hover>
          <TableCell>{learningPrompt.prompt_name}</TableCell>
          <TableCell>
            <Chip 
              label={learningPrompt.prompt_category} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
              {learningPrompt.prompt_template}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip
              label={learningPrompt.is_active ? 'Active' : 'Inactive'}
              size="small"
              color={learningPrompt.is_active ? 'success' : 'default'}
            />
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              {onCopy && (
                <Tooltip title="Copy prompt">
                  <IconButton size="small" onClick={() => onCopy(learningPrompt)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Edit prompt">
                <IconButton size="small" onClick={() => onEdit(learningPrompt)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete prompt">
                <IconButton 
                  size="small" 
                  onClick={() => onDelete(learningPrompt.id)}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </TableCell>
        </TableRow>
      );
    } else {
      const aiTemplate = prompt as AIPromptTemplate;
      return (
        <TableRow key={aiTemplate.id} hover>
          <TableCell>{aiTemplate.name}</TableCell>
          <TableCell>
            <Chip 
              label={aiTemplate.category} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
              {aiTemplate.template}
            </Typography>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {aiTemplate.tags?.slice(0, 3).map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
              {aiTemplate.tags && aiTemplate.tags.length > 3 && (
                <Chip label={`+${aiTemplate.tags.length - 3}`} size="small" variant="outlined" />
              )}
            </Box>
          </TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Chip
                label={aiTemplate.is_active ? 'Active' : 'Inactive'}
                size="small"
                color={aiTemplate.is_active ? 'success' : 'default'}
              />
              {aiTemplate.is_public && (
                <Chip label="Public" size="small" color="info" />
              )}
            </Box>
          </TableCell>
          <TableCell align="center">
            {aiTemplate.usage_count || 0}
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              {onCopy && (
                <Tooltip title="Copy template">
                  <IconButton size="small" onClick={() => onCopy(aiTemplate)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Edit template">
                <IconButton size="small" onClick={() => onEdit(aiTemplate)}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete template">
                <IconButton 
                  size="small" 
                  onClick={() => onDelete(aiTemplate.id)}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </TableCell>
        </TableRow>
      );
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Template</TableCell>
            {type === 'ai' && <TableCell>Tags</TableCell>}
            <TableCell>Status</TableCell>
            {type === 'ai' && <TableCell align="center">Usage</TableCell>}
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {prompts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={type === 'ai' ? 7 : 5} align="center">
                <Typography variant="body2" color="text.secondary">
                  No {type === 'learning' ? 'learning prompts' : 'AI templates'} found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            prompts.map(renderPromptRow)
          )}
        </TableBody>
      </Table>
      
      {onPageChange && onRowsPerPageChange && (
        <TablePagination
          component="div"
          count={totalCount || prompts.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={onPageChange}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </TableContainer>
  );
};