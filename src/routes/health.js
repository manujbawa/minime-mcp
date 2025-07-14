/**
 * Health Routes
 * System health check endpoints
 */

import { HealthController } from '../controllers/HealthController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';

export default function healthRoutes(app, services) {
  const controller = new HealthController(services);

  // Basic health check
  app.get('/health', asyncHandler(controller.getHealth));
  
  // Detailed health check
  app.get('/api/health', asyncHandler(controller.getDetailedHealth));
}