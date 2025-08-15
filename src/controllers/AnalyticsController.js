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

  /**
   * Get token usage analytics
   */
  getTokenAnalytics = async (req, res) => {
    try {
      const { project_name, memory_type, limit = 10 } = req.query;

      // Get project-level token usage
      const projectTokens = await this.getProjectTokenUsage(project_name);
      
      // Get token usage by memory type
      const typeBreakdown = await this.getTokensByMemoryType(project_name);
      
      // Get top token-consuming memories
      const topMemories = await this.getTopTokenMemories(project_name, memory_type, limit);
      
      // Get token usage over time
      const tokenTrends = await this.getTokenTrends(project_name);

      res.json(ResponseUtil.success({
        summary: projectTokens,
        byType: typeBreakdown,
        topMemories,
        trends: tokenTrends,
        generatedAt: new Date().toISOString()
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve token analytics');
    }
  }

  /**
   * Get memory-level token details
   */
  getMemoryTokenDetails = async (req, res) => {
    try {
      const { project_id, limit = 50, offset = 0 } = req.query;

      const result = await this.databaseService.query(`
        SELECT 
          m.id,
          m.content,
          m.memory_type,
          m.token_metadata,
          m.created_at,
          m.updated_at,
          p.name as project_name
        FROM memories m
        JOIN projects p ON m.project_id = p.id
        WHERE ($1::int IS NULL OR m.project_id = $1)
          AND m.token_metadata IS NOT NULL
        ORDER BY (m.token_metadata->>'total_tokens')::int DESC NULLS LAST
        LIMIT $2 OFFSET $3
      `, [project_id || null, limit, offset]);

      const memories = result.rows.map(row => ({
        id: row.id,
        content: row.content.substring(0, 100) + '...',
        memory_type: row.memory_type,
        project_name: row.project_name,
        tokens: row.token_metadata || {},
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      res.json(ResponseUtil.success({
        memories,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: memories.length
        }
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve memory token details');
    }
  }

  // Helper methods for token analytics
  async getProjectTokenUsage(projectName) {
    const whereClause = projectName ? 'WHERE p.name = $1' : '';
    const params = projectName ? [projectName] : [];
    
    const result = await this.databaseService.query(`
      SELECT 
        COUNT(m.id) as total_memories,
        COUNT(m.token_metadata) as memories_with_tokens,
        COALESCE(SUM((m.token_metadata->>'total_tokens')::int), 0) as total_tokens,
        COALESCE(SUM((m.token_metadata->>'content_tokens')::int), 0) as content_tokens,
        COALESCE(SUM((m.token_metadata->>'summary_tokens')::int), 0) as summary_tokens,
        COALESCE(SUM((m.token_metadata->>'tags_tokens')::int), 0) as tags_tokens,
        COALESCE(AVG((m.token_metadata->>'total_tokens')::int), 0)::int as avg_tokens_per_memory
      FROM memories m
      JOIN projects p ON m.project_id = p.id
      ${whereClause}
    `, params);
    
    return result.rows[0];
  }

  async getTokensByMemoryType(projectName) {
    const whereClause = projectName ? 'WHERE p.name = $1' : '';
    const params = projectName ? [projectName] : [];
    
    const result = await this.databaseService.query(`
      SELECT 
        m.memory_type,
        COUNT(m.id) as count,
        COALESCE(SUM((m.token_metadata->>'total_tokens')::int), 0) as total_tokens,
        COALESCE(AVG((m.token_metadata->>'total_tokens')::int), 0)::int as avg_tokens
      FROM memories m
      JOIN projects p ON m.project_id = p.id
      ${whereClause}
      GROUP BY m.memory_type
      ORDER BY total_tokens DESC
    `, params);
    
    return result.rows;
  }

  async getTopTokenMemories(projectName, memoryType, limit) {
    const conditions = [];
    const params = [];
    
    if (projectName) {
      params.push(projectName);
      conditions.push(`p.name = $${params.length}`);
    }
    
    if (memoryType) {
      params.push(memoryType);
      conditions.push(`m.memory_type = $${params.length}`);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit);
    
    const result = await this.databaseService.query(`
      SELECT 
        m.id,
        m.memory_type,
        p.name as project_name,
        SUBSTRING(m.content, 1, 100) as content_preview,
        m.token_metadata,
        m.created_at
      FROM memories m
      JOIN projects p ON m.project_id = p.id
      ${whereClause}
      ORDER BY (m.token_metadata->>'total_tokens')::int DESC NULLS LAST
      LIMIT $${params.length}
    `, params);
    
    return result.rows;
  }

  async getTokenTrends(projectName) {
    const whereClause = projectName ? 'AND p.name = $1' : '';
    const params = projectName ? [projectName] : [];
    
    const result = await this.databaseService.query(`
      SELECT 
        DATE_TRUNC('day', m.created_at) as date,
        COUNT(m.id) as memories_created,
        COALESCE(SUM((m.token_metadata->>'total_tokens')::int), 0) as tokens_added
      FROM memories m
      JOIN projects p ON m.project_id = p.id
      WHERE m.created_at > NOW() - INTERVAL '30 days'
        ${whereClause}
      GROUP BY DATE_TRUNC('day', m.created_at)
      ORDER BY date
    `, params);
    
    return result.rows;
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