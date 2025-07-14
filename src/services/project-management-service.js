/**
 * Project Management Service
 * Handles creation, update, and retrieval of project documents
 */

class ProjectManagementService {
    constructor(logger, db, memoryService) {
        this.logger = logger;
        this.db = db;
        this.memoryService = memoryService;
    }

    /**
     * Create a new project document
     */
    async createDocument({ docType, content, projectName }) {
        if (!docType || !content || !projectName) {
            throw new Error('Document type, content, and project name are required');
        }

        const memoryType = `project_${docType}`;

        // Store as memory with project-specific type
        const result = await this.memoryService.createMemory({
            content: content,
            projectName: projectName,
            memoryType: memoryType,
            sessionName: 'project_docs',
            status: 'active'
        });

        return {
            id: result.id,
            content: content,
            type: docType
        };
    }

    /**
     * Update an existing project document
     */
    async updateDocument({ docId, content }) {
        if (!docId || !content) {
            throw new Error('Document ID and content are required');
        }

        const updateQuery = `
            UPDATE memories 
            SET content = $1,
                updated_at = NOW()
            WHERE id = $2 
            AND memory_type LIKE 'project_%'
            RETURNING memory_type, project_id`;

        const result = await this.db.query(updateQuery, [content, docId]);

        if (result.rows.length === 0) {
            throw new Error('Project document not found');
        }

        const docType = result.rows[0].memory_type.replace('project_', '');
        return { docType, docId };
    }

    /**
     * Get project documents
     */
    async getDocuments({ projectName, docType = null }) {
        const query = `
            SELECT m.*, p.name as project_name 
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            WHERE p.name = $1
            AND m.memory_type LIKE 'project_%'
            ${docType ? "AND m.memory_type = $2" : ''}
            ORDER BY 
                CASE m.memory_type 
                    WHEN 'project_brief' THEN 1
                    WHEN 'project_prd' THEN 2
                    WHEN 'project_plan' THEN 3
                    ELSE 4
                END,
                m.updated_at DESC`;

        const params = docType ? [projectName, `project_${docType}`] : [projectName];
        const result = await this.db.query(query, params);

        return result.rows.map(row => ({
            id: row.id,
            type: row.memory_type.replace('project_', ''),
            content: row.content,
            updatedAt: row.updated_at,
            createdAt: row.created_at
        }));
    }

}

export default ProjectManagementService;