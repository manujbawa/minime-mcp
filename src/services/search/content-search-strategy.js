/**
 * Content Search Strategy
 * Handles content-only embedding search
 */

export class ContentSearchStrategy {
    constructor(logger, databaseService, embeddingService) {
        this.logger = logger;
        this.db = databaseService;
        this.embeddingService = embeddingService;
    }

    /**
     * Search memories using content embeddings only
     */
    async searchByEmbedding(queryEmbedding, options = {}) {
        const {
            projectId = null,
            projectName = null,
            memoryType = null,
            sessionId = null,
            recentOnly = false,
            processingStatus = null,
            importanceMin = null,
            dateFrom = null,
            threshold = 0.7,
            limit = 10,
            includeEmbeddings = false,
            includeLinkedProjects = false,
            linkedProjectDepth = 2
        } = options;

        try {
            // Build SQL query for content-only search
            let sql;
            
            if (includeLinkedProjects && projectId) {
                // Use CTE to get linked projects
                sql = `
                    WITH RECURSIVE linked_projects AS (
                        -- Start with the source project
                        SELECT id, 0 as depth
                        FROM projects
                        WHERE id = $2
                        
                        UNION
                        
                        -- Recursively find linked projects
                        SELECT 
                            CASE 
                                WHEN pr.project_id = lp.id THEN pr.related_project_id
                                ELSE pr.project_id
                            END as id,
                            lp.depth + 1 as depth
                        FROM project_relationships pr
                        JOIN linked_projects lp ON 
                            (pr.project_id = lp.id OR pr.related_project_id = lp.id)
                        WHERE lp.depth < $3
                        AND pr.visibility IN ('full', 'metadata_only')
                    )
                    SELECT 
                        m.id, m.project_id, m.session_id, m.content, m.memory_type,
                        m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata,
                        m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,
                        p.name as project_name,
                        s.session_name,
                        (1 - (m.embedding <=> $1::vector)) as content_similarity,
                        'content_only' as search_mode,
                        CASE 
                            WHEN m.project_id = $2 THEN 'direct'
                            ELSE 'linked'
                        END as source_type
                        ${includeEmbeddings ? ', m.embedding' : ''}
                    FROM memories m
                    JOIN projects p ON m.project_id = p.id
                    LEFT JOIN sessions s ON m.session_id = s.id
                    WHERE m.project_id IN (SELECT DISTINCT id FROM linked_projects)
                    AND m.embedding IS NOT NULL
                    AND m.processing_status NOT IN ('failed', 'failed_permanent')
                `;
            } else {
                sql = `
                    SELECT 
                        m.id, m.project_id, m.session_id, m.content, m.memory_type,
                        m.summary, m.processing_status, m.importance_score, m.smart_tags, m.metadata,
                        m.embedding_model, m.embedding_dimensions, m.created_at, m.updated_at,
                        p.name as project_name,
                        s.session_name,
                        (1 - (m.embedding <=> $1::vector)) as content_similarity,
                        'content_only' as search_mode
                        ${includeEmbeddings ? ', m.embedding' : ''}
                    FROM memories m
                    JOIN projects p ON m.project_id = p.id
                    LEFT JOIN sessions s ON m.session_id = s.id
                    WHERE m.embedding IS NOT NULL
                    AND m.processing_status NOT IN ('failed', 'failed_permanent')
                `;
            }

            const params = [JSON.stringify(queryEmbedding)];
            let paramCount = 1;
            
            // Add linked projects parameters if needed
            if (includeLinkedProjects && projectId) {
                params.push(projectId); // $2
                params.push(linkedProjectDepth); // $3
                paramCount = 3;
            }

            // Apply filters
            if (!includeLinkedProjects) {
                if (projectId) {
                    sql += ` AND m.project_id = $${++paramCount}`;
                    params.push(projectId);
                } else if (projectName) {
                    sql += ` AND p.name = $${++paramCount}`;
                    params.push(projectName);
                }
            }

            if (sessionId) {
                sql += ` AND m.session_id = $${++paramCount}`;
                params.push(sessionId);
            }

            if (memoryType && memoryType !== 'any') {
                sql += ` AND m.memory_type = $${++paramCount}`;
                params.push(memoryType);
            }

            if (processingStatus) {
                sql += ` AND m.processing_status = $${++paramCount}`;
                params.push(processingStatus);
            }

            if (importanceMin) {
                sql += ` AND m.importance_score >= $${++paramCount}`;
                params.push(importanceMin);
            }

            if (dateFrom) {
                sql += ` AND m.created_at >= $${++paramCount}`;
                params.push(dateFrom);
            }

            if (recentOnly) {
                sql += ` AND m.created_at > NOW() - INTERVAL '30 days'`;
            }

            // Apply similarity threshold
            sql += ` AND (1 - (m.embedding <=> $1::vector)) >= $${++paramCount}`;
            params.push(threshold);

            // Order by similarity and importance
            sql += ` ORDER BY content_similarity DESC, m.importance_score DESC, m.created_at DESC`;
            sql += ` LIMIT $${++paramCount}`;
            params.push(limit);

            const result = await this.db.query(sql, params);
            
            this.logger.debug(`Content search found ${result.rows.length} results`);
            
            return result.rows.map(row => ({
                ...row,
                similarity: row.content_similarity,
                search_scores: {
                    content: row.content_similarity,
                    tags: null,
                    combined: row.content_similarity
                },
                ...(row.source_type && { source_type: row.source_type })
            }));

        } catch (error) {
            this.logger.error('Content search failed:', error);
            throw new Error(`Content search failed: ${error.message}`);
        }
    }

    /**
     * Search memories by content text (generates embedding first)
     */
    async search(query, options = {}) {
        try {
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);
            return await this.searchByEmbedding(queryEmbedding, options);
        } catch (error) {
            this.logger.error('Content search with text query failed:', error);
            throw error;
        }
    }

    /**
     * Get search capability for this strategy
     */
    getSearchCapability() {
        return 'content_only';
    }

    /**
     * Check if memory is compatible with this search strategy
     */
    isMemoryCompatible(memory) {
        return memory.embedding !== null;
    }
} 