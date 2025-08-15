/**
 * Analytics Page
 * Comprehensive analytics dashboard with charts, KPIs, and insights
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Alert,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { PageLayout } from '../../../components/layout/PageLayout';
import { useApp } from '../../../contexts/AppContext';
import { AnalyticsAPI, ProjectsAPI } from '../../../services/api';
import {
  AnalyticsFilters,
  KPICards,
  AnalyticsTabs,
  TabPanel,
} from '../components';
import {
  TrendsTab,
  DistributionsTab,
  PerformanceTab,
  IntelligenceTab,
  TokenUsageTab,
} from '../tabs';
import type { Analytics, Project } from '../../../types';

interface KPIMetrics {
  productivityScore: number;
  learningVelocity: number;
  knowledgeDepth: number;
  systemHealth: number;
}

export const AnalyticsPage: React.FC = () => {
  const { addNotification } = useApp();
  
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('30 days');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Load projects
  const loadProjects = async () => {
    try {
      const response = await ProjectsAPI.list();
      if (response.success && response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      setError('Failed to load projects');
      console.error('Error loading projects:', error);
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const projectName = selectedProject === 'all' ? undefined : selectedProject;
      const response = await AnalyticsAPI.getAnalytics({
        project_name: projectName,
        timeframe: timeframe,
      });
      
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      setError('Failed to load analytics');
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate KPI metrics from analytics data
  const generateKPIMetrics = (): KPIMetrics => {
    if (!analytics) {
      return {
        productivityScore: 0,
        learningVelocity: 0,
        knowledgeDepth: 0,
        systemHealth: 0,
      };
    }

    // Parse data from analytics response
    const totalMemories = parseInt(analytics.database.total_memories || analytics.database.memories?.total_memories || '0');
    const totalSequences = parseInt(analytics.database.total_thinking_sequences || analytics.thinking?.total_sequences || '0');
    const completionRate = analytics.thinking?.completion_rate || 0;
    const avgConfidence = analytics.thinking?.avg_confidence || 0;
    
    // Calculate actual metrics based on real data
    const memoryScore = Math.min(100, (totalMemories / 50) * 100); // 50 memories = 100%
    const sequenceScore = Math.min(100, (totalSequences / 20) * 100); // 20 sequences = 100%
    
    // Productivity: weighted average of memory and sequence activity
    const productivityScore = Math.round((memoryScore * 0.6 + sequenceScore * 0.4));
    
    // Learning velocity: memories per sequence (if sequences exist)
    const learningVelocity = totalSequences > 0 
      ? Math.round(totalMemories / totalSequences)
      : totalMemories;
    
    // Knowledge depth: based on confidence and completion rate
    const knowledgeDepth = Math.round((avgConfidence * 100 * 0.7) + (completionRate * 0.3));
    
    // System health: based on having data and activity
    let systemHealth = 0;
    if (totalMemories > 0) systemHealth += 40;
    if (totalSequences > 0) systemHealth += 30;
    if (avgConfidence > 0.5) systemHealth += 15;
    if (completionRate > 50) systemHealth += 15;

    return {
      productivityScore: Math.min(100, productivityScore),
      learningVelocity,
      knowledgeDepth: Math.min(100, knowledgeDepth),
      systemHealth: Math.min(100, systemHealth),
    };
  };

  // Handle export report
  const handleExportReport = () => {
    addNotification({
      type: 'info',
      message: 'Export functionality will be implemented soon',
    });
  };

  // Load initial data in parallel
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Load projects and analytics in parallel
        const [projectsResult] = await Promise.all([
          ProjectsAPI.list().catch(err => {
            console.error('Error loading projects:', err);
            return null;
          }),
          // Initial analytics load with default values
          AnalyticsAPI.getAnalytics({
            project_name: undefined,
            timeframe: '30 days',
          }).then(response => {
            if (response.success) {
              setAnalytics(response.data);
            }
            return response;
          }).catch(err => {
            console.error('Error loading initial analytics:', err);
            return null;
          })
        ]);

        if (projectsResult?.success && projectsResult.data) {
          setProjects(projectsResult.data);
        }
      } catch (error) {
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Only reload analytics when filters change (not on initial load)
  useEffect(() => {
    // Skip if this is the initial load
    if (!projects.length) return;
    
    loadAnalytics();
  }, [selectedProject, timeframe]);

  // Calculate metrics
  const kpiMetrics = generateKPIMetrics();

  // Show skeleton loader while loading
  const showSkeleton = loading && !analytics;

  return (
    <PageLayout
      title="Advanced Analytics"
      subtitle="Comprehensive insights into your digital twin's performance, learning patterns, and knowledge evolution"
    >
      <Box sx={{ '> *': { mb: 3 } }}>
        {/* Filters */}
        <AnalyticsFilters
          projects={projects}
          selectedProject={selectedProject}
          timeframe={timeframe}
          onProjectChange={setSelectedProject}
          onTimeframeChange={setTimeframe}
          onExportReport={handleExportReport}
        />

        {/* Error Message */}
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* KPI Cards */}
        {showSkeleton ? (
          <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} sx={{ flex: 1, p: 2 }}>
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="rectangular" height={4} sx={{ mt: 1 }} />
              </Card>
            ))}
          </Box>
        ) : analytics && (
          <KPICards metrics={kpiMetrics} />
        )}

        {/* Analytics Tabs */}
        <Card>
          <AnalyticsTabs activeTab={activeTab} onTabChange={setActiveTab}>
            {/* Tab 1: Trends & Growth */}
            <TabPanel value={activeTab} index={0}>
              <TrendsTab analytics={analytics} />
            </TabPanel>

            {/* Tab 2: Distributions */}
            <TabPanel value={activeTab} index={1}>
              <DistributionsTab analytics={analytics} />
            </TabPanel>

            {/* Tab 3: Performance */}
            <TabPanel value={activeTab} index={2}>
              <PerformanceTab analytics={analytics} projects={projects} />
            </TabPanel>

            {/* Tab 4: Intelligence */}
            <TabPanel value={activeTab} index={3}>
              <IntelligenceTab analytics={analytics} />
            </TabPanel>

            {/* Tab 5: Token Usage */}
            <TabPanel value={activeTab} index={4}>
              <TokenUsageTab projectName={selectedProject === 'all' ? undefined : selectedProject} />
            </TabPanel>
          </AnalyticsTabs>
        </Card>
      </Box>
    </PageLayout>
  );
};