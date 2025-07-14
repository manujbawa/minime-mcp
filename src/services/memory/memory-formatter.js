/**
 * Memory Formatter Service
 * Composable component for formatting memory storage results
 * Supports multiple output formats for different consumers (MCP, API, UI, etc.)
 */

export class MemoryFormatter {
    constructor(logger) {
        this.logger = logger;
        
        // Format configurations
        this.formatConfigs = {
            mcp: {
                includeQuickActions: true,
                includeSuggestions: true,
                includeStats: false,
                maxContentPreview: 200,
                useEmojis: true
            },
            api: {
                includeQuickActions: false,
                includeSuggestions: false,
                includeStats: true,
                maxContentPreview: null,
                useEmojis: false
            },
            ui: {
                includeQuickActions: true,
                includeSuggestions: true,
                includeStats: true,
                maxContentPreview: 150,
                useEmojis: true
            },
            summary: {
                includeQuickActions: false,
                includeSuggestions: false,
                includeStats: false,
                maxContentPreview: 100,
                useEmojis: false
            }
        };
        
        // Quick action templates
        this.quickActionTemplates = {
            code: [
                'search_memories("code patterns")',
                'get_insights(analysis_type: "patterns")',
                'search_memories(memory_type: "code")'
            ],
            decision: [
                'search_memories(memory_type: "decision")',
                'get_insights(analysis_type: "progress")',
                'search_memories("architecture decisions")'
            ],
            rule: [
                'get_rules()',
                'search_memories(memory_type: "rule")',
                'search_memories("guidelines")'
            ],
            progress: [
                'search_memories(memory_type: "progress")',
                'get_insights(analysis_type: "progress")',
                'search_memories("milestones")'
            ],
            project_brief: [
                'search_memories(memory_type: "project_brief")',
                'get_insights(analysis_type: "comprehensive")',
                'search_memories("architecture")'
            ],
            tech_reference: [
                'search_memories(memory_type: "tech_reference")',
                'search_memories("documentation")',
                'search_memories("tutorial")'
            ]
        };
    }

    /**
     * Format memory storage result based on requested format
     */
    format(memory, options = {}) {
        const {
            format = 'raw',
            detectionResult = null,
            enhancements = {},
            project = null,
            isDuplicate = false,
            error = null
        } = options;
        
        try {
            // Handle error cases
            if (error) {
                return this._formatError(error, format);
            }
            
            // Handle duplicate cases
            if (isDuplicate) {
                return this._formatDuplicate(memory, format, { project, detectionResult });
            }
            
            // Format based on requested format
            switch (format) {
                case 'mcp':
                    return this._formatForMCP(memory, { detectionResult, enhancements, project });
                
                case 'api':
                    return this._formatForAPI(memory, { detectionResult, enhancements });
                
                case 'ui':
                    return this._formatForUI(memory, { detectionResult, enhancements, project });
                
                case 'summary':
                    return this._formatAsSummary(memory, { detectionResult });
                
                case 'detailed':
                    return this._formatDetailed(memory, { detectionResult, enhancements, project });
                
                case 'raw':
                default:
                    return memory;
            }
            
        } catch (error) {
            this.logger.error('Memory formatting failed:', error);
            return this._formatError(error, format);
        }
    }

