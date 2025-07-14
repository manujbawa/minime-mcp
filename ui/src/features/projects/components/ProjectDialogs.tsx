/**
 * Project Dialogs Component
 * Create/Edit and Delete confirmation dialogs for projects
 */

import React from 'react';
import {
  Button,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import {
  Delete,
} from '@mui/icons-material';
import type { Project } from '../../../types';

interface ProjectDialogsProps {
  // Create/Edit Dialog
  createDialogOpen: boolean;
  selectedProject: Project | null;
  formData: {
    name: string;
    description: string;
  };
  onFormDataChange: (data: { name: string; description: string }) => void;
  onCreateProject: () => void;
  onCloseCreateDialog: () => void;
  
  // Delete Dialog
  deleteDialogOpen: boolean;
  onDeleteProject: () => void;
  onCloseDeleteDialog: () => void;
}

export const ProjectDialogs: React.FC<ProjectDialogsProps> = ({
  createDialogOpen,
  selectedProject,
  formData,
  onFormDataChange,
  onCreateProject,
  onCloseCreateDialog,
  deleteDialogOpen,
  onDeleteProject,
  onCloseDeleteDialog,
}) => {
  return (
    <>
      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={onCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={formData.name}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              disabled={!!selectedProject}
              sx={{ mb: 2 }}
              helperText="Use lowercase letters, numbers, and hyphens"
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              helperText="Optional description of your project"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseCreateDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onCreateProject}
            disabled={!formData.name.trim()}
          >
            {selectedProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={onCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Project?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the project "{selectedProject?.name}"?
            This will permanently delete all associated memories, sessions, and data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDeleteDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={onDeleteProject}
            startIcon={<Delete />}
          >
            Delete Project
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};