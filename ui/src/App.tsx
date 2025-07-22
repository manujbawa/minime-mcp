import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { AppProvider } from './contexts/AppContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { MainLayout } from './layouts/MainLayout';
import { basename } from './config/environment';

// Lazy load pages
const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProjectsPage = lazy(() => import('./features/projects/pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectDetailsPage = lazy(() => import('./features/projects/pages/ProjectDetailsPage').then(m => ({ default: m.ProjectDetailsPage })));
const MemoriesPage = lazy(() => import('./features/memories/pages/MemoriesPage').then(m => ({ default: m.MemoriesPage })));
const AnalyticsPage = lazy(() => import('./features/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const SequentialThinkingPage = lazy(() => import('./features/thinking/pages/SequentialThinkingPage').then(m => ({ default: m.SequentialThinkingPage })));
const InsightsPage = lazy(() => import('./features/insights/pages/InsightsPage').then(m => ({ default: m.InsightsPage })));
const InsightsV2Page = lazy(() => import('./features/insights/pages/InsightsV2Page').then(m => ({ default: m.InsightsV2Page })));
const AdminPage = lazy(() => import('./features/admin/pages/AdminPage').then(m => ({ default: m.AdminPage })));
const TasksPage = lazy(() => import('./features/tasks/pages/TasksPage').then(m => ({ default: m.TasksPage })));
const ConfigPage = lazy(() => import('./features/config/pages/ConfigPage').then(m => ({ default: m.ConfigPage })));
const MCPToolsPage = lazy(() => import('./features/mcp-tools/pages/MCPToolsPage').then(m => ({ default: m.MCPToolsPage })));
const PromptManagementPage = lazy(() => import('./features/prompts/pages/PromptManagementPage').then(m => ({ default: m.PromptManagementPage })));
const LogsPage = lazy(() => import('./features/logs/pages/LogsPage').then(m => ({ default: m.LogsPage })));

// Loading component
const PageLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppProvider>
        <RefreshProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="projects"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProjectsPage />
                  </Suspense>
                }
              />
              <Route
                path="projects/:projectName"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ProjectDetailsPage />
                  </Suspense>
                }
              />
              <Route
                path="memories"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MemoriesPage />
                  </Suspense>
                }
              />
              <Route
                path="thinking"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SequentialThinkingPage />
                  </Suspense>
                }
              />
              <Route
                path="analytics"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AnalyticsPage />
                  </Suspense>
                }
              />
              <Route
                path="meta-learning"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <InsightsV2Page />
                  </Suspense>
                }
              />
              <Route
                path="insights"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <InsightsPage />
                  </Suspense>
                }
              />
              <Route
                path="admin"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AdminPage />
                  </Suspense>
                }
              />
              <Route
                path="prompt-management"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PromptManagementPage />
                  </Suspense>
                }
              />
              <Route
                path="tasks"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TasksPage />
                  </Suspense>
                }
              />
              <Route
                path="config"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <ConfigPage />
                  </Suspense>
                }
              />
              <Route
                path="mcp-tools"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MCPToolsPage />
                  </Suspense>
                }
              />
              <Route
                path="logs"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LogsPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </RefreshProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;