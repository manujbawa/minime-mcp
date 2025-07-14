/**
 * PostgreSQL Data Access Layer for MiniMe-MCP
 * Handles all database operations for memories, sequential thinking, and meta-learning
 */

import pkg from 'pg';
const { Pool } = pkg;

export class DatabaseService {
    constructor(logger, config = {}) {
        this.logger = logger;
        this.config = {
            host: config.host || process.env.POSTGRES_HOST || 'localhost',
            port: config.port || process.env.POSTGRES_PORT || 5432,
            database: config.database || process.env.POSTGRES_DB || 'minime_memories',
            user: config.user || process.env.POSTGRES_USER || 'postgres',
            password: config.password || process.env.POSTGRES_PASSWORD || 'password',
            max: config.max || 20,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
            ...config
        };
        
        this.pool = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection and verify schema
     */
    async initialize() {
        try {
            this.logger.info('Initializing database connection...');
            
            this.pool = new Pool(this.config);
            
            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            this.isConnected = true;
            this.logger.info('Database connection established successfully');
            
            // Verify schema and extensions
            await this.verifySchema();
            
            return true;
        } catch (error) {
            this.logger.error('Failed to initialize database:', error);
            throw error;
        }
    }

    /**
     * Verify required database schema and extensions
     */
    async verifySchema() {
        try {
            // Check if pgvector extension is available
            const vectorResult = await this.pool.query(`
                SELECT EXISTS(
                    SELECT 1 FROM pg_extension WHERE extname = 'vector'
                ) as has_vector
            `);
            
            if (!vectorResult.rows[0].has_vector) {
                this.logger.warn('pgvector extension not found - vector operations may fail');
            }

            // Check if core tables exist
            const tablesResult = await this.pool.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('projects', 'sessions', 'memories', 'thinking_sequences', 'thoughts')
            `);
            
            const existingTables = tablesResult.rows.map(row => row.table_name);
            const requiredTables = ['projects', 'sessions', 'memories', 'thinking_sequences', 'thoughts'];
            const missingTables = requiredTables.filter(table => !existingTables.includes(table));
            
            if (missingTables.length > 0) {
                this.logger.warn(`Missing database tables: ${missingTables.join(', ')}`);
                this.logger.info('Please run the database schema initialization');
            } else {
                this.logger.info('Database schema verification passed');
            }
            
        } catch (error) {
            this.logger.error('Schema verification failed:', error);
        }
    }

    /**
     * Execute a query with error handling
     */
    async query(text, params) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        
        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            
            this.logger.debug('Executed query', { 
                query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                duration: `${duration}ms`,
                rows: result.rowCount 
            });
            
            return result;
        } catch (error) {
            this.logger.error('Query execution failed:', {
                query: text.substring(0, 200),
                params: params?.length ? `${params.length} parameters` : 'no parameters',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Execute a transaction
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    // ============================================================================
    // PROJECT MANAGEMENT
    // ============================================================================

    /**
     * Create a new project
     */
    async createProject(nameOrData, description = null, settings = {}) {
        // Support both old signature and new object signature
        let name, desc, sett, created_at;
        
        if (typeof nameOrData === 'object') {
            // New object signature
            ({ name, description: desc, settings: sett, created_at } = nameOrData);
        } else {
            // Old signature
            name = nameOrData;
            desc = description;
            sett = settings;
        }

        try {
            const result = await this.query(`
                INSERT INTO projects (name, description, settings, created_at)
                VALUES ($1, $2, $3, COALESCE($4::timestamp, NOW()))
                RETURNING id, name, description, settings, created_at, updated_at
            `, [name, desc, JSON.stringify(sett || {}), created_at]);
            
            this.logger.info(`Created project: ${name}`, { projectId: result.rows[0].id });
            return result.rows[0];
        } catch (error) {
            // If it's a unique constraint violation on name, that's expected
            if (error.message?.includes('duplicate key') && error.message?.includes('projects_name_unique')) {
                throw new Error(`Project with name '${name}' already exists`);
            }
            // If it's a primary key violation, that's unexpected - log more details
            if (error.message?.includes('duplicate key') && error.message?.includes('projects_pkey')) {
                this.logger.error('Unexpected primary key violation in projects table', {
                    name,
                    error: error.message,
                    detail: error.detail
                });
            }
            throw error;
        }
    }

    /**
     * Get project by name
     */
    async getProjectByName(name) {
        const result = await this.query(`
            SELECT id, name, description, settings, created_at, updated_at
            FROM projects 
            WHERE LOWER(name) = LOWER($1)
        `, [name]);
        
        return result.rows[0] || null;
    }

    /**
     * Get project by ID
     */
    async getProjectById(id) {
        const result = await this.query(`
            SELECT id, name, description, settings, created_at, updated_at
            FROM projects 
            WHERE id = $1
        `, [id]);
        
        return result.rows[0] || null;
    }

    /**
     * List all projects with optional stats
     */
    async listProjects(includeStats = true) {
        if (includeStats) {
            const result = await this.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.settings,
                    p.created_at,
                    p.updated_at,
                    COUNT(DISTINCT s.id) as session_count,
                    COUNT(DISTINCT m.id) as memory_count,
                    COUNT(DISTINCT ts.id) as thinking_sequence_count,
                    MAX(GREATEST(
                        COALESCE(s.updated_at, p.created_at),
                        COALESCE(m.updated_at, p.created_at),
                        COALESCE(ts.updated_at, p.created_at)
                    )) as last_activity
                FROM projects p
                LEFT JOIN sessions s ON p.id = s.project_id
                LEFT JOIN memories m ON p.id = m.project_id
                LEFT JOIN thinking_sequences ts ON p.id = ts.project_id
                GROUP BY p.id, p.name, p.description, p.settings, p.created_at, p.updated_at
                ORDER BY last_activity DESC
            `);
            return result.rows;
        } else {
            const result = await this.query(`
                SELECT id, name, description, settings, created_at, updated_at
                FROM projects
                ORDER BY created_at DESC
            `);
            return result.rows;
        }
    }

