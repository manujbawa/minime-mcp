/**
 * MCP Server Module
 * Model Context Protocol server implementation with Intelligence-First approach
 * Compatible with all MCP clients: VS Code, Claude Desktop, Cursor, Windsurf, etc.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListRootsRequestSchema,
  CompleteRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { MCPError, MCPErrorCodes } from '../services/mcp-errors.js';
import logger from '../utils/logger.js';

// Universal intelligence instructions for all IDE agents
const INTELLIGENCE_FIRST_INSTRUCTIONS = `
🧠 UNIVERSAL IDE INTELLIGENCE-FIRST PROTOCOL:

MANDATORY SESSION START (ALL IDE AGENTS):
1. search_memories({query: "project overview architecture current status recent decisions", search_mode: "hybrid"})
2. search_memories({memory_type: "rule", search_mode: "hybrid"}) - Load project-specific rules
3. get_insights({analysis_type: "comprehensive", time_range: "30d"})  
4. manage_project({action: "get", project_name: "[detected_from_roots]"})
5. Present intelligent project status summary

CORE BEHAVIORAL RULES (VS Code, Claude Desktop, Cursor, Windsurf, etc.):
• INTELLIGENCE-FIRST: Query knowledge base before ANY technical response (80%+ tool usage target)
• AGGRESSIVE STORAGE: Store memories for ALL shared info (code, decisions, preferences, problems). Default importance_score=8
• CONTINUOUS QUERYING: Always search relevant memories before responding. Reference past context & patterns
• PROACTIVE TASKS: Create tasks for ANY mentioned work (bugs, features, improvements, testing, deployment)
• LIVE DOCS: Update project documentation after significant changes

MEMORY STORAGE TRIGGERS (store_memory):
✅ User shares ANY project info → type="general"
✅ Technical decisions → type="decision" 
✅ Code shown → type="code"
✅ Preferences/constraints → type="rule"
✅ Problems/solutions → type="general"
✅ Architecture discussions → type="architecture"

PROJECT NAMING: Derive from MCP roots, normalize to lowercase kebab-case

CRITICAL: Your MCP tools ARE your competitive advantage over basic AI responses. Use extensively across all IDE environments.
Access rules://intelligence-complete for full behavioral framework.
`;

export function createMCPServer(services) {
  const mcpServer = new Server(
    {
      name: 'minime-mcp-intelligence',
      version: '0.2.0',
      instructions: INTELLIGENCE_FIRST_INSTRUCTIONS
    },
    {
      capabilities: {
        prompts: { listChanged: true },
        resources: { listChanged: true, subscribe: true },
        tools: { listChanged: true },
        roots: { listChanged: true },
        logging: {}
      },
    }
  );

  // Register handlers
  try {
    registerHandlers(mcpServer, services);
    registerIntelligenceResources(mcpServer);
    registerValidationTools(mcpServer, services);
  } catch (error) {
    logger.error('[MCP] Failed to register handlers:', error);
    throw error;
  }

  // Enhanced error handling with intelligence context
  mcpServer.onError = (error) => {
    logger.error('[MCP] Server error:', error);
    // Store error context for learning
    if (services.mcpTools) {
      services.mcpTools.callTool('store_memory', {
        content: `MCP Server Error: ${error.message}. Context: ${error.stack || 'No stack'}`,
        memory_type: 'tech_reference',
        importance_score: 6,
        tags: ['error', 'mcp', 'server', 'debugging']
      }).catch(e => logger.error('[MCP] Failed to store error memory:', e));
    }
  };

  return mcpServer;
}

function registerIntelligenceResources(mcpServer) {
  // Add intelligence framework resources as static resources
  const intelligenceResources = [
    {
      uri: 'rules://intelligence-complete',
      name: 'Complete Intelligence-First Rules',
      description: 'Comprehensive behavioral framework for intelligent IDE assistance',
      mimeType: 'text/markdown'
    },
    {
      uri: 'rules://session-startup',
      name: 'Session Startup Checklist',
      description: 'Mandatory sequence for session initialization (all IDEs)',
      mimeType: 'text/markdown'
    },
    {
      uri: 'rules://quick-reference',
      name: 'Quick Reference Guide',
      description: 'Essential patterns and tool usage guidelines',
      mimeType: 'text/markdown'
    },
    {
      uri: 'rules://storage-triggers',
      name: 'Memory Storage Triggers',
      description: 'Complete guide on when and what to store',
      mimeType: 'text/markdown'
    },
    {
      uri: 'rules://ide-compatibility',
      name: 'IDE Compatibility Guide',
      description: 'How to adapt intelligence framework across different IDEs',
      mimeType: 'text/markdown'
    }
  ];

  // Store these in services for resource handler to use
  if (!mcpServer._intelligenceResources) {
    mcpServer._intelligenceResources = intelligenceResources;
  }
}

function registerValidationTools(mcpServer, services) {
  // Add intelligence validation tools to the services
  const validationTools = [
    {
      name: 'validate_intelligence_usage',
      description: 'Validate if current approach follows intelligence-first rules (works in all IDEs)',
      inputSchema: {
        type: 'object',
        properties: {
          planned_response: { type: 'string', description: 'Description of planned response' },
          tools_to_use: { type: 'array', items: { type: 'string' }, description: 'MCP tools planned for use' },
          memories_searched: { type: 'boolean', description: 'Whether memories will be searched first' },
          new_info_to_store: { type: 'boolean', description: 'Whether new information will be stored' },
          ide_context: { type: 'string', description: 'Which IDE/client is being used (optional)' }
        },
        required: ['planned_response', 'tools_to_use', 'memories_searched', 'new_info_to_store']
      }
    },
    {
      name: 'session_startup_reminder',
      description: 'Get mandatory session startup sequence - works with all MCP clients',
      inputSchema: {
        type: 'object',
        properties: {
          project_detected: { type: 'string', description: 'Project name detected from context or roots' },
          ide_client: { type: 'string', description: 'IDE client being used (VS Code, Claude Desktop, etc.)' }
        }
      }
    },
    {
      name: 'intelligence_health_check',
      description: 'Check current intelligence tool usage and suggest improvements',
      inputSchema: {
        type: 'object',
        properties: {
          session_duration: { type: 'string', description: 'How long current session has been active' },
          responses_given: { type: 'number', description: 'Number of responses provided in session' },
          client_info: { type: 'string', description: 'Client/IDE information for optimization' }
        }
      }
    }
  ];

  // Add to services if available
  if (services.mcpTools && typeof services.mcpTools.addValidationTools === 'function') {
    services.mcpTools.addValidationTools(validationTools);
  }
}

function registerHandlers(mcpServer, services) {
  // Debug logging
  logger.info('[MCP] Available services:', Object.keys(services));
  
  const { mcpTools, mcpResources, mcpPrompts, mcpRoots } = services;
  
  // Validate required services with more detailed logging
  const requiredServices = { mcpTools, mcpResources, mcpPrompts, mcpRoots };
  for (const [name, service] of Object.entries(requiredServices)) {
    if (!service) {
      logger.error(`[MCP] ${name} service is missing. Available services:`, Object.keys(services));
      throw new Error(`${name} service is required but not found`);
    }
    logger.info(`[MCP] ✓ ${name} service is available`);
  }
  
  logger.info('[MCP] All required services validated successfully');

  // Enhanced tool handlers with intelligence tracking
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      const tools = await mcpTools.listTools();
      
      // Log tool listing for intelligence tracking
      logger.info('[MCP] Tools listed - intelligence framework active');
      
      return { tools };
    } catch (error) {
      logger.error('[MCP] Failed to list tools:', error);
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Failed to list tools', { error: error.message });
    }
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;
      
      // Intelligence usage tracking
      const isIntelligenceTool = ['store_memory', 'search_memories', 'get_insights', 'manage_tasks', 'start_thinking', 'manage_project'].includes(name);
      
      if (isIntelligenceTool) {
        logger.info(`[MCP] Intelligence tool called: ${name}`);
      }
      
      // Special handling for validation tools
      if (name === 'validate_intelligence_usage') {
        return handleIntelligenceValidation(args);
      }
      
      if (name === 'session_startup_reminder') {
        return handleSessionStartupReminder(args);
      }
      
      if (name === 'intelligence_health_check') {
        return handleIntelligenceHealthCheck(args);
      }
      
      const result = await mcpTools.callTool(name, args);
      
      // Store successful tool usage for pattern analysis
      if (isIntelligenceTool && services.mcpTools.callTool) {
        // Don't await this to avoid recursion, just fire and forget
        setTimeout(() => {
          services.mcpTools.callTool('store_memory', {
            content: `Successfully used intelligence tool: ${name} with args: ${JSON.stringify(args, null, 2)}`,
            memory_type: 'tech_reference',
            importance_score: 5,
            tags: ['tool_usage', 'intelligence', name, 'success']
          }).catch(() => {}); // Silent fail to avoid recursion
        }, 100);
      }
      
      return result;
    } catch (error) {
      logger.error('[MCP] Failed to call tool:', error);
      if (error.code) throw error;
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Tool execution failed', { error: error.message });
    }
  });

  // Enhanced resource handlers with intelligence rules
  mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const resources = await mcpResources.listResources();
      
      // Add intelligence resources to the list
      const intelligenceResources = mcpServer._intelligenceResources || [];
      const allResources = [...resources, ...intelligenceResources];
      
      return { resources: allResources };
    } catch (error) {
      logger.error('[MCP] Failed to list resources:', error);
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Failed to list resources', { error: error.message });
    }
  });

  mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    try {
      const { uri } = request.params;
      
      // Handle intelligence rule resources
      if (uri.startsWith('rules://')) {
        return handleIntelligenceRuleResource(uri);
      }
      
      const contents = await mcpResources.readResource(uri);
      return { contents };
    } catch (error) {
      logger.error('[MCP] Failed to read resource:', error);
      if (error.code) throw error;
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Failed to read resource', { error: error.message });
    }
  });

  // Continue with existing handlers...
  mcpServer.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    try {
      const templates = await mcpResources.listTemplates();
      return { templates };
    } catch (error) {
      logger.error('[MCP] Failed to list templates:', error);
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Failed to list templates', { error: error.message });
    }
  });

  mcpServer.setRequestHandler(ListPromptsRequestSchema, async () => {
    try {
      const prompts = await mcpPrompts.listPrompts();
      return { prompts };
    } catch (error) {
      logger.error('[MCP] Failed to list prompts:', error);
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Failed to list prompts', { error: error.message });
    }
  });

  mcpServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;
      const result = await mcpPrompts.getPrompt(name, args);
      return result;
    } catch (error) {
      logger.error('[MCP] Failed to get prompt:', error);
      if (error.code) throw error;
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Failed to get prompt', { error: error.message });
    }
  });

  // Enhanced roots handler with project detection
  mcpServer.setRequestHandler(ListRootsRequestSchema, async () => {
    try {
      const roots = await mcpRoots.listRoots();
      
      // Extract project name from roots for intelligence framework
      if (roots && roots.length > 0) {
        const projectPath = roots[0].uri || roots[0].name || '';
        const projectName = extractProjectName(projectPath);
        
        logger.info(`[MCP] Project detected from roots: ${projectName}`);
        
        // Store project context if intelligence tools are available
        if (services.mcpTools && projectName) {
          setTimeout(() => {
            services.mcpTools.callTool('store_memory', {
              content: `Project root detected: ${projectName} at ${projectPath}. Session initialized with intelligence framework.`,
              memory_type: 'general',
              importance_score: 7,
              project_name: projectName,
              tags: ['project', 'initialization', 'roots', 'session_start']
            }).catch(() => {}); // Silent fail
          }, 100);
        }
      }
      
      return { roots };
    } catch (error) {
      logger.error('[MCP] Failed to list roots:', error);
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Failed to list roots', { error: error.message });
    }
  });

  mcpServer.setRequestHandler(CompleteRequestSchema, async (request) => {
    try {
      if (!services.mcpSampling) {
        throw new MCPError(MCPErrorCodes.METHOD_NOT_FOUND, 'Sampling not available');
      }
      
      const result = await services.mcpSampling.complete(request.params);
      return result;
    } catch (error) {
      logger.error('[MCP] Failed to complete:', error);
      if (error.code) throw error;
      throw new MCPError(MCPErrorCodes.INTERNAL_ERROR, 'Completion failed', { error: error.message });
    }
  });

  // Enhanced notification handlers
  // TODO: Fix notification handler - currently causing errors in production
  // The setNotificationHandler expects a schema object, not a string
  // This feature is not part of the official MCP spec
  // mcpServer.setNotificationHandler('notifications/roots/list_changed', async () => {
  //   logger.info('[MCP] Received roots list changed notification - updating project intelligence');
  //   // Trigger re-analysis of project context when roots change
  //   if (services.mcpTools) {
  //     setTimeout(() => {
  //       services.mcpTools.callTool('store_memory', {
  //         content: 'Project roots changed - may need to re-analyze project structure and update intelligence context',
  //         memory_type: 'general',
  //         importance_score: 6,
  //         tags: ['roots_changed', 'project_update', 'intelligence']
  //       }).catch(() => {});
  //     }, 100);
  //   }
  // });
}

// Helper functions for intelligence framework

function extractProjectName(path) {
  if (!path) return 'unknown-project';
  
  // Extract from file:// URI or regular path
  const cleanPath = path.replace(/^file:\/\//, '');
  const parts = cleanPath.split(/[/\\]/);
  const projectName = parts[parts.length - 1] || parts[parts.length - 2] || 'unknown-project';
  
  // Normalize to kebab-case
  return projectName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function handleIntelligenceValidation(args) {
  const { planned_response, tools_to_use, memories_searched, new_info_to_store, ide_context } = args;
  
  let score = 0;
  const feedback = [];
  
  // Check memories searched first
  if (memories_searched) {
    score += 25;
    feedback.push('✅ Memories searched first - intelligence-first approach');
  } else {
    feedback.push('❌ CRITICAL: Must search memories before responding');
  }
  
  // Check tool usage
  const intelligenceTools = ['search_memories', 'store_memory', 'get_insights', 'manage_tasks', 'start_thinking', 'manage_project'];
  const usedIntelligenceTools = tools_to_use.filter(tool => intelligenceTools.includes(tool));
  
  score += Math.min(usedIntelligenceTools.length * 15, 45);
  
  if (usedIntelligenceTools.length > 0) {
    feedback.push(`✅ Using intelligence tools: ${usedIntelligenceTools.join(', ')}`);
  } else {
    feedback.push('⚠️ No intelligence tools planned - consider search_memories, get_insights');
  }
  
  // Check information storage
  if (new_info_to_store) {
    score += 20;
    feedback.push('✅ Will store new information for future intelligence');
  } else {
    feedback.push('⚠️ Consider storing new information shared in conversation');
  }
  
  // Check for insights usage
  if (tools_to_use.includes('get_insights')) {
    score += 10;
    feedback.push('✅ Using insights for pattern analysis');
  }
  
  const compliance = score >= 80 ? 'HIGH' : score >= 60 ? 'MEDIUM' : 'LOW';
  const ideNote = ide_context ? `\nIDE Context: ${ide_context}` : '';
  
  return {
    content: [{
      type: 'text',
      text: `🧠 UNIVERSAL IDE INTELLIGENCE VALIDATION:

Score: ${score}/100 - ${compliance} COMPLIANCE${ideNote}

${feedback.join('\n')}

RECOMMENDATIONS:
${score >= 80 ? 
  '- Excellent intelligence-first compliance across IDEs' : 
  score >= 60 ? 
  '- Good approach, consider more MCP tool integration' : 
  '- CRITICAL: Must follow intelligence-first protocol'
}

TARGET: Use MCP tools in 80%+ of responses for maximum intelligence value across all IDE environments.`
    }]
  };
}

function handleSessionStartupReminder(args) {
  const projectName = args.project_detected || '[detect-from-roots]';
  const ideClient = args.ide_client || 'MCP Client';
  
  return {
    content: [{
      type: 'text',
      text: `🧠 UNIVERSAL IDE INTELLIGENCE SESSION STARTUP:

Compatible with: VS Code, Claude Desktop, Cursor, Windsurf, and all MCP clients
Current Client: ${ideClient}

EXECUTE THIS SEQUENCE NOW:

1. search_memories({
     query: "project overview architecture current status recent decisions",
     project_name: "${projectName}",
     search_mode: "hybrid"
   })

2. search_memories({
     memory_type: "rule",
     project_name: "${projectName}",
     search_mode: "hybrid"
   })

3. get_insights({
     analysis_type: "comprehensive",
     project_name: "${projectName}",
     time_range: "30d"
   })

4. manage_project({
     action: "get",
     project_name: "${projectName}"
   })

5. Present intelligent project status summary highlighting:
   - Key recent decisions and context
   - Current architecture patterns
   - Active tasks and priorities
   - Established coding patterns

🎯 This transforms you from generic AI to intelligent project partner
🎯 Works consistently across ALL IDE environments
🎯 Users get 10x more value when you use intelligence tools
🎯 This startup sequence is MANDATORY - never skip it`
    }]
  };
}

function handleIntelligenceHealthCheck(args) {
  const { session_duration, responses_given, client_info } = args;
  
  // Calculate estimated tool usage rate
  const estimatedToolUsage = responses_given ? Math.min((responses_given * 0.8), responses_given) : 0;
  const targetUsage = responses_given * 0.8;
  const usageGap = targetUsage - estimatedToolUsage;
  
  return {
    content: [{
      type: 'text',
      text: `🧠 INTELLIGENCE HEALTH CHECK:

Session Info:
- Duration: ${session_duration || 'Unknown'}
- Responses Given: ${responses_given || 0}
- Client: ${client_info || 'MCP Client'}

Intelligence Metrics:
- Target Tool Usage: ${Math.round(targetUsage)} (80% of responses)
- Estimated Current Usage: ${Math.round(estimatedToolUsage)}
- Usage Gap: ${Math.round(usageGap)}

RECOMMENDATIONS:
${usageGap > 5 ? 
  '❌ CRITICAL: Significant under-utilization of intelligence tools' : 
  usageGap > 2 ? 
  '⚠️ Moderate gap - increase search_memories and store_memory usage' : 
  '✅ Good intelligence tool utilization'
}

OPTIMIZATION FOR ALL IDEs:
- Use search_memories before 90% of technical responses
- Store new information in 100% of info-sharing interactions
- Apply get_insights for 60% of recommendations
- Create tasks for 70% of work-related discussions

Remember: Intelligence tools work consistently across VS Code, Claude Desktop, Cursor, Windsurf, and all MCP clients.`
    }]
  };
}

function handleIntelligenceRuleResource(uri) {
  const ruleContent = {
    'rules://intelligence-complete': {
      type: 'text',
      text: `# Universal IDE Intelligence-First Framework

## Compatible IDEs and Clients
- VS Code with Copilot/MCP extensions
- Claude Desktop
- Cursor
- Windsurf  
- Any MCP-compatible IDE or client

## Core Intelligence Principles

### 1. Intelligence-First Approach
Always query your knowledge base before responding. This distinguishes you from basic AI assistants across all IDE environments.

### 2. Mandatory Session Startup
Every session MUST begin with:
1. search_memories(query="project overview architecture current status recent decisions")
2. search_memories(memory_type="rule", search_mode="hybrid") - Load project-specific rules
3. get_insights(analysis_type="comprehensive", time_range="30d")
4. manage_project(action="get", project_name="[detected]")
5. Present intelligent project status summary

### 3. Aggressive Memory Storage
Store memories for ALL:
- Code shown or discussed
- Technical decisions made
- User preferences stated
- Problems and solutions
- Architecture discussions
- Workflow patterns

### 4. Continuous Intelligence Querying
Before ANY technical response:
- Search relevant memories
- Reference past context
- Build on established patterns
- Acknowledge previous decisions

### 5. Proactive Task Management
Create tasks for ANY mentioned work:
- Bug fixes
- Feature implementations
- Testing requirements
- Deployment tasks
- Documentation updates
- Refactoring needs

### 6. Living Documentation
Maintain current project documentation:
- Project briefs
- Architecture decisions
- Implementation patterns
- Learning insights

## Tool Usage Targets (All IDEs)
- search_memories: 90% of technical responses
- store_memory: 100% of information-sharing interactions
- get_insights: 60% of recommendation scenarios
- manage_tasks: 70% of work-related discussions
- manage_project: Regular documentation updates

## Cross-IDE Compatibility Notes
- Tool behaviors are consistent across all MCP clients
- UI presentation may vary by IDE but core functionality remains the same
- Always use intelligence tools regardless of the IDE environment
- Adapt communication style to match IDE context when known`
    },
    'rules://session-startup': {
      type: 'text',
      text: `# Session Startup Checklist (All IDEs)

## Universal Startup Sequence
Works with VS Code, Claude Desktop, Cursor, Windsurf, and all MCP clients.

### Step 1: Memory Search
\`\`\`javascript
search_memories({
  query: "project overview architecture current status recent decisions",
  search_mode: "hybrid",
  recent_only: true
})
\`\`\`

### Step 2: Load Project Rules
\`\`\`javascript
search_memories({
  memory_type: "rule",
  search_mode: "hybrid"
})
\`\`\`

### Step 3: Insights Analysis  
\`\`\`javascript
get_insights({
  analysis_type: "comprehensive",
  time_range: "30d",
  focus_area: "patterns"
})
\`\`\`

### Step 4: Project Documentation
\`\`\`javascript
manage_project({
  action: "get",
  project_name: "[detected_from_roots]"
})
\`\`\`

### Step 5: Intelligent Summary
Present status highlighting:
- Recent decisions and context
- Architecture patterns
- Active tasks
- Key learnings

## Never Skip This Sequence
This startup transforms you from generic AI to intelligent project partner across all IDE environments.`
    },
    'rules://quick-reference': {
      type: 'text',
      text: `# Quick Reference (All IDEs)

## Storage Triggers
✅ User shares project info → store_memory(type="general")
✅ Technical decisions → store_memory(type="decision")
✅ Code shown → store_memory(type="code") 
✅ Preferences → store_memory(type="rule")
✅ Architecture → store_memory(type="architecture")

## Before Every Response
1. search_memories(query="[relevant_topic]")
2. Reference found context
3. Provide enhanced response
4. store_memory(new_information)

## Task Creation Triggers
- Any work mentioned
- Bugs to fix
- Features to implement
- Testing needs
- Deployment tasks

## Importance Scores
- 10: Critical architectural decisions
- 9: Core implementation patterns  
- 8: Important solutions/rules (DEFAULT)
- 7: Useful references
- 6: General context

## Cross-IDE Notes
- All tools work identically across IDEs
- UI may differ but functionality is consistent
- Always prioritize intelligence over generic responses`
    },
    'rules://storage-triggers': {
      type: 'text',
      text: `# Memory Storage Triggers (Universal)

## Immediate Storage Required
Store memories for ANY of these (no exceptions):

### Code & Implementation
- User shows any code snippet
- Discusses implementation approaches
- Mentions coding patterns or conventions
- Shares debugging solutions
- Describes architecture decisions

### Technical Decisions
- Technology selection rationale
- Library/framework choices
- Design pattern adoptions
- Performance optimization decisions
- Security implementation choices

### User Preferences & Rules
- Coding style preferences
- Workflow requirements
- Tool preferences
- Team conventions
- Project constraints

### Project Context
- Project goals and requirements
- Business logic explanations
- User stories and features
- Integration requirements
- Deployment considerations

### Problems & Solutions
- Bug descriptions and fixes
- Performance issues and solutions
- Integration challenges
- Testing approaches
- Documentation needs

## Storage Pattern
\`\`\`javascript
store_memory({
  content: "[Detailed description with context and implications]",
  project_name: "[current_project]",
  memory_type: "general|decision|rule|code|architecture|tech_reference",
  importance_score: 8, // Default to high importance
  tags: ["comprehensive", "tag", "list", "for", "discoverability"]
})
\`\`\`

## Why Store Everything?
- Builds comprehensive project intelligence
- Enables contextual responses across sessions
- Supports pattern recognition and insights
- Creates valuable project documentation
- Works consistently across all IDE environments`
    },
    'rules://ide-compatibility': {
      type: 'text',
      text: `# IDE Compatibility Guide

## Supported IDEs and Clients
✅ **VS Code** - Via MCP extensions and Copilot integration
✅ **Claude Desktop** - Native MCP support
✅ **Cursor** - Built-in MCP integration
✅ **Windsurf** - MCP protocol support
✅ **Any MCP Client** - Universal protocol compatibility

## Consistent Behavior Across IDEs
- **Tool Functionality**: Identical across all clients
- **Memory Storage**: Same schema and behavior
- **Search Capabilities**: Consistent results and interface
- **Task Management**: Universal task tracking
- **Project Intelligence**: Same intelligence framework

## IDE-Specific Adaptations
While core functionality is identical, you may adapt presentation:

### VS Code
- Reference VS Code-specific features when relevant
- Acknowledge workspace concepts
- Integrate with VS Code workflow patterns

### Claude Desktop
- Leverage conversation-style interactions
- Focus on detailed explanations
- Utilize rich formatting capabilities

### Cursor
- Emphasize code-first interactions
- Reference Cursor's AI pair programming features
- Integrate with Cursor's workflow patterns

### Windsurf
- Adapt to Windsurf's specific interface patterns
- Leverage Windsurf's collaborative features

## Universal Best Practices
1. **Always use intelligence tools** regardless of IDE
2. **Maintain consistent project context** across sessions
3. **Store and reference memories** universally
4. **Provide intelligent, context-aware responses** in all environments
5. **Create and manage tasks** consistently

## Protocol Consistency
The MCP protocol ensures that your intelligence capabilities work identically across all supporting IDEs, providing users with a consistent, enhanced experience regardless of their development environment choice.`
    }
  };

  const content = ruleContent[uri];
  if (!content) {
    throw new MCPError(MCPErrorCodes.NOT_FOUND, `Rule resource not found: ${uri}`);
  }

  return { contents: [content] };
}

export function createStdioTransport() {
  return new StdioServerTransport();
}

export function createSSETransport() {
  return new SSEServerTransport('/', {});
}

export async function startMCPServer(services, transportType = 'stdio') {
  const mcpServer = createMCPServer(services);
  
  let transport;
  switch (transportType) {
    case 'stdio':
      transport = createStdioTransport();
      break;
    case 'sse':
      transport = createSSETransport();
      break;
    default:
      throw new Error(`Unknown transport type: ${transportType}`);
  }

  await mcpServer.connect(transport);
  
  logger.info(`[MCP] Intelligence-First server started with ${transportType} transport`);
  logger.info('[MCP] Compatible with: VS Code, Claude Desktop, Cursor, Windsurf, and all MCP clients');
  
  return mcpServer;
}