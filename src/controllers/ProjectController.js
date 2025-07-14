/**
 * Project Controller
 * Handles project management operations
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class ProjectController extends BaseController {
  constructor(services) {
    super(services);
  }

  /**
   * List all projects
   */
  list = async (req, res) => {
    try {
      const projects = await this.databaseService.listProjects();
      res.json(ResponseUtil.success(projects));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve projects');
    }
  }

  /**
   * Create new project
   */
  create = async (req, res) => {
    try {
      const { name, description } = req.body;
      
      this.validateRequired({ name }, ['name']);

      // Check if project already exists
      const existing = await this.databaseService.getProjectByName(name);
      if (existing) {
        return res.status(HttpStatus.CONFLICT).json(
          ResponseUtil.error(`Project '${name}' already exists`)
        );
      }

      const project = await this.databaseService.createProject(name, description);
      this.logAction('Project created', { projectName: name });

      res.status(HttpStatus.CREATED).json(
        ResponseUtil.created(project)
      );
    } catch (error) {
      this.handleError(res, error, 'Failed to create project');
    }
  }

  /**
   * Get specific project details
   */
  get = async (req, res) => {
    try {
      const { projectName } = req.params;
      
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Get project with stats by using listProjects and filtering
      const projectsWithStats = await this.databaseService.listProjects(true);
      const projectWithStats = projectsWithStats.find(p => p.name === projectName);
      
      res.json(ResponseUtil.success({
        ...project,
        session_count: projectWithStats?.session_count || 0,
        memory_count: projectWithStats?.memory_count || 0,
        thinking_sequence_count: projectWithStats?.thinking_sequence_count || 0,
        last_activity: projectWithStats?.last_activity || project.updated_at
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve project');
    }
  }

  /**
   * Delete project and all associated data
   */
  delete = async (req, res) => {
    try {
      const { projectName } = req.params;
      
      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Delete project and all associated data (CASCADE handles everything)
      const result = await this.databaseService.deleteProject(project.id);
      
      this.logAction('Project deleted', { 
        projectName,
        deletedCounts: result
      });

      res.json(ResponseUtil.deleted(`Project '${projectName}' and all associated data deleted`));
    } catch (error) {
      this.handleError(res, error, 'Failed to delete project');
    }
  }

  /**
   * Get project sessions
   */
  getSessions = async (req, res) => {
    try {
      const { projectName } = req.params;
      const { limit, offset } = this.parsePagination(req);
      
      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Get unique sessions
      const result = await this.databaseService.query(`
        SELECT DISTINCT s.session_name, 
               MIN(m.created_at) as first_activity,
               MAX(m.created_at) as last_activity,
               COUNT(*) as memory_count
        FROM memories m
        JOIN sessions s ON m.session_id = s.id
        WHERE s.project_id = $1 AND s.session_name IS NOT NULL
        GROUP BY s.session_name
        ORDER BY last_activity DESC
        LIMIT $2 OFFSET $3
      `, [project.id, limit, offset]);

      const total = await this.databaseService.query(`
        SELECT COUNT(DISTINCT s.session_name) as count
        FROM memories m
        JOIN sessions s ON m.session_id = s.id
        WHERE s.project_id = $1 AND s.session_name IS NOT NULL
      `, [project.id]);

      res.json(ResponseUtil.paginated(
        result.rows,
        { limit, offset, total: parseInt(total.rows[0].count) }
      ));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve sessions');
    }
  }

  /**
   * Create new session for project
   */
  createSession = async (req, res) => {
    try {
      const { projectName } = req.params;
      const { sessionName, metadata } = req.body;
      
      this.validateRequired({ sessionName }, ['sessionName']);

      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Get or create session
      const session = await this._getOrCreateSession(project.id, sessionName);

      // Create initial memory for session
      const memory = await this.databaseService.query(`
        INSERT INTO memories 
        (project_id, session_id, content, memory_type, importance_score, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        project.id,
        session.id,
        `Session '${sessionName}' started`,
        'note',
        0.3,
        JSON.stringify(metadata || {})
      ]);

      this.logAction('Session created', { projectName, sessionName });

      res.status(HttpStatus.CREATED).json(
        ResponseUtil.created({
          projectName,
          sessionName,
          createdAt: memory.rows[0].created_at
        })
      );
    } catch (error) {
      this.handleError(res, error, 'Failed to create session');
    }
  }

  /**
   * Get project memories
   */
  getMemories = async (req, res) => {
    try {
      const { projectName } = req.params;
      const { limit, offset } = this.parsePagination(req);
      const filters = this.parseFilters(req, [
        'memory_type', 'session_name', 'processing_status', 'search', 'startDate', 'endDate'
      ]);

      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Build query
      let query = 'SELECT * FROM memories WHERE project_id = $1';
      const params = [project.id];
      let paramIndex = 2;

      if (filters.memory_type) {
        query += ` AND memory_type = $${paramIndex++}`;
        params.push(filters.memory_type);
      }

      if (filters.session_name) {
        query += ` AND session_id IN (SELECT id FROM sessions WHERE project_id = $1 AND session_name = $${paramIndex++})`;
        params.push(filters.session_name);
      }

      if (filters.processing_status) {
        query += ` AND processing_status = $${paramIndex++}`;
        params.push(filters.processing_status);
      }

      if (filters.search) {
        query += ` AND content ILIKE $${paramIndex++}`;
        params.push(`%${filters.search}%`);
      }

      if (filters.startDate) {
        query += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.endDate);
      }

      // Get total count
      const countResult = await this.databaseService.query(
        query.replace('SELECT *', 'SELECT COUNT(*)'),
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      query += ` ORDER BY created_at DESC`;
      if (limit !== null) {
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);
      } else if (offset > 0) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }
      
      const result = await this.databaseService.query(query, params);

      res.json(ResponseUtil.paginated(
        result.rows,
        { limit, offset, total }
      ));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve memories');
    }
  }

  /**
   * Delete all memories for a project
   */
  deleteMemories = async (req, res) => {
    try {
      const { projectName } = req.params;
      const { sessionName, memoryType } = req.query;

      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Build delete query
      let query = 'DELETE FROM memories WHERE project_id = $1';
      const params = [project.id];
      let paramIndex = 2;

      if (sessionName) {
        query += ` AND session_id IN (SELECT id FROM sessions WHERE project_id = $1 AND session_name = $${paramIndex++})`;
        params.push(sessionName);
      }

      if (memoryType) {
        query += ` AND memory_type = $${paramIndex++}`;
        params.push(memoryType);
      }

      const result = await this.databaseService.query(query, params);
      const deletedCount = result.rowCount || 0;

      this.logAction('Memories deleted', { 
        projectName, 
        sessionName, 
        memoryType, 
        count: deletedCount 
      });

      res.json(ResponseUtil.deleted(
        `Deleted ${deletedCount} memories from project '${projectName}'`
      ));
    } catch (error) {
      this.handleError(res, error, 'Failed to delete memories');
    }
  }

  /**
   * Get project thinking sequences
   */
  getThinking = async (req, res) => {
    try {
      const { projectName } = req.params;
      const { limit, offset } = this.parsePagination(req);
      const { status } = req.query;

      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Get thinking sequences directly from database (following modular pattern)
      let baseQuery = `
        FROM thinking_sequences ts
        WHERE ts.project_id = $1
      `;
      const params = [project.id];
      let paramIndex = 2;

      if (status) {
        if (status === 'complete') {
          baseQuery += ` AND ts.is_complete = true`;
        } else if (status === 'active') {
          baseQuery += ` AND ts.is_complete = false`;
        }
      }

      // Get total count first
      const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
      const countResult = await this.databaseService.query(countQuery, params);
      const total = parseInt(countResult.rows[0]?.total || 0);

      // Get sequences with thought counts using subquery
      let query = `
        SELECT ts.id, ts.sequence_name, ts.description, ts.goal, ts.is_complete,
               ts.created_at, ts.updated_at,
               (SELECT COUNT(*) FROM thoughts t WHERE t.sequence_id = ts.id) as thought_count
        ${baseQuery}
        ORDER BY ts.created_at DESC
      `;
      if (limit !== null) {
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);
      } else if (offset > 0) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }

      const result = await this.databaseService.query(query, params);

      res.json(ResponseUtil.paginated(
        result.rows,
        { limit, offset, total }
      ));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve thinking sequences');
    }
  }

  /**
   * Get detailed thinking sequence with thoughts
   */
  getThinkingSequenceDetails = async (req, res) => {
    try {
      const { sequenceId } = req.params;

      // Get sequence with thoughts
      const sequenceQuery = `
        SELECT ts.id, ts.sequence_name, ts.description, ts.goal, ts.is_complete,
               ts.created_at, ts.updated_at, ts.completion_summary
        FROM thinking_sequences ts
        WHERE ts.id = $1
      `;
      const sequenceResult = await this.databaseService.query(sequenceQuery, [sequenceId]);

      if (sequenceResult.rows.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Thinking sequence ${sequenceId} not found`)
        );
      }

      const sequence = sequenceResult.rows[0];

      // Get all thoughts for this sequence
      const thoughtsQuery = `
        SELECT t.id, t.thought_number, t.total_thoughts, t.content, t.thought_type,
               t.confidence_level, t.next_thought_needed, t.is_revision,
               t.revises_thought_id, t.branch_from_thought_id, t.branch_id,
               t.metadata, t.created_at
        FROM thoughts t
        WHERE t.sequence_id = $1
        ORDER BY t.thought_number ASC
      `;
      const thoughtsResult = await this.databaseService.query(thoughtsQuery, [sequenceId]);

      // Attach thoughts to sequence
      sequence.thoughts = thoughtsResult.rows;

      res.json(ResponseUtil.success(sequence));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve thinking sequence details');
    }
  }

  /**
   * Get project tasks
   */
  getTasks = async (req, res) => {
    try {
      const { projectName } = req.params;
      const { status, priority } = req.query;
      const { limit, offset } = this.parsePagination(req);

      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Build query
      let query = `
        SELECT id, content, metadata, created_at, updated_at
        FROM memories
        WHERE project_id = $1 
        AND memory_type = 'progress'
        AND metadata->>'task_id' IS NOT NULL
      `;
      const params = [project.id];
      let paramIndex = 2;

      if (status) {
        query += ` AND metadata->>'status' = $${paramIndex++}`;
        params.push(status);
      }

      if (priority) {
        query += ` AND metadata->>'priority' = $${paramIndex++}`;
        params.push(priority);
      }

      // Get total count
      const countResult = await this.databaseService.query(
        query.replace('SELECT id, content, metadata, created_at, updated_at', 'SELECT COUNT(*)'),
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      query += ` ORDER BY created_at DESC`;
      if (limit !== null) {
        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
        params.push(limit, offset);
      } else if (offset > 0) {
        query += ` OFFSET $${paramIndex}`;
        params.push(offset);
      }

      const result = await this.databaseService.query(query, params);

      // Transform to task format matching TaskItem interface
      const tasks = result.rows.map(row => ({
        id: row.metadata.task_id,
        title: row.metadata.title || row.content.substring(0, 100) + (row.content.length > 100 ? '...' : ''),
        description: row.content,
        category: row.metadata.category || 'feature',
        status: row.metadata.status || 'pending',
        priority: {
          urgency: row.metadata.priority_urgency || row.metadata.priority || 'medium',
          impact: row.metadata.priority_impact || 'medium',
          effort: row.metadata.priority_effort || 'medium'
        },
        dependencies: row.metadata.dependencies || [],
        acceptance_criteria: row.metadata.acceptance_criteria || [],
        estimated_hours: row.metadata.estimated_hours || null,
        due_date: row.metadata.due_date || null,
        tags: row.metadata.tags || [],
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      res.json(ResponseUtil.paginated(tasks, { limit, offset, total }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve tasks');
    }
  }

  /**
   * Create project task
   */
  createTask = async (req, res) => {
    try {
      const { projectName } = req.params;
      const { 
        content, 
        title,
        category = 'feature',
        priority = 'medium', 
        priority_urgency = 'medium',
        priority_impact = 'medium', 
        priority_effort = 'medium',
        estimated_hours,
        due_date,
        tags = [],
        metadata = {} 
      } = req.body;

      this.validateRequired({ content }, ['content']);

      // Check if project exists
      const project = await this.databaseService.getProjectByName(projectName);
      if (!project) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Project '${projectName}' not found`)
        );
      }

      // Generate task ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create task as a progress memory with proper metadata structure
      const memory = await this.databaseService.query(`
        INSERT INTO memories 
        (project_id, content, memory_type, importance_score, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        project.id,
        content,
        'progress',
        0.6, // Tasks have higher importance
        JSON.stringify({
          ...metadata,
          task_id: taskId,
          title: title || content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          category,
          status: 'pending',
          priority,
          priority_urgency,
          priority_impact,
          priority_effort,
          estimated_hours,
          due_date,
          tags,
          dependencies: metadata.dependencies || [],
          acceptance_criteria: metadata.acceptance_criteria || []
        })
      ]);

      this.logAction('Task created', { projectName, taskId });

      res.status(HttpStatus.CREATED).json(
        ResponseUtil.created({
          id: taskId,
          title: title || content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          description: content,
          category,
          status: 'pending',
          priority: {
            urgency: priority_urgency,
            impact: priority_impact,
            effort: priority_effort
          },
          estimated_hours,
          due_date,
          tags,
          projectName,
          created_at: memory.rows[0].created_at,
          updated_at: memory.rows[0].updated_at
        })
      );
    } catch (error) {
      this.handleError(res, error, 'Failed to create task');
    }
  }

  /**
   * Helper method to get or create a session (following modular pattern)
   */
  async _getOrCreateSession(projectId, sessionName) {
    let result = await this.databaseService.query(
      'SELECT * FROM sessions WHERE project_id = $1 AND session_name = $2',
      [projectId, sessionName]
    );
    
    if (result.rows.length === 0) {
      result = await this.databaseService.query(
        'INSERT INTO sessions (project_id, session_name) VALUES ($1, $2) RETURNING *',
        [projectId, sessionName]
      );
    }
    
    return result.rows[0];
  }
}