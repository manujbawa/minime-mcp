/**
 * Project Routes
 * Project management endpoints
 */

import { ProjectController } from '../controllers/ProjectController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateBody, validateQuery, schemas } from '../server/middleware/validation.js';

export default function projectRoutes(app, services) {
  const controller = new ProjectController(services);

  // List all projects
  app.get('/api/projects', asyncHandler(controller.list));
  
  // Create new project
  app.post('/api/projects',
    validateBody(schemas.projectName),
    asyncHandler(controller.create)
  );
  
  // Get specific project
  app.get('/api/projects/:projectName', asyncHandler(controller.get));
  
  // Delete project
  app.delete('/api/projects/:projectName', asyncHandler(controller.delete));
  
  // Project sessions
  app.get('/api/projects/:projectName/sessions',
    validateQuery(schemas.pagination),
    asyncHandler(controller.getSessions)
  );
  
  app.post('/api/projects/:projectName/sessions',
    validateBody({
      sessionName: { required: true, type: 'string', minLength: 1 }
    }),
    asyncHandler(controller.createSession)
  );
  
  // Project memories
  app.get('/api/projects/:projectName/memories',
    validateQuery({
      ...schemas.pagination,
      memory_type: { 
        type: 'string',
        enum: ['code', 'decision', 'rule', 'note', 'progress', 'project_brief', 'project_prd', 'project_plan', 'tech_reference', 'tech_context', 'architecture', 'requirements', 'bug', 'task', 'general']
      },
      session_name: { type: 'string' },
      search: { type: 'string' },
      ...schemas.dateRange
    }),
    asyncHandler(controller.getMemories)
  );
  
  app.delete('/api/projects/:projectName/memories',
    validateQuery({
      sessionName: { type: 'string' },
      memoryType: { 
        type: 'string',
        enum: ['code', 'decision', 'rule', 'note', 'progress', 'project_brief', 'project_prd', 'project_plan', 'tech_reference', 'tech_context', 'architecture', 'requirements', 'bug', 'task', 'general']
      }
    }),
    asyncHandler(controller.deleteMemories)
  );
  
  // Project thinking sequences
  app.get('/api/projects/:projectName/thinking',
    validateQuery({
      ...schemas.pagination,
      status: { 
        type: 'string',
        enum: ['active', 'completed', 'abandoned']
      }
    }),
    asyncHandler(controller.getThinking)
  );

  // Get detailed thinking sequence with thoughts (global endpoint)
  app.get('/api/thinking/:sequenceId',
    asyncHandler(controller.getThinkingSequenceDetails)
  );
  
  // Project tasks
  app.get('/api/projects/:projectName/tasks',
    validateQuery({
      ...schemas.pagination,
      status: { 
        type: 'string',
        enum: ['pending', 'in_progress', 'completed']
      },
      priority: {
        type: 'string',
        enum: ['low', 'medium', 'high']
      }
    }),
    asyncHandler(controller.getTasks)
  );
  
  app.post('/api/projects/:projectName/tasks',
    validateBody({
      content: { required: true, type: 'string', minLength: 1 },
      priority: { 
        required: false, 
        type: 'string',
        enum: ['low', 'medium', 'high']
      }
    }),
    asyncHandler(controller.createTask)
  );

  // Project linking endpoints
  app.post('/api/projects/:projectName/links',
    validateBody({
      target_project_id: { type: 'number' },
      target_project_name: { type: 'string' },
      link_type: { 
        type: 'string',
        enum: ['related', 'parent', 'child', 'dependency', 'fork', 'template'],
        default: 'related'
      },
      visibility: {
        type: 'string',
        enum: ['full', 'metadata_only', 'none'],
        default: 'full'
      },
      metadata: { type: 'object' }
    }),
    asyncHandler(controller.linkProjects)
  );

  app.get('/api/projects/:projectName/links',
    validateQuery({
      include_metadata: { type: 'boolean', default: true }
    }),
    asyncHandler(controller.getProjectLinks)
  );

  app.put('/api/projects/:projectName/links',
    validateBody({
      target_project_id: { required: true, type: 'number' },
      link_type: { 
        type: 'string',
        enum: ['related', 'parent', 'child', 'dependency', 'fork', 'template']
      },
      visibility: {
        type: 'string',
        enum: ['full', 'metadata_only', 'none']
      },
      metadata: { type: 'object' }
    }),
    asyncHandler(controller.updateProjectLink)
  );

  app.delete('/api/projects/:projectName/links',
    validateQuery({
      target_project_id: { required: true, type: 'number' }
    }),
    asyncHandler(controller.unlinkProjects)
  );

  app.get('/api/projects/:projectName/related-memories',
    validateQuery({
      ...schemas.pagination,
      include_metadata_only: { type: 'boolean', default: false },
      max_depth: { type: 'number', default: 2, min: 1, max: 5 }
    }),
    asyncHandler(controller.getRelatedMemories)
  );

  app.get('/api/projects/:projectName/relationship-hints',
    validateQuery({
      min_references: { type: 'number', default: 3, min: 1 },
      min_shared_tags: { type: 'number', default: 5, min: 1 }
    }),
    asyncHandler(controller.detectRelationships)
  );
}