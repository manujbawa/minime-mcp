import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Save } from '@mui/icons-material';
import { usePromptTesting } from '../../../hooks/admin/usePromptTesting';
import { TestControls } from './TestControls';
import { VariablesEditor } from './VariablesEditor';
import { TestResults } from './TestResults';
import { LoadingSpinner, FullWidthCard } from '../../shared';

export function PromptTestingTab() {
  const {
    // State
    promptTestTable,
    testPrompts,
    selectedTestPromptId,
    testPromptText,
    testVariables,
    testModel,
    availableModels,
    testLoading,
    testResult,
    testMemories,
    selectedTestMemory,
    memoryTypeFilter,
    
    // Actions
    setPromptTestTable,
    setSelectedTestPromptId,
    setTestPromptText,
    setTestVariables,
    setTestModel,
    setSelectedTestMemory,
    setMemoryTypeFilter,
    loadPromptForTesting,
    loadMemoryForTesting,
    runPromptTest,
    savePromptAfterTest
  } = usePromptTesting();

  const handlePromptSelect = (promptId: string) => {
    setSelectedTestPromptId(promptId);
    loadPromptForTesting(promptId);
  };

  const handleMemorySelect = (memoryId: string) => {
    setSelectedTestMemory(memoryId);
    if (memoryId) {
      loadMemoryForTesting(memoryId);
    }
  };

  const canRunTest = testPromptText && !testLoading;
  const selectedMemoryData = testMemories.find(m => m.id === parseInt(selectedTestMemory));
  
  // Compose the final prompt with variables replaced
  const getFinalPrompt = () => {
    if (!testPromptText) return '';
    
    let finalPrompt = testPromptText;
    try {
      const variables = JSON.parse(testVariables || '{}');
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        finalPrompt = finalPrompt.replace(regex, String(value || ''));
      });
    } catch (e) {
      // If JSON parsing fails, return prompt as-is
    }
    return finalPrompt;
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ px: 2, pt: 2, pb: 1 }}>
        Prompt JSON Testing
      </Typography>
      
      {/* Row 1: Form Controls */}
      <TestControls
        promptTestTable={promptTestTable}
        testPrompts={testPrompts}
        selectedTestPromptId={selectedTestPromptId}
        memoryTypeFilter={memoryTypeFilter}
        testMemories={testMemories}
        selectedTestMemory={selectedTestMemory}
        testModel={testModel}
        availableModels={availableModels}
        onTableChange={setPromptTestTable}
        onPromptSelect={handlePromptSelect}
        onMemoryTypeChange={setMemoryTypeFilter}
        onMemorySelect={handleMemorySelect}
        onModelChange={setTestModel}
      />

      {/* Row 2: Prompt Template and Variables */}
      <Box sx={{ mt: 3 }}>
        <VariablesEditor
        promptTemplate={testPromptText}
        variables={testVariables}
        onPromptChange={setTestPromptText}
        onVariablesChange={setTestVariables}
      />
      </Box>

      {/* Row 3: Final Prompt Preview */}
      <FullWidthCard 
        title="Final Prompt Preview (with variables replaced)" 
        height="500px"
        mb={2}
      >
        <Box sx={{ 
          height: 'calc(100% - 40px)', // Account for the title
          overflow: 'auto', 
          bgcolor: 'grey.50', 
          p: 2, 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.5',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}>
          {testPromptText ? (
            <>
              {getFinalPrompt().split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < getFinalPrompt().split('\n').length - 1 && '\n'}
                </React.Fragment>
              ))}
              
              {/* Show variable replacement info */}
              {testVariables && (
                <Box sx={{ 
                  mt: 3, 
                  pt: 2, 
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontSize: '0.85rem'
                }}>
                  <Typography variant="caption" display="block" gutterBottom>
                    <strong>Variables detected and replaced:</strong>
                  </Typography>
                  {(() => {
                    try {
                      const vars = JSON.parse(testVariables);
                      const usedVars = Object.entries(vars).filter(([key]) => 
                        testPromptText.includes(`{${key}}`)
                      );
                      const unusedVars = Object.entries(vars).filter(([key]) => 
                        !testPromptText.includes(`{${key}}`)
                      );
                      
                      return (
                        <>
                          {usedVars.length > 0 && (
                            <Box sx={{ ml: 2, mb: 1 }}>
                              {usedVars.map(([key, value]) => (
                                <Typography key={key} variant="caption" display="block" sx={{ color: 'success.main' }}>
                                  ✓ {`{${key}}`} → {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          {unusedVars.length > 0 && (
                            <Box sx={{ ml: 2 }}>
                              <Typography variant="caption" display="block" sx={{ color: 'warning.main', mb: 0.5 }}>
                                Unused variables:
                              </Typography>
                              {unusedVars.map(([key]) => (
                                <Typography key={key} variant="caption" display="block" sx={{ color: 'text.disabled', ml: 1 }}>
                                  • {`{${key}}`}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </>
                      );
                    } catch (e) {
                      return <Typography variant="caption">Invalid JSON in variables</Typography>;
                    }
                  })()}
                </Box>
              )}
            </>
          ) : (
            <Typography color="text.secondary">
              Enter a prompt template to see the final composed prompt
            </Typography>
          )}
        </Box>
      </FullWidthCard>

      {/* Row 4: Action Buttons */}
      <FullWidthCard mb={2}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={runPromptTest}
            disabled={!canRunTest}
            startIcon={testLoading ? <CircularProgress size={20} /> : undefined}
            sx={{ minWidth: 140 }}
          >
            {testLoading ? 'Testing...' : 'Test Prompt'}
          </Button>
          
          {testResult?.isValid && (
            <Button
              variant="outlined"
              onClick={savePromptAfterTest}
              disabled={!selectedTestPromptId}
              startIcon={<Save />}
              sx={{ minWidth: 120 }}
            >
              Save Prompt
            </Button>
          )}
        </Box>
      </FullWidthCard>

      {/* Loading Indicator */}
      {testLoading && <LoadingSpinner message="Running prompt test..." />}

      {/* Test Results */}
      <TestResults
        result={testResult}
        selectedPromptId={selectedTestPromptId}
        onSavePrompt={savePromptAfterTest}
      />
    </Box>
  );
}