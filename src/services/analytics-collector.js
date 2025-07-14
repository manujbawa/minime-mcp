// Analytics Collector Service
// Collects time-series analytics data at configurable intervals

// Logger will be passed to constructor - no import needed

class AnalyticsCollector {
  constructor(databaseService, configService, logger = console) {
    this.db = databaseService;
    this.config = configService;
    this.logger = logger;
    this.collectionInterval = null;
    this.isCollecting = false;
  }

  // Start the analytics collection process
  async start() {
    try {
      const enabled = await this.config.isFeatureEnabled('analytics_enabled');
      if (!enabled) {
        this.logger.info('Analytics collection is disabled');
        return;
      }

      const intervalMinutes = await this.config.getNumber('analytics_interval_minutes', 5);
      const intervalMs = intervalMinutes * 60 * 1000;

      // Clear any existing interval
      if (this.collectionInterval) {
        clearInterval(this.collectionInterval);
      }

      // Collect immediately on start
      await this.collectSnapshot();

      // Set up recurring collection
      this.collectionInterval = setInterval(async () => {
        await this.collectSnapshot();
      }, intervalMs);

      this.logger.info(`Analytics collection started with ${intervalMinutes} minute interval`);
    } catch (error) {
      this.logger.error('Failed to start analytics collection:', error);
    }
  }

