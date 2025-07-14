/**
 * Job Definitions
 * All background jobs for the system
 */

import { AnalyticsJob } from './AnalyticsJob.js';
import { EmbeddingJob } from './EmbeddingJob.js';
import { CleanupJob } from './CleanupJob.js';
import { V2InsightJob } from './V2InsightJob.js';

export function registerAllJobs(scheduler, services) {
  services.logger.info('[Jobs] Registering system jobs with Unified Insights v2');
  
  // Register all jobs with the scheduler
  
  // Learning pipeline removed - using v2 unified insights

  // Analytics collection job - ALWAYS ENABLED
  scheduler.registerJob('analytics_collection', {
    name: 'Analytics Collection',
    description: 'Collect and aggregate analytics data',
    interval: 60000, // 1 minute
    enabled: true,
    handler: AnalyticsJob.execute
  });

  // Embedding generation job - ALWAYS ENABLED (memories need embeddings)
  scheduler.registerJob('embedding_generation', {
    name: 'Embedding Generation',
    description: 'Generate embeddings for new memories',
    interval: 30000, // 30 seconds
    enabled: true, // Keep enabled - foundational service
    handler: EmbeddingJob.execute
  });

  // AI insights generation removed - using v2 unified insights

  // L1 insights removed - using v2 unified insights

  // Mini insights removed - using v2 unified insights

  // Database cleanup job - ALWAYS ENABLED
  scheduler.registerJob('database_cleanup', {
    name: 'Database Cleanup',
    description: 'Clean up old data and optimize database',
    interval: 86400000, // 24 hours
    enabled: true,
    handler: CleanupJob.execute
  });

  // V2 insight generation job
  scheduler.registerJob('v2_insight_generation', {
    name: 'V2 Insight Generation',
    description: 'Process all unprocessed memories using unified insights v2',
    interval: 300000, // 5 minutes (increased to prevent overlap)
    enabled: true,
    handler: V2InsightJob.execute
  });

  const enabledJobs = [];
  const disabledJobs = [];
  
  for (const [jobId, job] of scheduler.jobs) {
    if (job.enabled) {
      enabledJobs.push(jobId);
    } else {
      disabledJobs.push(jobId);
    }
  }
  
  services.logger.info(`[Jobs] Registered ${scheduler.jobs.size} jobs`);
  services.logger.info(`[Jobs] Enabled: ${enabledJobs.join(', ')}`);
}