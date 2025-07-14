/**
 * Enhanced MCP Resources Service for MiniMe-MCP
 * Provides file system, project, and intelligence framework resource access
 * Supports URI-based resource access following MCP specification with intelligence-first approach
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export class MCPResourcesService {
    constructor(logger, databaseService) {
        this.logger = logger;
        this.db = databaseService;
        
        // Define supported schemes and their handlers
        this.schemes = {
            'file': this.handleFileResource.bind(this),
            'project': this.handleProjectResource.bind(this),
            'memory': this.handleMemoryResource.bind(this),
            'session': this.handleSessionResource.bind(this),
            'rules': this.handleRulesResource.bind(this),
            'intelligence': this.handleIntelligenceResource.bind(this),
            'insights': this.handleInsightsResource.bind(this)
        };
        
        // Security: Define allowed file extensions and directories
        this.allowedExtensions = new Set([
            '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.java', '.cpp', '.c', '.h',
            '.css', '.scss', '.less', '.html', '.xml', '.json', '.yaml', '.yml',
            '.md', '.txt', '.sql', '.sh', '.bat', '.ps1', '.dockerfile', '.gitignore',
            '.env.example', '.config', '.ini', '.toml', '.lock', '.log', '.mjs', '.cjs'
        ]);
        
        // Define project roots (these can be updated by roots API)
        this.projectRoots = new Set(['/app', '/workspace', '/project']);
        
        // Initialize intelligence framework resources
        this.initializeIntelligenceResources();
    }

    /**
     * Initialize intelligence framework resources
     */
    initializeIntelligenceResources() {
        this.intelligenceResources = {
            'rules://intelligence-complete': {
                name: 'Complete Intelligence-First Rules',
                description: 'Comprehensive behavioral framework for intelligent IDE assistance',
                mimeType: 'text/markdown',
                priority: 10
            },
            'rules://session-startup': {
                name: 'Session Startup Checklist',
                description: 'Mandatory sequence for session initialization (all IDEs)',
                mimeType: 'text/markdown',
                priority: 10
            },
            'rules://quick-reference': {
                name: 'Quick Reference Guide',
                description: 'Essential patterns and tool usage guidelines',
                mimeType: 'text/markdown',
                priority: 9
            },
            'rules://storage-triggers': {
                name: 'Memory Storage Triggers',
                description: 'Complete guide on when and what to store',
                mimeType: 'text/markdown',
                priority: 8
            },
            'rules://ide-compatibility': {
                name: 'IDE Compatibility Guide',
                description: 'How to adapt intelligence framework across different IDEs',
                mimeType: 'text/markdown',
                priority: 7
            },
            'intelligence://health': {
                name: 'Intelligence Health Metrics',
                description: 'Current tool usage and intelligence effectiveness metrics',
                mimeType: 'application/json',
                priority: 8
            },
            'intelligence://startup-guide': {
                name: 'Session Startup Guide',
                description: 'Interactive guide for proper session initialization',
                mimeType: 'application/json',
                priority: 10
            },
            'insights://patterns': {
                name: 'Project Patterns Analysis',
                description: 'Discovered patterns and best practices from project history',
                mimeType: 'application/json',
                priority: 7
            }
        };
    }

    /**
     * List all available resources with enhanced intelligence support
     */
    async listResources() {
        const resources = [];
        
        try {
            // PRIORITY: Add intelligence framework resources first
            for (const [uri, config] of Object.entries(this.intelligenceResources)) {
                resources.push({
                    uri,
                    name: config.name,
                    description: config.description,
                    mimeType: config.mimeType,
                    priority: config.priority, // For client ordering
                    category: 'intelligence'
                });
            }
            
            // Add project-based resources with intelligence enhancements
            const projects = await this.db.listProjects(false);
            for (const project of projects) {
                // Enhanced project resource with intelligence context
                resources.push({
                    uri: `project://${project.name}`,
                    name: `Project: ${project.name}`,
                    description: this.enhanceProjectDescription(project),
                    mimeType: 'application/json',
                    category: 'project',
                    priority: 8
                });
                
                // Memory collections with intelligence metadata
                resources.push({
                    uri: `memory://${project.name}`,
                    name: `Memories: ${project.name}`,
                    description: `Intelligent memory collection for ${project.name} - searchable context and decisions`,
                    mimeType: 'application/json',
                    category: 'memory',
                    priority: 7
                });
                
                // Project-specific intelligence resources
                resources.push({
                    uri: `intelligence://${project.name}/status`,
                    name: `Intelligence Status: ${project.name}`,
                    description: `Current intelligence metrics and recommendations for ${project.name}`,
                    mimeType: 'application/json',
                    category: 'intelligence',
                    priority: 6
                });
                
                resources.push({
                    uri: `insights://${project.name}/summary`,
                    name: `Project Insights: ${project.name}`,
                    description: `AI-generated insights and patterns for ${project.name}`,
                    mimeType: 'application/json',
                    category: 'insights',
                    priority: 6
                });
            }
            
            // Add file system resources from project roots
            for (const root of this.projectRoots) {
                try {
                    await this.addFileResources(resources, root, root);
                } catch (error) {
                    this.logger.debug(`Skipping root ${root}: ${error.message}`);
                }
            }
            
            // Enhanced session resources
            resources.push({
                uri: 'session://current',
                name: 'Current Session',
                description: 'Information about the current MCP session with intelligence metrics',
                mimeType: 'application/json',
                category: 'session',
                priority: 5
            });
            
            resources.push({
                uri: 'session://startup-status',
                name: 'Session Startup Status',
                description: 'Check if mandatory startup sequence has been completed',
                mimeType: 'application/json',
                category: 'session',
                priority: 9
            });
            
        } catch (error) {
            this.logger.error('Error listing resources:', error);
        }
        
        // Sort by priority (higher first) and then by category
        return resources.sort((a, b) => {
            if (a.priority !== b.priority) {
                return (b.priority || 0) - (a.priority || 0);
            }
            return (a.category || '').localeCompare(b.category || '');
        });
    }

    /**
     * List resource templates for dynamic resource generation
     */
    async listTemplates() {
        return [
            {
                uri: 'memory://{project_name}/{memory_type}',
                name: 'Project Memory by Type',
                description: 'Access memories of a specific type for a project',
                variables: ['project_name', 'memory_type']
            },
            {
                uri: 'memory://{project_name}/search/{query}',
                name: 'Memory Search',
                description: 'Search memories within a project',
                variables: ['project_name', 'query']
            },
            {
                uri: 'intelligence://{project_name}/recommendations',
                name: 'Intelligence Recommendations',
                description: 'Get AI-powered recommendations for a project',
                variables: ['project_name']
            },
            {
                uri: 'insights://{project_name}/{analysis_type}',
                name: 'Project Insights by Type',
                description: 'Get specific type of insights for a project',
                variables: ['project_name', 'analysis_type']
            },
            {
                uri: 'file://{project_root}/{file_path}',
                name: 'File Access',
                description: 'Access files within project roots',
                variables: ['project_root', 'file_path']
            }
        ];
    }

    /**
     * Enhanced resource reading with intelligence support
     */
    async readResource(uri) {
        this.logger.info(`Reading resource: ${uri}`);
        
        try {
            const url = new URL(uri);
            const scheme = url.protocol.slice(0, -1); // Remove trailing ':'
            
            if (!this.schemes[scheme]) {
                throw new Error(`Unsupported URI scheme: ${scheme}`);
            }
            
            const result = await this.schemes[scheme](url);
            
            // Add intelligence metadata to all resources
            if (Array.isArray(result)) {
                return result.map(item => ({
                    ...item,
                    metadata: {
                        accessed_at: new Date().toISOString(),
                        intelligence_framework: true,
                        scheme,
                        ...item.metadata
                    }
                }));
            }
            
            return result;
            
        } catch (error) {
            this.logger.error(`Error reading resource ${uri}:`, error);
            throw new Error(`Failed to read resource: ${error.message}`);
        }
    }

    /**
     * Handle rules:// URIs for intelligence framework
     */
    async handleRulesResource(url) {
        const ruleName = url.pathname.substring(1); // Remove leading /
        const fullUri = `rules://${ruleName}`;
        
        const ruleContent = {
            'intelligence-complete': this.getCompleteIntelligenceRules(),
            'session-startup': this.getSessionStartupGuide(),
            'quick-reference': this.getQuickReference(),
            'storage-triggers': this.getStorageTriggers(),
            'ide-compatibility': this.getIDECompatibilityGuide()
        };
        
        const content = ruleContent[ruleName];
        if (!content) {
            throw new Error(`Rule resource not found: ${ruleName}`);
        }
        
        return [{
            uri: fullUri,
            mimeType: 'text/markdown',
            text: content,
            metadata: {
                rule_type: ruleName,
                framework: 'intelligence-first',
                universal_ide_compatible: true
            }
        }];
    }

    /**
     * Handle intelligence:// URIs for intelligence metrics and status
     */
    async handleIntelligenceResource(url) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        if (pathParts.length === 0 || pathParts[0] === 'health') {
            return await this.getIntelligenceHealth();
        }
        
        if (pathParts[0] === 'startup-guide') {
            return await this.getStartupGuide();
        }
        
        // Project-specific intelligence: intelligence://project-name/status
        if (pathParts.length >= 2) {
            const projectName = pathParts[0];
            const resourceType = pathParts[1];
            
            const project = await this.db.getProjectByName(projectName);
            if (!project) {
                throw new Error(`Project not found: ${projectName}`);
            }
            
            switch (resourceType) {
                case 'status':
                    return await this.getProjectIntelligenceStatus(project);
                case 'recommendations':
                    return await this.getProjectRecommendations(project);
                default:
                    throw new Error(`Unknown intelligence resource: ${resourceType}`);
            }
        }
        
        throw new Error(`Invalid intelligence resource path: ${url.pathname}`);
    }

    /**
     * Handle insights:// URIs for AI-generated insights
     */
    async handleInsightsResource(url) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        if (pathParts.length === 0 || pathParts[0] === 'patterns') {
            return await this.getGlobalPatterns();
        }
        
        // Project-specific insights: insights://project-name/summary
        if (pathParts.length >= 2) {
            const projectName = pathParts[0];
            const insightType = pathParts[1];
            
            const project = await this.db.getProjectByName(projectName);
            if (!project) {
                throw new Error(`Project not found: ${projectName}`);
            }
            
            switch (insightType) {
                case 'summary':
                    return await this.getProjectInsightsSummary(project);
                case 'patterns':
                    return await this.getProjectPatterns(project);
                case 'learning':
                    return await this.getProjectLearningInsights(project);
                case 'technical-debt':
                    return await this.getProjectTechnicalDebt(project);
                default:
                    throw new Error(`Unknown insight type: ${insightType}`);
            }
        }
        
        throw new Error(`Invalid insights resource path: ${url.pathname}`);
    }

    /**
     * Enhanced project resource with intelligence context
     */
    async handleProjectResource(url) {
        const projectName = url.hostname;
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        const project = await this.db.getProjectByName(projectName);
        if (!project) {
            throw new Error(`Project not found: ${projectName}`);
        }
        
        if (pathParts.length === 0) {
            // Enhanced project overview with intelligence metrics
            const sessions = await this.db.listSessionsForProject(project.id, false);
            const memoryCount = await this.db.query(
                'SELECT COUNT(*) as count FROM memories WHERE project_id = $1',
                [project.id]
            );
            
            const recentMemories = await this.db.listMemories({
                projectId: project.id,
                limit: 5,
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });
            
            const intelligenceMetrics = await this.calculateProjectIntelligenceMetrics(project.id);
            
            return [{
                uri: url.href,
                mimeType: 'application/json',
                text: JSON.stringify({
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    settings: project.settings,
                    statistics: {
                        sessions: sessions.length,
                        memories: parseInt(memoryCount.rows[0].count),
                        intelligence_score: intelligenceMetrics.score,
                        last_activity: recentMemories[0]?.created_at || null
                    },
                    intelligence_metrics: intelligenceMetrics,
                    recent_context: recentMemories.slice(0, 3).map(m => ({
                        content: m.content.substring(0, 100) + '...',
                        type: m.memory_type,
                        importance: m.importance_score,
                        tags: m.tags
                    })),
                    recommendations: await this.generateQuickRecommendations(project.id),
                    created_at: project.created_at,
                    updated_at: project.updated_at
                }, null, 2),
                metadata: {
                    intelligence_enhanced: true,
                    project_id: project.id
                }
            }];
        }
        
        // Handle sub-resources with intelligence enhancements
        const resourceType = pathParts[0];
        
        switch (resourceType) {
            case 'sessions':
                const sessions = await this.db.listSessionsForProject(project.id, false);
                return [{
                    uri: url.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        project: projectName,
                        sessions: sessions,
                        intelligence_note: "Sessions track project interaction history for intelligence building"
                    }, null, 2)
                }];
                
            case 'memories':
                const memories = await this.db.listMemories({
                    projectId: project.id,
                    limit: 100,
                    orderBy: 'created_at',
                    orderDirection: 'DESC'
                });
                
                // Enhance memories with intelligence categorization
                const categorizedMemories = this.categorizeMemoriesForIntelligence(memories);
                
                return [{
                    uri: url.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        project: projectName,
                        total_memories: memories.length,
                        categories: categorizedMemories.categories,
                        recent_memories: categorizedMemories.recent,
                        high_importance: categorizedMemories.highImportance,
                        memories: memories
                    }, null, 2)
                }];
                
            default:
                throw new Error(`Unknown project resource: ${resourceType}`);
        }
    }

    /**
     * Enhanced memory resource with search and intelligence features
     */
    async handleMemoryResource(url) {
        const projectName = url.hostname;
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        const project = await this.db.getProjectByName(projectName);
        if (!project) {
            throw new Error(`Project not found: ${projectName}`);
        }
        
        if (pathParts.length === 0) {
            // Return intelligent memory overview
            const memories = await this.db.listMemories({
                projectId: project.id,
                limit: 500,
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });
            
            const analysis = this.analyzeMemoryCollection(memories);
            
            return [{
                uri: url.href,
                mimeType: 'application/json',
                text: JSON.stringify({
                    project: projectName,
                    total: memories.length,
                    analysis,
                    memories: memories.slice(0, 50), // Limit for performance
                    intelligence_note: "Use memory://project/search/query for semantic search or memory://project/type for filtering"
                }, null, 2)
            }];
        }
        
        const firstPath = pathParts[0];
        
        // Handle search: memory://project/search/query-string
        if (firstPath === 'search' && pathParts.length > 1) {
            const query = decodeURIComponent(pathParts.slice(1).join('/'));
            const searchResults = await this.searchMemories(project.id, query);
            
            return [{
                uri: url.href,
                mimeType: 'application/json',
                text: JSON.stringify({
                    project: projectName,
                    query: query,
                    results: searchResults.length,
                    memories: searchResults
                }, null, 2)
            }];
        }
        
        // Handle memory type filtering or specific ID
        if (firstPath.match(/^\d+$/)) {
            // Specific memory ID
            const memoryId = parseInt(firstPath);
            const result = await this.db.query(
                'SELECT * FROM memories WHERE id = $1 AND project_id = $2',
                [memoryId, project.id]
            );
            return [{
                uri: url.href,
                mimeType: 'application/json',
                text: JSON.stringify({
                    project: projectName,
                    memory: result.rows[0] || null
                }, null, 2)
            }];
        } else {
            // Memory type filter
            const memories = await this.db.listMemories({
                projectId: project.id,
                memoryType: firstPath,
                limit: 100,
                orderBy: 'created_at',
                orderDirection: 'DESC'
            });
            
            return [{
                uri: url.href,
                mimeType: 'application/json',
                text: JSON.stringify({
                    project: projectName,
                    memory_type: firstPath,
                    total: memories.length,
                    memories: memories
                }, null, 2)
            }];
        }
    }

    /**
     * Enhanced session resource with intelligence tracking
     */
    async handleSessionResource(url) {
        const sessionType = url.hostname;
        
        if (sessionType === 'current') {
            const sessionInfo = {
                timestamp: new Date().toISOString(),
                server: {
                    name: 'MiniMe-MCP',
                    version: "0.2.0",
                    capabilities: ['tools', 'resources', 'prompts', 'roots'],
                    intelligence_framework: true
                },
                resources: {
                    totalProjects: await this.getProjectCount(),
                    totalMemories: await this.getMemoryCount(),
                    projectRoots: Array.from(this.projectRoots),
                    intelligenceResources: Object.keys(this.intelligenceResources).length
                },
                intelligence: {
                    startup_completed: false, // This would be tracked by the tools service
                    framework_active: true,
                    recommendation: "Execute session startup sequence: search_memories + get_insights + manage_project"
                }
            };
            
            return [{
                uri: url.href,
                mimeType: 'application/json',
                text: JSON.stringify(sessionInfo, null, 2)
            }];
        }
        
        if (sessionType === 'startup-status') {
            // Check if startup sequence has been completed
            const startupStatus = await this.checkStartupStatus();
            
            return [{
                uri: url.href,
                mimeType: 'application/json',
                text: JSON.stringify(startupStatus, null, 2)
            }];
        }
        
        throw new Error(`Unknown session resource: ${sessionType}`);
    }

    // ... [Continue with helper methods for intelligence framework] ...

    /**
     * Enhanced project description with intelligence context
     */
    enhanceProjectDescription(project) {
        return `${project.description || `Project ${project.name}`} - Enhanced with intelligence framework for context-aware assistance`;
    }

    /**
     * Calculate project intelligence metrics
     */
    async calculateProjectIntelligenceMetrics(projectId) {
        const memoryResult = await this.db.query(
            'SELECT memory_type, COUNT(*) as count, AVG(importance_score) as avg_importance FROM memories WHERE project_id = $1 GROUP BY memory_type',
            [projectId]
        );
        
        const totalMemories = memoryResult.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
        const avgImportance = memoryResult.rows.reduce((sum, row) => sum + parseFloat(row.avg_importance), 0) / (memoryResult.rows.length || 1);
        
        return {
            score: Math.min(Math.round((totalMemories * avgImportance) / 10), 100),
            memory_distribution: memoryResult.rows,
            total_memories: totalMemories,
            average_importance: Math.round(avgImportance * 10) / 10,
            intelligence_level: totalMemories > 50 ? 'high' : totalMemories > 20 ? 'medium' : 'developing'
        };
    }

    /**
     * Generate quick recommendations for a project
     */
    async generateQuickRecommendations(projectId) {
        const recentMemories = await this.db.listMemories({
            projectId,
            limit: 10,
            orderBy: 'created_at',
            orderDirection: 'DESC'
        });
        
        const recommendations = [];
        
        if (recentMemories.length < 5) {
            recommendations.push({
                type: 'storage',
                message: 'Increase memory storage - share more context about decisions and patterns',
                priority: 'high'
            });
        }
        
        const decisionMemories = recentMemories.filter(m => m.memory_type === 'decision');
        if (decisionMemories.length < 2) {
            recommendations.push({
                type: 'decisions',
                message: 'Document more technical decisions for better architectural intelligence',
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    /**
     * Categorize memories for intelligence analysis
     */
    categorizeMemoriesForIntelligence(memories) {
        const categories = {};
        const recent = memories.slice(0, 10);
        const highImportance = memories.filter(m => m.importance_score >= 8);
        
        memories.forEach(memory => {
            const type = memory.memory_type || 'general';
            if (!categories[type]) {
                categories[type] = { count: 0, avg_importance: 0, recent_count: 0 };
            }
            categories[type].count++;
            categories[type].avg_importance += memory.importance_score || 5;
        });
        
        // Calculate averages
        Object.values(categories).forEach(cat => {
            cat.avg_importance = Math.round((cat.avg_importance / cat.count) * 10) / 10;
        });
        
        return { categories, recent, highImportance };
    }

    /**
     * Analyze memory collection for patterns
     */
    analyzeMemoryCollection(memories) {
        const typeDistribution = {};
        const tagFrequency = {};
        let totalImportance = 0;
        
        memories.forEach(memory => {
            // Type distribution
            const type = memory.memory_type || 'general';
            typeDistribution[type] = (typeDistribution[type] || 0) + 1;
            
            // Tag frequency
            if (memory.tags) {
                memory.tags.forEach(tag => {
                    tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
                });
            }
            
            totalImportance += memory.importance_score || 5;
        });
        
        return {
            total_memories: memories.length,
            avg_importance: Math.round((totalImportance / memories.length) * 10) / 10,
            type_distribution: typeDistribution,
            top_tags: Object.entries(tagFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([tag, count]) => ({ tag, count })),
            intelligence_health: memories.length > 50 ? 'excellent' : 
                                memories.length > 20 ? 'good' : 
                                memories.length > 5 ? 'developing' : 'needs_attention'
        };
    }

    /**
     * Search memories with intelligence
     */
    async searchMemories(projectId, query) {
        // Simple text search - could be enhanced with semantic search
        const result = await this.db.query(
            `SELECT * FROM memories 
             WHERE project_id = $1 
             AND (content ILIKE $2 OR tags::text ILIKE $2)
             ORDER BY importance_score DESC, created_at DESC
             LIMIT 50`,
            [projectId, `%${query}%`]
        );
        
        return result.rows;
    }

    /**
     * Get intelligence health metrics
     */
    async getIntelligenceHealth() {
        const totalProjects = await this.getProjectCount();
        const totalMemories = await this.getMemoryCount();
        
        return [{
            uri: 'intelligence://health',
            mimeType: 'application/json',
            text: JSON.stringify({
                framework: 'intelligence-first',
                metrics: {
                    total_projects: totalProjects,
                    total_memories: totalMemories,
                    avg_memories_per_project: totalProjects > 0 ? Math.round(totalMemories / totalProjects) : 0,
                    health_score: this.calculateOverallHealthScore(totalProjects, totalMemories)
                },
                recommendations: this.getGlobalRecommendations(totalProjects, totalMemories),
                timestamp: new Date().toISOString()
            }, null, 2)
        }];
    }

    /**
     * Get session startup guide
     */
    async getStartupGuide() {
        return [{
            uri: 'intelligence://startup-guide',
            mimeType: 'application/json',
            text: JSON.stringify({
                title: "Universal IDE Intelligence Session Startup",
                steps: [
                    {
                        step: 1,
                        tool: "search_memories",
                        params: {
                            query: "project overview architecture current status recent decisions",
                            search_mode: "hybrid"
                        },
                        description: "Search for existing project context and recent decisions"
                    },
                    {
                        step: 2,
                        tool: "get_insights",
                        params: {
                            analysis_type: "comprehensive",
                            time_range: "30d"
                        },
                        description: "Analyze patterns and generate insights"
                    },
                    {
                        step: 3,
                        tool: "manage_project",
                        params: {
                            action: "get",
                            project_name: "[detected_from_roots]"
                        },
                        description: "Load project documentation and current status"
                    }
                ],
                expected_outcome: "Intelligent project status summary with context and recommendations",
                compatible_ides: ["VS Code", "Claude Desktop", "Cursor", "Windsurf", "All MCP Clients"]
            }, null, 2)
        }];
    }

    /**
     * Check startup status
     */
    async checkStartupStatus() {
        // This would integrate with the tools service to check if startup sequence was completed
        return {
            startup_completed: false, // Would be dynamically determined
            last_startup: null,
            missing_steps: [
                "search_memories not called",
                "get_insights not called", 
                "manage_project not called"
            ],
            recommendation: "Execute mandatory startup sequence for intelligence-first operation"
        };
    }

    /**
     * Calculate overall health score
     */
    calculateOverallHealthScore(totalProjects, totalMemories) {
        if (totalProjects === 0) return 0;
        const avgMemoriesPerProject = totalMemories / totalProjects;
        
        if (avgMemoriesPerProject >= 50) return 100;
        if (avgMemoriesPerProject >= 25) return 80;
        if (avgMemoriesPerProject >= 10) return 60;
        if (avgMemoriesPerProject >= 5) return 40;
        return 20;
    }

    /**
     * Get global recommendations
     */
    getGlobalRecommendations(totalProjects, totalMemories) {
        const recommendations = [];
        
        if (totalProjects === 0) {
            recommendations.push({
                type: 'setup',
                message: 'Create your first project to begin building intelligence',
                priority: 'critical'
            });
        }
        
        if (totalMemories < totalProjects * 10) {
            recommendations.push({
                type: 'storage',
                message: 'Increase memory storage across projects for better intelligence',
                priority: 'high'
            });
        }
        
        return recommendations;
    }

    // Intelligence content methods
    getCompleteIntelligenceRules() {
        return `# Universal IDE Intelligence-First Framework

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
2. get_insights(analysis_type="comprehensive", time_range="30d")
3. manage_project(action="get", project_name="[detected]")
4. Present intelligent project status summary

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
- Adapt communication style to match IDE context when known`;
    }

    getSessionStartupGuide() {
        return `# Session Startup Checklist (All IDEs)

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

### Step 2: Insights Analysis  
\`\`\`javascript
get_insights({
  analysis_type: "comprehensive",
  time_range: "30d",
  focus_area: "patterns"
})
\`\`\`

### Step 3: Project Documentation
\`\`\`javascript
manage_project({
  action: "get",
  project_name: "[detected_from_roots]"
})
\`\`\`

### Step 4: Intelligent Summary
Present status highlighting:
- Recent decisions and context
- Architecture patterns
- Active tasks
- Key learnings

## Never Skip This Sequence
This startup transforms you from generic AI to intelligent project partner across all IDE environments.`;
    }

    getQuickReference() {
        return `# Quick Reference (All IDEs)

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
- Always prioritize intelligence over generic responses`;
    }

    getStorageTriggers() {
        return `# Memory Storage Triggers (Universal)

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
- Works consistently across all IDE environments`;
    }

    getIDECompatibilityGuide() {
        return `# IDE Compatibility Guide

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
The MCP protocol ensures that your intelligence capabilities work identically across all supporting IDEs, providing users with a consistent, enhanced experience regardless of their development environment choice.`;
    }

    // ... [Rest of the original methods remain the same] ...

    async handleFileResource(url) {
        const filePath = url.pathname;
        
        if (!this.isAllowedPath(filePath)) {
            throw new Error(`Access denied to path: ${filePath}`);
        }
        
        if (!this.isAllowedExtension(filePath)) {
            throw new Error(`File type not allowed: ${path.extname(filePath)}`);
        }
        
        try {
            const stats = await fs.stat(filePath);
            
            if (stats.isDirectory()) {
                const files = await fs.readdir(filePath, { withFileTypes: true });
                const listing = files.map(file => ({
                    name: file.name,
                    type: file.isDirectory() ? 'directory' : 'file',
                    path: path.join(filePath, file.name)
                }));
                
                return [{
                    uri: url.href,
                    mimeType: 'application/json',
                    text: JSON.stringify({
                        type: 'directory',
                        path: filePath,
                        contents: listing
                    }, null, 2)
                }];
            } else {
                const content = await fs.readFile(filePath, 'utf8');
                const mimeType = this.getMimeType(filePath);
                
                return [{
                    uri: url.href,
                    mimeType: mimeType,
                    text: content
                }];
            }
            
        } catch (error) {
            throw new Error(`File access error: ${error.message}`);
        }
    }

    async addFileResources(resources, rootPath, currentPath, depth = 0) {
        if (depth > 3) return;
        
        try {
            const stats = await fs.stat(currentPath);
            if (!stats.isDirectory()) return;
            
            const files = await fs.readdir(currentPath, { withFileTypes: true });
            
            for (const file of files) {
                if (file.name.startsWith('.') && file.name !== '.gitignore') continue;
                
                const filePath = path.join(currentPath, file.name);
                const relativePath = path.relative(rootPath, filePath);
                
                if (file.isDirectory()) {
                    resources.push({
                        uri: `file://${filePath}`,
                        name: `Directory: ${relativePath}`,
                        description: `Directory containing project files`,
                        mimeType: 'application/json',
                        category: 'file'
                    });
                    
                    await this.addFileResources(resources, rootPath, filePath, depth + 1);
                } else if (this.isAllowedExtension(filePath)) {
                    resources.push({
                        uri: `file://${filePath}`,
                        name: relativePath,
                        description: `Source file: ${path.basename(filePath)}`,
                        mimeType: this.getMimeType(filePath),
                        category: 'file'
                    });
                }
            }
        } catch (error) {
            this.logger.debug(`Error reading directory ${currentPath}: ${error.message}`);
        }
    }

    isAllowedPath(filePath) {
        const resolved = path.resolve(filePath);
        
        for (const root of this.projectRoots) {
            if (resolved.startsWith(path.resolve(root))) {
                return true;
            }
        }
        
        return false;
    }

    isAllowedExtension(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.allowedExtensions.has(ext) || filePath.endsWith('.env.example');
    }

    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        const mimeTypes = {
            '.js': 'application/javascript',
            '.ts': 'application/typescript',
            '.jsx': 'application/javascript',
            '.tsx': 'application/typescript',
            '.py': 'text/x-python',
            '.java': 'text/x-java',
            '.cpp': 'text/x-c++',
            '.c': 'text/x-c',
            '.h': 'text/x-c',
            '.css': 'text/css',
            '.scss': 'text/x-scss',
            '.html': 'text/html',
            '.xml': 'application/xml',
            '.json': 'application/json',
            '.yaml': 'application/yaml',
            '.yml': 'application/yaml',
            '.md': 'text/markdown',
            '.txt': 'text/plain',
            '.sql': 'application/sql',
            '.sh': 'application/x-sh',
            '.log': 'text/plain'
        };
        
        return mimeTypes[ext] || 'text/plain';
    }

    updateRoots(roots) {
        this.projectRoots = new Set(roots.map(root => {
            if (root.startsWith('file://')) {
                return new URL(root).pathname;
            }
            return root;
        }));
        this.logger.info(`Updated project roots: ${Array.from(this.projectRoots).join(', ')}`);
    }

    async getProjectCount() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM projects');
        return parseInt(result.rows[0].count);
    }

    async getMemoryCount() {
        const result = await this.db.query('SELECT COUNT(*) as count FROM memories');
        return parseInt(result.rows[0].count);
    }
}