    /**
     * Update project
     */
    async updateProject(id, updates) {
        const setClauses = [];
        const values = [];
        let paramCount = 1;

        if (updates.name !== undefined) {
            setClauses.push(`name = $${paramCount++}`);
            values.push(updates.name);
        }
        if (updates.description !== undefined) {
            setClauses.push(`description = $${paramCount++}`);
            values.push(updates.description);
        }
        if (updates.settings !== undefined) {
            setClauses.push(`settings = $${paramCount++}`);
            values.push(JSON.stringify(updates.settings));
        }

        if (setClauses.length === 0) {
            throw new Error('No updates provided');
        }

        values.push(id);
        const result = await this.query(`
            UPDATE projects 
            SET ${setClauses.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount}
            RETURNING id, name, description, settings, created_at, updated_at
        `, values);

        return result.rows[0] || null;
    }

    // ============================================================================
    // SESSION MANAGEMENT
    // ============================================================================

    /**
     * Create a new session
     */
    async createSession(projectIdOrData, sessionName, sessionType = 'mixed', description = null, metadata = {}) {
        // Support both old signature and new object signature
        let project_id, name, type, desc, meta, created_at;
        
        if (typeof projectIdOrData === 'object') {
            // New object signature - safely extract fields
            const data = projectIdOrData;
            project_id = data.project_id;
            name = data.name || data.session_name; // Support both field names
            type = data.sessionType || data.session_type || 'mixed';
            desc = data.description;
            meta = data.metadata || {};
            created_at = data.created_at;
        } else {
            // Old signature
            project_id = projectIdOrData;
            name = sessionName;
            type = sessionType;
            desc = description;
            meta = metadata;
        }

        const result = await this.query(`
            INSERT INTO sessions (project_id, session_name, session_type, description, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, NOW()))
            RETURNING id, project_id, session_name, session_type, description, metadata, is_active, created_at, updated_at
        `, [project_id, name, type || 'mixed', desc, JSON.stringify(meta || {}), created_at]);
        
        this.logger.info(`Created session: ${name}`, { 
            sessionId: result.rows[0].id, 
            projectId: project_id 
        });
        return result.rows[0];
    }

    /**
     * Get session by project and name
     */
    async getSessionByName(projectId, sessionName) {
        const result = await this.query(`
            SELECT id, project_id, session_name, session_type, description, metadata, is_active, created_at, updated_at
            FROM sessions 
            WHERE project_id = $1 AND session_name = $2
        `, [projectId, sessionName]);
        
        return result.rows[0] || null;
    }

    /**
     * List sessions for a project
     */
    async listSessionsForProject(projectId, activeOnly = false) {
        let query = `
            SELECT 
                s.id,
                s.project_id,
                s.session_name,
                s.session_type,
                s.description,
                s.metadata,
                s.is_active,
                s.created_at,
                s.updated_at,
                COUNT(m.id) as memory_count,
                COUNT(ts.id) as thinking_sequence_count
            FROM sessions s
            LEFT JOIN memories m ON s.id = m.session_id
            LEFT JOIN thinking_sequences ts ON s.id = ts.session_id
            WHERE s.project_id = $1
        `;
        
        const params = [projectId];
        
        if (activeOnly) {
            query += ` AND s.is_active = true`;
        }
        
        query += `
            GROUP BY s.id, s.project_id, s.session_name, s.session_type, s.description, s.metadata, s.is_active, s.created_at, s.updated_at
            ORDER BY s.updated_at DESC
        `;
        
        const result = await this.query(query, params);
        return result.rows;
    }

