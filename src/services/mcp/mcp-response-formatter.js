/**
 * MCP Response Formatter Service
 * Formats responses for MCP protocol
 * Ensures consistent response structure
 */

export class MCPResponseFormatter {
    constructor(logger) {
        this.logger = logger;
    }

    /**
     * Format a success response
     * MCP SDK compliant format
     */
    success(message, data = null) {
        // Standard MCP response format
        const response = {
            content: [{
                type: "text",
                text: message
            }]
        };

        // Note: MCP SDK doesn't support metadata field
        // Data should be included in the text message if needed

        return response;
    }

    /**
     * Format an error response
     * MCP SDK compliant format
     */
    error(message, error = null) {
        const errorMessage = `❌ ${message}`;
        
        if (error && this.logger) {
            this.logger.error(message, error);
        }

        return {
            content: [{
                type: "text",
                text: error ? `${errorMessage}: ${error.message}` : errorMessage
            }],
            isError: true  // MCP SDK standard error indicator
        };
    }

    /**
     * Format memory storage response
     */
    memoryStored(memoryId, memoryType, project, tags = []) {
        const emoji = this.getMemoryTypeEmoji(memoryType);
        const tagString = tags.length > 0 ? `\n**Tags:** ${tags.join(', ')}` : '';
        
        return this.success(
            `${emoji} Memory #${memoryId} stored successfully!\n**Type:** ${memoryType}\n**Project:** ${project}${tagString}`
        );
    }

    /**
     * Format search results
     */
    searchResults(results, query, searchMode = 'semantic') {
        if (!results || results.length === 0) {
            return this.success(`🔍 No memories found for "${query}"`);
        }

        const header = `# 🔍 Search Results for "${query}"\n**Mode:** ${searchMode} | **Found:** ${results.length} memories\n\n---\n`;
        
        const formatted = results.map((memory, index) => 
            this.formatMemoryResult(memory, index + 1)
        ).join('\n---\n');

        return this.success(header + formatted);
    }

    /**
     * Format a single memory result
     */
    formatMemoryResult(memory, index) {
        const date = new Date(memory.created_at).toLocaleDateString();
        const emoji = this.getMemoryTypeEmoji(memory.memory_type);
        
        let result = `### ${index}. ${emoji} Memory #${memory.id}\n`;
        result += `**Project:** ${memory.project_name} | **Type:** ${memory.memory_type} | **Date:** ${date}\n`;
        
        if (memory.smart_tags && memory.smart_tags.length > 0) {
            result += `**Tags:** ${memory.smart_tags.join(', ')}\n`;
        }
        
        if (memory.similarity_score) {
            result += `**Relevance:** ${Math.round(memory.similarity_score * 100)}%\n`;
        }
        
        result += `\n${memory.content}`;
        
        return result;
    }

    /**
     * Format insights response
     */
    insights(title, sections, metadata = {}) {
        const parts = [`# ${title}`];
        
        if (metadata.project) {
            parts.push(`**Project:** ${metadata.project}`);
        }
        if (metadata.timeRange) {
            parts.push(`**Time Range:** ${metadata.timeRange}`);
        }
        
        parts.push(''); // Empty line
        
        // Add sections
        if (Array.isArray(sections)) {
            parts.push(...sections);
        } else if (typeof sections === 'object') {
            for (const [key, value] of Object.entries(sections)) {
                parts.push(`## ${this.formatSectionTitle(key)}`);
                parts.push(value);
                parts.push(''); // Empty line between sections
            }
        } else {
            parts.push(sections);
        }
        
        return this.success(parts.join('\n'));
    }

    /**
     * Format rules response
     */
    rules(rules, projectName = null) {
        if (!rules || rules.length === 0) {
            return this.success('No rules found. Use `store_rule` to add rules.');
        }

        const header = projectName 
            ? `# 📋 Rules & Constraints for ${projectName}`
            : '# 📋 Rules & Constraints';

        const formatted = rules.map((rule, index) => 
            this.formatRule(rule, index + 1)
        ).join('\n\n---\n\n');

        return this.success(`${header}\n\n${formatted}`);
    }

    /**
     * Format a single rule
     */
    formatRule(rule, index) {
        return `### ${index}. Rule #${rule.id}
**Project:** ${rule.project_name}
**Priority:** ${rule.priority || 'medium'}
**Category:** ${rule.category || 'general'}

${rule.content}`;
    }

