/**
 * Admin Routes
 * System administration endpoints
 */

import { AdminController } from '../controllers/AdminController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateBody } from '../server/middleware/validation.js';

export default function adminRoutes(app, services) {
  const controller = new AdminController(services);

  // Job management
  app.get('/api/admin/jobs', asyncHandler(controller.getJobs.bind(controller)));
  
  app.post('/api/admin/jobs/:jobId/trigger', asyncHandler(controller.triggerJob.bind(controller)));
  
  app.post('/api/admin/jobs/trigger-all',
    validateBody({
      exclude: { required: false }
    }),
    asyncHandler(controller.triggerAllJobs.bind(controller))
  );
  
  app.post('/api/admin/jobs/:jobId/toggle',
    validateBody({
      enabled: { required: true, type: 'boolean' }
    }),
    asyncHandler(controller.toggleJob.bind(controller))
  );
  
  // Test utilities
  app.post('/api/admin/test/delete-embeddings',
    validateBody({
      count: { 
        required: true, 
        type: 'number',
        validator: (v) => v < 1 || v > 1000 ? 'Count must be between 1 and 1000' : null
      }
    }),
    asyncHandler(controller.deleteTestEmbeddings.bind(controller))
  );
  
  app.post('/api/admin/test/delete-learnings',
    validateBody({
      count: { 
        required: true, 
        type: 'number',
        validator: (v) => v < 1 || v > 1000 ? 'Count must be between 1 and 1000' : null
      }
    }),
    asyncHandler(controller.deleteTestLearnings.bind(controller))
  );
  
  app.get('/api/admin/test-memories', asyncHandler(controller.getTestMemories.bind(controller)));
  
  // System maintenance
  app.get('/api/admin/ollama/models', asyncHandler(controller.getOllamaModels.bind(controller)));
  
  app.post('/api/admin/prompts/test-json',
    validateBody({
      prompt: { required: true, type: 'string' },
      model: { required: false, type: 'string' },
      variables: { required: false }
    }),
    asyncHandler(controller.testPromptJson.bind(controller))
  );
}