    /**
     * Format for MCP tools (rich markdown with actionable information)
     */
    _formatForMCP(memory, options = {}) {
        const { detectionResult, enhancements, project } = options;
        const config = this.formatConfigs.mcp;
        
        // Build the response text
        let text = `✅ Memory stored successfully!\n\n`;
        
        // Core information
        text += `**ID:** ${memory.id} | **Type:** ${memory.memory_type}`;
        
        // Auto-detection info
        if (detectionResult?.autoDetected) {
            const confidence = Math.round(detectionResult.confidence * 100);
            text += ` (auto-detected, ${confidence}% confidence)`;
        }
        
        text += ` | **Project:** ${project || 'Unknown'}\n`;
        
        // Tags
        const tags = memory.tags || memory.smart_tags || [];
        if (tags.length > 0) {
            text += `**Tags:** ${tags.map(t => `\`${t}\``).join(' ')}\n`;
        }
        
        // Content preview (if configured)
        if (config.maxContentPreview && memory.content) {
            const preview = memory.content.length > config.maxContentPreview
                ? memory.content.substring(0, config.maxContentPreview) + '...'
                : memory.content;
            text += `\n**Content Preview:**\n${preview}\n`;
        }
        
        // Processing status
        if (memory.processing_status === 'pending') {
            text += `\n📝 **Background Processing:** Smart tags and embedding generation in progress...\n`;
        }
        
        // Enhancements
        if (enhancements.stats && config.includeStats) {
            text += `\n📊 **Project Stats:** ${enhancements.stats.total_memories} total memories, ${enhancements.stats.recent_memories} added recently\n`;
        }
        
        if (enhancements.suggestions && config.includeSuggestions && enhancements.suggestions.length > 0) {
            text += `\n🔗 **Related Memories:** Found ${enhancements.suggestions.length} similar memories\n`;
        }
        
        // Detection details (for debugging)
        if (detectionResult?.details && detectionResult.method !== 'manual') {
            text += `\n🔍 **Detection Details:** ${detectionResult.method} method`;
            if (detectionResult.details.alternatives?.length > 0) {
                const alternatives = detectionResult.details.alternatives
                    .map(alt => `${alt.type} (${Math.round(alt.confidence * 100)}%)`)
                    .join(', ');
                text += `, alternatives: ${alternatives}`;
            }
            text += `\n`;
        }
        
        // Quick actions
        if (config.includeQuickActions) {
            text += this._buildQuickActions(memory.memory_type, project, tags);
        }
        
        return {
            content: [{
                type: "text",
                text
            }]
        };
    }

    /**
     * Format for API responses (clean JSON structure)
     */
    _formatForAPI(memory, options = {}) {
        const { detectionResult, enhancements } = options;
        const config = this.formatConfigs.api;
        
        const result = {
            id: memory.id,
            project_id: memory.project_id,
            session_id: memory.session_id,
            content: memory.content,
            memory_type: memory.memory_type,
            importance_score: memory.importance_score,
            tags: memory.tags || memory.smart_tags || [],
            processing_status: memory.processing_status,
            created_at: memory.created_at,
            updated_at: memory.updated_at
        };
        
        // Add metadata if available
        if (memory.metadata) {
            result.metadata = memory.metadata;
        }
        
        // Add detection information
        if (detectionResult) {
            result.detection = {
                auto_detected: detectionResult.autoDetected,
                confidence: detectionResult.confidence,
                method: detectionResult.method
            };
        }
        
        // Add enhancements
        if (config.includeStats && enhancements.stats) {
            result.project_stats = enhancements.stats;
        }
        
        if (enhancements.suggestions) {
            result.related_memories = enhancements.suggestions.map(s => ({
                id: s.id,
                similarity: s.similarity,
                type: s.memory_type
            }));
        }
        
        return result;
    }

    /**
     * Format for UI components (user-friendly structure)
     */
    _formatForUI(memory, options = {}) {
        const { detectionResult, enhancements, project } = options;
        const config = this.formatConfigs.ui;
        
        const result = {
            id: memory.id,
            content: memory.content,
            memory_type: memory.memory_type,
            project_name: project,
            tags: memory.tags || memory.smart_tags || [],
            importance_score: memory.importance_score,
            processing_status: memory.processing_status,
            created_at: memory.created_at,
            
            // UI-specific fields
            display: {
                title: this._generateTitle(memory.content, memory.memory_type),
                preview: config.maxContentPreview && memory.content
                    ? memory.content.substring(0, config.maxContentPreview) + (memory.content.length > config.maxContentPreview ? '...' : '')
                    : memory.content,
                status_color: this._getStatusColor(memory.processing_status),
                type_icon: this._getTypeIcon(memory.memory_type),
                confidence_badge: detectionResult?.autoDetected 
                    ? `Auto-detected (${Math.round(detectionResult.confidence * 100)}%)`
                    : null
            }
        };
        
        // Add enhancements for UI
        if (enhancements.suggestions) {
            result.related_count = enhancements.suggestions.length;
        }
        
        if (config.includeQuickActions) {
            result.quick_actions = this._getQuickActionsList(memory.memory_type, project, memory.tags);
        }
        
        return result;
    }

    /**
     * Format as summary (condensed information)
     */
    _formatAsSummary(memory, options = {}) {
        const { detectionResult } = options;
        const config = this.formatConfigs.summary;
        
        return {
            id: memory.id,
            type: memory.memory_type,
            preview: config.maxContentPreview && memory.content
                ? memory.content.substring(0, config.maxContentPreview) + '...'
                : memory.content,
            tags: (memory.tags || memory.smart_tags || []).slice(0, 3), // Top 3 tags
            confidence: detectionResult?.confidence,
            auto_detected: detectionResult?.autoDetected || false,
            created_at: memory.created_at
        };
    }

    /**
     * Format with detailed information (comprehensive view)
     */
    _formatDetailed(memory, options = {}) {
        const { detectionResult, enhancements, project } = options;
        
        return {
            // Core memory data
            memory: {
                id: memory.id,
                project_id: memory.project_id,
                session_id: memory.session_id,
                content: memory.content,
                memory_type: memory.memory_type,
                importance_score: memory.importance_score,
                tags: memory.tags || memory.smart_tags || [],
                metadata: memory.metadata || {},
                processing_status: memory.processing_status,
                created_at: memory.created_at,
                updated_at: memory.updated_at
            },
            
            // Detection information
            detection: detectionResult ? {
                type: detectionResult.type,
                confidence: detectionResult.confidence,
                auto_detected: detectionResult.autoDetected,
                method: detectionResult.method,
                details: detectionResult.details,
                error: detectionResult.error
            } : null,
            
            // Project context
            project: {
                name: project,
                stats: enhancements.stats
            },
            
            // Related information
            related: {
                suggestions: enhancements.suggestions || [],
                quick_actions: this._getQuickActionsList(memory.memory_type, project, memory.tags)
            },
            
            // Metadata
            meta: {
                formatted_at: new Date().toISOString(),
                format_version: '1.0'
            }
        };
    }

    /**
     * Format error responses
     */
    _formatError(error, format) {
        const errorMessage = error.message || 'Unknown error occurred';
        
        switch (format) {
            case 'mcp':
                return {
                    content: [{
                        type: "text",
                        text: `❌ Memory storage failed: ${errorMessage}`
                    }]
                };
            
            case 'api':
            case 'ui':
                return {
                    error: true,
                    message: errorMessage,
                    timestamp: new Date().toISOString()
                };
            
            default:
                return { error: errorMessage };
        }
    }

    /**
     * Format duplicate memory responses
     */
    _formatDuplicate(memory, format, options = {}) {
        const { project, detectionResult } = options;
        
        switch (format) {
            case 'mcp':
                return {
                    content: [{
                        type: "text",
                        text: `✅ Memory already exists!\n\n**ID:** ${memory.id} | **Project:** ${project || 'Unknown'}\n\n🔍 **Quick Actions:**\n- View memory: \`search_memories(id: ${memory.id})\`\n- Find similar: \`search_memories("${memory.memory_type}")\``
                    }]
                };
            
            case 'api':
                return {
                    id: memory.id,
                    duplicate: true,
                    message: 'Memory with identical content already exists',
                    existing_memory: {
                        id: memory.id,
                        memory_type: memory.memory_type,
                        created_at: memory.created_at
                    }
                };
            
            case 'ui':
                return {
                    id: memory.id,
                    duplicate: true,
                    message: 'This content has already been stored',
                    display: {
                        title: 'Duplicate Memory',
                        status_color: 'warning',
                        type_icon: this._getTypeIcon(memory.memory_type)
                    }
                };
            
            default:
                return { duplicate: true, existing_id: memory.id };
        }
    }

    /**
     * Build quick actions section for MCP format
     */
    _buildQuickActions(memoryType, project, tags) {
        let text = `\n⚡ **Quick Actions:**\n`;
        
        // Type-specific actions
        const typeActions = this.quickActionTemplates[memoryType] || this.quickActionTemplates.code;
        for (const action of typeActions.slice(0, 2)) { // Top 2 actions
            text += `- ${action}\n`;
        }
        
        // Project-specific action
        if (project) {
            text += `- View project: \`search_memories(project_name: "${project}")\`\n`;
        }
        
        // Tag-specific action
        if (tags.length > 0) {
            const topTag = tags[0];
            text += `- Search similar: \`search_memories("${topTag}")\`\n`;
        }
        
        return text;
    }

    /**
     * Get quick actions as a list (for API/UI)
     */
    _getQuickActionsList(memoryType, project, tags) {
        const actions = [];
        
        // Type-specific actions
        const typeActions = this.quickActionTemplates[memoryType] || this.quickActionTemplates.code;
        actions.push(...typeActions.slice(0, 2));
        
        // Project-specific action
        if (project) {
            actions.push(`search_memories(project_name: "${project}")`);
        }
        
        // Tag-specific action
        if (tags?.length > 0) {
            actions.push(`search_memories("${tags[0]}")`);
        }
        
        return actions;
    }

    /**
     * Generate a title for the memory (for UI display)
     */
    _generateTitle(content, memoryType) {
        // Extract first meaningful line or sentence
        const firstLine = content.split('\n')[0].trim();
        
        if (firstLine.length > 0 && firstLine.length <= 60) {
            return firstLine;
        }
        
        // If first line is too long, extract first sentence
        const firstSentence = content.match(/^[^.!?]*[.!?]/);
        if (firstSentence && firstSentence[0].length <= 60) {
            return firstSentence[0].trim();
        }
        
        // Fallback to truncated content
        const maxLength = 50;
        return content.length > maxLength 
            ? content.substring(0, maxLength) + '...'
            : content;
    }

    /**
     * Get status color for UI display
     */
    _getStatusColor(status) {
        const colors = {
            'ready': 'success',
            'pending': 'warning',
            'processing': 'info',
            'failed': 'error',
            'failed_permanent': 'error'
        };
        
        return colors[status] || 'default';
    }

    /**
     * Get type icon for UI display
     */
    _getTypeIcon(memoryType) {
        const icons = {
            'code': '💻',
            'decision': '🎯',
            'rule': '📋',
            'note': '📝',
            'progress': '📈',
            'project_brief': '📊',
            'tech_reference': '📖',
            'general': '📄'
        };
        
        return icons[memoryType] || '📄';
    }

    /**
     * Test formatter with sample data
     */
    test() {
        const sampleMemory = {
            id: 123,
            project_id: 1,
            session_id: 1,
            content: 'Implemented React component with useState hook for form validation. Added proper error handling and accessibility features.',
            memory_type: 'code',
            importance_score: 0.8,
            tags: ['react', 'frontend', 'validation', 'accessibility'],
            processing_status: 'ready',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const sampleDetection = {
            type: 'code',
            confidence: 0.85,
            autoDetected: true,
            method: 'pattern'
        };
        
        const formats = ['mcp', 'api', 'ui', 'summary', 'detailed'];
        const results = {};
        
        for (const format of formats) {
            try {
                results[format] = this.format(sampleMemory, {
                    format,
                    detectionResult: sampleDetection,
                    project: 'test-project',
                    enhancements: {
                        stats: { total_memories: 50, recent_memories: 5 }
                    }
                });
            } catch (error) {
                results[format] = { error: error.message };
            }
        }
        
        return {
            sample_memory: sampleMemory,
            formatted_results: results
        };
    }
} 