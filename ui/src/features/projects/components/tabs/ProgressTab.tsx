/**
 * Progress Tab Component
 * Displays project progress tracking
 */

import React from 'react';
import { Box, Typography, Paper, Button, Chip, LinearProgress, Avatar } from '@mui/material';
import { Add as AddIcon, TrendingUp as ProgressIcon } from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import type { ProgressEntry } from '../../../../types';

interface ProgressTabProps {
  progress: ProgressEntry[];
  onAddProgress: () => void;
  onViewProgress: (entry: ProgressEntry) => void;
}

export const ProgressTab: React.FC<ProgressTabProps> = ({ progress, onAddProgress, onViewProgress }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressColumns = (): GridColDef[] => [
    {
      field: 'version',
      headerName: 'Version',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: '0.8rem' }}>
          {params.value}
        </Avatar>
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'milestoneType',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'completionPercentage',
      headerName: 'Progress',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={params.value || 0}
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" sx={{ minWidth: 35 }}>
              {params.value || 0}%
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'blockers',
      headerName: 'Blockers',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const blockers = params.value as string[];
        return blockers && blockers.length > 0 ? (
          <Chip
            label={blockers.length}
            size="small"
            color="error"
            variant="outlined"
          />
        ) : (
          <Typography variant="caption" color="text.disabled">
            None
          </Typography>
        );
      },
    },
    {
      field: 'nextSteps',
      headerName: 'Next Steps',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const steps = params.value as string[];
        return steps && steps.length > 0 ? (
          <Chip
            label={steps.length}
            size="small"
            color="info"
            variant="outlined"
          />
        ) : (
          <Typography variant="caption" color="text.disabled">
            None
          </Typography>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="caption">
          {formatDate(params.value)}
        </Typography>
      ),
    },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Progress History
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddProgress}
        >
          Add Progress
        </Button>
      </Box>

      {progress.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ProgressIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No progress entries yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Track project milestones with automatic versioning
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddProgress}
          >
            Add First Progress
          </Button>
        </Paper>
      ) : (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={progress.map((entry) => ({
              id: entry.id,
              version: entry.version,
              description: entry.progress_description,
              milestoneType: entry.milestone_type,
              completionPercentage: entry.completion_percentage || 0,
              blockers: entry.blockers || [],
              nextSteps: entry.next_steps || [],
              tags: entry.tags || [],
              createdAt: entry.created_at,
              updatedAt: entry.updated_at
            }))}
            columns={getProgressColumns()}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
              sorting: {
                sortModel: [{ field: 'createdAt', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderColor: 'divider',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'grey.50',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'action.hover',
              },
            }}
            onRowClick={(params) => {
              onViewProgress(params.row as ProgressEntry);
            }}
          />
        </Paper>
      )}
    </>
  );
};