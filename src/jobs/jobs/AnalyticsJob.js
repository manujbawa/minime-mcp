/**
 * Analytics Collection Job
 * Collects and aggregates analytics data
 */

export class AnalyticsJob {
  static async execute(services) {
    const { database, analytics, config, logger } = services;
    
    // Check if analytics are enabled
    const enabled = await config.get('analytics_enabled');
    if (!enabled) {
      logger.debug('[AnalyticsJob] Analytics disabled, skipping');
      return;
    }

    if (!analytics || typeof analytics.collectSnapshot !== 'function') {
      logger.error('[AnalyticsJob] Analytics collector service not available');
      return;
    }

    try {
      // Use the analytics collector's built-in snapshot collection
      await analytics.collectSnapshot();
      
      logger.info('[AnalyticsJob] Analytics snapshot collected successfully');
    } catch (error) {
      logger.error('[AnalyticsJob] Failed:', error);
      throw error;
    }
  }


}