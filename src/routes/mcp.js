/**
 * MCP Routes
 * Model Context Protocol endpoints
 */

import { asyncHandler } from '../server/middleware/error-handler.js';
import { MCPError, MCPErrorCodes } from '../services/mcp-errors.js';

export default function mcpRoutes(app, services) {
  const { mcpTools, mcpResources, mcpPrompts, mcpRoots, mcpSampling } = services;

  // MCP JSON-RPC endpoint
  app.post('/mcp', asyncHandler(async (req, res) => {
    const { jsonrpc, method, params, id } = req.body;

    // Validate JSON-RPC request
    if (jsonrpc !== '2.0') {
      const error = new MCPError(MCPErrorCodes.INVALID_REQUEST, 'Invalid Request');
      return res.json(error.toJSONRPC(id || null));
    }

    try {
      let result;

      switch (method) {
        // Tool methods
        case 'tools/list':
          const tools = mcpTools.listTools();
          result = { tools };
          break;

        case 'tools/call':
          result = await mcpTools.callTool(params.name, params.arguments);
          break;

        // Resource methods
        case 'resources/list':
          const resources = await mcpResources.listResources();
          result = { resources };
          break;

        case 'resources/read':
          const contents = await mcpResources.readResource(params.uri);
          result = { contents };
          break;

        case 'resources/templates/list':
          const templates = await mcpResources.listTemplates();
          result = { templates };
          break;

        case 'resources/templates/read':
          result = await mcpResources.readTemplate(params.uri);
          break;

        // Prompt methods
        case 'prompts/list':
          const prompts = await mcpPrompts.listPrompts();
          result = { prompts };
          break;

        case 'prompts/get':
          result = await mcpPrompts.getPrompt(params.name, params.arguments);
          break;

        // Roots methods
        case 'roots/list':
          const roots = await mcpRoots.listRoots();
          result = { roots };
          break;

        // Completion methods
        case 'completion/complete':
          if (!mcpSampling) {
            throw new MCPError(MCPErrorCodes.METHOD_NOT_FOUND, 'Method not found');
          }
          result = await mcpSampling.complete(params);
          break;

        default:
          throw new MCPError(MCPErrorCodes.METHOD_NOT_FOUND, 'Method not found');
      }

      res.json({
        jsonrpc: '2.0',
        result,
        id
      });
    } catch (error) {
      services.logger.error(`[MCP] Error handling ${method}:`, error);
      
      // Convert error to MCP format
      const mcpError = error instanceof MCPError ? error : 
        new MCPError(MCPErrorCodes.INTERNAL_ERROR, error.message || 'Internal error');
      
      res.json(mcpError.toJSONRPC(id));
    }
  }));

  // MCP capabilities endpoint
  app.get('/mcp/capabilities', (req, res) => {
    res.json({
      capabilities: {
        tools: { supported: true, listChanged: true },
        resources: { supported: true, listChanged: true },
        prompts: { supported: true, listChanged: true },
        roots: { supported: true, listChanged: true },
        completion: { supported: !!mcpSampling }
      },
      version: '0.1.0',
      name: 'minime-mcp'
    });
  });

  // MCP status endpoint for UI
  app.get('/mcp/status', asyncHandler(async (req, res) => {
    const showFullSchema = req.query.full === 'true';
    
    try {
      // Get tools from the MCP tools service
      const tools = mcpTools.listTools();
      
      res.json({
        message: 'MCP server ready with Streamable HTTP transport',
        version: "0.2.5",
        transport: {
          type: 'Streamable HTTP MCP',
          protocol: 'Model Context Protocol',
          endpoint: '/mcp',
          features: ['session_management', 'resumability', 'unified_get_post'],
          note: 'This is MCP protocol, not SSE. For SSE transport see /sse/status'
        },
        capabilities: {
          tools: {
            count: tools.length,
            available: showFullSchema ? tools : tools.map(t => ({ name: t.name, description: t.description }))
          },
          resources: {
            supported_schemes: ['file', 'project', 'memory', 'session'],
            total_available: 'dynamic',
            description: 'File system, project data, memories, and session resources'
          },
          prompts: {
            count: 10,
            categories: ['code-review', 'debugging', 'architecture', 'documentation', 'testing', 'optimization'],
            description: 'Reusable prompt templates for common development workflows'
          },
          roots: {
            default_roots: ['/app', '/workspace'],
            supports_updates: true,
            description: 'Workspace boundary management and resource discovery hints'
          },
          sampling: {
            supported_features: ['text_completion', 'code_analysis', 'debug_assistance', 'architecture_planning'],
            simulated: true,
            description: 'Server-requested LLM completions for advanced workflows'
          }
        },
        services: {
          embeddings: 'available',
          learning: 'active',
          sequentialThinking: 'active',
          projectManagement: 'active'
        },
        alternativeTransports: {
          sse: {
            endpoint: '/sse',
            status: '/sse/status',
            note: 'Server-Sent Events transport (separate from MCP)'
          }
        }
      });
    } catch (error) {
      services.logger.error('[MCP] Error getting status:', error);
      res.status(500).json({
        error: 'Failed to get MCP status',
        message: error.message
      });
    }
  }));
}