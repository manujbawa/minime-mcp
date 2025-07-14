/**
 * Learning Routes
 * Unified Insights v2 endpoints
 */

import { InsightsV2Controller } from '../controllers/InsightsV2Controller.js';
import { asyncHandler } from '../server/middleware/error-handler.js';
import { validateBody, validateQuery } from '../server/middleware/validation.js';

export default function learningRoutes(app, services) {
  const controller = new InsightsV2Controller(services);

  // Get insights from unified_insights_v2 with advanced filtering
  app.get('/api/learning/insights',
    validateQuery({
      category: { type: 'string' },
      type: { type: 'string' },
      insight_type: { type: 'string' },
      project_id: { type: 'string' },
      project_name: { type: 'string' },
      source_type: { type: 'string', enum: ['all', 'memory', 'cluster'] },
      actionable_only: { type: 'boolean' },
      min_confidence: { type: 'number' },
      search: { type: 'string' },
      date_range: { type: 'string', enum: ['all', '1d', '7d', '30d', '3m', '1y'] },
      limit: { type: 'number' },
      offset: { type: 'number' }
    }),
    asyncHandler(controller.getInsights)
  );
  
  // Get patterns from pattern_library_v2
  app.get('/api/learning/patterns',
    validateQuery({
      pattern_category: { type: 'string' },
      project_name: { type: 'string' },
      min_confidence: { type: 'number' },
      limit: { type: 'number' },
      offset: { type: 'number' }
    }),
    asyncHandler(controller.getPatterns)
  );
  
  // Get v2 system status
  app.get('/api/learning/status', asyncHandler(controller.getStatus));
  
  // Get monitoring data
  app.get('/api/learning/monitoring', asyncHandler(controller.getMonitoring));
  
  // Trigger analysis
  app.post('/api/learning/analyze',
    validateBody({
      projectName: { required: true, type: 'string' },
      analysisType: { 
        required: false, 
        type: 'string',
        enum: ['full', 'patterns', 'insights', 'quick']
      },
      options: { required: false, type: 'object' }
    }),
    asyncHandler(controller.triggerAnalysis)
  );
  
  // Get insight categories
  app.get('/api/learning/categories', asyncHandler(controller.getCategories));
  
  // Get pattern categories
  app.get('/api/learning/pattern-categories', asyncHandler(controller.getPatternCategories));
  
  // Get insight metrics
  app.get('/api/learning/insights/metrics',
    validateQuery({
      project_id: { type: 'string' },
      date_range: { type: 'string', enum: ['7d', '30d', '3m', '1y'] }
    }),
    asyncHandler(controller.getInsightMetrics)
  );
  
  // Get cluster metrics
  app.get('/api/learning/clusters/metrics', asyncHandler(controller.getClusterMetrics));
  
  // Search insights with semantic search
  app.post('/api/learning/insights/search',
    validateBody({
      query: { required: true, type: 'string' },
      limit: { type: 'number' },
      min_confidence: { type: 'number' }
    }),
    asyncHandler(controller.searchInsights)
  );
}