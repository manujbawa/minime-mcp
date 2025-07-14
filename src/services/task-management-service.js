/**
 * Task Management Service
 * Handles creation, completion, and retrieval of tasks
 */

class TaskManagementService {
    constructor(logger, db, memoryService) {
        this.logger = logger;
        this.db = db;
        this.memoryService = memoryService;
    }

    /**
     * Create a new task
     */
    async createTask({ taskDescription, projectName }) {
        if (!taskDescription || !projectName) {
            throw new Error('Task description and project name are required');
        }

        // Store task with memory_status = 'active' (pending)
        const result = await this.memoryService.createMemory({
            content: taskDescription,
            projectName: projectName,
            memoryType: 'task',
            sessionName: 'tasks',
            status: 'active'
        });

        return {
            id: result.id,
            description: taskDescription,
            projectName: projectName
        };
    }

    /**
     * Complete a task
     */
    async completeTask({ taskId }) {
        if (!taskId) {
            throw new Error('Task ID is required');
        }

        // Update task status to completed
        const updateQuery = `
            UPDATE memories 
            SET memory_status = 'completed', 
                updated_at = NOW()
            WHERE id = $1 AND memory_type = 'task'
            RETURNING content, project_id`;

        const result = await this.db.query(updateQuery, [taskId]);

        if (result.rows.length === 0) {
            throw new Error('Task not found');
        }

        return {
            taskId,
            content: result.rows[0].content
        };
    }

    /**
     * Get tasks for a project
     */
    async getTasks({ projectName, includeCompleted = false }) {
        const query = `
            SELECT m.*, p.name as project_name 
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            WHERE m.memory_type = 'task'
            AND p.name = $1
            ${includeCompleted ? '' : "AND m.memory_status = 'active'"}
            ORDER BY 
                CASE m.memory_status 
                    WHEN 'active' THEN 0 
                    ELSE 1 
                END,
                m.created_at DESC`;

        const result = await this.db.query(query, [projectName]);

        return result.rows.map(row => ({
            id: row.id,
            content: row.content,
            status: row.memory_status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }
}

export default TaskManagementService;