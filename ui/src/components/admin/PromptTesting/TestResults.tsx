import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Card
} from '@mui/material';
import { SplitContentArea } from '../../shared';

interface TestResultsProps {
  result: any;
  selectedPromptId: string;
  onSavePrompt: () => Promise<boolean>;
}

export function TestResults({ result }: TestResultsProps) {
  if (!result) return null;

  const isValid = result.isValid || result.isValidJSON;

  const rawOutputContent = (
    <>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Raw Output
      </Typography>
      <Box
        sx={{
          height: 'calc(100% - 40px)', // Account for the title
          overflow: 'auto',
          bgcolor: 'grey.100',
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
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
          }
        }}
      >
        {result.output || result.rawResponse}
      </Box>
    </>
  );

  const parsedJsonContent = isValid ? (
    <>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Parsed JSON
      </Typography>
      <Box
        sx={{
          height: 'calc(100% - 40px)', // Account for the title
          overflow: 'auto',
          bgcolor: 'success.50',
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'success.main',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
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
          }
        }}
      >
        {JSON.stringify(result.parsed || result.parsedJSON, null, 2)}
      </Box>
    </>
  ) : (
    <>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        JSON Parse Error
      </Typography>
      <Box
        sx={{
          height: 'calc(100% - 40px)', // Account for the title
          overflow: 'auto',
          bgcolor: 'error.50',
          p: 2,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'error.main',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
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
          }
        }}
      >
        {result.error || result.jsonError || 'Unable to parse JSON'}
      </Box>
    </>
  );

  return (
    <Box>
      {/* Status Alert */}
      <Card sx={{ mx: 2, mb: 2, p: 2 }}>
        <Alert 
          severity={isValid ? 'success' : 'error'}
          sx={{ mb: 0 }}
        >
          {isValid 
            ? `✓ Valid JSON${result.duration ? ` • Response time: ${result.duration}ms` : ''}${result.tokenCount ? ` • Tokens: ${result.tokenCount}` : ''}`
            : `✗ Invalid JSON: ${result.error || result.jsonError || 'Unknown error'}`
          }
        </Alert>
      </Card>

      {/* Output Display */}
      <SplitContentArea
        leftContent={rawOutputContent}
        rightContent={parsedJsonContent}
        leftFlex={isValid ? 1 : 2}
        rightFlex={isValid ? 1 : 1}
        height={{ xs: 'auto', md: '400px' }}
        mb={2}
      />
    </Box>
  );
}