  // Stop the analytics collection process
  stop() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      this.logger.info('Analytics collection stopped');
    }
  }

  // Collect a single analytics snapshot
  async collectSnapshot() {
    if (this.isCollecting) {
      this.logger.debug('Analytics collection already in progress, skipping');
      return;
    }

    this.isCollecting = true;
    const startTime = Date.now();

    try {
      const enabled = await this.config.isFeatureEnabled('analytics_enabled');
      if (!enabled) {
        this.stop();
        return;
      }

      const client = await this.db.getClient();
      try {
        // Collect global metrics
        const globalMetrics = await this.collectGlobalMetrics(client);
        await this.saveSnapshot(client, null, 'minute', globalMetrics);

        // Collect per-project metrics
        const projects = await this.getActiveProjects(client);
        for (const project of projects) {
          const projectMetrics = await this.collectProjectMetrics(client, project.id);
          await this.saveSnapshot(client, project.id, 'minute', projectMetrics);
        }

        // Check if we should create hourly/daily aggregates
        await this.checkAndCreateAggregates(client);

        // Clean up old data
        await this.cleanupOldSnapshots(client);

        const duration = Date.now() - startTime;
        this.logger.debug(`Analytics snapshot collected in ${duration}ms`);
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to collect analytics snapshot:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  // Collect global system metrics
  async collectGlobalMetrics(client) {
    const metrics = {};

    // Database statistics
    const dbStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM memories) as total_memories,
        (SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL) as memories_with_embeddings,
        (SELECT COUNT(*) FROM sessions) as total_sessions,
        (SELECT COUNT(*) FROM sessions WHERE is_active = true) as active_sessions,
        (SELECT COUNT(*) FROM thinking_sequences) as total_sequences,
        (SELECT COUNT(*) FROM thinking_sequences WHERE is_complete = false) as active_sequences,
        (SELECT COUNT(*) FROM thoughts) as total_thoughts,
        (SELECT COUNT(*) FROM memories WHERE memory_type = 'task') as total_tasks,
        (SELECT COUNT(*) FROM memories WHERE memory_type = 'task' AND metadata->>'status' = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM memories WHERE memory_type = 'task' AND metadata->>'status' = 'completed' AND (metadata->>'completed_at')::timestamp > NOW() - INTERVAL '24 hours') as recently_completed_tasks,
        (SELECT COUNT(*) FROM pattern_library_v2) as total_patterns,
        (SELECT COUNT(*) FROM unified_insights_v2) as total_insights
    `);
    
    metrics.database = dbStats.rows[0];

    // Memory statistics
    const memoryStats = await client.query(`
      SELECT 
        memory_type,
        COUNT(*) as count,
        AVG(importance_score) as avg_importance
      FROM memories
      GROUP BY memory_type
    `);
    
    metrics.memory_types = {};
    memoryStats.rows.forEach(row => {
      metrics.memory_types[row.memory_type] = {
        count: parseInt(row.count),
        avg_importance: parseFloat(row.avg_importance) || 0
      };
    });

    // Thinking statistics
    const thinkingStats = await client.query(`
      SELECT 
        AVG(0.5) as avg_confidence,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_duration_hours,
        COUNT(CASE WHEN is_complete = true THEN 1 END) as completed_count,
        COUNT(CASE WHEN EXISTS(SELECT 1 FROM thinking_branches tb WHERE tb.sequence_id = thinking_sequences.id) THEN 1 END) as branched_count
      FROM thinking_sequences
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);
    
    metrics.thinking = thinkingStats.rows[0];

    // Task statistics from task-type memories
    const taskStats = await client.query(`
      SELECT 
        metadata->>'task_type' as type,
        metadata->>'status' as status,
        COUNT(*) as count
      FROM memories
      WHERE memory_type = 'task'
      GROUP BY metadata->>'task_type', metadata->>'status'
    `);
    
    metrics.tasks = {};
    taskStats.rows.forEach(row => {
      if (!metrics.tasks[row.type]) {
        metrics.tasks[row.type] = {};
      }
      metrics.tasks[row.type][row.status] = parseInt(row.count);
    });

    // Activity metrics (last 24 hours)
    const activityStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM memories WHERE created_at > NOW() - INTERVAL '24 hours') as memories_24h,
        (SELECT COUNT(*) FROM thoughts WHERE created_at > NOW() - INTERVAL '24 hours') as thoughts_24h,
        (SELECT COUNT(*) FROM memories WHERE memory_type = 'task' AND created_at > NOW() - INTERVAL '24 hours') as tasks_created_24h,
        (SELECT COUNT(*) FROM memories WHERE memory_type = 'task' AND metadata->>'status' = 'completed' AND (metadata->>'completed_at')::timestamp > NOW() - INTERVAL '24 hours') as tasks_completed_24h
    `);
    
    metrics.activity_24h = activityStats.rows[0];

    // System health metrics
    metrics.health = {
      timestamp: new Date().toISOString(),
      collection_time_ms: Date.now() - client.query_start_time || 0
    };

    return metrics;
  }

  // Collect project-specific metrics
  async collectProjectMetrics(client, projectId) {
    const metrics = {};

    // Basic project stats
    const projectStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM memories WHERE project_id = $1) as memory_count,
        (SELECT COUNT(*) FROM memories WHERE project_id = $1 AND embedding IS NOT NULL) as embeddings_count,
        (SELECT COUNT(*) FROM sessions WHERE project_id = $1) as session_count,
        (SELECT COUNT(*) FROM sessions WHERE project_id = $1 AND is_active = true) as active_sessions,
        (SELECT COUNT(*) FROM thinking_sequences WHERE project_id = $1) as sequence_count,
        (SELECT COUNT(*) FROM memories WHERE project_id = $1 AND memory_type = 'task') as task_count,
        (SELECT COUNT(*) FROM memories WHERE project_id = $1 AND memory_type = 'task' AND metadata->>'status' = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM memories WHERE project_id = $1 AND memory_type = 'task' AND metadata->>'status' = 'completed') as completed_tasks
    `, [projectId]);
    
    metrics.counts = projectStats.rows[0];

    // Activity in last 24 hours
    const activityStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM memories WHERE project_id = $1 AND created_at > NOW() - INTERVAL '24 hours') as memories_24h,
        (SELECT COUNT(*) FROM memories WHERE project_id = $1 AND memory_type = 'task' AND created_at > NOW() - INTERVAL '24 hours') as tasks_created_24h,
        (SELECT COUNT(*) FROM memories WHERE project_id = $1 AND memory_type = 'task' AND metadata->>'status' = 'completed' AND (metadata->>'completed_at')::timestamp > NOW() - INTERVAL '24 hours') as tasks_completed_24h
    `, [projectId]);
    
    metrics.activity_24h = activityStats.rows[0];

    // Memory type distribution
    const memoryTypes = await client.query(`
      SELECT memory_type, COUNT(*) as count
      FROM memories
      WHERE project_id = $1
      GROUP BY memory_type
    `, [projectId]);
    
    metrics.memory_types = {};
    memoryTypes.rows.forEach(row => {
      metrics.memory_types[row.memory_type] = parseInt(row.count);
    });

    // Task type distribution from task-type memories
    const taskTypes = await client.query(`
      SELECT 
        metadata->>'task_type' as type, 
        metadata->>'status' as status, 
        COUNT(*) as count
      FROM memories
      WHERE project_id = $1 AND memory_type = 'task'
      GROUP BY metadata->>'task_type', metadata->>'status'
    `, [projectId]);
    
    metrics.task_breakdown = {};
    taskTypes.rows.forEach(row => {
      if (!metrics.task_breakdown[row.type]) {
        metrics.task_breakdown[row.type] = {};
      }
      metrics.task_breakdown[row.type][row.status] = parseInt(row.count);
    });

    return metrics;
  }

  // Get list of active projects
  async getActiveProjects(client) {
    const result = await client.query(`
      SELECT DISTINCT p.id, p.name
      FROM projects p
      WHERE EXISTS (
        SELECT 1 FROM memories m WHERE m.project_id = p.id AND m.created_at > NOW() - INTERVAL '7 days'
      ) OR EXISTS (
        SELECT 1 FROM sessions s WHERE s.project_id = p.id AND s.created_at > NOW() - INTERVAL '7 days'
      )
      ORDER BY p.name
    `);
    
    return result.rows;
  }

  // Save analytics snapshot
  async saveSnapshot(client, projectId, granularity, metrics) {
    await client.query(`
      INSERT INTO analytics_snapshots (snapshot_time, granularity, project_id, metrics)
      VALUES (NOW(), $1, $2, $3)
    `, [granularity, projectId, JSON.stringify(metrics)]);
  }

  // Create hourly/daily aggregates
  async checkAndCreateAggregates(client) {
    // Check if we need to create hourly aggregate
    const lastHour = await client.query(`
      SELECT MAX(snapshot_time) as last_snapshot
      FROM analytics_snapshots
      WHERE granularity = 'hour'
    `);
    
    const lastHourTime = lastHour.rows[0].last_snapshot || new Date(0);
    const hoursSinceLastAggregate = (Date.now() - new Date(lastHourTime).getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastAggregate >= 1) {
      await this.createHourlyAggregates(client);
    }

    // Check if we need to create daily aggregate
    const lastDay = await client.query(`
      SELECT MAX(snapshot_time) as last_snapshot
      FROM analytics_snapshots
      WHERE granularity = 'day'
    `);
    
    const lastDayTime = lastDay.rows[0].last_snapshot || new Date(0);
    const daysSinceLastAggregate = (Date.now() - new Date(lastDayTime).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastAggregate >= 1) {
      await this.createDailyAggregates(client);
    }
  }

  // Create hourly aggregates from minute data
  async createHourlyAggregates(client) {
    await client.query(`
      INSERT INTO analytics_snapshots (snapshot_time, granularity, project_id, metrics)
      SELECT 
        date_trunc('hour', snapshot_time) as hour,
        'hour' as granularity,
        project_id,
        jsonb_agg(metrics ORDER BY snapshot_time) as metrics
      FROM analytics_snapshots
      WHERE granularity = 'minute'
        AND snapshot_time >= date_trunc('hour', NOW() - INTERVAL '1 hour')
        AND snapshot_time < date_trunc('hour', NOW())
      GROUP BY date_trunc('hour', snapshot_time), project_id
      ON CONFLICT DO NOTHING
    `);
  }

  // Create daily aggregates from hour data
  async createDailyAggregates(client) {
    await client.query(`
      INSERT INTO analytics_snapshots (snapshot_time, granularity, project_id, metrics)
      SELECT 
        date_trunc('day', snapshot_time) as day,
        'day' as granularity,
        project_id,
        jsonb_agg(metrics ORDER BY snapshot_time) as metrics
      FROM analytics_snapshots
      WHERE granularity = 'hour'
        AND snapshot_time >= date_trunc('day', NOW() - INTERVAL '1 day')
        AND snapshot_time < date_trunc('day', NOW())
      GROUP BY date_trunc('day', snapshot_time), project_id
      ON CONFLICT DO NOTHING
    `);
  }

  // Clean up old snapshots based on retention policy
  async cleanupOldSnapshots(client) {
    const retentionDays = await this.config.getNumber('analytics_retention_days', 30);
    
    // Delete old minute-level data
    await client.query(`
      DELETE FROM analytics_snapshots
      WHERE granularity = 'minute'
        AND snapshot_time < NOW() - INTERVAL '1 day' * $1
    `, [Math.min(retentionDays, 7)]); // Keep minute data for max 7 days
    
    // Delete old hour-level data
    await client.query(`
      DELETE FROM analytics_snapshots
      WHERE granularity = 'hour'
        AND snapshot_time < NOW() - INTERVAL '1 day' * $1
    `, [retentionDays]);
    
    // Day-level data is kept indefinitely
  }

  // Get time-series data for a specific metric
  async getTimeSeries(metric, projectId = null, timeRange = '24 hours', granularity = 'minute') {
    const client = await this.db.getClient();
    try {
      let query = `
        SELECT 
          snapshot_time,
          metrics
        FROM analytics_snapshots
        WHERE granularity = $1
          AND snapshot_time > NOW() - INTERVAL $2
      `;
      
      const params = [granularity, timeRange];
      
      if (projectId) {
        query += ' AND project_id = $3';
        params.push(projectId);
      } else {
        query += ' AND project_id IS NULL';
      }
      
      query += ' ORDER BY snapshot_time ASC';
      
      const result = await client.query(query, params);
      
      // Extract specific metric from JSONB
      return result.rows.map(row => ({
        time: row.snapshot_time,
        value: this.extractMetricValue(row.metrics, metric)
      }));
    } finally {
      client.release();
    }
  }

  // Extract nested metric value from JSONB
  extractMetricValue(metrics, path) {
    const parts = path.split('.');
    let value = metrics;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return null;
      }
    }
    
    return value;
  }
}

export default AnalyticsCollector;