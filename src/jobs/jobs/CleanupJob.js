/**
 * Database Cleanup Job
 * Cleans up old data and optimizes database
 */

export class CleanupJob {
  static async execute(services) {
    const { database, config, logger } = services;
    
    try {
      logger.info('[CleanupJob] Starting database cleanup');
      
      // Clean up old analytics data (older than 90 days)
      const analyticsResult = await database.query(`
        DELETE FROM analytics_events
        WHERE created_at < NOW() - INTERVAL '90 days'
      `);
      
      logger.info(`[CleanupJob] Deleted ${analyticsResult.rowCount || 0} old analytics events`);

      // Clean up orphaned data
      const orphanedResult = await database.query(`
        DELETE FROM memories
        WHERE project_name NOT IN (SELECT name FROM projects)
      `);
      
      if (orphanedResult.rowCount > 0) {
        logger.warn(`[CleanupJob] Deleted ${orphanedResult.rowCount} orphaned memories`);
      }

      // Vacuum analyze for optimization (PostgreSQL)
      if (database.client === 'pg') {
        await database.query('VACUUM ANALYZE');
        logger.info('[CleanupJob] Database optimized');
      }

      logger.info('[CleanupJob] Cleanup completed successfully');
    } catch (error) {
      logger.error('[CleanupJob] Failed:', error);
      throw error;
    }
  }
}