    /**
     * Format task list
     */
    tasks(tasks, projectName = null) {
        if (!tasks || tasks.length === 0) {
            return this.success('No tasks found.');
        }

        const header = projectName 
            ? `# ✅ Tasks for ${projectName}`
            : '# ✅ Task List';

        const grouped = this.groupTasksByStatus(tasks);
        const sections = [];

        if (grouped.pending.length > 0) {
            sections.push('## 📌 Pending Tasks');
            sections.push(grouped.pending.map((t, i) => 
                `${i + 1}. ${t.content} (Priority: ${t.priority || 'medium'})`
            ).join('\n'));
        }

        if (grouped.in_progress.length > 0) {
            sections.push('\n## 🔄 In Progress');
            sections.push(grouped.in_progress.map((t, i) => 
                `${i + 1}. ${t.content}`
            ).join('\n'));
        }

        if (grouped.completed.length > 0) {
            sections.push('\n## ✅ Completed');
            sections.push(grouped.completed.map((t, i) => 
                `${i + 1}. ~~${t.content}~~`
            ).join('\n'));
        }

        return this.success(`${header}\n\n${sections.join('\n')}`);
    }

    /**
     * Format thinking sequence response
     */
    thinkingStarted(sequenceId, goal) {
        return this.success(
            `🧠 Started thinking sequence #${sequenceId}\n\n**Goal:** ${goal}\n\nUse \`add_thought\` to continue the thinking process.`
        );
    }

    /**
     * Format thought added response
     */
    thoughtAdded(sequenceId, thoughtType) {
        return this.success(`✅ Added ${thoughtType} to sequence #${sequenceId}`);
    }

    /**
     * Helper: Get emoji for memory type
     */
    getMemoryTypeEmoji(type) {
        const emojis = {
            code: '💻',
            bug: '🐛',
            decision: '🎯',
            rule: '📋',
            progress: '📈',
            project_brief: '📄',
            tech_reference: '📚',
            task: '✅',
            note: '📝',
            general: '💭'
        };
        return emojis[type] || '📌';
    }

