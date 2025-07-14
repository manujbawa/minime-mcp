/**
 * Memory Controller
 * Handles memory CRUD operations
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class MemoryController extends BaseController {
  constructor(services) {
    super(services);
    this.embeddingService = services.embedding;
    this.memorySearchService = services.memorySearch;
  }

  /**
   * List all memories (across all projects)
   */
  list = async (req, res) => {
    try {
      const { limit, offset } = this.parsePagination(req);
      const { 
        memory_type, 
        processing_status,
        search_query,
        order_by = 'created_at',
        order_direction = 'DESC',
        project_name,
        session_name,
        has_embedding
      } = req.query;

      // Build query
      let query = `
        SELECT m.id, m.project_id, m.session_id, m.content, m.memory_type,
               m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata,
               m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,
               p.name as project_name
        FROM memories m
        LEFT JOIN projects p ON m.project_id = p.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      // Apply filters
      if (memory_type) {
        query += ` AND m.memory_type = $${paramIndex++}`;
        params.push(memory_type);
      }

      if (project_name) {
        query += ` AND p.name = $${paramIndex++}`;
        params.push(project_name);
      }

      if (session_name) {
        query += ` AND m.session_name = $${paramIndex++}`;
        params.push(session_name);
      }

      if (processing_status) {
        query += ` AND m.processing_status = $${paramIndex++}`;
        params.push(processing_status);
      }

      if (search_query) {
        query += ` AND (m.content ILIKE $${paramIndex} OR m.smart_tags::text ILIKE $${paramIndex})`;
        params.push(`%${search_query}%`);
        paramIndex++;
      }

      if (has_embedding !== undefined) {
        query += has_embedding === 'true' 
          ? ` AND m.embedding IS NOT NULL`
          : ` AND m.embedding IS NULL`;
      }

      // Validate order_by column
      const validColumns = ['created_at', 'updated_at', 'memory_type', 'project_name'];
      const safeOrderBy = validColumns.includes(order_by) ? order_by : 'created_at';
      const safeDirection = order_direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Get total count
      const countQuery = query.replace(
        'SELECT m.id, m.project_id, m.session_id, m.content, m.memory_type,\n               m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata,\n               m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,\n               p.name as project_name',
        'SELECT COUNT(*) as total'
      );
      const countResult = await this.databaseService.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || 0);

      // Apply ordering and pagination
      query += ` ORDER BY m.${safeOrderBy} ${safeDirection}`;
      query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
      params.push(limit, offset);

      const result = await this.databaseService.query(query, params);

      res.json(ResponseUtil.paginated(
        result.rows,
        { limit, offset, total }
      ));
    } catch (error) {
      this.handleError(res, error, 'Failed to list memories');
    }
  }

  /**
   * Get memory count
   */
  count = async (req, res) => {
    try {
      const { memory_type, project_name, processing_status } = req.query;

      let query = `
        SELECT COUNT(*) as count
        FROM memories m
        LEFT JOIN projects p ON m.project_id = p.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (memory_type) {
        query += ` AND m.memory_type = $${paramIndex++}`;
        params.push(memory_type);
      }

      if (project_name) {
        query += ` AND p.name = $${paramIndex++}`;
        params.push(project_name);
      }

      if (processing_status) {
        query += ` AND m.processing_status = $${paramIndex++}`;
        params.push(processing_status);
      }

      const result = await this.databaseService.query(query, params);
      const count = parseInt(result.rows[0]?.count || 0);

      res.json(ResponseUtil.success({ count }));
    } catch (error) {
      this.handleError(res, error, 'Failed to get memory count');
    }
  }

  /**
   * Get specific memory by ID
   */
  get = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.databaseService.query(`
        SELECT m.id, m.project_id, m.session_id, m.content, m.memory_type,
               m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata,
               m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,
               p.name as project_name
        FROM memories m
        LEFT JOIN projects p ON m.project_id = p.id
        WHERE m.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error('Memory not found')
        );
      }

      res.json(ResponseUtil.success(result.rows[0]));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve memory');
    }
  }

  /**
   * Initialize MemoryStorageService using factory pattern
   * Centralizes configuration and eliminates duplicate initialization logic
   */
  async _getMemoryStorageService() {
    if (!this.memoryStorageService) {
      const { MemoryServiceFactory } = await import('../services/memory/memory-service-factory.js');
      this.memoryStorageService = await MemoryServiceFactory.createMemoryStorageService({
        logger: this.logger,
        databaseService: this.databaseService,
        eventEmitter: null
      }, {
        maxTagsPerMemory: 10, // API allows more tags than MCP default
        importanceScoreDefault: 0.6 // Higher default for API context
      });
    }
    return this.memoryStorageService;
  }

  /**
   * Create new memory using modular MemoryStorageService
   */
  create = async (req, res) => {
    try {
      const { 
        content, 
        memory_type,
        project_name,
        session_name,
        smart_tags = [],
        metadata = {},
        importance_score
      } = req.body;

      this.validateRequired({ content, project_name }, ['content', 'project_name']);

      // Get MemoryStorageService via factory
      const memoryStorage = await this._getMemoryStorageService();

      // Use modular memory storage service
      const result = await memoryStorage.store(content, {
        memoryType: memory_type,
        projectName: project_name,
        sessionName: session_name,
        importanceScore: importance_score,
        tags: smart_tags,
        metadata,
        format: 'api', // API format for HTTP responses
        enableEnhancements: true
      });

      this.logAction('Memory created via modular service', { 
        memoryId: result.id, 
        type: result.memory_type,
        project: project_name,
        autoDetected: result.detection?.autoDetected
      });

      res.status(HttpStatus.CREATED).json(
        ResponseUtil.created(result)
      );
    } catch (error) {
      this.handleError(res, error, 'Failed to create memory');
    }
  }

  /**
   * Update memory using modular MemoryStorageService
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Get MemoryStorageService via factory
      const memoryStorage = await this._getMemoryStorageService();

      // Map API fields to modular service format
      const updateData = {};
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.memory_type !== undefined) updateData.memoryType = updates.memory_type;
      if (updates.smart_tags !== undefined) updateData.tags = updates.smart_tags;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
      if (updates.session_name !== undefined) updateData.sessionName = updates.session_name;

      if (Object.keys(updateData).length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('No valid fields to update')
        );
      }

      // Use modular service to update memory
      const result = await memoryStorage.update(id, updateData, {
        format: 'api',
        enableEnhancements: true
      });

      this.logAction('Memory updated via modular service', { 
        memoryId: id,
        fieldsUpdated: Object.keys(updateData)
      });

      res.json(ResponseUtil.updated(result));
    } catch (error) {
      this.handleError(res, error, 'Failed to update memory');
    }
  }

  /**
   * Delete memory using modular MemoryStorageService
   */
  delete = async (req, res) => {
    try {
      const { id } = req.params;

      // Get MemoryStorageService via factory
      const memoryStorage = await this._getMemoryStorageService();

      // Use modular service to delete memory
      const result = await memoryStorage.delete(id, {
        format: 'api'
      });

      this.logAction('Memory deleted via modular service', { memoryId: id });

      res.json(ResponseUtil.deleted());
    } catch (error) {
      this.handleError(res, error, 'Failed to delete memory');
    }
  }

  /**
   * Search memories by similarity with hybrid search support
   */
  searchSimilar = async (req, res) => {
    try {
      // Support both GET and POST requests
      const params = req.method === 'GET' ? req.query : req.body;
      const { 
        query, 
        limit = 10, 
        threshold = 0.7, 
        project_name, 
        memory_type, 
        processing_status, 
        importance_min, 
        date_from,
        // Hybrid search parameters
        search_mode = 'hybrid',
        content_weight = 0.7,
        tag_weight = 0.3,
        enable_overlap_boost = true,
        enable_diversity = false
      } = params;

      this.validateRequired({ query }, ['query']);

      // Use MemorySearchService if available, otherwise fallback
      if (this.memorySearchService) {
        const searchResult = await this.memorySearchService.search(query, {
          projectName: project_name,
          memoryType: memory_type,
          processingStatus: processing_status,
          importanceMin: importance_min,
          dateFrom: date_from,
          limit,
          threshold,
          searchMode: search_mode,
          contentWeight: content_weight,
          tagWeight: tag_weight,
          enableOverlapBoost: enable_overlap_boost,
          enableDiversity: enable_diversity,
          format: 'raw'
        });

        // Include search metadata in response
        res.json(ResponseUtil.success({
          results: searchResult.results,
          total: searchResult.total,
          search_mode: searchResult.search_mode,
          search_capabilities: searchResult.search_capabilities,
          query: searchResult.query
        }));
      } else if (this.embeddingService) {
        // Fallback to embedding service (legacy)
        this.logger.warn('MemorySearchService not available, using embedding service fallback');
        const results = await this.embeddingService.searchSimilar(
          query,
          limit,
          threshold,
          project_name
        );
        res.json(ResponseUtil.success({
          results,
          total: results.length,
          search_mode: 'content_only',
          query
        }));
      } else {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Search service not available')
        );
      }
    } catch (error) {
      this.handleError(res, error, 'Failed to search memories');
    }
  }

  /**
   * Bulk create memories using modular MemoryStorageService
   */
  bulkCreate = async (req, res) => {
    try {
      const { memories } = req.body;

      if (!Array.isArray(memories) || memories.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Memories array is required')
        );
      }

      // Get MemoryStorageService via factory
      const memoryStorage = await this._getMemoryStorageService();

      // Use batch processing from modular service
      const memoriesData = memories.map(memory => ({
        content: memory.content,
        memoryType: memory.memory_type,
        projectName: memory.project_name,
        sessionName: memory.session_name,
        importanceScore: memory.importance_score,
        tags: memory.smart_tags || memory.tags || [],
        metadata: memory.metadata || {}
      }));

      const batchResult = await memoryStorage.storeBatch(memoriesData, {
        format: 'api',
        enableEnhancements: true,
        continueOnError: true
      });

      this.logAction('Bulk memories created via modular service', { 
        total: batchResult.summary.total,
        success: batchResult.summary.success,
        failed: batchResult.summary.failed
      });

      res.status(HttpStatus.CREATED).json(
        ResponseUtil.created({
          created: batchResult.results,
          errors: batchResult.errors,
          summary: batchResult.summary
        })
      );
    } catch (error) {
      this.handleError(res, error, 'Failed to bulk create memories');
    }
  }
}