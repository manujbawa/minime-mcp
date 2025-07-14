/**
 * Prefetch utilities for improved performance
 */

// Prefetch analytics page when user hovers over the link
export const prefetchAnalytics = () => {
  import('../features/analytics/pages/AnalyticsPage');
};

// Prefetch commonly used pages
export const prefetchCommonPages = () => {
  // Prefetch in order of likelihood of use
  setTimeout(() => {
    import('../features/dashboard/pages/DashboardPage');
    import('../features/projects/pages/ProjectsPage');
  }, 1000);
  
  setTimeout(() => {
    import('../features/analytics/pages/AnalyticsPage');
    import('../features/memories/pages/MemoriesPage');
  }, 2000);
};