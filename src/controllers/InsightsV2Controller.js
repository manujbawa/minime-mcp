/**
 * Insights V2 Controller
 * Handles unified insights v2 operations
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class InsightsV2Controller extends BaseController {
  constructor(services) {
    super(services);
    this.unifiedInsightsV2 = services.unifiedInsightsV2;
  }

  /**
   * Get insights from unified_insights_v2 with advanced filtering
   */
  getInsights = async (req, res) => {
    try {
      const { 
        category, 
        type,
        insight_type,
        project_id,
        project_name,
        source_type,
        actionable_only,
        min_confidence = 0,
        search,
        date_range,
        limit = 50,
        offset = 0 
      } = req.query;

      let query = `
        SELECT 
          ui.*,
          p.name as project_name,
          array_length(ui.source_ids, 1) as source_count
        FROM unified_insights_v2 ui
        LEFT JOIN projects p ON ui.project_id = p.id
        WHERE 1=1
          AND ui.insight_type != 'processing_marker'
          AND ui.confidence_score >= $1
      `;
      const params = [parseFloat(min_confidence)];
      let paramIndex = 2;

      if (category) {
        query += ` AND ui.insight_category = $${paramIndex++}`;
        params.push(category);
      }

      if (insight_type) {
        query += ` AND ui.insight_type = $${paramIndex++}`;
        params.push(insight_type);
      }

      if (project_id) {
        query += ` AND ui.project_id = $${paramIndex++}`;
        params.push(project_id);
      }

      if (actionable_only === 'true') {
        query += ` AND (ui.recommendations IS NOT NULL AND jsonb_array_length(ui.recommendations) > 0)`;
      }

      if (source_type && source_type !== 'all') {
        query += ` AND ui.source_type = $${paramIndex++}`;
        params.push(source_type);
      }

      if (project_name) {
        query += ` AND p.name = $${paramIndex++}`;
        params.push(project_name);
      }

      if (search) {
        query += ` AND (
          ui.title ILIKE $${paramIndex} OR 
          ui.summary ILIKE $${paramIndex} OR
          ui.tags::text ILIKE $${paramIndex} OR
          ui.technologies::text ILIKE $${paramIndex}
        )`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (date_range) {
        const dateFilter = this.getDateFilter(date_range);
        if (dateFilter) {
          query += ` AND ui.created_at > NOW() - INTERVAL '${dateFilter}'`;
        }
      }

      query += ` ORDER BY ui.confidence_score DESC, ui.created_at DESC`;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await this.databaseService.query(query, params);

      // Include cluster fields
      const insights = result.rows.map(row => ({
        id: row.id,
        category: row.insight_category,
        type: row.insight_type,
        insight: row.summary,
        title: row.title,
        confidence: row.confidence_score,
        key_findings: row.detailed_content?.key_findings || [row.title],
        tags: row.tags || [],
        actionable_advice: row.recommendations?.[0]?.action || row.custom_metadata?.actionable_advice,
        project_name: row.project_name,
        created_at: row.created_at,
        // Include v2 specific fields
        evidence: row.evidence || [],
        patterns: row.patterns || [],
        technologies: row.technologies || [],
        recommendations: row.recommendations || [],
        // Clustering fields
        source_type: row.source_type,
        source_ids: row.source_ids,
        detailed_content: row.detailed_content || {}
      }));

      res.json(ResponseUtil.success(insights));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve insights');
    }
  }

  /**
   * Get patterns from pattern_library_v2
   */
  getPatterns = async (req, res) => {
    try {
      const { 
        pattern_category,
        project_name,
        min_confidence = 0, 
        limit = 50,
        offset = 0
      } = req.query;

      let query = `
        SELECT 
          pl.*
        FROM pattern_library_v2 pl
        WHERE pl.confidence_score >= $1
      `;
      const params = [parseFloat(min_confidence)];
      let paramIndex = 2;

      if (pattern_category) {
        query += ` AND pl.pattern_category = $${paramIndex++}`;
        params.push(pattern_category);
      }

      if (project_name) {
        query += ` AND $${paramIndex++} = ANY(pl.projects_seen)`;
        params.push(project_name);
      }

      query += ` ORDER BY pl.confidence_score DESC, pl.frequency_count DESC`;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await this.databaseService.query(query, params);

      // Transform data for frontend compatibility
      const patterns = result.rows.map(row => ({
        id: row.id,
        pattern_name: row.pattern_name,
        pattern_type: row.pattern_category,
        description: row.description || row.pattern_signature,
        frequency: row.frequency_count,
        confidence: row.confidence_score,
        project_name: row.projects_seen && row.projects_seen.length > 0 ? row.projects_seen[0] : 'General',
        created_at: row.created_at,
        // Include v2 specific fields
        signature: row.pattern_signature,
        subcategory: row.pattern_subcategory,
        projects_seen: row.projects_seen,
        problem_statement: row.problem_statement,
        solution_approach: row.solution_approach,
        technologies: row.technologies || [],
        tags: row.tags || []
      }));

      res.json(ResponseUtil.success(patterns));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve patterns');
    }
  }

  /**
   * Get insights v2 system status
   */
  getStatus = async (req, res) => {
    try {
      // Get processing queue status
      const queueStatus = await this.databaseService.query(`
        SELECT 
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
        FROM insight_processing_queue_v2
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);

      // Get recent completions by project
      const recentCompletions = await this.databaseService.query(`
        SELECT 
          p.name as project_name, 
          COUNT(DISTINCT ui.id) as count, 
          MAX(ui.created_at) as last_processed
        FROM unified_insights_v2 ui
        JOIN projects p ON ui.project_id = p.id
        WHERE ui.created_at > NOW() - INTERVAL '24 hours'
        GROUP BY p.name
        ORDER BY last_processed DESC
        LIMIT 10
      `);

      // Get system metrics
      const metrics = await this.databaseService.query(`
        SELECT 
          (SELECT COUNT(*) FROM unified_insights_v2) as total_insights,
          (SELECT COUNT(*) FROM pattern_library_v2) as total_patterns,
          (SELECT COUNT(DISTINCT project_id) FROM unified_insights_v2) as active_projects,
          (SELECT COUNT(*) FROM unified_insights_v2 WHERE created_at > NOW() - INTERVAL '1 hour') as recent_insights
      `);

      // Check if v2 processor is healthy
      const isHealthy = this.unifiedInsightsV2?.isHealthy ? 
        await this.unifiedInsightsV2.isHealthy() : true;

      res.json(ResponseUtil.success({
        queue: queueStatus.rows[0],
        recentCompletions: recentCompletions.rows,
        metrics: metrics.rows[0],
        serviceHealth: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          enabled: !!this.unifiedInsightsV2,
          version: 'v2'
        },
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve status');
    }
  }

  /**
   * Get detailed monitoring data
   */
  getMonitoring = async (req, res) => {
    try {
      const monitoring = await this.databaseService.query(`
        WITH queue_stats AS (
          SELECT 
            COUNT(*) as total_items,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
            COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
            AVG(CASE 
              WHEN status = 'completed' AND started_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (completed_at - started_at)) 
            END) as avg_processing_time
          FROM insight_processing_queue_v2
        ),
        insight_stats AS (
          SELECT
            COUNT(*) as insights_generated,
            AVG(confidence_score) as avg_confidence,
            COUNT(DISTINCT insight_category) as categories_covered,
            COUNT(DISTINCT insight_type) as types_detected
          FROM unified_insights_v2
          WHERE created_at > NOW() - INTERVAL '24 hours'
        ),
        pattern_stats AS (
          SELECT
            COUNT(*) as patterns_detected,
            AVG(confidence_score) as avg_confidence,
            COUNT(DISTINCT pattern_category) as categories_covered,
            SUM(frequency_count) as total_frequency
          FROM pattern_library_v2
          WHERE created_at > NOW() - INTERVAL '24 hours'
        )
        SELECT 
          row_to_json(queue_stats) as queue,
          row_to_json(insight_stats) as insights,
          row_to_json(pattern_stats) as patterns
        FROM queue_stats, insight_stats, pattern_stats
      `);

      const stats = monitoring.rows[0];

      res.json(ResponseUtil.success({
        queueStatus: stats.queue,
        insightStats: stats.insights,
        patternStats: stats.patterns,
        systemInfo: {
          version: 'v2',
          enabled: !!this.unifiedInsightsV2,
          processorCount: 1
        },
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve monitoring data');
    }
  }

  /**
   * Trigger immediate analysis
   */
  triggerAnalysis = async (req, res) => {
    try {
      const { projectName, analysisType = 'full', options = {} } = req.body;

      this.validateRequired({ projectName }, ['projectName']);

      if (!this.unifiedInsightsV2) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Unified Insights v2 service not available')
        );
      }

      // Check if project exists
      const project = await this.databaseService.getProject(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Get memories for the project
      const memories = await this.databaseService.query(`
        SELECT * FROM memories 
        WHERE project_id = $1 
        AND processing_status = 'ready'
        ORDER BY importance_score DESC, created_at DESC
        LIMIT 100
      `, [project.id]);

      if (memories.rows.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('No memories available for analysis in this project')
        );
      }

      // Process memories through v2 system
      const results = [];
      for (const memory of memories.rows) {
        try {
          const result = await this.unifiedInsightsV2.processMemory(memory, {
            realTime: true,
            comprehensive: analysisType === 'full',
            ...options
          });
          results.push(result);
        } catch (error) {
          this.logger.error(`Failed to process memory ${memory.id}:`, error);
        }
      }

      this.logAction('Insights v2 analysis triggered', { projectName, analysisType });

      res.json(ResponseUtil.success({
        projectName,
        analysisType,
        status: 'completed',
        memoriesProcessed: memories.rows.length,
        insightsGenerated: results.reduce((sum, r) => sum + (r.insights?.length || 0), 0),
        patternsDetected: results.reduce((sum, r) => sum + (r.patterns?.length || 0), 0)
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to trigger analysis');
    }
  }

  /**
   * Get insight categories
   */
  getCategories = async (req, res) => {
    try {
      const result = await this.databaseService.query(`
        SELECT DISTINCT 
          insight_category as category,
          COUNT(*) as count
        FROM unified_insights_v2
        GROUP BY insight_category
        ORDER BY count DESC
      `);

      res.json(ResponseUtil.success(result.rows));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve categories');
    }
  }

  /**
   * Get pattern categories
   */
  getPatternCategories = async (req, res) => {
    try {
      const result = await this.databaseService.query(`
        SELECT DISTINCT 
          pattern_category as category,
          COUNT(*) as count,
          AVG(confidence_score) as avg_confidence
        FROM pattern_library_v2
        GROUP BY pattern_category
        ORDER BY count DESC
      `);

      res.json(ResponseUtil.success(result.rows));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve pattern categories');
    }
  }

  /**
   * Get insight metrics
   */
  getInsightMetrics = async (req, res) => {
    try {
      const { project_id, date_range } = req.query;
      
      let whereClause = 'WHERE ui.insight_type != \'processing_marker\'';
      const params = [];
      
      if (project_id) {
        whereClause += ' AND ui.project_id = $1';
        params.push(project_id);
      }
      
      if (date_range) {
        const dateFilter = this.getDateFilter(date_range);
        if (dateFilter) {
          whereClause += ` AND ui.created_at > NOW() - INTERVAL '${dateFilter}'`;
        }
      }

      const metrics = await this.databaseService.query(`
        WITH insight_data AS (
          SELECT * FROM unified_insights_v2 ui ${whereClause}
        ),
        category_counts AS (
          SELECT 
            insight_category,
            COUNT(*) as count
          FROM insight_data
          GROUP BY insight_category
        ),
        type_counts AS (
          SELECT 
            insight_type,
            COUNT(*) as count
          FROM insight_data
          GROUP BY insight_type
        ),
        confidence_distribution AS (
          SELECT
            COUNT(CASE WHEN confidence_score > 0.8 THEN 1 END) as high,
            COUNT(CASE WHEN confidence_score BETWEEN 0.5 AND 0.8 THEN 1 END) as medium,
            COUNT(CASE WHEN confidence_score < 0.5 THEN 1 END) as low
          FROM insight_data
        ),
        source_distribution AS (
          SELECT
            COUNT(CASE WHEN source_type = 'memory' THEN 1 END) as memory,
            COUNT(CASE WHEN source_type = 'cluster' THEN 1 END) as cluster
          FROM insight_data
        ),
        daily_trend AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count,
            AVG(confidence_score) as avg_confidence
          FROM insight_data
          WHERE created_at > NOW() - INTERVAL '30 days'
          GROUP BY DATE(created_at)
          ORDER BY date
        )
        SELECT 
          (SELECT json_object_agg(insight_category, count) FROM category_counts) as by_category,
          (SELECT json_object_agg(insight_type, count) FROM type_counts) as by_type,
          (SELECT row_to_json(confidence_distribution) FROM confidence_distribution) as by_confidence,
          (SELECT row_to_json(source_distribution) FROM source_distribution) as by_source,
          (SELECT json_agg(row_to_json(daily_trend)) FROM daily_trend) as trend
      `, params);

      res.json(ResponseUtil.success(metrics.rows[0]));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve insight metrics');
    }
  }

  /**
   * Get cluster metrics
   */
  getClusterMetrics = async (req, res) => {
    try {
      const metrics = await this.databaseService.query(`
        WITH cluster_insights AS (
          SELECT 
            ui.*,
            ui.detailed_content->>'cluster_size' as cluster_size_str,
            ui.detailed_content->>'memory_type' as memory_type,
            ui.detailed_content->'time_span'->>'days' as time_span_days
          FROM unified_insights_v2 ui
          WHERE ui.source_type = 'cluster'
        ),
        cluster_stats AS (
          SELECT 
            COUNT(*) as total_clusters,
            AVG(CAST(cluster_size_str AS INTEGER)) as avg_cluster_size,
            MAX(CAST(cluster_size_str AS INTEGER)) as max_cluster_size,
            MIN(created_at) as earliest_cluster,
            MAX(created_at) as latest_cluster
          FROM cluster_insights
          WHERE cluster_size_str IS NOT NULL
        ),
        largest_cluster AS (
          SELECT 
            id,
            title,
            CAST(cluster_size_str AS INTEGER) as size,
            memory_type
          FROM cluster_insights
          WHERE cluster_size_str IS NOT NULL
          ORDER BY CAST(cluster_size_str AS INTEGER) DESC
          LIMIT 1
        ),
        common_patterns AS (
          SELECT 
            p.pattern_name as pattern,
            COUNT(*) as frequency,
            AVG(p.confidence_score) as confidence
          FROM pattern_library_v2 p
          WHERE p.frequency_count > 2
          GROUP BY p.pattern_name
          ORDER BY COUNT(*) DESC
          LIMIT 5
        )
        SELECT 
          (SELECT row_to_json(cluster_stats) FROM cluster_stats) as stats,
          (SELECT row_to_json(largest_cluster) FROM largest_cluster) as largest,
          (SELECT json_agg(row_to_json(common_patterns)) FROM common_patterns) as patterns
      `);

      const result = metrics.rows[0];
      const response = {
        total_clusters: result.stats?.total_clusters || 0,
        avg_cluster_size: result.stats?.avg_cluster_size || 0,
        largest_cluster: result.largest ? {
          size: result.largest.size,
          type: result.largest.memory_type,
          id: result.largest.id
        } : null,
        time_coverage: result.stats ? {
          start: result.stats.earliest_cluster,
          end: result.stats.latest_cluster,
          days: result.stats.earliest_cluster && result.stats.latest_cluster ?
            Math.ceil((new Date(result.stats.latest_cluster) - new Date(result.stats.earliest_cluster)) / (1000 * 60 * 60 * 24)) : 0
        } : null,
        common_patterns: result.patterns || []
      };

      res.json(ResponseUtil.success(response));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve cluster metrics');
    }
  }

  /**
   * Search insights with semantic search
   */
  searchInsights = async (req, res) => {
    try {
      const { query, limit = 20, min_confidence = 0.3 } = req.body;
      
      if (!query) {
        return res.status(400).json(
          ResponseUtil.error('Search query is required')
        );
      }

      // For now, use text search. In production, this would use embeddings
      const results = await this.databaseService.query(`
        SELECT 
          ui.*,
          p.name as project_name,
          ts_rank_cd(to_tsvector('english', 
            coalesce(ui.title, '') || ' ' || 
            coalesce(ui.summary, '') || ' ' ||
            coalesce(ui.tags::text, '') || ' ' ||
            coalesce(ui.technologies::text, '')
          ), plainto_tsquery('english', $1)) as rank
        FROM unified_insights_v2 ui
        LEFT JOIN projects p ON ui.project_id = p.id
        WHERE ui.confidence_score >= $2
          AND ui.insight_type != 'processing_marker'
          AND (
            ui.title ILIKE $3 OR 
            ui.summary ILIKE $3 OR
            ui.tags::text ILIKE $3 OR
            ui.technologies::text ILIKE $3
          )
        ORDER BY rank DESC, ui.confidence_score DESC
        LIMIT $4
      `, [query, parseFloat(min_confidence), `%${query}%`, parseInt(limit)]);

      const insights = results.rows.map(row => ({
        id: row.id,
        category: row.insight_category,
        type: row.insight_type,
        insight: row.summary,
        title: row.title,
        confidence: row.confidence_score,
        key_findings: row.detailed_content?.key_findings || [row.title],
        tags: row.tags || [],
        actionable_advice: row.recommendations?.[0]?.action || row.custom_metadata?.actionable_advice,
        project_name: row.project_name,
        created_at: row.created_at,
        evidence: row.evidence || [],
        patterns: row.patterns || [],
        technologies: row.technologies || [],
        recommendations: row.recommendations || [],
        source_type: row.source_type,
        source_ids: row.source_ids,
        detailed_content: row.detailed_content || {},
        relevance_score: row.rank
      }));

      res.json(ResponseUtil.success(insights));
    } catch (error) {
      this.handleError(res, error, 'Failed to search insights');
    }
  }

  /**
   * Helper to convert date range to interval
   */
  getDateFilter(dateRange) {
    const filters = {
      '1d': '1 day',
      '7d': '7 days',
      '30d': '30 days',
      '3m': '3 months',
      '1y': '1 year'
    };
    return filters[dateRange] || null;
  }
}