/**
 * Ollama Routes
 * Ollama model management endpoints
 */

import { OllamaController } from '../controllers/OllamaController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateBody } from '../server/middleware/validation.js';

export default function ollamaRoutes(app, services) {
  const controller = new OllamaController(services);

  // System info
  app.get('/api/ollama/info', asyncHandler(controller.getInfo));
  
  // Model management
  app.get('/api/ollama/models', asyncHandler(controller.listModels));
  
  app.post('/api/ollama/models/pull',
    validateBody({
      model: { required: true, type: 'string' }
    }),
    asyncHandler(controller.pullModel)
  );
  
  app.delete('/api/ollama/models/:model', asyncHandler(controller.deleteModel));
  
  app.get('/api/ollama/models/:model', asyncHandler(controller.showModel));
  
  app.post('/api/ollama/models/copy',
    validateBody({
      source: { required: true, type: 'string' },
      destination: { required: true, type: 'string' }
    }),
    asyncHandler(controller.copyModel)
  );
  
  app.get('/api/ollama/models/:model/config', asyncHandler(controller.getModelConfig));
  
  // Model testing
  app.post('/api/ollama/test',
    validateBody({
      model: { required: true, type: 'string' },
      prompt: { required: true, type: 'string' }
    }),
    asyncHandler(controller.testModel)
  );
  
  // LLM configuration
  app.post('/api/ollama/llm-config',
    validateBody({
      model: { required: false, type: 'string' },
      temperature: { required: false, type: 'number' },
      maxTokens: { required: false, type: 'number' }
    }),
    asyncHandler(controller.updateLLMConfig)
  );
  
  app.get('/api/ollama/llm-config', asyncHandler(controller.getLLMConfig));
  
  // Embedding testing
  app.post('/api/ollama/test/embedding',
    validateBody({
      text: { required: true, type: 'string' },
      model: { required: false, type: 'string' }
    }),
    asyncHandler(controller.testEmbedding)
  );
  
  app.post('/api/ollama/test/similarity',
    validateBody({
      query: { required: true, type: 'string' },
      projectName: { required: false, type: 'string' },
      limit: { required: false, type: 'number' }
    }),
    asyncHandler(controller.testSimilarity)
  );
}