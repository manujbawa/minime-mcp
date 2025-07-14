/**
 * MCP Tools Page
 * Displays all available MCP tools organized by category
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
} from '@mui/icons-material';
import { PageLayout } from '../../../components/layout/PageLayout';
import { useApp } from '../../../contexts/AppContext';
import { MCPStatusOverview, ToolCategorySection } from '../components';
import type { MCPStatus, MCPTool } from '../../../types';

const getToolCategory = (toolName: string): string => {
  if (toolName.includes('memory') || toolName.includes('store') || toolName.includes('search')) {
    return 'Memory Management';
  }
  if (toolName.includes('thinking') || toolName.includes('thought')) {
    return 'Sequential Thinking';
  }
  if (toolName.includes('task')) {
    return 'Task Management';
  }
  if (toolName.includes('learning') || toolName.includes('pattern') || toolName.includes('insight')) {
    return 'Meta-Learning';
  }
  return 'General';
};

export const MCPToolsPage: React.FC = () => {
  const { addNotification } = useApp();
  
  // State
  const [mcpStatus, setMCPStatus] = useState<MCPStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTool, setExpandedTool] = useState<string | false>(false);

  // Fetch MCP status
  const fetchMCPStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch with full schemas for IDE Agent view
      const response = await fetch('/mcp/status?full=true');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const status = await response.json();
      
      // Check if this is an error response
      if (status.error) {
        throw new Error(status.message || status.error);
      }
      
      // Log the response structure for debugging
      console.log('MCP Status Response:', status);
      
      setMCPStatus(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch MCP status';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle accordion expansion
  const handleAccordionChange = (toolName: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedTool(isExpanded ? toolName : false);
  };

  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      addNotification({
        type: 'success',
        message: 'Copied to clipboard',
      });
    }).catch(() => {
      addNotification({
        type: 'error',
        message: 'Failed to copy to clipboard',
      });
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchMCPStatus();
  };

  // Load data on mount
  useEffect(() => {
    fetchMCPStatus();
  }, []);

  // Group tools by category
  const toolsByCategory = mcpStatus?.capabilities?.tools?.available?.reduce((acc, tool) => {
    const category = getToolCategory(tool.name);
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {} as Record<string, MCPTool[]>) || {};

  if (loading) {
    return (
      <PageLayout
        title="MCP Tools"
        subtitle="Discover and explore all available Model Context Protocol (MCP) tools for interacting with MiniMe"
        actions={
          <Tooltip title="Refresh tools">
            <IconButton onClick={handleRefresh} color="primary" disabled>
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="MCP Tools"
        subtitle="Discover and explore all available Model Context Protocol (MCP) tools for interacting with MiniMe"
        actions={
          <Tooltip title="Refresh tools">
            <IconButton onClick={handleRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      >
        <Alert 
          severity="error" 
          action={
            <IconButton color="inherit" size="small" onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          }
        >
          {error}
        </Alert>
      </PageLayout>
    );
  }

  if (!mcpStatus) {
    return (
      <PageLayout
        title="MCP Tools"
        subtitle="Discover and explore all available Model Context Protocol (MCP) tools for interacting with MiniMe"
        actions={
          <Tooltip title="Refresh tools">
            <IconButton onClick={handleRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      >
        <Alert severity="info">No MCP status data available</Alert>
      </PageLayout>
    );
  }

  // Check if we have the expected structure
  if (!mcpStatus.capabilities || !mcpStatus.capabilities.tools || !mcpStatus.capabilities.tools.available) {
    return (
      <PageLayout
        title="MCP Tools"
        subtitle="Discover and explore all available Model Context Protocol (MCP) tools for interacting with MiniMe"
        actions={
          <Tooltip title="Refresh tools">
            <IconButton onClick={handleRefresh} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        }
      >
        <Alert severity="warning">
          MCP status received but tools data is not available. 
          Server response: {JSON.stringify(mcpStatus, null, 2)}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="MCP Tools"
      subtitle="Discover and explore all available Model Context Protocol (MCP) tools for interacting with MiniMe"
      actions={
        <Tooltip title="Refresh tools">
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      }
    >
      <Box sx={{ '> *': { mb: 3 } }}>
        {/* MCP Status Overview */}
        <MCPStatusOverview 
          status={mcpStatus} 
          toolsByCategory={toolsByCategory} 
        />

        {/* Tools by Category */}
        {Object.entries(toolsByCategory).map(([category, tools]) => (
          <ToolCategorySection
            key={category}
            category={category}
            tools={tools}
            expandedTool={expandedTool}
            onAccordionChange={handleAccordionChange}
            onCopyToClipboard={copyToClipboard}
          />
        ))}
      </Box>
    </PageLayout>
  );
}; 