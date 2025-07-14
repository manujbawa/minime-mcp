import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useApp } from './AppContext';
import { environment } from '../config/environment';

interface WebSocketContextValue {
  isConnected: boolean;
  subscribe: (event: string, handler: (data: any) => void) => () => void;
  emit: (event: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { addNotification } = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map());

  useEffect(() => {
    // Connect to SSE endpoint
    const connect = () => {
      try {
        // Use relative URL to leverage the proxy configuration
        const sseUrl = '/api/sse/events';
        const eventSource = new EventSource(sseUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          addNotification({
            type: 'success',
            message: 'Real-time connection established',
          });
        };

        eventSource.onerror = (error) => {
          setIsConnected(false);
          console.error('SSE connection error:', error);
          
          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle connection event
            if (data.type === 'connected') {
              console.log('SSE connected with client ID:', data.clientId);
              return;
            }
          } catch (error) {
            console.error('Failed to parse SSE message:', error);
          }
        };

        // Set up event listeners for specific events
        const events = [
          'memory:created',
          'memory:updated',
          'memory:deleted',
          'task:created',
          'task:updated',
          'task:completed',
          'insight:generated',
          'learning:progress',
          'job:started',
          'job:completed',
          'job:failed'
        ];

        events.forEach(eventName => {
          eventSource.addEventListener(eventName, (event: MessageEvent) => {
            try {
              const data = JSON.parse(event.data);
              const handlers = handlersRef.current.get(eventName);
              if (handlers) {
                handlers.forEach(handler => handler(data));
              }
            } catch (error) {
              console.error(`Failed to handle ${eventName}:`, error);
            }
          });
        });

      } catch (error) {
        console.error('Failed to connect to SSE:', error);
        setIsConnected(false);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [addNotification]);

  const subscribe = (event: string, handler: (data: any) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(event);
        }
      }
    };
  };

  const emit = (event: string, data: any) => {
    // SSE is one-way, so emit would use a different endpoint
    const broadcastUrl = 'http://localhost:8000/api/sse/broadcast';
    fetch(broadcastUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data }),
    }).catch(error => {
      console.error('Failed to emit event:', error);
    });
  };

  const value: WebSocketContextValue = {
    isConnected,
    subscribe,
    emit,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};