/**
 * MiniMe-MCP Entry Point
 * Main entry point for the MiniMe Model Context Protocol server
 */

import { server } from './server.js';

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Starting MiniMe-MCP server...');
}

export { server };
export * from './services/embedding/index.js';
// Learning pipeline moved to insights-v2 - use unified insights v2 instead