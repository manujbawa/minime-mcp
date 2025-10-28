import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListRootsRequestSchema,
  CreateMessageRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Server configuration
const MINIME_SERVER_URL = process.env.MINIME_SERVER_URL || 'http://localhost:8000/mcp';
const DEBUG = process.env.MINIME_DEBUG === 'true';

// Logging helper
function log(...args) {
  if (DEBUG) {
    console.error('[MiniMe MCP Client]', ...args);
  }
}

// Create the MCP server that communicates via stdio with Cursor
const server = new Server({
  name: "minime-mcp",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {},
    resources: {},
    prompts: {},
    sampling: {},
    roots: {
      listChanged: true
    }
  }
});

// Helper to make HTTP requests to MiniMe server
async function callMiniMeServer(method, params = {}) {
  const requestBody = {
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: Date.now().toString()
  };

  log(`Calling MiniMe server: ${method}`, params);

  try {
    const response = await fetch(MINIME_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'User-Agent': 'MiniMe-MCP-Client/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error.message || 'Unknown error');
    }

    log(`Response from MiniMe:`, result.result);
    return result.result;
  } catch (error) {
    log(`Error calling MiniMe:`, error);
    throw error;
  }
}

// Handle tool discovery
server.setRequestHandler(ListToolsRequestSchema, async () => {
  log('Handling tools/list request');
  return await callMiniMeServer('tools/list');
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  log(`Handling tools/call request: ${name}`, args);
  return await callMiniMeServer('tools/call', { name, arguments: args });
});

// Handle resource listing
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  log('Handling resources/list request');
  return await callMiniMeServer('resources/list');
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  log(`Handling resources/read request: ${uri}`);
  return await callMiniMeServer('resources/read', { uri });
});

// Handle prompt listing
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  log('Handling prompts/list request');
  return await callMiniMeServer('prompts/list');
});

// Handle prompt retrieval
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  log(`Handling prompts/get request: ${name}`, args);
  return await callMiniMeServer('prompts/get', { name, arguments: args });
});

// Handle sampling requests
server.setRequestHandler(CreateMessageRequestSchema, async (request) => {
  log('Handling sampling/createMessage request');
  return await callMiniMeServer('sampling/createMessage', request.params);
});

// Handle roots listing
server.setRequestHandler(ListRootsRequestSchema, async () => {
  log('Handling roots/list request');
  return await callMiniMeServer('roots/list');
});

// Start the stdio transport
async function start() {
  log(`Starting MiniMe MCP Client`);
  log(`Connecting to MiniMe server at: ${MINIME_SERVER_URL}`);
  
  // Test connection to MiniMe server
  try {
    // Extract base URL (remove /mcp if present)
    const baseUrl = MINIME_SERVER_URL.replace(/\/mcp$/, '');
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      console.error(`Warning: MiniMe server at ${baseUrl} is not responding`);
      console.error(`Make sure your Docker container is running: docker run -p 8000:8000 minime-mcp`);
    } else {
      log('Successfully connected to MiniMe server');
    }
  } catch (error) {
    const baseUrl = MINIME_SERVER_URL.replace(/\/mcp$/, '');
    console.error(`Warning: Cannot connect to MiniMe server at ${baseUrl}`);
    console.error(`Error: ${error.message}`);
    console.error(`Make sure your Docker container is running: docker run -p 8000:8000 minime-mcp`);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  log('MCP stdio transport connected');
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start().catch(error => {
  console.error('Failed to start MiniMe MCP Client:', error);
  process.exit(1);
});