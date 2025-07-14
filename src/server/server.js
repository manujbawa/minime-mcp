/**
 * Main Server Entry Point
 * Modular server implementation
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

import { createApp, configureErrorHandling } from './app.js';
import { config, validateConfig } from './config/environment.js';
import { initializeServices, shutdownServices } from '../services/service-initializer.js';
import { registerRoutes } from '../routes/index.js';
import { createMCPServer } from '../mcp-server/index.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { JobScheduler } from '../jobs/JobScheduler.js';
import { registerAllJobs } from '../jobs/jobs/index.js';
import logger from '../utils/logger.js';

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
let server;
let mcpServer;
let jobScheduler;

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  
  // Stop accepting new connections
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
    });
  }
  
  // Stop job scheduler
  if (jobScheduler) {
    jobScheduler.stop();
  }
  
  // Shutdown all services
  try {
    await shutdownServices(logger);
  } catch (error) {
    logger.error('Error shutting down services:', error);
  }
  
  process.exit(0);
}

async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    
    logger.info('Starting MiniMe MCP Server...');
    
    // Initialize event system
    const eventEmitter = new EventEmitter(logger);
    
    // Initialize services
    logger.info('Initializing services...');
    const serviceRegistry = await initializeServices(logger);
    
    // Get services as object for passing to routes
    const services = serviceRegistry.getAllAsObject();
    
    // Add additional services
    services.logger = logger;
    services.eventEmitter = eventEmitter;
    services.serviceRegistry = serviceRegistry;
    
    // Create Express app
    logger.info('Creating Express application...');
    const app = createApp(services, config);
    
    // Register all routes
    logger.info('Registering routes...');
    registerRoutes(app, services);
    
    // Configure error handling (must be after routes)
    configureErrorHandling(app, logger);
    
    // Initialize job scheduler
    logger.info('Initializing job scheduler...');
    jobScheduler = new JobScheduler(services);
    registerAllJobs(jobScheduler, services);
    jobScheduler.start();
    
    // Start HTTP server
    const port = config.port;
    const host = config.host;
    
    server = app.listen(port, host, () => {
      logger.info(`🚀 Server started on http://${host}:${port}`);
      logger.info(`📁 Database: ${config.database.path}`);
      logger.info(`🤖 Ollama: ${config.ollama.host}`);
      
      // Start MCP server if not already started by stdio
      if (!process.env.MCP_STDIO) {
        startMCPServerStandalone(services);
      }
    });
    
    // Emit system ready event
    eventEmitter.emit('system:ready');
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function startMCPServerStandalone(services) {
  try {
    logger.info('Starting MCP server in standalone mode...');
    // In standalone mode, MCP is accessed via HTTP endpoints, not directly
    // The mcpServer instance is created and configured but not connected to a transport
    // since HTTP requests will be handled by Express routes
    const { createMCPServer } = await import('../mcp-server/index.js');
    mcpServer = createMCPServer(services);
    logger.info('MCP server configured for HTTP transport at /mcp endpoint');
  } catch (error) {
    logger.error('Failed to configure MCP server:', error);
    // Non-fatal error - HTTP endpoints can still work without MCP server instance
  }
}

// Start server or MCP based on environment
if (process.env.MCP_STDIO === '1') {
  // MCP stdio mode
  logger.info('Starting in MCP stdio mode...');
  
  initializeServices(logger).then(async (services) => {
    const { startMCPServer } = await import('../mcp-server/index.js');
    await startMCPServer(services, 'stdio');
    
    logger.info('MCP server started in stdio mode');
  }).catch((error) => {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  });
} else {
  // Normal HTTP server mode
  startServer();
}