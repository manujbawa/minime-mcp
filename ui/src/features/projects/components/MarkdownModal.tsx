/**
 * Markdown Modal Component
 * Displays markdown content in a modal dialog
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

interface MarkdownModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export const MarkdownModal: React.FC<MarkdownModalProps> = ({ 
  open, 
  onClose, 
  title, 
  content, 
  metadata 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {metadata && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {metadata.created_at && (
              <Chip 
                label={`Created: ${new Date(metadata.created_at).toLocaleDateString()}`} 
                size="small" 
                variant="outlined" 
              />
            )}
            {metadata.memory_type && (
              <Chip 
                label={`Type: ${metadata.memory_type}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            )}
            {metadata.importance_score !== undefined && (
              <Chip 
                label={`Importance: ${Math.round(metadata.importance_score * 100)}%`} 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            )}
            {metadata.version && (
              <Chip 
                label={`Version: ${metadata.version}`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            )}
            {metadata.completion_percentage !== undefined && (
              <Chip 
                label={`Progress: ${metadata.completion_percentage}%`} 
                size="small" 
                color="success" 
                variant="outlined" 
              />
            )}
            {metadata.is_complete !== undefined && (
              <Chip 
                label={metadata.is_complete ? 'Complete' : 'Active'} 
                size="small" 
                color={metadata.is_complete ? 'success' : 'primary'} 
              />
            )}
          </Box>
        )}
        
        <Box sx={{ 
          '& h1, & h2, & h3': { mt: 3, mb: 1 },
          '& p': { mb: 2 },
          '& pre': { 
            backgroundColor: 'grey.100', 
            p: 2, 
            borderRadius: 1, 
            overflow: 'auto' 
          },
          '& code': { 
            backgroundColor: 'grey.100', 
            px: 0.5, 
            borderRadius: 0.5,
            fontSize: '0.875em'
          },
          '& ul, & ol': { mb: 2 },
          '& li': { mb: 0.5 }
        }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};