    /**
     * Update session status
     */
    async updateSessionStatus(sessionId, isActive) {
        const result = await this.query(`
            UPDATE sessions 
            SET is_active = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, project_id, session_name, session_type, description, metadata, is_active, created_at, updated_at
        `, [isActive, sessionId]);
        
        return result.rows[0] || null;
    }

    // ============================================================================
    // MEMORY MANAGEMENT
    // ============================================================================

    /**
     * Create a new memory
     */
    async createMemory(projectId, sessionId, content, memoryType = 'general', options = {}) {
        const {
            summary = null,
            embedding = null,
            embeddingModel = 'mxbai-embed-large',
            embeddingDimensions = null,
            importanceScore = 0.5,
            tags = [],
            metadata = {},
            checkDuplicates = true
        } = options;

        // Check for duplicate memory if enabled
        if (checkDuplicates) {
            const duplicateCheck = await this.query(`
                SELECT id, created_at FROM memories 
                WHERE project_id = $1 
                AND memory_type = $2
                AND content = $3
                LIMIT 1
            `, [projectId, memoryType, content]);
            
            if (duplicateCheck.rows.length > 0) {
                this.logger.info(`Duplicate memory detected, returning existing`, { 
                    memoryId: duplicateCheck.rows[0].id, 
                    projectId: projectId,
                    memoryType: memoryType
                });
                // Return existing memory
                return await this.getMemoryById(duplicateCheck.rows[0].id);
            }
        }

        const result = await this.query(`
            INSERT INTO memories 
            (project_id, session_id, content, memory_type, summary, embedding, 
             embedding_model, embedding_dimensions, importance_score, smart_tags, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, project_id, session_id, content, memory_type, summary, 
                      importance_score, smart_tags, metadata, created_at, updated_at
        `, [
            projectId, sessionId, content, memoryType, summary,
            embedding || null,
            embeddingModel,
            embeddingDimensions || (embedding ? embedding.length : null),
            importanceScore, tags, JSON.stringify(metadata)
        ]);
        
        this.logger.info(`Created memory`, { 
            memoryId: result.rows[0].id, 
            projectId: projectId,
            memoryType: memoryType
        });
        return result.rows[0];
    }

    /**
     * Get memory by ID
     */
    async getMemoryById(id) {
        const result = await this.query(`
            SELECT 
                m.id, m.project_id, m.session_id, m.content, m.memory_type, 
                m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata, 
                m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,
                p.name as project_name,
                s.session_name
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            LEFT JOIN sessions s ON m.session_id = s.id
            WHERE m.id = $1
        `, [id]);
        
        return result.rows[0] || null;
    }

    /**
     * Search memories using vector similarity
     */
    async searchMemories(queryEmbedding, options = {}) {
        const {
            projectId = null,
            sessionId = null,
            memoryType = null,
            minSimilarity = 0.7,
            limit = 10,
            includeEmbeddings = false
        } = options;

        let query = `
            SELECT 
                m.id, m.project_id, m.session_id, m.content, m.memory_type,
                m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata,
                m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,
                p.name as project_name,
                s.session_name,
                (1 - (m.embedding <=> $1::vector)) as similarity
                ${includeEmbeddings ? ', m.embedding' : ''}
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            LEFT JOIN sessions s ON m.session_id = s.id
            WHERE m.embedding IS NOT NULL
        `;

        const params = [JSON.stringify(queryEmbedding)];
        let paramCount = 1;

        if (projectId) {
            paramCount++;
            query += ` AND m.project_id = $${paramCount}`;
            params.push(projectId);
        }

        if (sessionId) {
            paramCount++;
            query += ` AND m.session_id = $${paramCount}`;
            params.push(sessionId);
        }

        if (memoryType) {
            paramCount++;
            query += ` AND m.memory_type = $${paramCount}`;
            params.push(memoryType);
        }

        paramCount++;
        query += ` AND (1 - (m.embedding <=> $1::vector)) >= $${paramCount}`;
        params.push(minSimilarity);

        query += ` ORDER BY similarity DESC LIMIT $${paramCount + 1}`;
        params.push(limit);

        const result = await this.query(query, params);
        return result.rows;
    }

