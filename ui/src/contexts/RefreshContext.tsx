import React, { createContext, useContext, useState, useCallback } from 'react';

interface RefreshContextType {
  triggerRefresh: (component?: string) => void;
  refreshKey: number;
}

const RefreshContext = createContext<RefreshContextType | null>(null);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback((component?: string) => {
    console.log(`Refresh triggered${component ? ` for ${component}` : ''}`);
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <RefreshContext.Provider value={{ triggerRefresh, refreshKey }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};