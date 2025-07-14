/**
 * Ollama Controller
 * Handles Ollama model management and configuration
 */

import { BaseController } from './BaseController.js';
import { ResponseUtil, HttpStatus } from '../utils/response.js';

export class OllamaController extends BaseController {
  constructor(services) {
    super(services);
    this.ollamaClient = services.ollama;
    this.ollamaManagement = services.ollamaManagement;
  }

  /**
   * Get Ollama system information
   */
  getInfo = async (req, res) => {
    try {
      if (!this.ollamaManagement) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama management service not available')
        );
      }

      const info = await this.ollamaManagement.getSystemInfo();
      res.json(ResponseUtil.success(info));
    } catch (error) {
      this.handleError(res, error, 'Failed to get Ollama info');
    }
  }

  /**
   * List available models
   */
  listModels = async (req, res) => {
    try {
      if (!this.ollamaManagement) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama management service not available')
        );
      }

      const models = await this.ollamaManagement.listModels();
      res.json(ResponseUtil.success({ models }));
    } catch (error) {
      this.handleError(res, error, 'Failed to list models');
    }
  }

  /**
   * Pull a model
   */
  pullModel = async (req, res) => {
    try {
      const { model } = req.body;

      this.validateRequired({ model }, ['model']);

      if (!this.ollamaManagement) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama management service not available')
        );
      }

      // Start the pull process
      const result = await this.ollamaManagement.pullModel(model);
      
      this.logAction('Ollama model pull initiated', { model });

      res.json(ResponseUtil.success({
        model,
        status: 'pulling',
        result
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to pull model');
    }
  }

  /**
   * Delete a model
   */
  deleteModel = async (req, res) => {
    try {
      const { model } = req.params;

      if (!this.ollamaManagement) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama management service not available')
        );
      }

      await this.ollamaManagement.deleteModel(model);
      
      this.logAction('Ollama model deleted', { model });

      res.json(ResponseUtil.deleted(`Model '${model}' deleted successfully`));
    } catch (error) {
      this.handleError(res, error, 'Failed to delete model');
    }
  }

  /**
   * Show model information
   */
  showModel = async (req, res) => {
    try {
      const { model } = req.params;

      if (!this.ollamaManagement) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama management service not available')
        );
      }

      const info = await this.ollamaManagement.showModel(model);
      res.json(ResponseUtil.success(info));
    } catch (error) {
      this.handleError(res, error, 'Failed to get model info');
    }
  }

  /**
   * Copy a model
   */
  copyModel = async (req, res) => {
    try {
      const { source, destination } = req.body;

      this.validateRequired({ source, destination }, ['source', 'destination']);

      if (!this.ollamaManagement) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama management service not available')
        );
      }

      await this.ollamaManagement.copyModel(source, destination);
      
      this.logAction('Ollama model copied', { source, destination });

      res.json(ResponseUtil.success({
        message: `Model copied from '${source}' to '${destination}'`
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to copy model');
    }
  }

  /**
   * Get model configuration
   */
  getModelConfig = async (req, res) => {
    try {
      const { model } = req.params;

      if (!this.ollamaManagement) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama management service not available')
        );
      }

      const config = await this.ollamaManagement.getModelConfig(model);
      res.json(ResponseUtil.success(config));
    } catch (error) {
      this.handleError(res, error, 'Failed to get model config');
    }
  }

  /**
   * Test model with prompt
   */
  testModel = async (req, res) => {
    try {
      const { model, prompt, options = {} } = req.body;

      this.validateRequired({ model, prompt }, ['model', 'prompt']);

      if (!this.ollamaClient) {
        return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(
          ResponseUtil.error('Ollama client not available')
        );
      }

      const result = await this.ollamaClient.generate({
        model,
        prompt,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          ...options
        },
        stream: false
      });

      res.json(ResponseUtil.success({
        model,
        prompt,
        response: result.response,
        stats: {
          total_duration: result.total_duration,
          load_duration: result.load_duration,
          prompt_eval_count: result.prompt_eval_count,
          eval_count: result.eval_count
        }
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to test model');
    }
  }

  /**
   * Update LLM configuration
   */
  updateLLMConfig = async (req, res) => {
    try {
      const { model, temperature, maxTokens } = req.body;

      if (model) {
        await this.configService.set('model_llm', model);
      }
      
      if (temperature !== undefined) {
        await this.configService.set('prompt_temperature', temperature);
      }
      
      if (maxTokens !== undefined) {
        await this.configService.set('prompt_max_tokens', maxTokens);
      }

      this.logAction('LLM config updated', { model, temperature, maxTokens });

      res.json(ResponseUtil.updated({
        model: model || await this.configService.get('model_llm'),
        temperature: temperature || await this.configService.get('prompt_temperature'),
        maxTokens: maxTokens || await this.configService.get('prompt_max_tokens')
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to update LLM config');
    }
  }

  /**
   * Get LLM configuration
   */
  getLLMConfig = async (req, res) => {
    try {
      const config = {
        model: await this.configService.get('model_llm'),
        temperature: await this.configService.get('prompt_temperature'),
        maxTokens: await this.configService.get('prompt_max_tokens')
      };

      res.json(ResponseUtil.success(config));
    } catch (error) {
      this.handleError(res, error, 'Failed to get LLM config');
    }
  }

  /**
   * Test embedding generation
   */
  testEmbedding = async (req, res) => {
    try {
      const { text, model } = req.body;

      this.validateRequired({ text }, ['text']);

      const embeddingService = this.requireService('embedding');
      const embeddingModel = model || await this.configService.get('model_embedding');

      const embedding = await embeddingService.generateEmbedding(text, embeddingModel);

      res.json(ResponseUtil.success({
        text,
        model: embeddingModel,
        embedding: {
          dimensions: embedding.length,
          sample: embedding.slice(0, 10)
        }
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to test embedding');
    }
  }

  /**
   * Test similarity search
   */
  testSimilarity = async (req, res) => {
    try {
      const { query, projectName, limit = 5 } = req.body;

      this.validateRequired({ query }, ['query']);

      const embeddingService = this.requireService('embedding');
      
      const results = await embeddingService.searchSimilar(
        query,
        limit,
        0.5,
        projectName
      );

      res.json(ResponseUtil.success({
        query,
        projectName: projectName || 'all',
        results
      }));
    } catch (error) {
      this.handleError(res, error, 'Failed to test similarity');
    }
  }
}