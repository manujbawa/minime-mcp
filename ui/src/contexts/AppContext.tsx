import React, { createContext, useContext, useState, useCallback } from 'react';

interface AppState {
  currentProject: string | null;
  currentSession: string | null;
  isLoading: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
}

interface AppContextValue extends AppState {
  setCurrentProject: (project: string | null) => void;
  setCurrentSession: (session: string | null) => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    currentProject: null,
    currentSession: null,
    isLoading: false,
    notifications: [],
  });

  const setCurrentProject = useCallback((project: string | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
  }, []);

  const setCurrentSession = useCallback((session: string | null) => {
    setState(prev => ({ ...prev, currentSession: session }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification],
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id),
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  const value: AppContextValue = {
    ...state,
    setCurrentProject,
    setCurrentSession,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};