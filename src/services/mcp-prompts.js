/**
 * Enhanced MCP Prompts Service for MiniMe-MCP
 * Provides intelligence-enhanced prompt templates for development workflows
 * Supports dynamic arguments, context injection, and intelligence-first approach
 */

export class MCPPromptsService {
    constructor(logger, databaseService) {
        this.logger = logger;
        this.db = databaseService;
        
        // Define built-in prompts with intelligence framework support
        this.prompts = new Map();
        this.initializePrompts();
    }

    /**
     * Initialize enhanced prompt templates with intelligence framework
     */
    initializePrompts() {
        // PRIORITY: Intelligence Framework Prompts
        
        // Session Startup Prompt - CRITICAL for intelligence-first approach
        this.prompts.set('session-startup', {
            name: 'session-startup',
            description: 'Execute mandatory intelligence session startup sequence (all IDEs)',
            category: 'intelligence',
            priority: 10,
            arguments: [
                {
                    name: 'project_name',
                    description: 'Project name (auto-detected from MCP roots if not provided) - will be normalized to kebab-case',
                    required: false
                },
                {
                    name: 'ide_context',
                    description: 'IDE being used (VS Code, Claude Desktop, Cursor, etc.)',
                    required: false
                }
            ]
        });

        // Task Management Workflow
        this.prompts.set('task-workflow', {
            name: 'task-workflow',
            description: 'Demonstrate complete task management workflow: create → track → complete',
            category: 'intelligence',
            priority: 6,
            arguments: [
                {
                    name: 'context',
                    description: 'Context about work that needs task creation',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name (kebab-case from roots)',
                    required: true
                }
            ]
        });

        // Advanced Thinking Workflow Prompt
        this.prompts.set('thinking-workflow', {
            name: 'thinking-workflow',
            description: 'Execute complete thinking sequence for complex problems using start_thinking + add_thought',
            category: 'intelligence',
            priority: 8,
            arguments: [
                {
                    name: 'problem_statement',
                    description: 'Complex problem to think through systematically',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project context (derived from MCP roots)',
                    required: true
                }
            ]
        });

        // Memory Workflow Demonstration
        this.prompts.set('memory-workflow', {
            name: 'memory-workflow',
            description: 'Demonstrate complete memory workflow: search → analyze → store → insights',
            category: 'intelligence',
            priority: 7,
            arguments: [
                {
                    name: 'topic',
                    description: 'Topic to search and analyze',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name (kebab-case from roots)',
                    required: true
                }
            ]
        });

        // Intelligence Validation Prompt
        this.prompts.set('validate-intelligence', {
            name: 'validate-intelligence',
            description: 'Check if current approach follows intelligence-first principles',
            category: 'intelligence',
            priority: 9,
            arguments: [
                {
                    name: 'task_description',
                    description: 'What you plan to do',
                    required: true
                },
                {
                    name: 'tools_planned',
                    description: 'MCP tools you plan to use (comma-separated)',
                    required: false
                }
            ]
        });

        // Project Intelligence Summary Prompt
        this.prompts.set('project-intelligence', {
            name: 'project-intelligence',
            description: 'Generate intelligent project status summary with context',
            category: 'intelligence',
            priority: 8,
            arguments: [
                {
                    name: 'project_name',
                    description: 'Project to analyze',
                    required: true
                },
                {
                    name: 'focus_area',
                    description: 'Specific area to focus on (architecture, recent-changes, patterns, etc.)',
                    required: false
                }
            ]
        });

        // Intelligence-Enhanced Code Review
        this.prompts.set('intelligent-code-review', {
            name: 'intelligent-code-review',
            description: 'Code review enhanced with project memory and established patterns',
            category: 'development',
            priority: 8,
            arguments: [
                {
                    name: 'code',
                    description: 'The code to review',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name for context loading',
                    required: false
                },
                {
                    name: 'language',
                    description: 'Programming language (auto-detected if not provided)',
                    required: false
                },
                {
                    name: 'focus',
                    description: 'Specific areas to focus on (security, performance, style, etc.)',
                    required: false
                }
            ]
        });

        // Memory-Enhanced Debug Analysis
        this.prompts.set('intelligent-debug', {
            name: 'intelligent-debug',
            description: 'Debug analysis using project memory and past solutions',
            category: 'development',
            priority: 8,
            arguments: [
                {
                    name: 'error_message',
                    description: 'The error message or symptom description',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name for loading similar past issues',
                    required: false
                },
                {
                    name: 'code_context',
                    description: 'Relevant code where the error occurs',
                    required: false
                },
                {
                    name: 'logs',
                    description: 'Application logs or stack traces',
                    required: false
                }
            ]
        });

        // Pattern-Aware Architecture Planning
        this.prompts.set('intelligent-architecture', {
            name: 'intelligent-architecture',
            description: 'Architecture planning based on project patterns and past decisions',
            category: 'development',
            priority: 7,
            arguments: [
                {
                    name: 'requirements',
                    description: 'Project requirements and constraints',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name for loading architectural context',
                    required: false
                },
                {
                    name: 'scale',
                    description: 'Expected scale (users, data volume, etc.)',
                    required: false
                },
                {
                    name: 'technology_preferences',
                    description: 'Preferred technologies or constraints',
                    required: false
                }
            ]
        });

        // Context-Aware Decision Making
        this.prompts.set('make-decision', {
            name: 'make-decision',
            description: 'Make technical decisions using project history and established patterns',
            category: 'intelligence',
            priority: 8,
            arguments: [
                {
                    name: 'decision_context',
                    description: 'The decision that needs to be made',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name for loading decision history',
                    required: false
                },
                {
                    name: 'options',
                    description: 'Available options to consider',
                    required: false
                }
            ]
        });

        // Learning-Enhanced Documentation
        this.prompts.set('intelligent-docs', {
            name: 'intelligent-docs',
            description: 'Generate documentation using project patterns and conventions',
            category: 'development',
            priority: 6,
            arguments: [
                {
                    name: 'code',
                    description: 'Code to document',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name for loading documentation patterns',
                    required: false
                },
                {
                    name: 'format',
                    description: 'Documentation format (markdown, jsdoc, etc.)',
                    required: false
                },
                {
                    name: 'audience',
                    description: 'Target audience (developers, users, etc.)',
                    required: false
                }
            ]
        });

        // Pattern-Based Test Generation
        this.prompts.set('intelligent-tests', {
            name: 'intelligent-tests',
            description: 'Generate tests using established project testing patterns',
            category: 'development',
            priority: 6,
            arguments: [
                {
                    name: 'code',
                    description: 'Code to test',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name for loading testing patterns',
                    required: false
                },
                {
                    name: 'test_framework',
                    description: 'Testing framework (jest, pytest, etc.)',
                    required: false
                },
                {
                    name: 'coverage_type',
                    description: 'Type of tests (unit, integration, edge-cases)',
                    required: false
                }
            ]
        });

        // Intelligence Health Check
        this.prompts.set('intelligence-health', {
            name: 'intelligence-health',
            description: 'Assess current intelligence tool usage and provide recommendations',
            category: 'intelligence',
            priority: 7,
            arguments: [
                {
                    name: 'project_name',
                    description: 'Project to analyze',
                    required: false
                },
                {
                    name: 'session_duration',
                    description: 'How long current session has been active',
                    required: false
                }
            ]
        });

        // Task Creation with Intelligence
        this.prompts.set('create-intelligent-tasks', {
            name: 'create-intelligent-tasks',
            description: 'Create tasks based on conversation context and project patterns',
            category: 'intelligence',
            priority: 6,
            arguments: [
                {
                    name: 'context',
                    description: 'What was discussed or what needs to be done',
                    required: true
                },
                {
                    name: 'project_name',
                    description: 'Project name for context',
                    required: false
                }
            ]
        });

        // LEGACY PROMPTS (Enhanced versions of originals)
        
        // Traditional code review (kept for compatibility)
        this.prompts.set('code-review', {
            name: 'code-review',
            description: 'Traditional code review (consider using intelligent-code-review instead)',
            category: 'legacy',
            priority: 4,
            arguments: [
                {
                    name: 'code',
                    description: 'The code to review',
                    required: true
                },
                {
                    name: 'language',
                    description: 'Programming language (auto-detected if not provided)',
                    required: false
                },
                {
                    name: 'focus',
                    description: 'Specific areas to focus on (security, performance, style, etc.)',
                    required: false
                }
            ]
        });

        // [Keep other legacy prompts but with lower priority and legacy category]
        // ... [Original prompts with category: 'legacy', priority: 3-4]

        // Enhanced utility prompts
        this.prompts.set('memory-summary', {
            name: 'memory-summary',
            description: 'Extract concise, decision-oriented summaries for IDE agents',
            category: 'utility',
            priority: 5,
            arguments: [
                {
                    name: 'content',
                    description: 'Content to summarize',
                    required: true
                },
                {
                    name: 'memory_type',
                    description: 'Type of memory (code, decision, rule, note, progress, project_brief, tech_reference, general)',
                    required: true
                },
                {
                    name: 'max_length',
                    description: 'Maximum summary length in characters',
                    required: false,
                    default: 500
                }
            ]
        });

        this.prompts.set('tag-classification', {
            name: 'tag-classification',
            description: 'Classify development content into relevant categories and tags',
            category: 'utility',
            priority: 5,
            arguments: [
                {
                    name: 'content',
                    description: 'Content to classify',
                    required: true
                },
                {
                    name: 'memory_type',
                    description: 'Type of memory (code, decision, note, etc.)',
                    required: false,
                    default: 'note'
                }
            ]
        });

        this.logger.info(`Initialized ${this.prompts.size} prompts with intelligence framework support`);
    }

