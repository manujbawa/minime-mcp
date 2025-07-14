import React from 'react';
import { Typography, Box } from '@mui/material';
import { SplitContentArea } from '../../shared';

interface VariablesEditorProps {
  promptTemplate: string;
  variables: string;
  onPromptChange: (value: string) => void;
  onVariablesChange: (value: string) => void;
}

export function VariablesEditor({
  promptTemplate,
  variables,
  onPromptChange,
  onVariablesChange
}: VariablesEditorProps) {
  const promptContent = (
    <>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Prompt Template
      </Typography>
      <Box
        component="textarea"
        value={promptTemplate}
        onChange={(e) => onPromptChange(e.target.value)}
        sx={{
          height: 'calc(100% - 40px)', // Account for the title
          width: '100%',
          overflow: 'auto',
          bgcolor: 'grey.50',
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          resize: 'none',
          outline: 'none',
          '&:focus': {
            borderColor: 'primary.main',
          },
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
        }}
      />
    </>
  );

  const variablesContent = (
    <>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Test Variables (JSON)
      </Typography>
      <Box
        component="textarea"
        value={variables}
        onChange={(e) => onVariablesChange(e.target.value)}
        sx={{
          height: 'calc(100% - 40px)', // Account for the title
          width: '100%',
          overflow: 'auto',
          bgcolor: 'grey.50',
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          resize: 'none',
          outline: 'none',
          '&:focus': {
            borderColor: 'primary.main',
          },
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
        }}
      />
    </>
  );

  return (
    <SplitContentArea
      leftContent={promptContent}
      rightContent={variablesContent}
      leftFlex={3}
      rightFlex={2}
      height="400px"
      mb={2}
    />
  );
}