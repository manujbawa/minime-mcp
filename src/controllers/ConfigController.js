/**
 * Config Controller
 * Handles configuration management
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class ConfigController extends BaseController {
  constructor(services) {
    super(services);
  }

  /**
   * Get all configuration values
   */
  getAll = async (req, res) => {
    try {
      const { category } = req.query;
      let configs;

      if (category) {
        configs = await this.configService.getByCategory(category);
      } else {
        configs = await this.configService.getAll();
      }

      // Convert object to grouped format
      const grouped = {};
      for (const [key, value] of Object.entries(configs)) {
        const cat = this.getConfigCategory(key);
        if (!grouped[cat]) grouped[cat] = {};
        
        // Handle both simple values and nested {value, description} format
        if (value && typeof value === 'object' && 'value' in value) {
          grouped[cat][key] = value.value;
        } else {
          grouped[cat][key] = value;
        }
      }

      res.json(ResponseUtil.success(grouped, 'Configuration retrieved successfully'));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve configuration');
    }
  }

  /**
   * Get specific configuration value
   */
  get = async (req, res) => {
    try {
      const { key } = req.params;
      const value = await this.configService.get(key);

      if (value === null) {
        return res.status(HttpStatus.NOT_FOUND).json(
          ResponseUtil.error(`Configuration key '${key}' not found`)
        );
      }

      res.json(ResponseUtil.success({ key, value }));
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve configuration value');
    }
  }

  /**
   * Update specific configuration value
   */
  update = async (req, res) => {
    try {
      const { key } = req.params;
      const { value, category } = req.body;

      if (value === undefined) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Value is required')
        );
      }

      await this.configService.set(key, value, category);
      this.logAction('Configuration updated', { key, value });

      res.json(ResponseUtil.updated({ key, value, category }));
    } catch (error) {
      this.handleError(res, error, 'Failed to update configuration');
    }
  }

  /**
   * Bulk update configuration values
   */
  bulkUpdate = async (req, res) => {
    try {
      const updates = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Request body must be an array of updates')
        );
      }

      const results = [];
      for (const update of updates) {
        const { key, value, category } = update;
        
        if (!key || value === undefined) {
          results.push({
            key,
            success: false,
            error: 'Key and value are required'
          });
          continue;
        }

        try {
          await this.configService.set(key, value, category);
          results.push({ key, success: true });
        } catch (error) {
          results.push({
            key,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      this.logAction('Bulk configuration update', { 
        total: updates.length, 
        success: successCount 
      });

      res.json(ResponseUtil.success({
        results,
        summary: {
          total: updates.length,
          success: successCount,
          failed: updates.length - successCount
        }
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to bulk update configuration');
    }
  }

  /**
   * Reset configuration to defaults
   */
  reset = async (req, res) => {
    try {
      const { category, keys } = req.body;

      if (keys && !Array.isArray(keys)) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          ResponseUtil.error('Keys must be an array')
        );
      }

      // Get default configs from environment
      const defaults = this.getDefaultConfigs();
      let resetCount = 0;

      if (keys) {
        // Reset specific keys
        for (const key of keys) {
          if (defaults[key] !== undefined) {
            await this.configService.set(key, defaults[key]);
            resetCount++;
          }
        }
      } else if (category) {
        // Reset category
        const categoryDefaults = Object.entries(defaults)
          .filter(([k, v]) => this.getConfigCategory(k) === category);
        
        for (const [key, value] of categoryDefaults) {
          await this.configService.set(key, value, category);
          resetCount++;
        }
      } else {
        // Reset all
        for (const [key, value] of Object.entries(defaults)) {
          await this.configService.set(key, value, this.getConfigCategory(key));
          resetCount++;
        }
      }

      this.logAction('Configuration reset', { category, keys, resetCount });

      res.json(ResponseUtil.success({
        resetCount,
        message: `Reset ${resetCount} configuration values to defaults`
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to reset configuration');
    }
  }

  /**
   * Get default configuration values
   */
  getDefaultConfigs() {
    // Import environment config for pipeline defaults
    const { config: envConfig, isPipelineEnabled } = require('../server/config/environment.js');
    
    return {
      // Model configurations
      'model_embedding': envConfig.ollama.embeddingModel,
      'model_llm': envConfig.ollama.llmModel,
      'model_classification': envConfig.ollama.llmModel,
      
      // Feature toggles - read from environment variables
      'embeddings_enabled': isPipelineEnabled('embeddings'),
      'learning_pipeline_enabled': isPipelineEnabled('learning'),
      'ai_insights_enabled': isPipelineEnabled('ai_insights'),
      'task_deduplication_enabled': isPipelineEnabled('task_deduplication'),
      'analytics_enabled': isPipelineEnabled('analytics'),
      'sequential_thinking_enabled': isPipelineEnabled('sequential_thinking'),
      
      // Service settings
      'embedding_batch_size': envConfig.services.embeddingBatchSize,
      'embedding_interval': envConfig.services.embeddingInterval,
      'learning_batch_size': 50,
      'learning_interval': 300000,
      'insights_cache_ttl': envConfig.services.insightsCacheTTL,
      'config_cache_ttl': envConfig.services.configCacheTTL,
      
      // Prompt settings
      'prompt_temperature': 0.7,
      'prompt_max_tokens': 2000
    };
  }

  /**
   * Determine category for a config key
   */
  getConfigCategory(key) {
    if (key.startsWith('model_')) return 'models';
    if (key.endsWith('_enabled')) return 'features';
    if (key.startsWith('prompt_')) return 'prompts';
    return 'settings';
  }
}