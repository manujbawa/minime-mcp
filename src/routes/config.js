/**
 * Config Routes
 * Configuration management endpoints
 */

import { ConfigController } from '../controllers/ConfigController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateBody } from '../server/middleware/validation.js';

export default function configRoutes(app, services) {
  const controller = new ConfigController(services);

  // Get all configuration
  app.get('/api/config', asyncHandler(controller.getAll));
  
  // Get specific configuration
  app.get('/api/config/:key', asyncHandler(controller.get));
  
  // Update specific configuration
  app.put('/api/config/:key', 
    validateBody({
      value: { required: true },
      category: { required: false, type: 'string' }
    }),
    asyncHandler(controller.update)
  );
  
  // Bulk update configuration
  app.put('/api/config', asyncHandler(controller.bulkUpdate));
  
  // Reset configuration to defaults
  app.post('/api/config/reset', asyncHandler(controller.reset));
}