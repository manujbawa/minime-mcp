import { useState, useCallback } from 'react';

interface ErrorState {
  message: string | null;
  type: 'error' | 'warning' | 'info';
  details?: any;
}

export function useErrorHandling() {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((error: unknown, type: ErrorState['type'] = 'error') => {
    let message = 'An unknown error occurred';
    let details = undefined;

    if (error instanceof Error) {
      message = error.message;
      details = error.stack;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
      details = error;
    }

    setError({ message, type, details });
    
    // Always log to console for debugging
    console.error(`[${type.toUpperCase()}]`, message, details);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options?: { 
      onError?: (error: unknown) => void;
      errorMessage?: string;
      type?: ErrorState['type'];
    }
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        const errorMessage = options?.errorMessage || 
          (error instanceof Error ? error.message : 'Operation failed');
        
        handleError(errorMessage, options?.type);
        
        if (options?.onError) {
          options.onError(error);
        }
        
        throw error;
      }
    }) as T;
  }, [handleError]);

  return {
    error,
    handleError,
    clearError,
    withErrorHandling
  };
}