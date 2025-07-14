/**
 * Task Controller
 * Handles task management and extraction
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class TaskController extends BaseController {
  constructor(services) {
    super(services);
  }

  /**
   * Update task status
   */
  updateTask = async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status, metadata } = req.body;

      if (!status) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Status is required')
        );
      }

      // Find task by task_id in metadata
      const taskResult = await this.databaseService.query(`
        SELECT * FROM memories
        WHERE memory_type = 'progress'
        AND metadata->>'task_id' = $1
      `, [taskId]);

      if (taskResult.rows.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error('Task not found')
        );
      }

      const task = taskResult.rows[0];
      const updatedMetadata = {
        ...task.metadata,
        ...metadata,
        status,
        updated_at: new Date().toISOString()
      };

      // Update task
      const updateResult = await this.databaseService.query(`
        UPDATE memories
        SET metadata = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [updatedMetadata, task.id]);

      this.logAction('Task updated', { taskId, status });

      res.json(ResponseUtil.updated({
        id: taskId,
        content: updateResult.rows[0].content,
        status,
        metadata: updatedMetadata,
        updatedAt: updateResult.rows[0].updated_at
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to update task');
    }
  }

  /**
   * Delete task
   */
  deleteTask = async (req, res) => {
    try {
      const { taskId } = req.params;

      // Delete task by task_id in metadata
      const result = await this.databaseService.query(`
        DELETE FROM memories
        WHERE memory_type = 'progress'
        AND metadata->>'task_id' = $1
        RETURNING id
      `, [taskId]);

      if (result.rowCount === 0) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error('Task not found')
        );
      }

      this.logAction('Task deleted', { taskId });

      res.json(ResponseUtil.deleted());
    } catch (error) {
      this.handleError(res, error, 'Failed to delete task');
    }
  }

  /**
   * Get task extraction prompts
   */
  getExtractionPrompts = async (req, res) => {
    try {
      const { category, isActive } = req.query;

      let query = 'SELECT * FROM task_extraction_prompts WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (category) {
        query += ` AND category = $${paramIndex++}`;
        params.push(category);
      }

      if (isActive !== undefined) {
        query += ` AND is_active = $${paramIndex++}`;
        params.push(isActive === 'true');
      }

      query += ' ORDER BY category, name';

      const result = await this.databaseService.query(query, params);

      res.json(ResponseUtil.success(result.rows));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve extraction prompts');
    }
  }

  /**
   * Create task extraction prompt
   */
  createExtractionPrompt = async (req, res) => {
    try {
      const {
        name,
        category,
        promptTemplate,
        model,
        temperature = 0.7,
        maxTokens = 2000,
        extractionRules,
        outputFormat = 'json'
      } = req.body;

      this.validateRequired(
        { name, category, promptTemplate },
        ['name', 'category', 'promptTemplate']
      );

      const result = await this.databaseService.query(`
        INSERT INTO task_extraction_prompts (
          name, category, prompt_template, model,
          temperature, max_tokens, extraction_rules, output_format
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        name, category, promptTemplate, model,
        temperature, maxTokens, extractionRules, outputFormat
      ]);

      this.logAction('Task extraction prompt created', { name, category });

      res.status(HttpStatus.CREATED).json(
        ResponseUtil.created(result.rows[0])
      );
    } catch (error) {
      this.handleError(res, error, 'Failed to create extraction prompt');
    }
  }

  /**
   * Update task extraction prompt
   */
  updateExtractionPrompt = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Build update query
      const fields = [];
      const values = [];
      let paramIndex = 1;

      const allowedFields = [
        'name', 'category', 'prompt_template', 'model',
        'temperature', 'max_tokens', 'extraction_rules',
        'output_format', 'is_active'
      ];

      for (const field of allowedFields) {
        const camelField = field.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        if (updates[camelField] !== undefined) {
          fields.push(`${field} = $${paramIndex++}`);
          values.push(updates[camelField]);
        }
      }

      if (fields.length === 0) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('No valid fields to update')
        );
      }

      values.push(id);

      const result = await this.databaseService.query(`
        UPDATE task_extraction_prompts
        SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error('Extraction prompt not found')
        );
      }

      this.logAction('Task extraction prompt updated', { id });

      res.json(ResponseUtil.updated(result.rows[0]));
    } catch (error) {
      this.handleError(res, error, 'Failed to update extraction prompt');
    }
  }

  /**
   * Delete task extraction prompt
   */
  deleteExtractionPrompt = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.databaseService.query(
        'DELETE FROM task_extraction_prompts WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error('Extraction prompt not found')
        );
      }

      this.logAction('Task extraction prompt deleted', { id });

      res.json(ResponseUtil.deleted());
    } catch (error) {
      this.handleError(res, error, 'Failed to delete extraction prompt');
    }
  }

  /**
   * Get task extraction executions
   */
  getExtractionExecutions = async (req, res) => {
    try {
      const { promptTemplateId, limit = 50 } = req.query;

      let query = `
        SELECT 
          e.*,
          p.name as prompt_name,
          p.category as prompt_category
        FROM task_extraction_executions e
        JOIN task_extraction_prompts p ON e.prompt_template_id = p.id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;

      if (promptTemplateId) {
        query += ` AND e.prompt_template_id = $${paramIndex++}`;
        params.push(promptTemplateId);
      }

      query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex}`;
      params.push(parseInt(limit));

      const result = await this.databaseService.query(query, params);

      res.json(ResponseUtil.success(result.rows));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve extraction executions');
    }
  }
}