    /**
     * List memories for a project or session
     */
    async listMemories(options = {}) {
        const {
            projectId = null,
            sessionId = null,
            memoryType = null,
            limit = 50,
            offset = 0,
            orderBy = 'created_at',
            orderDirection = 'DESC'
        } = options;

        let query = `
            SELECT 
                m.id, m.project_id, m.session_id, m.content, m.memory_type,
                m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata,
                m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,
                p.name as project_name,
                s.session_name
            FROM memories m
            JOIN projects p ON m.project_id = p.id
            LEFT JOIN sessions s ON m.session_id = s.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        if (projectId) {
            paramCount++;
            query += ` AND m.project_id = $${paramCount}`;
            params.push(projectId);
        }

        if (sessionId) {
            paramCount++;
            query += ` AND m.session_id = $${paramCount}`;
            params.push(sessionId);
        }

        if (memoryType) {
            paramCount++;
            query += ` AND m.memory_type = $${paramCount}`;
            params.push(memoryType);
        }

        // Validate orderBy to prevent SQL injection
        const validOrderBy = ['created_at', 'updated_at', 'importance_score', 'memory_type'];
        const safeOrderBy = validOrderBy.includes(orderBy) ? orderBy : 'created_at';
        const safeDirection = orderDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY m.${safeOrderBy} ${safeDirection}`;
        
        if (limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            params.push(limit);
        }
        
        if (offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            params.push(offset);
        }

        const result = await this.query(query, params);
        return result.rows;
    }

