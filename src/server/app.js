/**
 * Express App Factory
 * Creates and configures the Express application
 */

import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { loggingMiddleware } from './middleware/logging.js';
import { errorHandlerMiddleware } from './middleware/error-handler.js';

export function createApp(services, config) {
  const app = express();
  const { logger } = services;
  
  // Trust proxy
  app.set('trust proxy', 1);
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // CORS middleware
  app.use(corsMiddleware(config));
  
  // Logging middleware
  app.use(loggingMiddleware(logger));
  
  // Health check endpoint (before other routes)
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // Static files (if needed)
  app.use('/static', express.static('public'));
  
  return app;
}

/**
 * Configure error handling
 * Must be called after all routes are registered
 */
export function configureErrorHandling(app, logger) {
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path
    });
  });
  
  // Error handler (must be last)
  app.use(errorHandlerMiddleware(logger));
}