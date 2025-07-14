/**
 * Memory Routes
 * Memory CRUD endpoints
 */

import { MemoryController } from '../controllers/MemoryController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateBody, validateQuery, schemas } from '../server/middleware/validation.js';

export default function memoryRoutes(app, services) {
  const controller = new MemoryController(services);

  // List all memories - MUST be before specific routes
  app.get('/api/memories',
    validateQuery({
      ...schemas.pagination,
      memory_type: { 
        type: 'string',
        enum: ['code', 'decision', 'rule', 'note', 'progress', 'project_brief', 'project_prd', 'project_plan', 'tech_reference', 'tech_context', 'architecture', 'requirements', 'bug', 'task', 'general']
      },
      project_name: { type: 'string' },
      session_name: { type: 'string' },
      search_query: { type: 'string' },
      has_embedding: { type: 'boolean' },
      order_by: { 
        type: 'string',
        enum: ['created_at', 'updated_at', 'memory_type', 'project_name']
      },
      order_direction: {
        type: 'string',
        enum: ['ASC', 'DESC']
      }
    }),
    asyncHandler(controller.list)
  );

  // GET endpoint for simple searches - MUST be before /:id route
  app.get('/api/memories/search',
    validateQuery({
      query: { required: true, type: 'string', minLength: 1 },
      limit: { required: false, type: 'number' },
      threshold: { required: false, type: 'number' },
      project_name: { required: false, type: 'string' },
      memory_type: { required: false, type: 'string' },
      search_mode: { 
        required: false, 
        type: 'string',
        enum: ['hybrid', 'content_only', 'tags_only']
      },
      content_weight: { required: false, type: 'number' },
      tag_weight: { required: false, type: 'number' }
    }),
    asyncHandler(controller.searchSimilar)
  );

  // Count endpoint - MUST be before /:id route
  app.get('/api/memories/count',
    validateQuery({
      memory_type: { type: 'string' },
      project_name: { type: 'string' },
      processing_status: { type: 'string' }
    }),
    asyncHandler(async (req, res) => {
      const controller = new MemoryController(services);
      await controller.count(req, res);
    })
  );
  
  // Get specific memory - MUST be last
  app.get('/api/memories/:id', asyncHandler(controller.get));
  
  // Create new memory
  app.post('/api/memories',
    validateBody({
      content: { required: true, type: 'string', minLength: 1 },
      memory_type: { 
        required: false,
        type: 'string',
        enum: ['code', 'decision', 'rule', 'note', 'progress', 'project_brief', 'project_prd', 'project_plan', 'tech_reference', 'tech_context', 'architecture', 'requirements', 'bug', 'task', 'general']
      },
      project_name: { required: true, type: 'string' },
      session_name: { required: false, type: 'string' }
    }),
    asyncHandler(controller.create)
  );
  
  // Update memory
  app.put('/api/memories/:id',
    validateBody({
      content: { required: false, type: 'string', minLength: 1 },
      memory_type: { 
        required: false,
        type: 'string',
        enum: ['code', 'decision', 'rule', 'note', 'progress', 'project_brief', 'project_prd', 'project_plan', 'tech_reference', 'tech_context', 'architecture', 'requirements', 'bug', 'task', 'general']
      },
      session_name: { required: false, type: 'string' }
    }),
    asyncHandler(controller.update)
  );
  
  // Delete memory
  app.delete('/api/memories/:id', asyncHandler(controller.delete));
  
  // Search similar memories
  app.post('/api/memories/search',
    validateBody({
      query: { required: true, type: 'string', minLength: 1 },
      limit: { required: false, type: 'number' },
      threshold: { required: false, type: 'number' },
      project_name: { required: false, type: 'string' },
      memory_type: { required: false, type: 'string' },
      processing_status: { required: false, type: 'string' },
      importance_min: { required: false, type: 'number' },
      date_from: { required: false, type: 'string' },
      // Hybrid search options
      search_mode: { 
        required: false, 
        type: 'string',
        enum: ['hybrid', 'content_only', 'tags_only']
      },
      content_weight: { required: false, type: 'number' },
      tag_weight: { required: false, type: 'number' },
      enable_overlap_boost: { required: false, type: 'boolean' },
      enable_diversity: { required: false, type: 'boolean' }
    }),
    asyncHandler(controller.searchSimilar)
  );
  
  // Bulk create memories
  app.post('/api/memories/bulk',
    validateBody({
      memories: { required: true }
    }),
    asyncHandler(controller.bulkCreate)
  );
}