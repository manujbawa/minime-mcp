/**
 * MCP Tools v3 - Clean Architecture
 * A thin wrapper that delegates all operations to appropriate services
 * Follows separation of concerns and single responsibility principles
 * 
 * Version 3 improvements:
 * - Pure delegation pattern
 * - No business logic in MCP layer
 * - All formatting and detection logic in dedicated services
 * - Improved testability and maintainability
 */

import { MCPResponseFormatter } from './mcp/mcp-response-formatter.js';
import { MemoryTypeDetector } from './memory/memory-type-detector.js';
import { SmartTagGenerator } from './memory/smart-tag-generator.js';
import { SchemaValidator } from './mcp/schema-validator.js';

export class MCPToolsV3 {
    constructor(logger, databaseService, services = {}) {
        this.logger = logger;
        this.db = databaseService;
        this.services = services;
        
        // Initialize formatters only - no business logic
        this.responseFormatter = new MCPResponseFormatter(logger);
        this.schemaValidator = new SchemaValidator(logger);
        
        // These should be in memory service, not here
        this.typeDetector = new MemoryTypeDetector(logger);
        this.tagGenerator = new SmartTagGenerator(logger);
        
        this.debug = false;
    }

    /**
     * List available tools - MCP SDK standard method
     */
    listTools() {
        return [
            {
                name: "store_memory",
                description: "Store project memories with auto-tagging. Use for decisions, code snippets, rules, or general notes that should be remembered across sessions. Memories are automatically categorized, tagged, and indexed for later retrieval. IDE Agents: Consider emotional context when choosing memory types - frustration often indicates a need for rules.",
                annotations: {
                    title: "Store Memory",
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false
                },
                inputSchema: {
                    type: "object",
                    properties: {
                        content: {
                            type: "string",
                            description: "Memory content to store. Can be plain text, markdown, code snippets, or structured documentation. Max 100,000 characters."
                        },
                        project_name: {
                            type: "string", 
                            description: "Project name for organization. Will be created if doesn't exist. IDE AGENTS: Derive this from the workspace root name provided via MCP roots (e.g., if root.name is 'MiniMe-MCP', use 'minime-mcp'). Normalize to lowercase kebab-case. Be consistent across all tool calls for the same workspace."
                        },
                        memory_type: {
                            type: "string",
                            enum: ["general", "decision", "rule", "code", "tech_reference", "tech_context", "architecture", "requirements", "bug", "task", "progress"],
                            description: "Memory type (auto-detected if omitted). Use: 'general' for notes, 'decision' for choices made, 'rule' for constraints, 'code' for snippets, 'tech_reference'/'tech_context' for technical details, 'architecture' for design, 'bug' for issues, 'task' for todos, 'progress' for updates. IDE AGENTS: Use 'rule' when detecting frustration/annoyance (prevent issues), confusion (clarity rules), or stress (process rules). Look for 'always', 'never', 'must', 'should' patterns."
                        },
                        importance_score: {
                            type: "number",
                            description: "Importance score between 0.0 and 1.0. Use: 0.9-1.0 for critical, 0.7-0.8 for important, 0.5-0.6 for normal, 0.3-0.4 for minor. Auto-scored based on content if omitted. Note: If you provide a value > 1, it will be normalized (e.g., 9 becomes 0.9)."
                        },
                        session_name: {
                            type: "string",
                            description: "Session grouping for organizing related memories (optional). Example: 'sprint-1', 'feature-auth', 'bugfix-session'. Defaults to date-based session."
                        },
                        tags: {
                            type: "array",
                            items: { type: "string" },
                            description: "Custom tags for categorization (auto-generated if omitted). Use lowercase, hyphenated tags. Example: ['authentication', 'oauth2', 'security']. System will add smart tags based on content analysis."
                        }
                    },
                    required: ["content", "project_name"]
                }
            },
            {
                name: "search_memories",
                description: "Search stored memories using semantic, keyword, or hybrid search. Returns relevant memories for context. Semantic search finds conceptually similar content, keyword search finds exact matches, hybrid combines both. Results include similarity scores and are sorted by relevance.",
                annotations: {
                    title: "Search Memories",
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true
                },
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Search query. Can be keywords, phrases, questions, or concepts. Examples: 'authentication flow', 'how do we handle errors?', 'OAuth implementation'. Semantic search understands context."
                        },
                        project_name: {
                            type: "string",
                            description: "Filter by specific project name (optional). Leave empty to search across all projects. IDE AGENTS: Use the same normalized name derived from workspace roots."
                        },
                        memory_type: {
                            type: "string",
                            enum: ["any", "general", "decision", "rule", "code", "tech_reference", "tech_context", "architecture", "requirements", "bug", "task", "progress"],
                            description: "Filter by memory type (default: 'any' searches all types). Use specific type to narrow results. Example: 'decision' to find only decision records."
                        },
                        recent_only: {
                            type: "boolean",
                            description: "Only return memories from last 30 days (default: false). Useful for finding recent context or updates."
                        },
                        search_mode: {
                            type: "string",
                            enum: ["semantic", "keyword", "hybrid"],
                            description: "Search algorithm (default: 'hybrid' for best results). 'semantic' finds conceptually similar content, 'keyword' finds exact text matches, 'hybrid' combines both approaches."
                        }
                    },
                    required: ["query"]
                }
            },
            {
                name: "get_insights",
                description: "Generate AI insights from stored memories. Analyzes patterns, learning progress, technical debt, and productivity trends. Uses GPT-4 to identify trends, suggest improvements, and provide actionable recommendations based on your project history.",
                annotations: {
                    title: "Get Insights",
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: false,
                    openWorldHint: true
                },
                inputSchema: {
                    type: "object",
                    properties: {
                        analysis_type: {
                            type: "string",
                            enum: ["comprehensive", "patterns", "learning", "progress", "quality", "productivity", "technical_debt"],
                            description: "Type of analysis to perform. 'comprehensive' covers all aspects, 'patterns' finds recurring themes, 'learning' tracks knowledge growth, 'progress' shows project advancement, 'quality' assesses code/doc quality, 'productivity' measures output, 'technical_debt' identifies areas needing refactoring."
                        },
                        project_name: {
                            type: "string",
                            description: "Focus analysis on specific project (optional). Leave empty for cross-project insights. IDE AGENTS: Use the same normalized name derived from workspace roots."
                        },
                        time_range: {
                            type: "string",
                            description: "Time period for analysis (optional). Format: number + unit. Examples: '7d' (7 days), '30d' (30 days), '3m' (3 months), '1y' (1 year). Defaults to all time."
                        }
                    }
                }
            },
            {
                name: "start_thinking",
                description: "Begin a structured thinking sequence for complex problems. Creates a thinking session for step-by-step reasoning. Returns a sequence ID that must be used with add_thought. Use for planning, problem-solving, architecture design, or any complex reasoning task.",
                annotations: {
                    title: "Start Thinking",
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false
                },
                inputSchema: {
                    type: "object",
                    properties: {
                        goal: {
                            type: "string",
                            description: "Problem or goal to think through. Be specific. Examples: 'Design authentication system for mobile app', 'Plan database migration strategy', 'Debug performance issue in API endpoint'."
                        },
                        project_name: {
                            type: "string",
                            description: "Project context for this thinking sequence. IDE AGENTS: Derive from workspace root name via MCP roots. Normalize to lowercase kebab-case. Must match names used in other tools."
                        }
                    },
                    required: ["goal", "project_name"]
                }
            },
            {
                name: "add_thought",
                description: "Add a thought to an ACTIVE thinking sequence. Builds up reasoning chain with observations, hypotheses, and conclusions. Each thought is appended to create a complete reasoning document. Mark sequence complete with 'conclusion' type. WARNING: Cannot add thoughts to completed sequences - start a new sequence if needed.",
                annotations: {
                    title: "Add Thought",
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false
                },
                inputSchema: {
                    type: "object",
                    properties: {
                        sequence_id: {
                            type: "string",
                            description: "The sequence ID returned from start_thinking. Must call start_thinking first to get a valid ID. Cannot use placeholder values like 'unknown'."
                        },
                        thought: {
                            type: "string",
                            description: "The thought content. Be clear and specific. Can include analysis, questions, answers, or decisions. Supports markdown formatting."
                        },
                        thought_type: {
                            type: "string",
                            description: "Type of thought being added. Valid types: 'observation' for facts/analysis, 'hypothesis' for theories, 'question' for unknowns, 'reasoning' for logical steps, 'conclusion' to finalize (stores as decision), 'assumption' for premises, 'general' for any other type of thought. SPECIAL: Use 'alternative', 'branch', 'option', 'variant', or 'fork' to create a new thinking branch for exploring different approaches. Unknown types will automatically be mapped or default to 'general'."
                        },
                        branch_name: {
                            type: "string",
                            description: "Optional name for the branch when using branch-type thoughts (e.g., 'Microservices Approach', 'Gradual Migration'). If not provided, defaults to 'Alternative N'."
                        }
                    },
                    required: ["sequence_id", "thought"]
                }
            },
            {
                name: "manage_tasks",
                description: "Create, complete, or list project tasks (bugs/features/todos). Simple workflow: create → complete when done. Tasks are stored as memories and can be searched. Each task gets a unique ID for tracking.",
                annotations: {
                    title: "Manage Tasks",
                    readOnlyHint: false,
                    destructiveHint: false,
                    idempotentHint: false
                },
                inputSchema: {
                    type: "object",
                    properties: {
                        action: {
                            type: "string",
                            enum: ["create", "complete", "get"],
                            description: "Action to perform. 'create' adds new task and returns task ID, 'complete' marks task as done using task ID, 'get' lists all pending tasks (or all tasks if include_completed=true)."
                        },
                        project_name: {
                            type: "string",
                            description: "Project name for task management. IDE AGENTS: Derive from workspace root name via MCP roots. Normalize to lowercase kebab-case. Must be consistent across all operations."
                        },
                        task_description: {
                            type: "string",
                            description: "Task description (required for 'create' action). Be specific about what needs to be done. Examples: 'Fix login button not responding on mobile', 'Add user profile API endpoint', 'Update documentation for v2.0'."
                        },
                        task_id: {
                            type: "string",
                            description: "Task ID to mark as complete (required for 'complete' action). Get this from 'create' action response or 'get' action task list."
                        },
                        include_completed: {
                            type: "boolean",
                            description: "Include completed tasks in listing (only for 'get' action, default: false). Set to true to see full task history."
                        }
                    },
                    required: ["action", "project_name"]
                }
            },
            {
                name: "manage_project",
                description: "Create, update, or retrieve project documentation (briefs, PRDs, implementation plans). Manages project-level docs. Documents are versioned and stored as special memory types. Use this for formal project documentation, not general notes.",
                annotations: {
                    title: "Manage Project",
                    readOnlyHint: false,
                    destructiveHint: true,
                    idempotentHint: true
                },
                inputSchema: {
                    type: "object",
                    properties: {
                        action: {
                            type: "string",
                            enum: ["create", "update", "get"],
                            description: "Action to perform. 'create' makes new document (fails if exists), 'update' modifies existing document (requires doc_id), 'get' retrieves all documents or filtered by doc_type."
                        },
                        project_name: {
                            type: "string",
                            description: "Project name for documentation. IDE AGENTS: Derive from workspace root name via MCP roots. Normalize to lowercase kebab-case. Must be consistent across all tools."
                        },
                        doc_type: {
                            type: "string",
                            enum: ["brief", "prd", "plan"],
                            description: "Document type. 'brief' for project overview and goals, 'prd' for detailed requirements and specifications, 'plan' for implementation strategy and technical approach."
                        },
                        content: {
                            type: "string",
                            description: "Document content in markdown format (required for 'create'/'update' actions). Include sections, headings, lists, code blocks as needed. Well-structured documents improve AI assistance."
                        },
                        doc_id: {
                            type: "string",
                            description: "Document ID for updates (required for 'update' action). Get this from 'create' response or 'get' action. Format: numeric ID as string."
                        }
                    },
                    required: ["action", "project_name"]
                }
            }
        ];
    }

    /**
     * Call a tool by name - MCP SDK standard method
     */
    async callTool(toolName, args) {
        try {
            // Get tool definition
            const tools = this.listTools();
            const tool = tools.find(t => t.name === toolName);
            
            if (!tool) {
                return this.responseFormatter.error(`Unknown tool: ${toolName}`);
            }
            
            // Validate arguments against schema
            const validation = this.schemaValidator.validate(args, tool.inputSchema, toolName);
            if (!validation.valid) {
                const errorMessage = `Invalid arguments for ${toolName}: ${validation.errors.join(', ')}`;
                this.logger.error(errorMessage, { args, errors: validation.errors });
                return this.responseFormatter.error(errorMessage);
            }
            
            // Execute tool handler
            switch (toolName) {
                case "store_memory":
                    return await this._handleStoreMemory(args);
                    
                case "search_memories":
                    return await this._handleSearchMemories(args);
                    
                case "get_insights":
                    return await this._handleGetInsights(args);
                    
                case "start_thinking":
                    return await this._handleStartThinking(args);
                    
                case "add_thought":
                    return await this._handleAddThought(args);
                    
                case "manage_tasks":
                    return await this._handleManageTasks(args);
                    
                case "manage_project":
                    return await this._handleManageProject(args);
                    
                default:
                    return this.responseFormatter.error(`Unknown tool: ${toolName}`);
            }
        } catch (error) {
            this.logger.error(`Tool execution failed: ${toolName}`, error);
            return this.responseFormatter.error(`Tool execution failed`, error);
        }
    }

    // Handler methods - delegate to appropriate services

    async _handleStoreMemory(args) {
        const { 
            content, 
            project_name, 
            memory_type = 'general',  // Default to general
            importance_score,
            session_name = 'default',  // Default session
            tags = []
        } = args;
        
        // Normalize importance score if needed (e.g., 9 -> 0.9)
        let normalizedImportance = importance_score;
        if (importance_score && importance_score > 1) {
            normalizedImportance = importance_score / 10;
            this.logger.debug(`Normalized importance score from ${importance_score} to ${normalizedImportance}`);
        }
        
        if (!this.services.memoryService) {
            return this.responseFormatter.error('Memory service not available');
        }
        
        try {
            // Simply pass through to memory service - let it handle validation
            const result = await this.services.memoryService.createMemory({
                content,
                projectName: project_name,
                sessionName: session_name,
                memoryType: memory_type,
                importanceScore: normalizedImportance,
                tags: tags
            });
            
            // Trust the result from the service
            if (!result || !result.id) {
                this.logger.error('Memory service did not return a valid ID', { result });
                return this.responseFormatter.error('Memory service did not return a valid ID');
            }
            
            return this.responseFormatter.memoryStored(
                result.id, 
                memory_type, 
                project_name, 
                tags
            );
        } catch (error) {
            this.logger.error('Failed to store memory:', error);
            return this.responseFormatter.error(error.message || 'Failed to store memory', { isError: true });
        }
    }

    async _handleSearchMemories(args) {
        const { query, project_name, memory_type, recent_only, search_mode } = args;
        
        if (!this.services.memorySearchService) {
            return this.responseFormatter.error('Memory search service not available');
        }
        
        const searchResult = await this.services.memorySearchService.search(query, {
            projectName: project_name,
            memoryType: memory_type === "any" ? null : memory_type,
            recentOnly: recent_only,
            searchMode: search_mode,
            limit: 10
        });
        
        return this.responseFormatter.searchResults(
            searchResult.results, 
            query, 
            searchResult.search_mode
        );
    }

    async _handleGetInsights(args) {
        const { analysis_type = 'comprehensive', project_name, time_range } = args;
        
        // Use v2 unified insights service
        if (this.services.unifiedInsights) {
            try {
                const result = await this.services.unifiedInsights.getInsights(
                    analysis_type,
                    {
                        projectName: project_name,
                        timeRange: time_range
                    }
                );
                
                // If no insights found for specific analysis type, try comprehensive
                if ((!result.insights || result.insights.length === 0) && analysis_type !== 'comprehensive') {
                    this.logger.info(`No ${analysis_type} insights found, falling back to comprehensive analysis`);
                    const comprehensiveResult = await this.services.unifiedInsights.getInsights(
                        'comprehensive',
                        {
                            projectName: project_name,
                            timeRange: time_range
                        }
                    );
                    
                    // Add note about fallback
                    if (comprehensiveResult.insights && comprehensiveResult.insights.length > 0) {
                        comprehensiveResult.metadata = comprehensiveResult.metadata || {};
                        comprehensiveResult.metadata.note = `No specific ${analysis_type} insights found. Showing general insights instead.`;
                    }
                    
                    const formattedInsights = this._formatInsightsForDisplay(comprehensiveResult);
                    return this.responseFormatter.insights(
                        `📊 ${this._getAnalysisTypeTitle(analysis_type)} Analysis (General Insights)`,
                        formattedInsights,
                        {
                            project: project_name,
                            timeRange: time_range,
                            ...comprehensiveResult.metadata
                        }
                    );
                }
                
                // Format insights into readable text
                const formattedInsights = this._formatInsightsForDisplay(result);
                
                return this.responseFormatter.insights(
                    `📊 ${this._getAnalysisTypeTitle(analysis_type)} Analysis`,
                    formattedInsights,
                    {
                        project: project_name,
                        timeRange: time_range,
                        ...result.metadata
                    }
                );
            } catch (error) {
                this.logger.error('Unified insights failed:', error);
                return this.responseFormatter.error('Failed to get insights', error);
            }
        } else {
            // Fallback to basic insights if service not available
            return await this._getBasicInsights(args);
        }
    }

    // REMOVED: store_rule and get_rules - use store_memory with type='rule' instead
    // These methods are kept commented for reference but are no longer used
    
    /*
    async _handleStoreRule(args) {
        const { rule_content, project_name, rule_category = 'general', priority = 'medium', scope = 'project' } = args;
        
        if (!this.services.rulesService) {
            // Fallback to memory service with rule type
            return await this._handleStoreMemory({
                content: rule_content,
                project_name: project_name || 'global',
                memory_type: 'rule',
                session_name: 'rules'
            });
        }
        
        const result = await this.services.rulesService.storeRule({
            content: rule_content,
            projectName: project_name,
            category: rule_category,
            priority,
            scope
        });
        
        return this.responseFormatter.success(
            `Rule stored (Category: ${rule_category}, Priority: ${priority})`,
            result
        );
    }

    async _handleGetRules(args) {
        const { project_name, rule_category, include_global = true } = args;
        
        if (!this.services.rulesService) {
            // Fallback to memory search
            const rules = await this._searchRulesFromMemories(project_name, include_global);
            return this.responseFormatter.rules(rules, project_name);
        }
        
        const rules = await this.services.rulesService.getRules({
            projectName: project_name,
            category: rule_category,
            includeGlobal: include_global
        });
        
        return this.responseFormatter.rules(rules, project_name);
    }
    */

    async _handleStartThinking(args) {
        const { goal, project_name } = args;
        
        if (!this.services.reasoningService) {
            return this.responseFormatter.error('Reasoning service not available');
        }
        
        try {
            const result = await this.services.reasoningService.startReasoning({
                goal: goal,
                projectName: project_name
            });
            
            this.logger.debug('startReasoning result:', result);
            
            if (!result || !result.sequenceId) {
                this.logger.error('Failed to get sequence ID from reasoning service', { result });
                return this.responseFormatter.error('Failed to get sequence ID from reasoning service');
            }
            
            return this.responseFormatter.reasoningStarted(result.sequenceId, goal);
        } catch (error) {
            this.logger.error('Failed to start reasoning:', error);
            return this.responseFormatter.error(error.message || 'Failed to start reasoning');
        }
    }

    async _handleAddThought(args) {
        const { sequence_id, thought, thought_type = 'observation', branch_name } = args;
        
        if (!this.services.reasoningService) {
            return this.responseFormatter.error('Reasoning service not available');
        }
        
        try {
            const result = await this.services.reasoningService.addThought({
                sequenceId: sequence_id,
                thought: thought,
                thoughtType: thought_type,
                branchName: branch_name
            });
            
            return this.responseFormatter.reasoningUpdated(
                result.sequenceId,
                result.content,
                result.isComplete,
                result.branchCreated
            );
        } catch (error) {
            this.logger.error('Failed to add thought:', error);
            return this.responseFormatter.error(error.message || 'Failed to add thought');
        }
    }

    async _handleManageTasks(args) {
        const { action } = args;
        
        if (!this.services.taskManagementService) {
            return this.responseFormatter.error('Task management service not available');
        }
        
        try {
            switch (action) {
                case "create": {
                    const result = await this.services.taskManagementService.createTask({
                        taskDescription: args.task_description,
                        projectName: args.project_name
                    });
                    return this.responseFormatter.taskCreated(result.id, result.description, result.projectName);
                }
                
                case "complete": {
                    const result = await this.services.taskManagementService.completeTask({
                        taskId: args.task_id
                    });
                    return this.responseFormatter.taskCompleted(result.taskId, args.project_name);
                }
                
                case "get": {
                    const tasks = await this.services.taskManagementService.getTasks({
                        projectName: args.project_name,
                        includeCompleted: args.include_completed || false
                    });
                    return this.responseFormatter.taskList(tasks, args.project_name);
                }
                
                default:
                    return this.responseFormatter.error(`Unknown task action: ${action}`);
            }
        } catch (error) {
            this.logger.error('Task management failed:', error);
            return this.responseFormatter.error(error.message || 'Task operation failed');
        }
    }

    async _handleManageProject(args) {
        const { action } = args;
        
        if (!this.services.projectManagementService) {
            return this.responseFormatter.error('Project management service not available');
        }
        
        try {
            switch (action) {
                case "create": {
                    const result = await this.services.projectManagementService.createDocument({
                        docType: args.doc_type,
                        content: args.content,
                        projectName: args.project_name
                    });
                    return this.responseFormatter.projectDocCreated(result);
                }
                
                case "update": {
                    // If doc_id is "unknown", try to find existing document or create new one
                    if (args.doc_id === "unknown") {
                        // First, try to get existing document
                        const existingDocs = await this.services.projectManagementService.getDocuments({
                            projectName: args.project_name,
                            docType: args.doc_type
                        });
                        
                        if (existingDocs.length > 0) {
                            // Update existing document
                            const result = await this.services.projectManagementService.updateDocument({
                                docId: existingDocs[0].id,
                                content: args.content
                            });
                            return this.responseFormatter.projectDocUpdated(result.docType, result.docId, args.project_name);
                        } else {
                            // Create new document
                            const result = await this.services.projectManagementService.createDocument({
                                docType: args.doc_type,
                                content: args.content,
                                projectName: args.project_name
                            });
                            return this.responseFormatter.projectDocCreated(result);
                        }
                    } else {
                        // Normal update with valid doc_id
                        const result = await this.services.projectManagementService.updateDocument({
                            docId: args.doc_id,
                            content: args.content
                        });
                        return this.responseFormatter.projectDocUpdated(result.docType, result.docId, args.project_name);
                    }
                }
                
                case "get": {
                    const docs = await this.services.projectManagementService.getDocuments({
                        projectName: args.project_name,
                        docType: args.doc_type
                    });
                    return this.responseFormatter.projectDocsList(docs, args.project_name);
                }
                
                default:
                    return this.responseFormatter.error(`Unknown project action: ${action}`);
            }
        } catch (error) {
            this.logger.error('Project management failed:', error);
            return this.responseFormatter.error(error.message || 'Project operation failed');
        }
    }

    // Private helper methods for insights

    // Removed deprecated insight methods - now handled directly in _handleGetInsights

    async _getBasicInsights(args) {
        const { analysis_type, project_name, time_range } = args;
        
        const stats = await this._getMemoryStats(project_name, time_range);
        // Format stats inline since we removed the formatter
        const formatted = this._formatMemoryStats(stats);
        
        return this.responseFormatter.insights(
            `📊 Basic Insights (${analysis_type})`,
            formatted,
            { project: project_name, timeRange: time_range }
        );
    }

    // Fallback methods for when services aren't available

    // REMOVED: _searchRulesFromMemories - use search_memories with type='rule' instead
    /*
    async _searchRulesFromMemories(projectName, includeGlobal) {
        const query = `
            SELECT m.*, p.name as project_name
            FROM memories m
            LEFT JOIN projects p ON m.project_id = p.id
            WHERE m.memory_type = 'rule'
            ${projectName ? `AND (p.name = $1 ${includeGlobal ? `OR p.name = 'global'` : ''})` : ''}
            ORDER BY m.importance_score DESC, m.created_at DESC
        `;
        
        const params = projectName ? [projectName] : [];
        const result = await this.db.query(query, params);
        
        return result.rows;
    }
    */

    async _searchTasksFromMemories(projectName, includeCompleted) {
        const query = `
            SELECT m.*, p.name as project_name
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            WHERE m.memory_type = 'task'
            ${projectName ? 'AND p.name = $1' : ''}
            ORDER BY m.created_at DESC
        `;
        
        const params = projectName ? [projectName] : [];
        const result = await this.db.query(query, params);
        
        // Simple task status detection
        return result.rows.map(row => ({
            ...row,
            status: this._detectTaskStatus(row.content)
        })).filter(task => 
            includeCompleted || task.status !== 'completed'
        );
    }

    async _getMemoryStats(projectName, timeRange) {
        // Default to all time if no timeRange specified
        const intervalClause = timeRange ? `AND m.created_at > NOW() - INTERVAL '${timeRange.replace(/[^0-9a-z]/gi, '')}'` : '';
        
        const query = `
            SELECT 
                COUNT(*) as total,
                memory_type,
                DATE(created_at) as day
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            WHERE 1=1 ${intervalClause}
            ${projectName ? 'AND p.name = $1' : ''}
            GROUP BY memory_type, day
        `;
        
        const params = projectName ? [projectName] : [];
        const result = await this.db.query(query, params);
        
        const stats = {
            total: 0,
            byType: {},
            topDays: []
        };
        
        const dayTotals = {};
        
        result.rows.forEach(row => {
            stats.total += parseInt(row.total);
            stats.byType[row.memory_type] = (stats.byType[row.memory_type] || 0) + parseInt(row.total);
            dayTotals[row.day] = (dayTotals[row.day] || 0) + parseInt(row.total);
        });
        
        stats.topDays = Object.entries(dayTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([day]) => new Date(day).toLocaleDateString());
        
        return stats;
    }

    _detectTaskStatus(content) {
        const contentLower = content.toLowerCase();
        if (contentLower.includes('[x]') || contentLower.includes('done') || contentLower.includes('completed')) {
            return 'completed';
        } else if (contentLower.includes('in progress') || contentLower.includes('working on')) {
            return 'in_progress';
        }
        return 'pending';
    }

    _formatMemoryStats(stats) {
        const lines = [];
        lines.push(`Total memories: ${stats.total}`);
        lines.push('\nBy type:');
        
        for (const [type, count] of Object.entries(stats.byType)) {
            lines.push(`  - ${type}: ${count}`);
        }
        
        if (stats.topDays && stats.topDays.length > 0) {
            lines.push('\nMost active days:');
            stats.topDays.forEach((day, index) => {
                lines.push(`  ${index + 1}. ${day}`);
            });
        }
        
        return lines.join('\n');
    }

    _getAnalysisTypeTitle(analysisType) {
        const titles = {
            comprehensive: 'Comprehensive',
            patterns: 'Pattern',
            learning: 'Learning Progress',
            progress: 'Project Progress',
            quality: 'Code Quality',
            productivity: 'Productivity',
            technical_debt: 'Technical Debt'
        };
        return titles[analysisType] || 'General';
    }

    _formatInsightsForDisplay(result) {
        const sections = [];
        
        // Summary section
        if (result.metadata) {
            sections.push('## Summary');
            
            // Add note if present
            if (result.metadata.note) {
                sections.push(`> **Note:** ${result.metadata.note}`);
                sections.push('');
            }
            
            sections.push(`- **Total Insights Found:** ${result.metadata.total_found || 0}`);
            if (result.metadata.confidence_distribution) {
                const dist = result.metadata.confidence_distribution;
                sections.push(`- **Confidence Distribution:** High: ${dist.high}, Medium: ${dist.medium}, Low: ${dist.low}`);
            }
            if (result.metadata.categories && result.metadata.categories.length > 0) {
                sections.push(`- **Categories:** ${result.metadata.categories.join(', ')}`);
            }
            sections.push('');
        }
        
        // Main insights - filter out system processing markers
        if (result.insights && result.insights.length > 0) {
            // Filter out system processing markers and low-value insights
            const meaningfulInsights = result.insights.filter(insight => 
                insight.insight_type !== 'processing_marker' && 
                insight.insight_category !== 'system'
            );
            
            sections.push('## Key Insights');
            
            if (meaningfulInsights.length > 0) {
                meaningfulInsights.slice(0, 10).forEach((insight, index) => {
                    sections.push(`\n### ${index + 1}. ${insight.title || 'Insight'}`);
                    if (insight.insight_type) {
                        sections.push(`**Type:** ${insight.insight_type} | **Category:** ${insight.insight_category || 'general'}`);
                    }
                    if (insight.confidence_score) {
                        sections.push(`**Confidence:** ${Math.round(insight.confidence_score * 100)}%`);
                    }
                    sections.push('');
                    sections.push(insight.summary || insight.content || 'No summary available');
                    
                    // Add evidence if available
                    if (insight.evidence && Array.isArray(insight.evidence) && insight.evidence.length > 0) {
                        sections.push('\n**Evidence:**');
                        insight.evidence.slice(0, 3).forEach(ev => {
                            const evText = typeof ev === 'object' ? (ev.description || JSON.stringify(ev)) : String(ev);
                            sections.push(`- ${evText}`);
                        });
                    }
                });
                
                if (meaningfulInsights.length > 10) {
                    sections.push(`\n*... and ${meaningfulInsights.length - 10} more insights*`);
                }
            } else {
                sections.push('No meaningful insights found. This might indicate:');
                sections.push('- The project has limited stored memories');
                sections.push('- Insights are still being processed');
                sections.push('- Try storing more detailed memories about your work');
            }
        } else {
            sections.push('## No insights found');
            sections.push('No insights were generated for the specified criteria. Try:');
            sections.push('- Storing more memories related to this project');
            sections.push('- Using a different analysis type');
            sections.push('- Expanding the time range');
        }
        
        // Recommendations
        if (result.recommendations && result.recommendations.length > 0) {
            sections.push('\n## Recommendations');
            result.recommendations.slice(0, 5).forEach((rec, index) => {
                let recText = '';
                if (typeof rec === 'object') {
                    recText = rec.description || rec.text || rec.recommendation || JSON.stringify(rec);
                } else {
                    recText = String(rec);
                }
                sections.push(`${index + 1}. ${recText}`);
            });
        }
        
        return sections.join('\n');
    }
}

export default MCPToolsV3;