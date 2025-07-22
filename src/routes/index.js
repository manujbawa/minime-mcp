/**
 * Route Registry
 * Central place to register all routes
 */

import healthRoutes from './health.js';
import configRoutes from './config.js';
import projectRoutes from './projects.js';
import memoryRoutes from './memories.js';
import analyticsRoutes from './analytics.js';
import learningRoutes from './learning.js';
// import insightsRoutes from './insights.js'; // Deprecated - using V2 insights
import adminRoutes from './admin.js';
import taskRoutes from './tasks.js';
import ollamaRoutes from './ollama.js';
import mcpRoutes from './mcp.js';
import logsRoutes from './logs.js';
// import sseRoutes from './sse.js'; // Removed - not needed for single-user local tool
import logger from '../utils/logger.js';

export function registerRoutes(app, services) {
  const routeModules = [
    { name: 'health', register: healthRoutes },
    { name: 'config', register: configRoutes },
    { name: 'projects', register: projectRoutes },
    { name: 'memories', register: memoryRoutes },
    { name: 'analytics', register: analyticsRoutes },
    { name: 'learning', register: learningRoutes },
    // { name: 'insights', register: insightsRoutes }, // Deprecated - using V2 insights
    { name: 'admin', register: adminRoutes },
    { name: 'tasks', register: taskRoutes },
    { name: 'ollama', register: ollamaRoutes },
    { name: 'mcp', register: mcpRoutes },
    { name: 'logs', register: logsRoutes }
    // { name: 'sse', register: sseRoutes } // Removed - not needed
  ];

  // Register each route module
  for (const { name, register } of routeModules) {
    try {
      register(app, services);
      logger.info(`Registered ${name} routes`);
    } catch (error) {
      logger.error(`Failed to register ${name} routes:`, error);
      throw error;
    }
  }

  logger.info('All routes registered successfully');
}