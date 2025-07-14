/**
 * Environment Configuration
 * Simplified single-environment configuration for production use
 */

interface UIConfig {
  basename: string;
  apiUrl: string;
  wsUrl: string;
  features: {
    sse: boolean;
    websocket: boolean;
  };
}

/**
 * Get configuration - single production-focused setup
 */
function getConfig(): UIConfig {
  // UI is always served under /ui prefix
  const basename = '/ui';
  
  // API URL configuration - always use relative URLs to leverage proxy
  // This ensures requests go to the same host:port as the UI
  const apiUrl = '';
  
  // WebSocket URL for SSE
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = (import.meta as any).env?.VITE_WS_URL || `${protocol}//${window.location.host}`;
  
  return {
    basename,
    apiUrl,
    wsUrl,
    features: {
      sse: true,
      websocket: false // Using SSE instead
    }
  };
}

// Export singleton config
export const config = getConfig();

// Export individual values for convenience
export const { basename, apiUrl, wsUrl, features } = config;

// Log configuration for debugging
console.log('UI Configuration:', config);