import React from 'react';
import { Box, Typography, Button, Alert, Card, CardContent, CircularProgress } from '@mui/material';
import { Add as Plus } from '@mui/icons-material';
import { useAIInsights } from '../../../hooks/admin/useAIInsights';
import { AIInsightsTable } from './AIInsightsTable';
import { AIInsightModal } from './AIInsightModal';
import { VariablesReference } from './VariablesReference';

export function AIInsightsTab() {
  const {
    templates,
    loading,
    showModal,
    editingTemplate,
    formData,
    page,
    rowsPerPage,
    showVariableMenu,
    variableMenuPosition,
    currentVariableSearch,
    availableVariables,
    openModal,
    closeModal,
    saveTemplate,
    deleteTemplate,
    updateFormField,
    insertVariable,
    handleChangePage,
    handleChangeRowsPerPage
  } = useAIInsights();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          AI Insight Prompt Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={() => openModal()}
          disabled={loading}
        >
          Add Template
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          These templates are used to generate AI insights from your development history. Templates support dynamic variables that get replaced with actual data during insight generation.
        </Typography>
      </Alert>

      {/* Templates Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <AIInsightsTable
              templates={templates}
              loading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              onEdit={openModal}
              onDelete={deleteTemplate}
            />
          )}
        </CardContent>
      </Card>

      {/* Variables Reference */}
      <VariablesReference variables={availableVariables} />

      {/* Modal */}
      <AIInsightModal
        open={showModal}
        onClose={closeModal}
        editingTemplate={editingTemplate}
        formData={formData}
        onSave={saveTemplate}
        onFieldChange={updateFormField}
        showVariableMenu={showVariableMenu}
        variableMenuPosition={variableMenuPosition}
        currentVariableSearch={currentVariableSearch}
        availableVariables={availableVariables}
        onInsertVariable={insertVariable}
      />
    </Box>
  );
}