/**
 * Admin Controller
 * Handles system administration, job management, and testing utilities
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class AdminController extends BaseController {
  constructor(services) {
    super(services);
    
    // Store service references for jobs
    this.memoryDeduplicationService = services.memoryDeduplicationService;
    this.insightScheduler = services.insightScheduler;
    this.learningPipeline = services.learningPipeline;
    this.analyticsCollector = services.analyticsCollector;
    this.embeddingService = services.embeddingService;
    this.serviceRegistry = services.serviceRegistry;
  }

  /**
   * Get all system jobs status
   */
  async getJobs(req, res) {
    try {
      const systemJobs = [
        {
          id: 'task_deduplication',
          name: 'Task Deduplication',
          description: 'Analyzes and marks duplicate tasks using vector embeddings and LLM verification',
          category: 'Maintenance',
          schedule: 'Every 30 minutes',
          configCategory: 'task_deduplication'
        },
        {
          id: 'ai_insights_generation',
          name: 'AI Insights Generation',
          description: 'Generates AI-powered insights from project data and patterns',
          category: 'Analysis',
          schedule: 'Every 1 hour',
          configCategory: 'ai_insights'
        },
        {
          id: 'learning_pipeline',
          name: 'Learning Pipeline',
          description: 'Processes learning queue for pattern detection and evolution tracking',
          category: 'Learning',
          schedule: 'Every 15 minutes',
          configCategory: 'learning_pipeline'
        },
        {
          id: 'analytics_collection',
          name: 'Analytics Collection',
          description: 'Collects system analytics and performance metrics',
          category: 'Monitoring',
          schedule: 'Every 1 hour',
          configCategory: 'analytics'
        },
        {
          id: 'embedding_generation',
          name: 'Embedding Generation',
          description: 'Generates vector embeddings for memories that lack them',
          category: 'Processing',
          schedule: 'Every 5 minutes',
          configCategory: 'embeddings'
        }
      ];

      // Get job status from configuration and system state
      const jobsWithStatus = await Promise.all(systemJobs.map(async (job) => {
        try {
          // Get configuration status
          let enabled = false;
          let lastRun = null;
          let nextRun = null;
          let lastStatus = 'unknown';
          let lastDuration = null;
          let errorMessage = null;

          if (job.configCategory) {
            enabled = await this.configService.isFeatureEnabled(`${job.configCategory}_enabled`);
          }

          // Get job-specific status from database
          if (job.id === 'task_deduplication') {
            // Get last deduplication run statistics
            const dedupStats = await this.databaseService.query(`
              SELECT get_task_duplicate_stats() as stats
            `);
            const stats = dedupStats.rows[0]?.stats;
            if (stats && stats.last_dedup_run) {
              lastRun = stats.last_dedup_run;
              lastStatus = 'success';
              const scheduleMinutes = await this.configService.getNumber('task_deduplication_schedule_minutes', 30);
              nextRun = new Date(new Date(lastRun).getTime() + scheduleMinutes * 60000).toISOString();
            }
          } else if (job.id === 'ai_insights_generation') {
            // Get last insight generation
            const insightStats = await this.databaseService.query(`
              SELECT created_at, metadata->>'status' as status, metadata->>'duration_ms' as duration
              FROM unified_insights_v2 
              ORDER BY created_at DESC 
              LIMIT 1
            `);
            if (insightStats.rows.length > 0) {
              const insight = insightStats.rows[0];
              lastRun = insight.created_at;
              lastStatus = insight.status === 'error' ? 'failed' : 'success';
              if (insight.duration) {
                lastDuration = parseInt(insight.duration);
              }
            }
          } else if (job.id === 'learning_pipeline') {
            // Get learning pipeline status
            const learningStats = await this.databaseService.query(`
              SELECT updated_at, status, processing_duration_ms
              FROM insight_processing_queue_v2 
              WHERE status IN ('completed', 'failed')
              ORDER BY updated_at DESC 
              LIMIT 1
            `);
            if (learningStats.rows.length > 0) {
              const learning = learningStats.rows[0];
              lastRun = learning.updated_at;
              lastStatus = learning.status === 'failed' ? 'failed' : 'success';
              if (learning.processing_duration_ms) {
                lastDuration = parseInt(learning.processing_duration_ms);
              }
            }
          } else if (job.id === 'analytics_collection') {
            // Analytics runs every hour, check for recent snapshots
            const analyticsStats = await this.databaseService.query(`
              SELECT created_at 
              FROM analytics_snapshots 
              WHERE granularity = 'minute' 
              ORDER BY created_at DESC 
              LIMIT 1
            `);
            if (analyticsStats.rows.length > 0) {
              lastRun = analyticsStats.rows[0].created_at;
              lastStatus = 'success';
              const intervalMinutes = await this.configService.getNumber('analytics_interval_minutes', 60);
              nextRun = new Date(new Date(lastRun).getTime() + intervalMinutes * 60000).toISOString();
            }
          }

          return {
            ...job,
            enabled,
            lastRun,
            lastStatus,
            nextRun,
            lastDuration,
            errorMessage
          };
        } catch (error) {
          this.logger.error(`Error getting status for job ${job.id}:`, error);
          return {
            ...job,
            enabled: false,
            lastStatus: 'error',
            errorMessage: error.message
          };
        }
      }));

      res.json(ResponseUtil.success({
        jobs: jobsWithStatus,
        timestamp: new Date().toISOString()
      }, 'Jobs retrieved successfully'));
    } catch (error) {
      this.handleError(res, error, 'Failed to get job status');
    }
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(req, res) {
    try {
      const { jobId } = req.params;
      const startTime = Date.now();
      
      this.logAction('Manually triggering job', { jobId });
      
      let result = {};
      
      switch (jobId) {
        case 'task_deduplication':
          result = await this.memoryDeduplicationService.analyzeDuplicateTasks();
          break;
          
        case 'ai_insights_generation':
          if (this.insightScheduler && this.insightScheduler.generateScheduledInsights) {
            result = await this.insightScheduler.generateScheduledInsights('manual', null, null);
          } else {
            throw new Error('AI Insights scheduler not available');
          }
          break;
          
        case 'learning_pipeline':
          if (this.learningPipeline && this.learningPipeline.processLearningQueue) {
            result = await this.learningPipeline.processLearningQueue(20);
          } else {
            throw new Error('Learning pipeline not available');
          }
          break;
          
        case 'analytics_collection':
          if (this.analyticsCollector && this.analyticsCollector.collectSnapshot) {
            result = await this.analyticsCollector.collectSnapshot();
          } else {
            throw new Error('Analytics collector not available');
          }
          break;
          
        case 'embedding_generation':
          // Generate embeddings for memories that lack them
          const memoriesNeedingEmbeddings = await this.databaseService.query(`
            SELECT id, content, memory_type 
            FROM memories 
            WHERE embedding IS NULL 
            LIMIT 50
          `);
          
          let generatedCount = 0;
          for (const memory of memoriesNeedingEmbeddings.rows) {
            try {
              const embedding = await this.embeddingService.generateEmbedding(memory.content);
              await this.databaseService.query(
                'UPDATE memories SET embedding = $1 WHERE id = $2',
                [JSON.stringify(embedding), memory.id]
              );
              generatedCount++;
            } catch (error) {
              this.logger.error(`Failed to generate embedding for memory ${memory.id}:`, error);
            }
          }
          result = { 
            generatedEmbeddings: generatedCount, 
            processedMemories: memoriesNeedingEmbeddings.rows.length 
          };
          break;
          
        default:
          throw new Error(`Unknown job ID: ${jobId}`);
      }
      
      const duration = Date.now() - startTime;
      
      this.logAction('Job triggered successfully', { jobId, duration });
      
      res.json(ResponseUtil.success({
        jobId,
        result,
        duration,
        triggeredAt: new Date().toISOString()
      }, `Job ${jobId} triggered successfully`));
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Job ${req.params.jobId} failed after ${duration}ms:`, error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        ResponseUtil.error(error.message, {
          jobId: req.params.jobId,
          duration,
          triggeredAt: new Date().toISOString()
        })
      );
    }
  }

  /**
   * Trigger all jobs
   */
  async triggerAllJobs(req, res) {
    try {
      const { exclude = [] } = req.body;
      const jobIds = [
        'task_deduplication', 
        'ai_insights_generation', 
        'learning_pipeline', 
        'analytics_collection', 
        'embedding_generation'
      ];
      const jobsToRun = jobIds.filter(id => !exclude.includes(id));
      
      this.logAction('Manually triggering all jobs', { jobsToRun });
      
      const results = [];
      
      for (const jobId of jobsToRun) {
        const startTime = Date.now();
        try {
          // Trigger each job directly
          let result = {};
          
          switch (jobId) {
            case 'task_deduplication':
              result = await this.memoryDeduplicationService.analyzeDuplicateTasks();
              break;
            case 'ai_insights_generation':
              if (this.insightScheduler && this.insightScheduler.generateScheduledInsights) {
                result = await this.insightScheduler.generateScheduledInsights('manual', null, null);
              } else {
                throw new Error('AI Insights scheduler not available');
              }
              break;
            case 'learning_pipeline':
              if (this.learningPipeline && this.learningPipeline.processLearningQueue) {
                result = await this.learningPipeline.processLearningQueue(20);
              } else {
                throw new Error('Learning pipeline not available');
              }
              break;
            case 'analytics_collection':
              if (this.analyticsCollector && this.analyticsCollector.collectSnapshot) {
                result = await this.analyticsCollector.collectSnapshot();
              } else {
                throw new Error('Analytics collector not available');
              }
              break;
            case 'embedding_generation':
              const memoriesNeedingEmbeddings = await this.databaseService.query(`
                SELECT id, content, memory_type 
                FROM memories 
                WHERE embedding IS NULL 
                LIMIT 50
              `);
              
              let generatedCount = 0;
              for (const memory of memoriesNeedingEmbeddings.rows) {
                try {
                  const embedding = await this.embeddingService.generateEmbedding(memory.content);
                  await this.databaseService.query(
                    'UPDATE memories SET embedding = $1 WHERE id = $2',
                    [JSON.stringify(embedding), memory.id]
                  );
                  generatedCount++;
                } catch (error) {
                  this.logger.error(`Failed to generate embedding for memory ${memory.id}:`, error);
                }
              }
              result = { 
                generatedEmbeddings: generatedCount, 
                processedMemories: memoriesNeedingEmbeddings.rows.length 
              };
              break;
            default:
              throw new Error(`Unknown job ID: ${jobId}`);
          }
          
          const duration = Date.now() - startTime;
          
          results.push({
            jobId,
            success: true,
            duration,
            result
          });
        } catch (error) {
          const duration = Date.now() - startTime;
          results.push({
            jobId,
            success: false,
            duration,
            error: error.message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      
      res.json(ResponseUtil.success({
        message: `Triggered ${successCount}/${jobsToRun.length} jobs successfully`,
        results,
        triggeredAt: new Date().toISOString()
      }, 'All jobs triggered'));
    } catch (error) {
      this.handleError(res, error, 'Failed to trigger all jobs');
    }
  }

  /**
   * Enable/disable a specific job
   */
  async toggleJob(req, res) {
    try {
      const { jobId } = req.params;
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('enabled must be a boolean value')
        );
      }
      
      // Map job IDs to configuration categories
      const jobConfigMap = {
        'task_deduplication': 'task_deduplication',
        'ai_insights_generation': 'ai_insights',
        'learning_pipeline': 'learning_pipeline',
        'analytics_collection': 'analytics',
        'embedding_generation': 'embeddings'
      };
      
      const configCategory = jobConfigMap[jobId];
      if (!configCategory) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error(`Unknown job ID: ${jobId}`)
        );
      }
      
      // Update configuration
      await this.configService.set(`${configCategory}_enabled`, enabled);
      
      this.logAction(`Job ${enabled ? 'enabled' : 'disabled'}`, { jobId });
      
      res.json(ResponseUtil.success({
        jobId,
        enabled,
        updatedAt: new Date().toISOString()
      }, `Job ${jobId} ${enabled ? 'enabled' : 'disabled'} successfully`));
    } catch (error) {
      this.handleError(res, error, `Failed to toggle job ${req.params.jobId}`);
    }
  }

  /**
   * Delete specific number of text embeddings for testing
   */
  async deleteTestEmbeddings(req, res) {
    try {
      const { count } = req.body;
      
      if (!count || count < 1 || count > 1000) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Count must be between 1 and 1000')
        );
      }
      
      this.logAction('Testing: Deleting text embeddings', { count });
      
      // Delete embeddings from memories (set to NULL)
      const result = await this.databaseService.query(`
        UPDATE memories 
        SET embedding = NULL 
        WHERE id IN (
          SELECT id FROM memories 
          WHERE embedding IS NOT NULL 
          ORDER BY created_at DESC 
          LIMIT $1
        )
      `, [count]);
      
      const deletedCount = result.rowCount || 0;
      
      res.json(ResponseUtil.success({
        deletedCount,
        message: `Cleared ${deletedCount} text embeddings for testing`
      }, 'Test embeddings deleted successfully'));
      
    } catch (error) {
      this.handleError(res, error, 'Failed to delete test embeddings');
    }
  }

  /**
   * Delete specific number of learning records for testing
   */
  async deleteTestLearnings(req, res) {
    try {
      const { count } = req.body;
      
      if (!count || count < 1 || count > 1000) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Count must be between 1 and 1000')
        );
      }
      
      this.logAction('Testing: Deleting learning records', { count });
      
      // Delete learning patterns
      const patternsResult = await this.databaseService.query(`
        DELETE FROM coding_patterns 
        WHERE id IN (
          SELECT id FROM coding_patterns 
          ORDER BY created_at DESC 
          LIMIT $1
        )
      `, [Math.ceil(count / 2)]);
      
      // Delete AI insights
      const insightsResult = await this.databaseService.query(`
        DELETE FROM unified_insights_v2 
        WHERE id IN (
          SELECT id FROM unified_insights_v2 
          ORDER BY created_at DESC 
          LIMIT $1
        )
      `, [Math.floor(count / 2)]);
      
      const deletedCount = (patternsResult.rowCount || 0) + (insightsResult.rowCount || 0);
      
      res.json(ResponseUtil.success({
        deletedCount,
        patternsDeleted: patternsResult.rowCount || 0,
        insightsDeleted: insightsResult.rowCount || 0,
        message: `Deleted ${deletedCount} learning records for testing`
      }, 'Test learning records deleted successfully'));
      
    } catch (error) {
      this.handleError(res, error, 'Failed to delete test learning records');
    }
  }

  /**
   * Get available Ollama models
   */
  async getOllamaModels(req, res) {
    try {
      // Use the unified Ollama client
      const ollamaClient = this.services.serviceRegistry.get('ollama');
      if (!ollamaClient) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama client not available')
        );
      }
      
      const models = await ollamaClient.listModels();
      // Return just the model names for simplicity
      const modelNames = models.map(m => m.name || m.model);
      
      res.json(ResponseUtil.success({ 
        models: modelNames 
      }, 'Ollama models retrieved successfully'));
    } catch (error) {
      this.handleError(res, error, 'Failed to list Ollama models');
    }
  }

  /**
   * Test prompt JSON output
   */
  async testPromptJson(req, res) {
    const { prompt, model = 'deepseek-coder:6.7b', variables = {} } = req.body;
    
    try {
      // Replace variables in prompt
      let finalPrompt = prompt;
      Object.entries(variables).forEach(([k, v]) => {
        finalPrompt = finalPrompt.replace(new RegExp(`{${k}}`, 'g'), v || '');
      });
      
      // Get unified Ollama client
      const ollamaClient = this.services.serviceRegistry.get('ollama');
      if (!ollamaClient) {
        throw new Error('Ollama client not available');
      }
      
      // Use the unified client to generate response
      const result = await ollamaClient.generate({
        model,
        prompt: finalPrompt,
        options: { temperature: 0.1, top_p: 0.9 },
        stream: false,
        returnType: 'json',
        timeout: 300000 // 5 minutes
      });
      
      // The ollamaClient already handles JSON parsing with the returnType
      res.json(ResponseUtil.success({
        output: result.output,
        isValid: result.isValid || false,
        parsed: result.parsed || null,
        error: result.error || null,
        model: result.model || model,
        duration: result.elapsed || null
      }, 'Prompt test completed'));
    } catch (error) {
      this.handleError(res, error, 'Prompt test error');
    }
  }

  /**
   * Get recent memories for prompt testing
   */
  async getTestMemories(req, res) {
    try {
      const { memoryType, limit = 20 } = req.query;
      
      let query = `
        SELECT 
          m.id,
          m.project_id,
          m.session_id,
          m.memory_type,
          m.content,
          m.smart_tags,
          m.metadata,
          m.created_at,
          p.name as project_name
        FROM memories m
        LEFT JOIN projects p ON m.project_id = p.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (memoryType && memoryType !== 'all') {
        query += ` AND m.memory_type = $${paramIndex}`;
        params.push(memoryType);
        paramIndex++;
      }
      
      query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
      
      const result = await this.databaseService.query(query, params);
      
      res.json(ResponseUtil.success({ 
        memories: result.rows.map(memory => ({
          ...memory,
          contentPreview: memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : '')
        }))
      }, 'Test memories retrieved successfully'));
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch test memories');
    }
  }

  /**
   * Register routes for this controller
   */
  static registerRoutes(app, controller) {
    // Job management
    app.get('/api/admin/jobs', (req, res) => controller.getJobs(req, res));
    app.post('/api/admin/jobs/:jobId/trigger', (req, res) => controller.triggerJob(req, res));
    app.post('/api/admin/jobs/trigger-all', (req, res) => controller.triggerAllJobs(req, res));
    app.post('/api/admin/jobs/:jobId/toggle', (req, res) => controller.toggleJob(req, res));
    
    // Test utilities
    app.post('/api/admin/test/delete-embeddings', (req, res) => controller.deleteTestEmbeddings(req, res));
    app.post('/api/admin/test/delete-learnings', (req, res) => controller.deleteTestLearnings(req, res));
    app.get('/api/admin/test-memories', (req, res) => controller.getTestMemories(req, res));
    
    // System maintenance
    app.get('/api/admin/ollama/models', (req, res) => controller.getOllamaModels(req, res));
    app.post('/api/admin/prompts/test-json', (req, res) => controller.testPromptJson(req, res));
  }
}