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
} from '@mui/material';
import { Edit, Delete as Trash2 } from '@mui/icons-material';
import { LearningPromptTemplate } from '../../../hooks/admin/useLearningPrompts';

interface LearningPromptsTableProps {
  prompts: LearningPromptTemplate[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onEdit: (prompt: LearningPromptTemplate) => void;
  onDelete: (promptId: number) => void;
}

export function LearningPromptsTable({
  prompts,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onEdit,
  onDelete
}: LearningPromptsTableProps) {
  const paginatedPrompts = prompts.slice(
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
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPrompts.map((prompt) => (
              <TableRow key={prompt.id}>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {prompt.prompt_name}
                  </Typography>
                  {prompt.applicable_memory_types && prompt.applicable_memory_types.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {prompt.applicable_memory_types.map((type) => (
                        <Chip key={type} label={type} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={prompt.prompt_category.replace(/_/g, ' ')} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {prompt.prompt_type.replace(/_/g, ' ')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {prompt.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {prompt.priority}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    v{prompt.version}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={prompt.is_active ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={prompt.is_active ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Edit Prompt">
                      <IconButton 
                        size="small" 
                        onClick={() => onEdit(prompt)}
                        disabled={loading}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Prompt">
                      <IconButton 
                        size="small" 
                        onClick={() => onDelete(prompt.id)}
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
        count={prompts.length}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
}