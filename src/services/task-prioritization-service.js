/**
 * Task Prioritization Service for MiniMe-MCP
 * Handles intelligent task ordering and context-aware prioritization
 */

export class TaskPrioritizationService {
    constructor(logger, databaseService) {
        this.logger = logger;
        this.db = databaseService;
        
        // Default priority weights - can be customized per project
        this.defaultWeights = {
            urgency: 0.3,
            impact: 0.3,
            context_alignment: 0.2,
            dependencies: 0.1,
            due_date: 0.1
        };
        
        // Task context requirements mapping
        this.contextMapping = {
            "feature": [
                "project_brief",      // Understand overall goals
                "requirements",       // Specific requirements
                "architecture",       // System design
                "tech_context"       // Technology constraints
            ],
            "bug": [
                "bug",               // Previous bug reports
                "implementation_notes", // How it was built
                "lessons_learned",   // Past fixes
                "system_patterns"    // Patterns to follow
            ],
            "refactor": [
                "code",              // Current implementation
                "design_decisions",  // Why it was built this way
                "system_patterns",   // Patterns to apply
                "tech_context"       // Technical constraints
            ],
            "optimization": [
                "system_patterns",   // Performance patterns
                "architecture",      // System design
                "implementation_notes", // Current approach
                "lessons_learned"    // Past optimizations
            ],
            "testing": [
                "requirements",      // What needs to be tested
                "implementation_notes", // How it works
                "bug",              // Known issues
                "code"              // Implementation details
            ],
            "documentation": [
                "project_brief",     // Overall context
                "architecture",      // System overview
                "design_decisions",  // Key decisions
                "lessons_learned"    // Important insights
            ]
        };
    }

    /**
     * Get prioritized tasks for a project
     */
    async getPrioritizedTasks(projectName, options = {}) {
        try {
            const weights = { ...this.defaultWeights, ...options.weights };
            const limit = options.limit || 50;
            const includeCompleted = options.includeCompleted || false;

            // Fetch all tasks for the project
            const tasks = await this.fetchTasks(projectName, { 
                limit, 
                includeCompleted 
            });

            if (tasks.length === 0) {
                return [];
            }

            // Calculate composite priority scores
            const scoredTasks = await Promise.all(
                tasks.map(async (task) => {
                    const compositeScore = await this.calculatePriority(task, projectName, weights);
                    return {
                        ...task,
                        composite_score: compositeScore,
                        context_requirements: this.getContextRequirements(task.category)
                    };
                })
            );

            // Sort by priority score, then by preferred sequence
            const sortedTasks = scoredTasks.sort((a, b) => {
                // First by composite score (descending)
                if (b.composite_score !== a.composite_score) {
                    return b.composite_score - a.composite_score;
                }
                
                // Then by creation date (older first for same priority)
                return new Date(a.created_at) - new Date(b.created_at);
            });

            // Apply dependency filtering - move blocked tasks to end
            return this.applyDependencyFiltering(sortedTasks);

        } catch (error) {
            this.logger.error('Error prioritizing tasks:', error);
            throw error;
        }
    }

    /**
     * Calculate composite priority score for a task
     */
    async calculatePriority(task, projectName, weights) {
        let score = 0;

        // 1. Urgency & Impact from task priority
        const urgencyScore = this.getUrgencyScore(task.priority?.urgency);
        const impactScore = this.getImpactScore(task.priority?.impact);
        
        score += urgencyScore * weights.urgency;
        score += impactScore * weights.impact;

        // 2. Context alignment - how much relevant context is available
        const contextScore = await this.calculateContextAlignment(task, projectName);
        score += contextScore * weights.context_alignment;

        // 3. Dependencies - are prerequisites met?
        const dependenciesScore = await this.checkDependencies(task, projectName);
        score += dependenciesScore * weights.dependencies;

        // 4. Due date proximity
        const dueDateScore = this.calculateDueDateScore(task);
        score += dueDateScore * weights.due_date;

        return Math.min(1.0, Math.max(0.0, score)); // Clamp between 0 and 1
    }

    /**
     * Calculate how much relevant context is available for a task
     */
    async calculateContextAlignment(task, projectName) {
        const requiredContextTypes = this.getContextRequirements(task.category);
        
        if (requiredContextTypes.length === 0) {
            return 0.8; // Default score if no specific context needed
        }

        let totalAvailable = 0;
        let totalRequired = requiredContextTypes.length;

        for (const contextType of requiredContextTypes) {
            const hasContext = await this.hasContextOfType(projectName, contextType);
            if (hasContext) {
                totalAvailable++;
            }
        }

        return totalAvailable / totalRequired;
    }

    /**
     * Check if all task dependencies are satisfied
     */
    async checkDependencies(task, projectName) {
        if (!task.dependencies || task.dependencies.length === 0) {
            return 1.0; // No dependencies = ready to go
        }

        const dependencyStatuses = await Promise.all(
            task.dependencies.map(depId => this.getDependencyStatus(depId, projectName))
        );

        const completedDependencies = dependencyStatuses.filter(status => status === 'completed').length;
        return completedDependencies / task.dependencies.length;
    }

    /**
     * Calculate due date urgency score
     */
    calculateDueDateScore(task) {
        if (!task.due_date) {
            return 0.5; // Default score for tasks without due dates
        }

        const now = new Date();
        const dueDate = new Date(task.due_date);
        const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);

