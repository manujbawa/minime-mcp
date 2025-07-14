import React from 'react';
import { Box, Typography, Button, Alert, Card, CardContent, CircularProgress } from '@mui/material';
import { Add as Plus } from '@mui/icons-material';
import { useLearningPrompts } from '../../../hooks/admin/useLearningPrompts';
import { LearningPromptsTable } from './LearningPromptsTable';
import { LearningPromptModal } from './LearningPromptModal';
import { PromptCategories } from './PromptCategories';
import { VariablesReference } from './VariablesReference';

export function LearningPromptsTab() {
  const {
    prompts,
    loading,
    showModal,
    editingPrompt,
    formData,
    page,
    rowsPerPage,
    openModal,
    closeModal,
    savePrompt,
    deletePrompt,
    updateFormField,
    updateConfigField,
    handleChangePage,
    handleChangeRowsPerPage
  } = useLearningPrompts();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Learning Prompt Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => openModal()}
          disabled={loading}
        >
          Add Prompt Template
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          These prompts are used by the LLM-based learning pipeline to detect patterns, extract technologies, 
          and generate insights from your development memories.
        </Typography>
      </Alert>

      {/* Prompts Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <LearningPromptsTable
              prompts={prompts}
              loading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onEdit={openModal}
              onDelete={deletePrompt}
            />
          )}
        </CardContent>
      </Card>

      {/* Prompt Categories Information */}
      <PromptCategories />

      {/* Variables Reference */}
      <VariablesReference />

      {/* Modal */}
      <LearningPromptModal
        open={showModal}
        onClose={closeModal}
        editingPrompt={editingPrompt}
        formData={formData}
        onSave={savePrompt}
        onFieldChange={updateFormField}
        onConfigChange={updateConfigField}
      />
    </Box>
  );
}