    /**
     * Update memory
     */
    async updateMemory(id, updates) {
        const setClauses = [];
        const values = [];
        let paramCount = 1;

        const allowedUpdates = ['content', 'memory_type', 'summary', 'importance_score', 'smart_tags', 'metadata'];
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedUpdates.includes(key)) {
                setClauses.push(`${key} = $${paramCount++}`);
                if (key === 'smart_tags' && Array.isArray(value)) {
                    values.push(value);
                } else if (key === 'metadata' && typeof value === 'object') {
                    values.push(JSON.stringify(value));
                } else {
                    values.push(value);
                }
            }
        }

        if (setClauses.length === 0) {
            throw new Error('No valid updates provided');
        }

        values.push(id);
        const result = await this.query(`
            UPDATE memories 
            SET ${setClauses.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount}
            RETURNING id, project_id, session_id, content, memory_type, summary, 
                      processing_status, importance_score, smart_tags, metadata, created_at, updated_at
        `, values);

        return result.rows[0] || null;
    }

    /**
     * Delete memory
     */
    async deleteMemory(id) {
        const result = await this.query(`
            DELETE FROM memories 
            WHERE id = $1
            RETURNING id
        `, [id]);
        
        return result.rowCount > 0;
    }

    /**
     * Store memory - alias for createMemory with different signature
     */
    async storeMemory(memoryData) {
        const {
            project_id,
            session_id,
            content,
            memory_type = 'note',
            importance_score = 0.5,
            tags = [],
            metadata = {},
            processing_status = 'pending',
            memory_status = 'active',
            thinking_sequence_id = null
        } = memoryData;

        const result = await this.query(`
            INSERT INTO memories (
                project_id, session_id, content, memory_type, 
                importance_score, smart_tags, metadata, processing_status,
                memory_status, thinking_sequence_id, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *
        `, [
            project_id,
            session_id,
            content,
            memory_type,
            importance_score,
            tags, // smart_tags is already an array type, no need to stringify
            JSON.stringify(metadata),
            processing_status,
            memory_status,
            thinking_sequence_id
        ]);

        this.logger.info(`Stored memory: ${result.rows[0].id}`, { 
            projectId: project_id,
            memoryType: memory_type 
        });
        
        return result.rows[0];
    }

    /**
     * Find memory by content hash
     */
    async findMemoryByHash(contentHash, projectId) {
        // Since we don't have a hash column, we'll use content comparison
        // In production, you might want to add a content_hash column for efficiency
        const result = await this.query(`
            SELECT * FROM memories 
            WHERE project_id = $1 
            AND md5(content) = $2
            LIMIT 1
        `, [projectId, contentHash]);

        return result.rows[0] || null;
    }

    /**
     * Get memory statistics for a project
     */
    async getMemoryStats(projectName = null) {
        let sql = `
            SELECT 
                COUNT(*) as total_memories,
                COUNT(CASE WHEN m.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_memories,
                COUNT(CASE WHEN m.processing_status = 'ready' THEN 1 END) as processed_memories,
                COUNT(CASE WHEN m.processing_status = 'pending' THEN 1 END) as pending_memories,
                COUNT(DISTINCT m.memory_type) as unique_types,
                AVG(m.importance_score) as avg_importance,
                MIN(m.created_at) as oldest_memory,
                MAX(m.created_at) as newest_memory
            FROM memories m
        `;

        const params = [];
        
        if (projectName) {
            sql += ` JOIN projects p ON m.project_id = p.id WHERE p.name = $1`;
            params.push(projectName);
        }

        const result = await this.query(sql, params);
        const stats = result.rows[0];

        // Convert counts to numbers
        Object.keys(stats).forEach(key => {
            if (key.includes('_memories') || key.includes('_types') || key === 'total_memories') {
                stats[key] = parseInt(stats[key]) || 0;
            }
            if (key === 'avg_importance') {
                stats[key] = parseFloat(stats[key]) || 0;
            }
        });

        return stats;
    }

    // ============================================================================
    // SEQUENTIAL THINKING MANAGEMENT
    // ============================================================================

    /**
     * Create a new thinking sequence
     */
    async createThinkingSequence(projectId, sessionId, sequenceName, options = {}) {
        const {
            description = null,
            goal = null,
            metadata = {}
        } = options;

        const result = await this.query(`
            INSERT INTO thinking_sequences 
            (project_id, session_id, sequence_name, description, goal, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, project_id, session_id, sequence_name, description, goal, 
                      is_complete, completion_summary, metadata, created_at, updated_at
        `, [projectId, sessionId, sequenceName, description, goal, JSON.stringify(metadata)]);
        
        this.logger.info(`Created thinking sequence: ${sequenceName}`, { 
            sequenceId: result.rows[0].id, 
            projectId: projectId 
        });
        return result.rows[0];
    }

    /**
     * Add a thought to a sequence
     */
    async addThought(sequenceId, content, thoughtNumber, totalThoughts, options = {}) {
        const {
            thoughtType = 'reasoning',
            confidenceLevel = 0.5,
            nextThoughtNeeded = true,
            isRevision = false,
            revisesThoughtId = null,
            branchFromThoughtId = null,
            branchId = null,
            metadata = {}
        } = options;

        const result = await this.query(`
            INSERT INTO thoughts 
            (sequence_id, thought_number, total_thoughts, content, thought_type, 
             confidence_level, next_thought_needed, is_revision, revises_thought_id, 
             branch_from_thought_id, branch_id, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id, sequence_id, thought_number, total_thoughts, content, 
                      thought_type, confidence_level, next_thought_needed, is_revision,
                      revises_thought_id, branch_from_thought_id, branch_id, metadata, created_at
        `, [
            sequenceId, thoughtNumber, totalThoughts, content, thoughtType,
            confidenceLevel, nextThoughtNeeded, isRevision, revisesThoughtId,
            branchFromThoughtId, branchId, JSON.stringify(metadata)
        ]);
        
        this.logger.debug(`Added thought ${thoughtNumber}/${totalThoughts}`, { 
            thoughtId: result.rows[0].id,
            sequenceId: sequenceId 
        });
        return result.rows[0];
    }

    /**
     * Get thinking sequence with thoughts
     */
    async getThinkingSequence(sequenceId, includeBranches = false) {
        // Get sequence info
        const sequenceResult = await this.query(`
            SELECT 
                ts.id, ts.project_id, ts.session_id, ts.sequence_name, 
                ts.description, ts.goal, ts.is_complete, ts.completion_summary,
                ts.metadata, ts.created_at, ts.updated_at,
                p.name as project_name,
                s.session_name
            FROM thinking_sequences ts
            JOIN projects p ON ts.project_id = p.id
            LEFT JOIN sessions s ON ts.session_id = s.id
            WHERE ts.id = $1
        `, [sequenceId]);

        if (sequenceResult.rows.length === 0) {
            return null;
        }

        const sequence = sequenceResult.rows[0];

        // Get thoughts
        let thoughtsQuery = `
            SELECT 
                id, sequence_id, thought_number, total_thoughts, content, 
                thought_type, confidence_level, next_thought_needed, is_revision,
                revises_thought_id, branch_from_thought_id, branch_id, metadata, created_at
            FROM thoughts 
            WHERE sequence_id = $1
        `;

        if (!includeBranches) {
            thoughtsQuery += ` AND (branch_id IS NULL OR branch_id = 'main')`;
        }

        thoughtsQuery += ` ORDER BY thought_number ASC`;

        const thoughtsResult = await this.query(thoughtsQuery, [sequenceId]);
        sequence.thoughts = thoughtsResult.rows;

        if (includeBranches) {
            // Get branch information
            const branchesResult = await this.query(`
                SELECT 
                    id, sequence_id, branch_id, branch_name, branch_from_thought_id,
                    description, rationale, is_active, is_merged, merge_summary, created_at
                FROM thinking_branches 
                WHERE sequence_id = $1
                ORDER BY created_at ASC
            `, [sequenceId]);
            sequence.branches = branchesResult.rows;
        }

        return sequence;
    }

    /**
     * Complete a thinking sequence
     */
    async completeThinkingSequence(sequenceId, completionSummary) {
        const result = await this.query(`
            UPDATE thinking_sequences 
            SET is_complete = true, completion_summary = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING id, project_id, session_id, sequence_name, description, goal, 
                      is_complete, completion_summary, metadata, created_at, updated_at
        `, [completionSummary, sequenceId]);

        return result.rows[0] || null;
    }

    /**
     * List thinking sequences for a project
     */
    async listThinkingSequences(projectId, includeCompleted = true) {
        let query = `
            SELECT 
                ts.id, ts.project_id, ts.session_id, ts.sequence_name, 
                ts.description, ts.goal, ts.is_complete, ts.completion_summary,
                ts.metadata, ts.created_at, ts.updated_at,
                p.name as project_name,
                s.session_name,
                COUNT(t.id) as thought_count,
                MAX(t.thought_number) as latest_thought_number
            FROM thinking_sequences ts
            JOIN projects p ON ts.project_id = p.id
            LEFT JOIN sessions s ON ts.session_id = s.id
            LEFT JOIN thoughts t ON ts.id = t.sequence_id
            WHERE ts.project_id = $1
        `;

        const params = [projectId];

        if (!includeCompleted) {
            query += ` AND ts.is_complete = false`;
        }

        query += `
            GROUP BY ts.id, ts.project_id, ts.session_id, ts.sequence_name, 
                     ts.description, ts.goal, ts.is_complete, ts.completion_summary,
                     ts.metadata, ts.created_at, ts.updated_at, p.name, s.session_name
            ORDER BY ts.updated_at DESC
        `;

        const result = await this.query(query, params);
        return result.rows;
    }

    // ============================================================================
    // UTILITY METHODS
    // ============================================================================

    /**
     * Get database statistics
     */
    async getStats() {
        const stats = {};

        // Project stats
        const projectStats = await this.query(`
            SELECT COUNT(*) as total_projects FROM projects
        `);
        stats.projects = parseInt(projectStats.rows[0].total_projects);

        // Memory stats
        const memoryStats = await this.query(`
            SELECT 
                COUNT(*) as total_memories,
                COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as memories_with_embeddings,
                AVG(importance_score) as avg_importance,
                COUNT(DISTINCT memory_type) as unique_memory_types
            FROM memories
        `);
        stats.memories = memoryStats.rows[0];
        stats.memories.avg_importance = parseFloat(stats.memories.avg_importance || 0);

        // Thinking stats
        const thinkingStats = await this.query(`
            SELECT 
                COUNT(DISTINCT ts.id) as total_sequences,
                COUNT(DISTINCT ts.id) FILTER (WHERE ts.is_complete = false) as active_sequences,
                COUNT(t.id) as total_thoughts
            FROM thinking_sequences ts
            LEFT JOIN thoughts t ON ts.id = t.sequence_id
        `);
        stats.thinking = thinkingStats.rows[0];

        return stats;
    }

    /**
     * Clean up old data
     */
    async cleanup(options = {}) {
        const {
            deleteOldMemories = false,
            memoryRetentionDays = 365,
            deleteCompletedSequences = false,
            sequenceRetentionDays = 90
        } = options;

        let deletedCount = 0;

        if (deleteOldMemories) {
            const result = await this.query(`
                DELETE FROM memories 
                WHERE created_at < NOW() - INTERVAL '${memoryRetentionDays} days'
                AND importance_score < 0.3
            `);
            deletedCount += result.rowCount;
            this.logger.info(`Cleaned up ${result.rowCount} old low-importance memories`);
        }

        if (deleteCompletedSequences) {
            const result = await this.query(`
                DELETE FROM thinking_sequences 
                WHERE is_complete = true 
                AND updated_at < NOW() - INTERVAL '${sequenceRetentionDays} days'
            `);
            deletedCount += result.rowCount;
            this.logger.info(`Cleaned up ${result.rowCount} old completed thinking sequences`);
        }

        return deletedCount;
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.pool) {
            await this.pool.end();
            this.isConnected = false;
            this.logger.info('Database connection closed');
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const result = await this.query('SELECT NOW() as current_time');
            return {
                status: 'healthy',
                timestamp: result.rows[0].current_time,
                connected: this.isConnected
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                connected: false
            };
        }
    }

    /**
     * Data Administration - Delete project memories only
     */
    async deleteProjectMemories(projectId) {
        try {
            const result = await this.query(`
                DELETE FROM memories 
                WHERE project_id = $1
            `, [projectId]);
            
            this.logger.info(`Deleted ${result.rowCount} memories from project ${projectId}`);
            return result.rowCount;
        } catch (error) {
            this.logger.error('Failed to delete project memories:', error);
            throw error;
        }
    }

    /**
     * Data Administration - Delete entire project and all associated data
     */
    async deleteProject(projectId) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Count what we're about to delete
            const memoriesCount = await client.query(
                'SELECT COUNT(*) FROM memories WHERE project_id = $1', 
                [projectId]
            );
            const sessionsCount = await client.query(
                'SELECT COUNT(*) FROM sessions WHERE project_id = $1', 
                [projectId]
            );
            const sequencesResult = await client.query(`
                SELECT COUNT(*) FROM thinking_sequences 
                WHERE session_id IN (SELECT id FROM sessions WHERE project_id = $1)
            `, [projectId]);
            const thoughtsResult = await client.query(`
                SELECT COUNT(*) FROM thoughts 
                WHERE sequence_id IN (
                    SELECT ts.id FROM thinking_sequences ts 
                    JOIN sessions s ON ts.session_id = s.id 
                    WHERE s.project_id = $1
                )
            `, [projectId]);

            // Delete in correct order (respecting foreign keys)
            // 1. Delete thoughts first
            await client.query(`
                DELETE FROM thoughts 
                WHERE sequence_id IN (
                    SELECT ts.id FROM thinking_sequences ts 
                    JOIN sessions s ON ts.session_id = s.id 
                    WHERE s.project_id = $1
                )
            `, [projectId]);

            // 2. Delete thinking sequences
            await client.query(`
                DELETE FROM thinking_sequences 
                WHERE session_id IN (SELECT id FROM sessions WHERE project_id = $1)
            `, [projectId]);

            // 3. Delete memories
            await client.query(
                'DELETE FROM memories WHERE project_id = $1', 
                [projectId]
            );

            // 4. Delete sessions
            await client.query(
                'DELETE FROM sessions WHERE project_id = $1', 
                [projectId]
            );

            // 5. Delete project
            await client.query(
                'DELETE FROM projects WHERE id = $1', 
                [projectId]
            );

            await client.query('COMMIT');

            const stats = {
                projects: 1,
                memories: parseInt(memoriesCount.rows[0].count),
                sessions: parseInt(sessionsCount.rows[0].count),
                sequences: parseInt(sequencesResult.rows[0].count),
                thoughts: parseInt(thoughtsResult.rows[0].count)
            };

            this.logger.info(`Deleted project ${projectId} and all associated data:`, stats);
            return stats;

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to delete project:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Data Administration - Delete all meta-learning data
     */
    async deleteAllLearnings() {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Count what we're about to delete
            const patternsResult = await client.query('SELECT COUNT(*) FROM pattern_library_v2');
            const insightsResult = await client.query('SELECT COUNT(*) FROM unified_insights_v2');

            // Delete all meta-learning data
            await client.query('DELETE FROM pattern_library_v2');
            await client.query('DELETE FROM unified_insights_v2');

            await client.query('COMMIT');

            const stats = {
                patterns: parseInt(patternsResult.rows[0].count),
                insights: parseInt(insightsResult.rows[0].count)
            };

            this.logger.info('Deleted all meta-learning data:', stats);
            return stats;

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to delete learnings:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Data Administration - Delete ALL user data
     */
    async deleteAllData() {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Count everything we're about to delete
            const [
                projectsResult,
                memoriesResult,
                sessionsResult,
                sequencesResult,
                thoughtsResult,
                patternsResult,
                insightsResult
            ] = await Promise.all([
                client.query('SELECT COUNT(*) FROM projects'),
                client.query('SELECT COUNT(*) FROM memories'),
                client.query('SELECT COUNT(*) FROM sessions'),
                client.query('SELECT COUNT(*) FROM thinking_sequences'),
                client.query('SELECT COUNT(*) FROM thoughts'),
                client.query('SELECT COUNT(*) FROM pattern_library_v2'),
                client.query('SELECT COUNT(*) FROM unified_insights_v2')
            ]);

            // Delete ALL user data in correct order (preserve system reference data)
            await client.query('DELETE FROM thoughts');
            await client.query('DELETE FROM thinking_sequences');
            await client.query('DELETE FROM memories');
            await client.query('DELETE FROM sessions');
            await client.query('DELETE FROM projects');
            await client.query('DELETE FROM pattern_library_v2');
            await client.query('DELETE FROM unified_insights_v2');
            
            // NOTE: embedding_models table is preserved as it contains essential system configuration

            await client.query('COMMIT');

            const stats = {
                projects: parseInt(projectsResult.rows[0].count),
                memories: parseInt(memoriesResult.rows[0].count),
                sessions: parseInt(sessionsResult.rows[0].count),
                sequences: parseInt(sequencesResult.rows[0].count),
                thoughts: parseInt(thoughtsResult.rows[0].count),
                patterns: parseInt(patternsResult.rows[0].count),
                insights: parseInt(insightsResult.rows[0].count)
            };

            this.logger.warn('DELETED ALL USER DATA:', stats);
            return stats;

        } catch (error) {
            await client.query('ROLLBACK');
            this.logger.error('Failed to delete all data:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Get a database client from the pool
     */
    async getClient() {
        if (!this.pool) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return await this.pool.connect();
    }

    // ============================================================================
    // TASK MANAGEMENT METHODS (CONSOLIDATED TO TASK-TYPE MEMORIES)
    // ============================================================================

    // Get task-type memories for a project with filtering options
    async getTasksForProject(projectId, options = {}) {
        const client = await this.getClient();
        try {
            let query = `
                SELECT 
                    id, project_id, session_id, content, metadata, 
                    created_at, updated_at, importance_score, smart_tags
                FROM memories 
                WHERE project_id = $1 AND memory_type = 'task'
            `;
            
            const params = [projectId];
            let paramIndex = 2;

            // Add status filter using metadata
            if (options.status) {
                query += ` AND metadata->>'status' = $${paramIndex}`;
                params.push(options.status);
                paramIndex++;
            }

            // Add type filter using metadata
            if (options.type) {
                query += ` AND metadata->>'task_type' = $${paramIndex}`;
                params.push(options.type);
                paramIndex++;
            }

            // Add ordering - prioritize by importance_score and creation date
            query += ` ORDER BY `;
            if (options.status === 'completed') {
                query += `(metadata->>'completed_at') DESC NULLS LAST`;
            } else {
                query += `
                    CASE 
                        WHEN metadata->>'priority' = 'critical' THEN 1 
                        WHEN metadata->>'priority' = 'high' THEN 2 
                        WHEN metadata->>'priority' = 'medium' THEN 3 
                        ELSE 4 
                    END, 
                    created_at DESC
                `;
            }

            // Add limit and offset
            if (options.limit) {
                query += ` LIMIT $${paramIndex}`;
                params.push(options.limit);
                paramIndex++;
            }

            if (options.offset) {
                query += ` OFFSET $${paramIndex}`;
                params.push(options.offset);
            }

            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    }

    // Get task statistics for a project using task-type memories
    async getTaskStats(projectId) {
        const client = await this.getClient();
        try {
            const result = await client.query(`
                SELECT 
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN metadata->>'status' = 'pending' THEN 1 END) as pending_tasks,
                    COUNT(CASE WHEN metadata->>'status' = 'in_progress' THEN 1 END) as in_progress_tasks,
                    COUNT(CASE WHEN metadata->>'status' = 'completed' THEN 1 END) as completed_tasks,
                    COUNT(CASE WHEN metadata->>'status' = 'cancelled' THEN 1 END) as cancelled_tasks,
                    COUNT(CASE WHEN metadata->>'task_type' = 'defect' THEN 1 END) as defects,
                    COUNT(CASE WHEN metadata->>'task_type' = 'feature' THEN 1 END) as features,
                    COUNT(CASE WHEN metadata->>'priority' = 'critical' THEN 1 END) as critical_tasks,
                    COUNT(CASE WHEN metadata->>'priority' = 'high' THEN 1 END) as high_priority_tasks
                FROM memories
                WHERE project_id = $1 AND memory_type = 'task'
            `, [projectId]);

            return result.rows[0];
        } finally {
            client.release();
        }
    }

    // Get all task-type memories across projects (for global views)
    async getAllTasks(options = {}) {
        const client = await this.getClient();
        try {
            let query = `
                SELECT 
                    m.id, m.project_id, m.content, m.metadata, m.created_at, 
                    m.updated_at, m.importance_score, m.smart_tags,
                    p.name as project_name
                FROM memories m
                JOIN projects p ON m.project_id = p.id
                WHERE m.memory_type = 'task'
            `;

            const params = [];
            let paramIndex = 1;
            const conditions = [];

            // Add status filter
            if (options.status) {
                conditions.push(`m.metadata->>'status' = $${paramIndex}`);
                params.push(options.status);
                paramIndex++;
            }

            // Add type filter
            if (options.type) {
                conditions.push(`m.metadata->>'task_type' = $${paramIndex}`);
                params.push(options.type);
                paramIndex++;
            }

            if (conditions.length > 0) {
                query += ' AND ' + conditions.join(' AND ');
            }

            // Add ordering
            query += ` ORDER BY `;
            if (options.status === 'completed') {
                query += `(m.metadata->>'completed_at') DESC NULLS LAST`;
            } else {
                query += `
                    CASE 
                        WHEN m.metadata->>'priority' = 'critical' THEN 1 
                        WHEN m.metadata->>'priority' = 'high' THEN 2 
                        WHEN m.metadata->>'priority' = 'medium' THEN 3 
                        ELSE 4 
                    END, 
                    m.created_at DESC
                `;
            }

            // Add limit
            if (options.limit) {
                query += ` LIMIT $${paramIndex}`;
                params.push(options.limit);
            }

            const result = await client.query(query, params);
            return result.rows;
        } finally {
            client.release();
        }
    }
}

export default DatabaseService;