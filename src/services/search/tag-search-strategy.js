/**
 * Tag Search Strategy
 * Handles tag-only embedding search
 */

export class TagSearchStrategy {
    constructor(logger, databaseService, embeddingService) {
        this.logger = logger;
        this.db = databaseService;
        this.embeddingService = embeddingService;
    }

    /**
     * Search memories using tag embeddings only
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
            // Build SQL query for tag-only search
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
                        (1 - (m.tag_embedding <=> $1::vector)) as tag_similarity,
                        'tags_only' as search_mode,
                        CASE 
                            WHEN m.project_id = $2 THEN 'direct'
                            ELSE 'linked'
                        END as source_type
                        ${includeEmbeddings ? ', m.tag_embedding' : ''}
                    FROM memories m
                    JOIN projects p ON m.project_id = p.id
                    LEFT JOIN sessions s ON m.session_id = s.id
                    WHERE m.project_id IN (SELECT DISTINCT id FROM linked_projects)
                    AND m.tag_embedding IS NOT NULL
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
                        (1 - (m.tag_embedding <=> $1::vector)) as tag_similarity,
                        'tags_only' as search_mode
                        ${includeEmbeddings ? ', m.tag_embedding' : ''}
                    FROM memories m
                    JOIN projects p ON m.project_id = p.id
                    LEFT JOIN sessions s ON m.session_id = s.id
                    WHERE m.tag_embedding IS NOT NULL
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
            sql += ` AND (1 - (m.tag_embedding <=> $1::vector)) >= $${++paramCount}`;
            params.push(threshold);

            // Order by tag similarity and importance
            sql += ` ORDER BY tag_similarity DESC, m.importance_score DESC, m.created_at DESC`;
            sql += ` LIMIT $${++paramCount}`;
            params.push(limit);

            const result = await this.db.query(sql, params);
            
            this.logger.debug(`Tag search found ${result.rows.length} results`);
            
            return result.rows.map(row => ({
                ...row,
                similarity: row.tag_similarity,
                search_scores: {
                    content: null,
                    tags: row.tag_similarity,
                    combined: row.tag_similarity
                },
                ...(row.source_type && { source_type: row.source_type })
            }));

        } catch (error) {
            this.logger.error('Tag search failed:', error);
            throw new Error(`Tag search failed: ${error.message}`);
        }
    }

    /**
     * Search memories by tag text (generates embedding first)
     */
    async search(query, options = {}) {
        try {
            // For tag search, we might want to preprocess the query
            // to extract tag-like terms
            const tagQuery = this._preprocessTagQuery(query);
            const queryEmbedding = await this.embeddingService.generateEmbedding(tagQuery);
            return await this.searchByEmbedding(queryEmbedding, options);
        } catch (error) {
            this.logger.error('Tag search with text query failed:', error);
            throw error;
        }
    }

    /**
     * Search by specific tags
     */
    async searchByTags(tags, options = {}) {
        try {
            // Create a tag-like query from the provided tags
            const tagQuery = Array.isArray(tags) ? tags.join(' ') : tags;
            const queryEmbedding = await this.embeddingService.generateEmbedding(tagQuery);
            return await this.searchByEmbedding(queryEmbedding, options);
        } catch (error) {
            this.logger.error('Tag search by specific tags failed:', error);
            throw error;
        }
    }

    /**
     * Find memories with similar tags to a given memory
     */
    async findSimilarByTags(memoryId, options = {}) {
        try {
            // Get the memory's tag embedding
            const memoryResult = await this.db.query(`
                SELECT tag_embedding, smart_tags 
                FROM memories 
                WHERE id = $1 AND tag_embedding IS NOT NULL
            `, [memoryId]);

            if (memoryResult.rows.length === 0) {
                return [];
            }

            const memory = memoryResult.rows[0];
            const tagEmbedding = JSON.parse(memory.tag_embedding);

            // Search for similar memories, excluding the source memory
            return await this.searchByEmbedding(tagEmbedding, {
                ...options,
                excludeIds: [memoryId]
            });

        } catch (error) {
            this.logger.error('Similar tag search failed:', error);
            throw error;
        }
    }

    /**
     * Get search capability for this strategy
     */
    getSearchCapability() {
        return 'tags_only';
    }

    /**
     * Check if memory is compatible with this search strategy
     */
    isMemoryCompatible(memory) {
        return memory.tag_embedding !== null;
    }

    /**
     * Preprocess query for tag search
     * Extract technical terms, remove common words
     */
    _preprocessTagQuery(query) {
        // Simple preprocessing - could be enhanced with NLP
        const technicalTerms = query.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why'].includes(word));

        return technicalTerms.join(' ');
    }

    /**
     * Get tag statistics for a project
     */
    async getTagStatistics(projectId = null) {
        try {
            let sql = `
                SELECT 
                    unnest(smart_tags) as tag,
                    COUNT(*) as frequency,
                    AVG(importance_score) as avg_importance
                FROM memories m
                WHERE smart_tags IS NOT NULL 
                AND array_length(smart_tags, 1) > 0
                AND tag_embedding IS NOT NULL
            `;

            const params = [];
            if (projectId) {
                sql += ` AND project_id = $1`;
                params.push(projectId);
            }

            sql += `
                GROUP BY tag
                ORDER BY frequency DESC, avg_importance DESC
                LIMIT 50
            `;

            const result = await this.db.query(sql, params);
            return result.rows;

        } catch (error) {
            this.logger.error('Tag statistics query failed:', error);
            return [];
        }
    }
} 