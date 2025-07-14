/**
 * Analytics Controller
 * Handles analytics data retrieval and aggregation
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class AnalyticsController extends BaseController {
  constructor(services) {
    super(services);
    this.analyticsCollector = services.analytics;
    this.thinkingService = services.thinking;
  }

  /**
   * Get comprehensive analytics
   */
  getAnalytics = async (req, res) => {
    try {
      const { project_name = 'all', timeframe = '30 days' } = req.query;

      // Database statistics
      const dbStats = await this.getDatabaseStats();
      
      // Memory distribution
      const memoryDistribution = await this.getMemoryDistribution(project_name);
      
      // Project breakdown
      const projectBreakdown = await this.getProjectBreakdown();
      
      // Time series data
      const timeSeries = await this.getTimeSeriesData(project_name, timeframe);
      
      // Health metrics
      const healthMetrics = await this.getHealthMetrics();
      
      // Insights summary
      const insightsSummary = await this.getInsightsSummary(project_name);
      
      // Patterns summary
      const patternsSummary = await this.getPatternsSummary(project_name);

      res.json(ResponseUtil.success({
        database: dbStats,
        memoryDistribution,
        projectBreakdown,
        timeSeries,
        health: healthMetrics,
        insights: insightsSummary,
        patterns: patternsSummary,
        generatedAt: new Date().toISOString()
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve analytics');
    }
  }

  /**
   * Get time series analytics
   */
  getTimeSeries = async (req, res) => {
    try {
      const { metric, project_name, timeRange = '24 hours', granularity = 'minute' } = req.query;

      if (!metric) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Metric parameter is required')
        );
      }

      const data = await this.analyticsCollector.getTimeSeriesData(
        metric,
        timeRange,
        granularity,
        project_name
      );

      res.json(ResponseUtil.success({
        metric,
        timeRange,
        granularity,
        projectName: project_name || 'all',
        data
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve time series data');
    }
  }

  /**
   * Get dashboard analytics
   */
  getDashboard = async (req, res) => {
    try {
      const { project_name, timeRange = '24 hours' } = req.query;

      const [memoryGrowth, taskActivity, thinkingActivity, completionRate] = await Promise.all([
        this.analyticsCollector.getTimeSeriesData('memory_created', timeRange, 'hour', project_name),
        this.analyticsCollector.getTimeSeriesData('task_created', timeRange, 'hour', project_name),
        this.analyticsCollector.getTimeSeriesData('thinking_started', timeRange, 'hour', project_name),
        this.getCompletionRate(project_name, timeRange)
      ]);

      res.json(ResponseUtil.success({
        timeRange,
        projectName: project_name || 'all',
        metrics: {
          memoryGrowth,
          taskActivity,
          thinkingActivity,
          completionRate
        },
        generatedAt: new Date().toISOString()
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve dashboard data');
    }
  }

  // Helper methods
  async getDatabaseStats() {
    const stats = await this.databaseService.query(`
      SELECT 
        (SELECT COUNT(*) FROM memories) as total_memories,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM unified_insights_v2) as total_insights,
        (SELECT COUNT(*) FROM pattern_library_v2) as total_patterns,
        (SELECT COUNT(*) FROM thinking_sequences) as total_thinking_sequences
    `);
    return stats.rows[0];
  }

  async getMemoryDistribution(projectName) {
    let query = `
      SELECT m.memory_type, COUNT(*) as count
      FROM memories m
    `;
    const params = [];
    
    if (projectName && projectName !== 'all') {
      query += ' JOIN projects p ON m.project_id = p.id WHERE p.name = $1';
      params.push(projectName);
    }
    
    query += ' GROUP BY m.memory_type ORDER BY count DESC';
    
    const result = await this.databaseService.query(query, params);
    
    // Transform the results to match expected format
    return result.rows.map(row => ({
      name: row.memory_type,
      value: parseInt(row.count)
    }));
  }

  async getProjectBreakdown() {
    const result = await this.databaseService.query(`
      SELECT 
        p.name,
        COUNT(DISTINCT m.id) as memory_count,
        COUNT(DISTINCT m.session_id) as session_count,
        COUNT(DISTINCT ai.id) as insight_count,
        MAX(m.created_at) as last_activity
      FROM projects p
      LEFT JOIN memories m ON p.id = m.project_id
      LEFT JOIN unified_insights_v2 ai ON p.id = ai.project_id
      GROUP BY p.name
      ORDER BY memory_count DESC
    `);
    return result.rows;
  }

  async getTimeSeriesData(projectName, timeframe) {
    const interval = this.getIntervalFromTimeframe(timeframe);
    
    let query = `
      SELECT 
        date_trunc($1, m.created_at) as time_bucket,
        COUNT(*) as memories,
        COUNT(DISTINCT m.memory_type) as types,
        AVG(m.importance_score) as avg_importance
      FROM memories m
    `;
    const params = [interval];
    
    if (projectName && projectName !== 'all') {
      query += ' JOIN projects p ON m.project_id = p.id WHERE p.name = $2';
      params.push(projectName);
    }
    
    query += ` 
      GROUP BY time_bucket 
      ORDER BY time_bucket ASC 
      LIMIT 100
    `;
    
    const result = await this.databaseService.query(query, params);
    
    // Format the data for the frontend chart
    return result.rows.map(row => ({
      date: row.time_bucket.toISOString().split('T')[0], // Format as YYYY-MM-DD
      memories: parseInt(row.memories),
      types: parseInt(row.types),
      importance: parseFloat(row.avg_importance || 0),
      // Add cumulative count for better visualization
      cumulative: 0 // Will be calculated below
    }));
  }

  async getHealthMetrics() {
    const result = await this.databaseService.query(`
      SELECT 
        (SELECT COUNT(*) FROM memories WHERE embedding IS NULL) as memories_without_embeddings,
        (SELECT COUNT(*) FROM memories WHERE created_at > NOW() - INTERVAL '1 hour') as recent_memories,
        (SELECT COUNT(*) FROM unified_insights_v2 WHERE created_at > NOW() - INTERVAL '1 day') as recent_insights,
        (SELECT COUNT(DISTINCT m.project_id) FROM memories m WHERE m.created_at > NOW() - INTERVAL '7 days') as active_projects
    `);
    return result.rows[0];
  }

  async getInsightsSummary(projectName) {
    let query = `
      SELECT 
        ai.insight_category as category,
        COUNT(*) as count,
        AVG(ai.confidence_score) as avg_confidence
      FROM unified_insights_v2 ai
    `;
    const params = [];
    
    if (projectName && projectName !== 'all') {
      query += ' JOIN projects p ON ai.project_id = p.id WHERE p.name = $1';
      params.push(projectName);
    }
    
    query += ' GROUP BY ai.insight_category ORDER BY count DESC';
    
    const result = await this.databaseService.query(query, params);
    return result.rows;
  }

  async getPatternsSummary(projectName) {
    let query = `
      SELECT 
        cp.pattern_category as pattern_type,
        COUNT(*) as count,
        AVG(cp.confidence_score) as avg_confidence,
        AVG(cp.frequency_count) as avg_frequency
      FROM pattern_library_v2 cp
    `;
    const params = [];
    
    if (projectName && projectName !== 'all') {
      query += ' WHERE $1 = ANY(cp.projects_seen)';
      params.push(projectName);
    }
    
    query += ' GROUP BY cp.pattern_category ORDER BY count DESC';
    
    const result = await this.databaseService.query(query, params);
    return result.rows;
  }

  async getCompletionRate(projectName, timeRange) {
    const interval = this.getIntervalFromTimeframe(timeRange);
    
    let query = `
      SELECT 
        date_trunc($1, m.created_at) as time_bucket,
        COUNT(CASE WHEN m.metadata->>'status' = 'completed' THEN 1 END)::float / 
        NULLIF(COUNT(*), 0) as completion_rate
      FROM memories m
    `;
    const params = [interval];
    
    if (projectName && projectName !== 'all') {
      query += ' JOIN projects p ON m.project_id = p.id WHERE p.name = $2 AND m.memory_type = \'progress\'';
      params.push(projectName);
    } else {
      query += ' WHERE m.memory_type = \'progress\'';
    }
    
    query += ' GROUP BY time_bucket ORDER BY time_bucket DESC LIMIT 100';
    
    const result = await this.databaseService.query(query, params);
    return result.rows;
  }

  getIntervalFromTimeframe(timeframe) {
    if (timeframe.includes('hour')) return 'minute';
    if (timeframe.includes('day')) return 'hour';
    if (timeframe.includes('week')) return 'day';
    if (timeframe.includes('month')) return 'day';
    return 'hour';
  }
}