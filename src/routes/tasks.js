/**
 * Task Routes
 * Task management endpoints
 */

import { TaskController } from '../controllers/TaskController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateBody, validateQuery } from '../server/middleware/validation.js';

export default function taskRoutes(app, services) {
  const controller = new TaskController(services);

  // Task management
  app.put('/api/tasks/:taskId',
    validateBody({
      status: { required: true, type: 'string' }
    }),
    asyncHandler(controller.updateTask)
  );
  
  app.delete('/api/tasks/:taskId', asyncHandler(controller.deleteTask));
  
  // Task extraction prompts
  app.get('/api/task-extraction/prompts',
    validateQuery({
      category: { type: 'string' },
      isActive: { type: 'boolean' }
    }),
    asyncHandler(controller.getExtractionPrompts)
  );
  
  app.post('/api/task-extraction/prompts',
    validateBody({
      name: { required: true, type: 'string' },
      category: { required: true, type: 'string' },
      promptTemplate: { required: true, type: 'string' },
      model: { required: false, type: 'string' },
      temperature: { required: false, type: 'number' },
      maxTokens: { required: false, type: 'number' },
      outputFormat: { 
        required: false, 
        type: 'string',
        enum: ['json', 'text', 'markdown']
      }
    }),
    asyncHandler(controller.createExtractionPrompt)
  );
  
  app.put('/api/task-extraction/prompts/:id', 
    asyncHandler(controller.updateExtractionPrompt)
  );
  
  app.delete('/api/task-extraction/prompts/:id', 
    asyncHandler(controller.deleteExtractionPrompt)
  );
  
  // Task extraction executions
  app.get('/api/task-extraction/prompts/executions',
    validateQuery({
      promptTemplateId: { type: 'string' },
      limit: { type: 'number' }
    }),
    asyncHandler(controller.getExtractionExecutions)
  );
}