    /**
     * List all available prompts with enhanced categorization
     */
    async listPrompts() {
        const promptList = [];
        
        for (const [name, prompt] of this.prompts) {
            promptList.push({
                name: prompt.name,
                description: prompt.description,
                arguments: prompt.arguments || [],
                category: prompt.category || 'general',
                priority: prompt.priority || 3
            });
        }
        
        // Sort by priority (higher first), then by category
        return promptList.sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return a.category.localeCompare(b.category);
        });
    }

    /**
     * Enhanced prompt generation with intelligence context loading
     */
    async getPrompt(name, args = {}) {
        const prompt = this.prompts.get(name);
        if (!prompt) {
            throw new Error(`Prompt not found: ${name}`);
        }

        this.logger.info(`Generating intelligence-enhanced prompt: ${name}`, { args: Object.keys(args) });

        // Load project context if project_name provided
        let projectContext = null;
        if (args.project_name) {
            projectContext = await this.loadProjectContext(args.project_name);
        }

        // Generate the actual prompt messages with intelligence enhancement
        const messages = await this.generateIntelligentPromptMessages(prompt, args, projectContext);
        
        return {
            description: prompt.description,
            messages: messages,
            metadata: {
                category: prompt.category,
                priority: prompt.priority,
                intelligence_enhanced: true,
                project_context_loaded: !!projectContext
            }
        };
    }

    /**
     * Load project context for intelligent prompt enhancement
     */
    async loadProjectContext(projectName) {
        try {
            const project = await this.db.getProjectByName(projectName);
            if (!project) return null;

            // Load recent memories
            const recentMemories = await this.db.listMemories({
                projectId: project.id,
                limit: 10,
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });

            // Load decisions
            const decisions = await this.db.listMemories({
                projectId: project.id,
                memoryType: 'decision',
                limit: 5,
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });

            // Load code patterns
            const codeMemories = await this.db.listMemories({
                projectId: project.id,
                memoryType: 'code',
                limit: 5,
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });

            return {
                project,
                recentMemories,
                decisions,
                codeMemories,
                summary: this.generateContextSummary(recentMemories, decisions, codeMemories)
            };
        } catch (error) {
            this.logger.error(`Error loading project context for ${projectName}:`, error);
            return null;
        }
    }

    /**
     * Generate context summary for prompts
     */
    generateContextSummary(recentMemories, decisions, codeMemories) {
        let summary = "## Project Context:\n\n";
        
        if (decisions.length > 0) {
            summary += "### Recent Decisions:\n";
            decisions.forEach(d => {
                summary += `- ${d.content.substring(0, 100)}...\n`;
            });
            summary += "\n";
        }
        
        if (codeMemories.length > 0) {
            summary += "### Code Patterns:\n";
            codeMemories.forEach(c => {
                summary += `- ${c.content.substring(0, 100)}...\n`;
            });
            summary += "\n";
        }
        
        if (recentMemories.length > 0) {
            summary += "### Recent Activity:\n";
            recentMemories.slice(0, 5).forEach(m => {
                summary += `- ${m.memory_type}: ${m.content.substring(0, 80)}...\n`;
            });
        }
        
        return summary;
    }

    /**
     * Generate intelligence-enhanced prompt messages
     */
    async generateIntelligentPromptMessages(prompt, args, projectContext) {
        const messages = [];
        
        switch (prompt.name) {
            case 'session-startup':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildSessionStartupPrompt(args, projectContext)
                    }
                });
                break;

            case 'validate-intelligence':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildIntelligenceValidationPrompt(args)
                    }
                });
                break;

            case 'project-intelligence':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildProjectIntelligencePrompt(args, projectContext)
                    }
                });
                break;

            case 'intelligent-code-review':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildIntelligentCodeReviewPrompt(args, projectContext)
                    }
                });
                break;

            case 'intelligent-debug':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildIntelligentDebugPrompt(args, projectContext)
                    }
                });
                break;

            case 'intelligent-architecture':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildIntelligentArchitecturePrompt(args, projectContext)
                    }
                });
                break;

            case 'make-decision':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildDecisionMakingPrompt(args, projectContext)
                    }
                });
                break;

            case 'intelligence-health':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildIntelligenceHealthPrompt(args, projectContext)
                    }
                });
                break;

            case 'thinking-workflow':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildThinkingWorkflowPrompt(args, projectContext)
                    }
                });
                break;

            case 'memory-workflow':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildMemoryWorkflowPrompt(args, projectContext)
                    }
                });
                break;

            case 'task-workflow':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildTaskWorkflowPrompt(args, projectContext)
                    }
                });
                break;

            case 'create-intelligent-tasks':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildTaskCreationPrompt(args, projectContext)
                    }
                });
                break;

            // Enhanced legacy prompts
            case 'code-review':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildCodeReviewPrompt(args) + "\n\n⚠️ Consider using 'intelligent-code-review' for enhanced analysis with project context."
                    }
                });
                break;

            // [Keep other original prompt builders but add intelligence notes]

            case 'memory-summary':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildMemorySummaryPrompt(args)
                    }
                });
                break;

            case 'tag-classification':
                messages.push({
                    role: 'user',
                    content: {
                        type: 'text',
                        text: this.buildTagClassificationPrompt(args)
                    }
                });
                break;

            default:
                throw new Error(`Unknown prompt template: ${prompt.name}`);
        }

        return messages;
    }

    // Intelligence-Enhanced Prompt Builders

    buildSessionStartupPrompt(args, projectContext) {
        const { project_name, ide_context } = args;
        const detectedProject = project_name || (projectContext?.project?.name) || '[auto-detect-from-roots]';
        const ide = ide_context || 'MCP Client';
        
        let prompt = `🧠 EXECUTE MANDATORY INTELLIGENCE SESSION STARTUP\n\n`;
        prompt += `IDE: ${ide}\n`;
        prompt += `Project: ${detectedProject}\n\n`;
        
        if (projectContext?.summary) {
            prompt += `${projectContext.summary}\n`;
        }
        
        prompt += `REQUIRED SEQUENCE - Execute these tools with EXACT parameters:\n\n`;
        
        prompt += `1. search_memories({\n`;
        prompt += `     query: "project overview architecture current status recent decisions",\n`;
        prompt += `     project_name: "${detectedProject}",\n`;
        prompt += `     search_mode: "hybrid",\n`;
        prompt += `     recent_only: false\n`;
        prompt += `   })\n\n`;
        
        prompt += `2. get_insights({\n`;
        prompt += `     analysis_type: "comprehensive",\n`;
        prompt += `     project_name: "${detectedProject}",\n`;
        prompt += `     time_range: "30d"\n`;
        prompt += `   })\n\n`;
        
        prompt += `3. manage_project({\n`;
        prompt += `     action: "get",\n`;
        prompt += `     project_name: "${detectedProject}"\n`;
        prompt += `   })\n\n`;
        
        prompt += `4. Present intelligent project status summary highlighting:\n`;
        prompt += `   - Key recent decisions and context\n`;
        prompt += `   - Current architecture patterns  \n`;
        prompt += `   - Active tasks and priorities\n`;
        prompt += `   - Established coding patterns\n\n`;
        
        prompt += `CRITICAL PROJECT NAMING:\n`;
        prompt += `- Derive project_name from MCP roots (workspace folder)\n`;
        prompt += `- Normalize to lowercase kebab-case (e.g., "MyApp" → "myapp", "My Project" → "my-project")\n`;
        prompt += `- Use SAME name consistently across ALL tool calls\n\n`;
        
        prompt += `🎯 This transforms you from generic AI to intelligent project partner\n`;
        prompt += `🎯 Works consistently across ALL IDE environments\n`;
        prompt += `🎯 Users get 10x more value when you use intelligence tools\n`;
        prompt += `🎯 This startup sequence is MANDATORY - execute it now`;
        
        return prompt;
    }

    buildTaskWorkflowPrompt(args, projectContext) {
        const { context, project_name } = args;
        
        let prompt = `🧠 COMPLETE TASK MANAGEMENT WORKFLOW\n\n`;
        prompt += `Context: ${context}\n`;
        prompt += `Project: ${project_name}\n\n`;
        
        if (projectContext?.summary) {
            prompt += `${projectContext.summary}\n`;
        }
        
        prompt += `STEP 1: List current tasks to understand workload\n`;
        prompt += `manage_tasks({\n`;
        prompt += `  action: "get",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  include_completed: false\n`;
        prompt += `})\n\n`;
        
        prompt += `STEP 2: Create new tasks based on context\n`;
        prompt += `manage_tasks({\n`;
        prompt += `  action: "create",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  task_description: "[specific actionable task based on context]"\n`;
        prompt += `})\n\n`;
        
        prompt += `STEP 3: Store context about task creation\n`;
        prompt += `store_memory({\n`;
        prompt += `  content: "Created task: [task description] because [reasoning from context]",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  memory_type: "task",\n`;
        prompt += `  importance_score: 0.6,\n`;
        prompt += `  tags: ["task-creation", "workflow"]\n`;
        prompt += `})\n\n`;
        
        prompt += `LATER: When task is completed, use:\n`;
        prompt += `manage_tasks({\n`;
        prompt += `  action: "complete",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  task_id: "[task_id_from_create_response]"\n`;
        prompt += `})\n\n`;
        
        prompt += `This creates a complete auditable task workflow with context preservation.`;
        
        return prompt;
    }

    buildThinkingWorkflowPrompt(args, projectContext) {
        const { problem_statement, project_name } = args;
        
        let prompt = `🧠 EXECUTE COMPLETE THINKING WORKFLOW\n\n`;
        prompt += `Problem: ${problem_statement}\n`;
        prompt += `Project: ${project_name}\n\n`;
        
        if (projectContext?.summary) {
            prompt += `${projectContext.summary}\n`;
        }
        
        prompt += `STEP 1: Start thinking sequence\n`;
        prompt += `start_thinking({\n`;
        prompt += `  goal: "${problem_statement}",\n`;
        prompt += `  project_name: "${project_name}"\n`;
        prompt += `})\n\n`;
        
        prompt += `STEP 2: Add systematic thoughts (use the sequence_id from step 1)\n`;
        prompt += `add_thought({\n`;
        prompt += `  sequence_id: "[id_from_start_thinking]",\n`;
        prompt += `  thought: "[your observation/analysis]",\n`;
        prompt += `  thought_type: "observation"\n`;
        prompt += `})\n\n`;
        
        prompt += `add_thought({\n`;
        prompt += `  sequence_id: "[same_id]",\n`;
        prompt += `  thought: "[your hypothesis/theory]",\n`;
        prompt += `  thought_type: "hypothesis"\n`;
        prompt += `})\n\n`;
        
        prompt += `Continue adding thoughts with types:\n`;
        prompt += `- "observation" for facts and analysis\n`;
        prompt += `- "hypothesis" for theories and possibilities\n`;
        prompt += `- "question" for unknowns to explore\n`;
        prompt += `- "reasoning" for logical deduction steps\n`;
        prompt += `- "alternative" to explore different approaches\n`;
        prompt += `- "conclusion" to finalize (automatically stores as decision)\n\n`;
        
        prompt += `STEP 4: Store key decisions discovered\n`;
        prompt += `store_memory({\n`;
        prompt += `  content: "[decision and full reasoning]",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  memory_type: "decision",\n`;
        prompt += `  importance_score: 0.8 // Use 0.0-1.0 scale (values >1 auto-normalized)\n`;
        prompt += `})\n\n`;
        
        prompt += `This creates a complete documented thinking process for complex problems.`;
        
        return prompt;
    }

    buildMemoryWorkflowPrompt(args, projectContext) {
        const { topic, project_name } = args;
        
        let prompt = `🧠 COMPLETE MEMORY WORKFLOW DEMONSTRATION\n\n`;
        prompt += `Topic: ${topic}\n`;
        prompt += `Project: ${project_name}\n\n`;
        
        prompt += `STEP 1: Search existing knowledge\n`;
        prompt += `search_memories({\n`;
        prompt += `  query: "${topic}",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  search_mode: "hybrid",\n`;
        prompt += `  memory_type: "any"\n`;
        prompt += `})\n\n`;
        
        prompt += `STEP 2: Analyze patterns and context\n`;
        prompt += `get_insights({\n`;
        prompt += `  analysis_type: "patterns",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  time_range: "30d"\n`;
        prompt += `})\n\n`;
        
        prompt += `STEP 3: Process and store new insights\n`;
        prompt += `store_memory({\n`;
        prompt += `  content: "[synthesis of findings + new insights]",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  memory_type: "[choose: general|decision|rule|code|tech_reference|architecture]",\n`;
        prompt += `  importance_score: "[0.0-1.0 based on significance]",\n`;
        prompt += `  tags: ["relevant", "topic", "tags"]\n`;
        prompt += `})\n\n`;
        
        prompt += `STEP 4: Create follow-up tasks if needed\n`;
        prompt += `manage_tasks({\n`;
        prompt += `  action: "create",\n`;
        prompt += `  project_name: "${project_name}",\n`;
        prompt += `  task_description: "[specific actionable task based on analysis]"\n`;
        prompt += `})\n\n`;
        
        prompt += `This demonstrates the complete intelligence cycle: search → analyze → store → act.`;
        
        return prompt;
    }

    buildIntelligenceValidationPrompt(args) {
        const { task_description, tools_planned = '' } = args;
        
        let prompt = `🧠 VALIDATE INTELLIGENCE-FIRST APPROACH\n\n`;
        prompt += `Task: ${task_description}\n\n`;
        
        if (tools_planned) {
            prompt += `Planned Tools: ${tools_planned}\n\n`;
        }
        
        prompt += `Use the validate_intelligence_usage tool to check compliance:\n\n`;
        prompt += `validate_intelligence_usage({\n`;
        prompt += `  planned_response: "${task_description}",\n`;
        prompt += `  tools_to_use: [${tools_planned.split(',').map(t => `"${t.trim()}"`).join(', ')}],\n`;
        prompt += `  memories_searched: false, // Update this\n`;
        prompt += `  new_info_to_store: false  // Update this\n`;
        prompt += `})\n\n`;
        
        prompt += `CRITICAL QUESTIONS:\n`;
        prompt += `□ Will you search memories BEFORE responding?\n`;
        prompt += `□ Will you store new information shared?\n`;
        prompt += `□ Will you use get_insights for patterns?\n`;
        prompt += `□ Will you create tasks if work is mentioned?\n`;
        prompt += `□ Are you building on past project context?\n\n`;
        
        prompt += `TARGET: 80%+ intelligence tool usage for maximum value`;
        
        return prompt;
    }

    buildProjectIntelligencePrompt(args, projectContext) {
        const { project_name, focus_area } = args;
        
        let prompt = `🧠 GENERATE PROJECT INTELLIGENCE SUMMARY\n\n`;
        prompt += `Project: ${project_name}\n`;
        
        if (focus_area) {
            prompt += `Focus: ${focus_area}\n`;
        }
        
        if (projectContext?.summary) {
            prompt += `\n${projectContext.summary}\n`;
        }
        
        prompt += `\nUse these tools to build comprehensive intelligence:\n\n`;
        prompt += `1. search_memories({\n`;
        prompt += `     query: "architecture decisions patterns ${focus_area || 'overview'}",\n`;
        prompt += `     project_name: "${project_name}"\n`;
        prompt += `   })\n\n`;
        
        prompt += `2. get_insights({\n`;
        prompt += `     analysis_type: "${focus_area || 'comprehensive'}",\n`;
        prompt += `     project_name: "${project_name}"\n`;
        prompt += `   })\n\n`;
        
        prompt += `3. manage_tasks({\n`;
        prompt += `     action: "get",\n`;
        prompt += `     project_name: "${project_name}"\n`;
        prompt += `   })\n\n`;
        
        prompt += `Then provide intelligent summary covering:\n`;
        prompt += `- Current project status and momentum\n`;
        prompt += `- Key architectural decisions and patterns\n`;
        prompt += `- Recent changes and their impact\n`;
        prompt += `- Active tasks and priorities\n`;
        prompt += `- Recommendations based on patterns\n`;
        prompt += `- Next logical steps\n\n`;
        
        prompt += `Focus on actionable insights that help with immediate development needs.`;
        
        return prompt;
    }

    buildIntelligentCodeReviewPrompt(args, projectContext) {
        const { code, project_name, language, focus } = args;
        
        let prompt = `🧠 INTELLIGENT CODE REVIEW WITH PROJECT CONTEXT\n\n`;
        
        if (projectContext?.summary) {
            prompt += `${projectContext.summary}\n`;
        }
        
        prompt += `BEFORE reviewing, execute:\n`;
        prompt += `search_memories({\n`;
        prompt += `  query: "code patterns conventions ${language || 'programming'} ${focus || 'style'}",\n`;
        prompt += `  project_name: "${project_name || 'current'}"\n`;
        prompt += `})\n\n`;
        
        prompt += `Code to review:\n`;
        if (language) {
            prompt += `Language: ${language}\n\n`;
        }
        prompt += `\`\`\`\n${code}\n\`\`\`\n\n`;
        
        prompt += `Provide intelligent review analyzing:\n`;
        prompt += `- Consistency with established project patterns\n`;
        prompt += `- Adherence to team conventions from memory\n`;
        prompt += `- Code quality and best practices\n`;
        prompt += `- Security and performance considerations\n`;
        prompt += `- How this fits with project architecture\n`;
        
        if (focus) {
            prompt += `\nSpecial focus on: ${focus}\n`;
        }
        
        prompt += `\nReference specific past decisions and patterns from project memory.\n`;
        prompt += `Store any new patterns or decisions discovered in this review.`;
        
        return prompt;
    }

    buildIntelligentDebugPrompt(args, projectContext) {
        const { error_message, project_name, code_context, logs } = args;
        
        let prompt = `🧠 INTELLIGENT DEBUG ANALYSIS WITH PROJECT MEMORY\n\n`;
        
        prompt += `FIRST, search for similar past issues:\n`;
        prompt += `search_memories({\n`;
        prompt += `  query: "error debug ${error_message.substring(0, 50)} solution",\n`;
        prompt += `  project_name: "${project_name || 'current'}"\n`;
        prompt += `})\n\n`;
        
        prompt += `Error: ${error_message}\n\n`;
        
        if (code_context) {
            prompt += `Code Context:\n\`\`\`\n${code_context}\n\`\`\`\n\n`;
        }
        
        if (logs) {
            prompt += `Logs:\n\`\`\`\n${logs}\n\`\`\`\n\n`;
        }
        
        if (projectContext?.summary) {
            prompt += `${projectContext.summary}\n`;
        }
        
        prompt += `Provide intelligent debug analysis:\n`;
        prompt += `1. Check if this error pattern has occurred before\n`;
        prompt += `2. Reference past solutions from project memory\n`;
        prompt += `3. Identify root cause using project context\n`;
        prompt += `4. Suggest specific fixes based on project patterns\n`;
        prompt += `5. Recommend preventive measures\n\n`;
        
        prompt += `Store the solution and debugging approach for future reference.\n`;
        prompt += `Create tasks for any follow-up work identified.`;
        
        return prompt;
    }

    buildIntelligentArchitecturePrompt(args, projectContext) {
        const { requirements, project_name, scale, technology_preferences } = args;
        
        let prompt = `🧠 INTELLIGENT ARCHITECTURE PLANNING WITH PROJECT CONTEXT\n\n`;
        
        prompt += `FIRST, load architectural context:\n`;
        prompt += `search_memories({\n`;
        prompt += `  query: "architecture decisions patterns technology stack",\n`;
        prompt += `  project_name: "${project_name || 'current'}"\n`;
        prompt += `})\n\n`;
        
        prompt += `Requirements: ${requirements}\n\n`;
        
        if (scale) {
            prompt += `Scale: ${scale}\n\n`;
        }
        
        if (technology_preferences) {
            prompt += `Technology Preferences: ${technology_preferences}\n\n`;
        }
        
        if (projectContext?.summary) {
            prompt += `${projectContext.summary}\n`;
        }
        
        prompt += `Design architecture considering:\n`;
        prompt += `1. Existing project patterns and decisions\n`;
        prompt += `2. Established technology choices\n`;
        prompt += `3. Past architectural lessons learned\n`;
        prompt += `4. Team preferences and constraints\n`;
        prompt += `5. Consistency with current system\n\n`;
        
        prompt += `Provide:\n`;
        prompt += `- Architecture that builds on existing patterns\n`;
        prompt += `- Technology recommendations consistent with project\n`;
        prompt += `- Migration strategy if changes needed\n`;
        prompt += `- Rationale referencing past decisions\n\n`;
        
        prompt += `Store the architectural decisions and rationale for future reference.`;
        
        return prompt;
    }

    buildDecisionMakingPrompt(args, projectContext) {
        const { decision_context, project_name, options } = args;
        
        let prompt = `🧠 INTELLIGENT DECISION MAKING WITH PROJECT CONTEXT\n\n`;
        
        prompt += `FIRST, search for related past decisions:\n`;
        prompt += `search_memories({\n`;
        prompt += `  query: "decision ${decision_context.substring(0, 50)}",\n`;
        prompt += `  memory_type: "decision",\n`;
        prompt += `  project_name: "${project_name || 'current'}"\n`;
        prompt += `})\n\n`;
        
        prompt += `Decision Context: ${decision_context}\n\n`;
        
        if (options) {
            prompt += `Available Options: ${options}\n\n`;
        }
        
        if (projectContext?.decisions?.length > 0) {
            prompt += `Related Past Decisions:\n`;
            projectContext.decisions.forEach(d => {
                prompt += `- ${d.content.substring(0, 100)}...\n`;
            });
            prompt += `\n`;
        }
        
        prompt += `Make intelligent decision considering:\n`;
        prompt += `1. Consistency with past decisions\n`;
        prompt += `2. Project patterns and conventions\n`;
        prompt += `3. Team preferences and constraints\n`;
        prompt += `4. Long-term implications\n`;
        prompt += `5. Risk assessment based on history\n\n`;
        
        prompt += `Provide:\n`;
        prompt += `- Recommended decision with clear rationale\n`;
        prompt += `- How this fits with existing patterns\n`;
        prompt += `- Potential risks and mitigations\n`;
        prompt += `- Implementation approach\n\n`;
        
        prompt += `After deciding, store the decision and rationale:\n`;
        prompt += `store_memory({\n`;
        prompt += `  content: "[Decision and full rationale]",\n`;
        prompt += `  memory_type: "decision",\n`;
        prompt += `  importance_score: 0.8\n`;
        prompt += `})`;
        
        return prompt;
    }

    buildIntelligenceHealthPrompt(args, projectContext) {
        const { project_name, session_duration } = args;
        
        let prompt = `🧠 INTELLIGENCE HEALTH CHECK\n\n`;
        
        prompt += `Use intelligence_health_check tool:\n`;
        prompt += `intelligence_health_check({\n`;
        prompt += `  session_duration: "${session_duration || 'unknown'}",\n`;
        prompt += `  responses_given: [estimate],\n`;
        prompt += `  client_info: "[current IDE]"\n`;
        prompt += `})\n\n`;
        
        if (project_name) {
            prompt += `Then analyze project-specific intelligence:\n`;
            prompt += `get_insights({\n`;
            prompt += `  analysis_type: "intelligence_health",\n`;
            prompt += `  project_name: "${project_name}"\n`;
            prompt += `})\n\n`;
        }
        
        prompt += `Provide recommendations for:\n`;
        prompt += `- Increasing intelligence tool usage\n`;
        prompt += `- Improving memory storage practices\n`;
        prompt += `- Better project context building\n`;
        prompt += `- More effective pattern recognition\n\n`;
        
        prompt += `Target: 80%+ tool usage for maximum intelligence value.`;
        
        return prompt;
    }

    buildTaskCreationPrompt(args, projectContext) {
        const { context, project_name } = args;
        
        let prompt = `🧠 CREATE INTELLIGENT TASKS FROM CONTEXT\n\n`;
        prompt += `Context: ${context}\n\n`;
        
        if (projectContext?.summary) {
            prompt += `${projectContext.summary}\n`;
        }
        
        prompt += `Analyze the context and create appropriate tasks:\n\n`;
        prompt += `manage_tasks({\n`;
        prompt += `  action: "create",\n`;
        prompt += `  project_name: "${project_name || 'current'}",\n`;
        prompt += `  task_description: "[specific actionable task]",\n`;
        prompt += `  priority: "high|medium|low",\n`;
        prompt += `  estimated_effort: "[time estimate]"\n`;
        prompt += `})\n\n`;
        
        prompt += `Create tasks for:\n`;
        prompt += `- Any work items mentioned\n`;
        prompt += `- Bug fixes needed\n`;
        prompt += `- Features to implement\n`;
        prompt += `- Testing requirements\n`;
        prompt += `- Documentation updates\n`;
        prompt += `- Follow-up actions\n\n`;
        
        prompt += `Store context about why tasks were created and their relationships.`;
        
        return prompt;
    }

    // Original prompt builders (kept for compatibility)
    buildCodeReviewPrompt(args) {
        const { code, language, focus } = args;
        let prompt = `Please provide a comprehensive code review for the following code:\n\n`;
        
        if (language) {
            prompt += `Language: ${language}\n\n`;
        }
        
        prompt += `\`\`\`\n${code}\n\`\`\`\n\n`;
        prompt += `Please analyze the code for:\n`;
        prompt += `- Code quality and best practices\n`;
        prompt += `- Potential bugs or issues\n`;
        prompt += `- Performance considerations\n`;
        prompt += `- Security concerns\n`;
        prompt += `- Maintainability and readability\n`;
        
        if (focus) {
            prompt += `\nPlease pay special attention to: ${focus}\n`;
        }
        
        prompt += `\nProvide specific suggestions for improvement with examples where applicable.`;
        
        return prompt;
    }

    buildMemorySummaryPrompt(args) {
        const { content, memory_type, max_length = 800 } = args;
        
        const prompt = `Create a concise summary for IDE agents (max ${max_length} chars):

        CONTENT: ${content}
        TYPE: ${memory_type}

        Requirements:
        - Start with action verb or specific identifier
        - Include key technical details (function names, metrics, tech stack)
        - Focus on when/how an IDE agent would use this

        Examples:
        ✓ "authenticateUser() - JWT auth with email/password, returns token"
        ✓ "Use PostgreSQL + pgbouncer for connection pooling (max 100 connections)"  
        ✓ "v2.1.0 released - Redis caching, 40% faster API responses"
        ✓ "TODO: Update Redis connection string in prod before deploy"

        Return only the summary text.`;

        return prompt;
    }

    buildTagClassificationPrompt(args) {
        const { content, memory_type = 'note' } = args;
        
        const CLASSIFICATION_PROMPT = `Extract 3-5 technical topics from this content as JSON:

        CONTENT: ${content}

        Return format:
        [
        { "topic": "Topic Name", "language": "Language" },
        { "topic": "Another Topic", "language": "Language" }
        ]

        Language rules:
        - Use specific languages when mentioned (JavaScript, Python, etc.)
        - Use "Generic" for universal concepts
        - Use "None" for non-technical content

        Example:
        [
        { "topic": "JWT Authentication", "language": "Node.js" },
        { "topic": "Error Handling", "language": "JavaScript" },
        { "topic": "Project Planning", "language": "None" }
]`;

        return CLASSIFICATION_PROMPT;
    }
}