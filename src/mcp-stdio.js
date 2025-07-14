#!/usr/bin/env node

/**
 * MCP Server - STDIO Only Mode
 * For use with MCP clients like Cursor IDE
 */

import { initializeServices } from './services/service-initializer.js';
import { startMCPServer } from './mcp-server/index.js';
import logger from './utils/logger.js';

// Set MCP environment flag
process.env.MCP_STDIO = '1';

// Configure logger for stderr (won't interfere with MCP stdio)
logger.transports.forEach(transport => {
  if (transport.name === 'console') {
    transport.stream = process.stderr;
  }
});

// Main function
async function main() {
  try {
    logger.info('Starting MCP server in stdio mode...');
    
    // Initialize services
    const services = await initializeServices(logger);
    
    // Start MCP server with stdio transport
    await startMCPServer(services, 'stdio');
    
    logger.info('MCP server started successfully in stdio mode');
    
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.debug('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.debug('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  logger.error('Startup error:', error);
  process.exit(1);
});