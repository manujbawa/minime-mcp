import { useState, useCallback } from 'react';

interface ApiOptions extends RequestInit {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const callApi = useCallback(async (url: string, options?: ApiOptions) => {
    const { onSuccess, onError, ...fetchOptions } = options || {};
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url: string, options?: ApiOptions) => {
    return callApi(url, { ...options, method: 'GET' });
  }, [callApi]);

  const post = useCallback((url: string, body: any, options?: ApiOptions) => {
    return callApi(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify(body)
    });
  }, [callApi]);

  const put = useCallback((url: string, body: any, options?: ApiOptions) => {
    return callApi(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: JSON.stringify(body)
    });
  }, [callApi]);

  const del = useCallback((url: string, options?: ApiOptions) => {
    return callApi(url, { ...options, method: 'DELETE' });
  }, [callApi]);

  return {
    loading,
    error,
    data,
    get,
    post,
    put,
    delete: del,
    callApi
  };
}