    /**
     * Helper: Format section title
     */
    formatSectionTitle(key) {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Helper: Group tasks by status
     */
    groupTasksByStatus(tasks) {
        const grouped = {
            pending: [],
            in_progress: [],
            completed: []
        };

        tasks.forEach(task => {
            const status = task.status || 'pending';
            if (grouped[status]) {
                grouped[status].push(task);
            }
        });

        return grouped;
    }

    /**
     * Format L2 knowledge
     */
    l2Knowledge(knowledge) {
        const sections = [];

        if (knowledge.quick_solutions?.length > 0) {
            sections.push('## 🚀 Quick Solutions');
            sections.push(knowledge.quick_solutions.map(sol => 
                `- **${sol.problem}**: ${sol.solution}`
            ).join('\n'));
        }

        if (knowledge.anti_patterns?.length > 0) {
            sections.push('\n## ⚠️ Anti-Patterns');
            sections.push(knowledge.anti_patterns.map(ap => 
                `- **${ap.pattern}**: ${ap.warning}`
            ).join('\n'));
        }

        if (knowledge.best_practices) {
            sections.push('\n## 📋 Best Practices');
            Object.entries(knowledge.best_practices).forEach(([category, practices]) => {
                sections.push(`\n### ${this.formatSectionTitle(category)}`);
                sections.push(practices.map(p => `- ${p.practice}`).join('\n'));
            });
        }

        return sections.join('\n');
    }

    /**
     * Format task created response
     */
    taskCreated(taskId, description, projectName) {
        return {
            content: [{
                type: "text",
                text: `✅ Task created\n\n**Task:** ${description}\n**ID:** ${taskId}\n\n**View tasks:** \`manage_tasks(action: "get", project_name: "${projectName}")\``
            }]
        };
    }

    /**
     * Format task completed response
     */
    taskCompleted(taskId, projectName) {
        return {
            content: [{
                type: "text",
                text: `✅ Task completed!\n\n**Remaining tasks:** \`manage_tasks(action: "get", project_name: "${projectName}")\``
            }]
        };
    }

    /**
     * Format task list response
     */
    taskList(tasks, projectName) {
        if (tasks.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: `No tasks found for project: ${projectName}\n\n**Create a task:** \`manage_tasks(action: "create", task_description: "...", project_name: "${projectName}")\``
                }]
            };
        }

        const activeTasks = tasks.filter(t => t.status === 'active');
        const completedTasks = tasks.filter(t => t.status === 'completed');
        
        let output = `# 📋 Tasks for ${projectName}\n\n`;
        
        if (activeTasks.length > 0) {
            output += `## ⏳ Active Tasks (${activeTasks.length})\n\n`;
            activeTasks.forEach((task, i) => {
                output += `${i + 1}. **${task.content}**\n   - ID: \`${task.id}\`\n   - Created: ${new Date(task.createdAt).toLocaleDateString()}\n\n`;
            });
        }
        
        if (completedTasks.length > 0) {
            output += `## ✅ Completed (${completedTasks.length})\n\n`;
            completedTasks.forEach((task, i) => {
                output += `${i + 1}. ~~${task.content}~~\n   - Completed: ${new Date(task.updatedAt).toLocaleDateString()}\n\n`;
            });
        }
        
        output += `\n**Actions:**\n- Complete a task: \`manage_tasks(action: "complete", task_id: "...")\`\n- Create new: \`manage_tasks(action: "create", task_description: "...")\``;
        
        return {
            content: [{
                type: "text",
                text: output
            }]
        };
    }

    /**
     * Format project document created response
     */
    projectDocCreated(result) {
        return {
            content: [{
                type: "text",
                text: `✅ Project ${result.type} created!\n\n${result.content}\n\n**Document ID:** ${result.id}\n\n**Next steps:**\n- Update: \`manage_project(action: "update", doc_id: "${result.id}", content: "...")\`\n- View all docs: \`manage_project(action: "get", project_name: "...")\``
            }]
        };
    }

    /**
     * Format project document updated response
     */
    projectDocUpdated(docType, docId, projectName) {
        return {
            content: [{
                type: "text",
                text: `✅ Project ${docType} updated!\n\n**View all docs:** \`manage_project(action: "get", project_name: "${projectName}")\``
            }]
        };
    }

    /**
     * Format project documents list response
     */
    projectDocsList(docs, projectName) {
        if (docs.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: `No project documents found for: ${projectName}\n\n**Create a document:** \`manage_project(action: "create", doc_type: "brief", content: "...", project_name: "${projectName}")\``
                }]
            };
        }

        let output = `# 📁 Project Documents: ${projectName}\n\n`;
        
        const docsByType = {
            brief: docs.filter(d => d.type === 'brief'),
            prd: docs.filter(d => d.type === 'prd'),
            plan: docs.filter(d => d.type === 'plan')
        };
        
        for (const [type, typeDocs] of Object.entries(docsByType)) {
            if (typeDocs.length > 0) {
                output += `## ${type.toUpperCase()}\n\n`;
                typeDocs.forEach(doc => {
                    output += `**ID:** \`${doc.id}\`\n`;
                    output += `**Updated:** ${new Date(doc.updatedAt).toLocaleDateString()}\n\n`;
                    output += `${doc.content.substring(0, 200)}...\n\n---\n\n`;
                });
            }
        }
        
        output += `**Actions:**\n- Update: \`manage_project(action: "update", doc_id: "...", content: "...")\`\n- Create new: \`manage_project(action: "create", doc_type: "...", content: "...")\``;
        
        return {
            content: [{
                type: "text",
                text: output
            }]
        };
    }

    /**
     * Format reasoning started response
     */
    reasoningStarted(sequenceId, goal) {
        return {
            content: [{
                type: "text",
                text: `🧠 Started reasoning process\n\n**Goal:** ${goal}\n**Reasoning ID:** ${sequenceId}\n\n**Add thoughts:** \`add_thought(sequence_id: "${sequenceId}", thought: "...")\`\n\n*Thoughts will be appended and the full reasoning chain returned each time.*`
            }]
        };
    }

    /**
     * Format reasoning updated response
     */
    reasoningUpdated(sequenceId, content, isComplete, branchCreated = false) {
        let statusMessage = '';
        
        if (isComplete) {
            statusMessage = '---\n\n🎯 **SEQUENCE COMPLETED** - This reasoning sequence (#' + sequenceId + ') is now CLOSED.\n\n**This reasoning has been stored as a decision and is now searchable.**\n\n**To start a new reasoning sequence, use:** `start_thinking(goal: "...", project_name: "...")`\n\n⚠️ **WARNING: You cannot add more thoughts to this completed sequence.**';
        } else if (branchCreated) {
            statusMessage = `---\n\n🌿 **BRANCH CREATED** - A new alternative path has been created in the reasoning tree.\n\n**Continue this branch:** \`add_thought(sequence_id: "${sequenceId}", thought: "...")\`\n**Or add another alternative:** \`add_thought(sequence_id: "${sequenceId}", thought: "...", thought_type: "alternative")\``;
        } else {
            statusMessage = `**Continue reasoning:** \`add_thought(sequence_id: "${sequenceId}", thought: "...")\``;
        }
        
        const response = {
            content: [{
                type: "text",
                text: `${content}\n\n${statusMessage}`
            }]
        };
        
        // Add markers for IDE agents
        if (isComplete) {
            response.content.push({
                type: "text",
                text: `[THINKING_SEQUENCE_COMPLETED: ${sequenceId}]`
            });
        } else if (branchCreated) {
            response.content.push({
                type: "text",
                text: `[BRANCH_CREATED: ${sequenceId}]`
            });
        }
        
        return response;
    }
}

export default MCPResponseFormatter;