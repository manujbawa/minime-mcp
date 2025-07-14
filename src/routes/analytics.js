/**
 * Analytics Routes
 * Analytics data endpoints
 */

import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateQuery } from '../server/middleware/validation.js';

export default function analyticsRoutes(app, services) {
  const controller = new AnalyticsController(services);

  // Get comprehensive analytics
  app.get('/api/analytics',
    validateQuery({
      project_name: { type: 'string' },
      timeframe: { type: 'string' }
    }),
    asyncHandler(controller.getAnalytics)
  );
  
  // Get time series data
  app.get('/api/analytics/timeseries',
    validateQuery({
      metric: { required: true, type: 'string' },
      project_name: { type: 'string' },
      timeRange: { type: 'string' },
      granularity: { 
        type: 'string',
        enum: ['minute', 'hour', 'day', 'week', 'month']
      }
    }),
    asyncHandler(controller.getTimeSeries)
  );
  
  // Get dashboard data
  app.get('/api/analytics/dashboard',
    validateQuery({
      project_name: { type: 'string' },
      timeRange: { type: 'string' }
    }),
    asyncHandler(controller.getDashboard)
  );
}