        if (daysUntilDue < 0) {
            return 1.0; // Overdue - highest priority
        } else if (daysUntilDue <= 1) {
            return 0.9; // Due within 1 day
        } else if (daysUntilDue <= 3) {
            return 0.7; // Due within 3 days
        } else if (daysUntilDue <= 7) {
            return 0.5; // Due within a week
        } else {
            return 0.3; // Due later
        }
    }

    /**
     * Get context requirements for a task category
     */
    getContextRequirements(category) {
        return this.contextMapping[category] || [];
    }

    /**
     * Apply dependency filtering to move blocked tasks to appropriate positions
     */
    applyDependencyFiltering(tasks) {
        const readyTasks = [];
        const blockedTasks = [];

        for (const task of tasks) {
            if (task.status === 'blocked' || 
                (task.dependencies && task.dependencies.length > 0 && 
                 this.hasUnmetDependencies(task, tasks))) {
                blockedTasks.push(task);
            } else {
                readyTasks.push(task);
            }
        }

        // Return ready tasks first, then blocked tasks
        return [...readyTasks, ...blockedTasks];
    }

    /**
     * HELPER METHODS
     */

    async fetchTasks(projectName, options = {}) {
        const project = await this.getProject(projectName);
        if (!project) {
            return [];
        }

        let query = `
            SELECT 
                m.id as memory_id,
                m.content,
                m.importance_score,
                m.created_at,
                m.tags
            FROM memories m
            WHERE m.project_id = $1 
            AND m.memory_type = 'task'
        `;

        const params = [project.id];

        if (!options.includeCompleted) {
            // Only include pending and in_progress tasks
            query += ` AND (m.content::json->>'status' IN ('pending', 'in_progress'))`;
        }

        query += ` ORDER BY m.created_at DESC LIMIT $2`;
        params.push(options.limit || 50);

        const result = await this.db.query(query, params);
        
        return result.rows.map(row => {
            const taskData = JSON.parse(row.content);
            return {
                ...taskData,
                memory_id: row.memory_id,
                original_priority_score: row.importance_score
            };
        });
    }

    async getProject(projectName) {
        const result = await this.db.query(
            'SELECT id, name FROM projects WHERE name = $1',
            [projectName]
        );
        return result.rows[0] || null;
    }

    async hasContextOfType(projectName, contextType) {
        const project = await this.getProject(projectName);
        if (!project) return false;

        const result = await this.db.query(
            `SELECT COUNT(*) as count FROM memories 
             WHERE project_id = $1 AND memory_type = $2`,
            [project.id, contextType]
        );

        return parseInt(result.rows[0].count) > 0;
    }

    async getDependencyStatus(dependencyId, projectName) {
        // Try to find the dependency task
        const project = await this.getProject(projectName);
        if (!project) return 'unknown';

        const result = await this.db.query(
            `SELECT content FROM memories 
             WHERE project_id = $1 AND memory_type = 'task' 
             AND (content::json->>'id' = $2 OR content::json->>'title' ILIKE $3)`,
            [project.id, dependencyId, `%${dependencyId}%`]
        );

        if (result.rows.length === 0) {
            return 'unknown';
        }

        const taskData = JSON.parse(result.rows[0].content);
        return taskData.status || 'pending';
    }

    hasUnmetDependencies(task, allTasks) {
        if (!task.dependencies || task.dependencies.length === 0) {
            return false;
        }

        const taskMap = new Map();
        allTasks.forEach(t => {
            taskMap.set(t.id, t);
            if (t.title) {
                taskMap.set(t.title, t);
            }
        });

        return task.dependencies.some(depId => {
            const depTask = taskMap.get(depId);
            return !depTask || depTask.status !== 'completed';
        });
    }

    getUrgencyScore(urgency) {
        const scores = {
            'critical': 1.0,
            'high': 0.75,
            'medium': 0.5,
            'low': 0.25
        };
        return scores[urgency] || 0.5;
    }

    getImpactScore(impact) {
        const scores = {
            'high': 1.0,
            'medium': 0.67,
            'low': 0.33
        };
        return scores[impact] || 0.67;
    }

    /**
     * Get next recommended task with context
     */
    async getNextTask(projectName, options = {}) {
        const prioritizedTasks = await this.getPrioritizedTasks(projectName, {
            limit: 10,
            includeCompleted: false,
            ...options
        });

        if (prioritizedTasks.length === 0) {
            return null;
        }

        const nextTask = prioritizedTasks[0];

        // Load context if requested
        if (options.includeContext) {
            const context = await this.loadTaskContext(nextTask, projectName);
            nextTask.loaded_context = context;
        }

        return nextTask;
    }

    /**
     * Load relevant context for a task
     */
    async loadTaskContext(task, projectName) {
        const requiredTypes = this.getContextRequirements(task.category);
        const context = {};

        for (const memType of requiredTypes) {
            context[memType] = await this.getMemoriesOfType(projectName, memType, 3);
        }

        return context;
    }

    async getMemoriesOfType(projectName, memoryType, limit = 3) {
        const project = await this.getProject(projectName);
        if (!project) return [];

        const result = await this.db.query(
            `SELECT content, created_at, importance_score 
             FROM memories 
             WHERE project_id = $1 AND memory_type = $2 
             ORDER BY importance_score DESC, created_at DESC 
             LIMIT $3`,
            [project.id, memoryType, limit]
        );

        return result.rows;
    }
}