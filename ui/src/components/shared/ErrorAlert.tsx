import React from 'react';
import { Alert, AlertProps } from '@mui/material';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  severity?: AlertProps['severity'];
}

export function ErrorAlert({ message, onClose, severity = 'error' }: ErrorAlertProps) {
  return (
    <Alert severity={severity} sx={{ mb: 3 }} onClose={onClose}>
      {message}
    </Alert>
  );
}