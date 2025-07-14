/**
 * Memory Search Service
 * Unified service for all memory search operations across UI, MCP, and API
 * Consolidates vector similarity search, filtering, and formatting
 */

import { HybridSearchEngine } from '../search/hybrid-search-engine.js';

export class MemorySearchService {
    constructor(logger, databaseService, embeddingService, configService = null) {
        this.logger = logger;
        this.db = databaseService;
        this.embeddingService = embeddingService;
        this.configService = configService;
        
        // Initialize hybrid search engine
        this.hybridSearch = new HybridSearchEngine(logger, databaseService, embeddingService, configService);
        
        // Default search configuration
        this.defaultConfig = {
            minSimilarity: 0.7,
            maxResults: 10,
            includeEmbeddings: false,
            excludeFailedProcessing: true,
            enableHybridSearch: true
        };
    }

    /**
     * Main search method - supports both text queries and direct embedding search
     */
    async search(query, options = {}) {
        const {
            // Search parameters
            projectName = null,
            projectId = null,
            memoryType = null,
            sessionId = null,
            recentOnly = false,
            
            // Filtering
            processingStatus = null,
            importanceMin = null,
            dateFrom = null,
            
            // Result options
            limit = this.defaultConfig.maxResults,
            threshold = this.defaultConfig.minSimilarity,
            includeEmbeddings = this.defaultConfig.includeEmbeddings,
            excludeFailedProcessing = this.defaultConfig.excludeFailedProcessing,
            
            // Hybrid search options
            searchMode = 'hybrid', // 'hybrid', 'content_only', 'tags_only'
            contentWeight = 0.7,
            tagWeight = 0.3,
            enableOverlapBoost = true,
            enableDiversity = false,
            
            // Formatting
            format = 'raw', // 'raw', 'markdown', 'summary'
            maxContentLength = null
        } = options;

        try {
            // Validate query
            if (typeof query !== 'string' && !Array.isArray(query)) {
                throw new Error('Query must be a string or embedding array');
            }

            // Get project ID if project name provided
            let resolvedProjectId = projectId;
            if (projectName && !projectId) {
                const project = await this.db.getProjectByName(projectName);
                if (!project) {
                    return {
                        results: [],
                        query: typeof query === 'string' ? query : '[embedding]',
                        total: 0,
                        search_mode: searchMode,
                        options
                    };
                }
                resolvedProjectId = project.id;
            }

            // Prepare search options for hybrid engine
            const searchOptions = {
                projectId: resolvedProjectId,
                projectName,
                memoryType,
                sessionId,
                recentOnly,
                processingStatus,
                importanceMin,
                dateFrom,
                threshold,
                limit,
                includeEmbeddings,
                excludeFailedProcessing,
                searchMode,
                contentWeight,
                tagWeight,
                enableOverlapBoost,
                enableDiversity
            };

            // Use hybrid search engine or fallback to legacy search
            let results;
            if (this.defaultConfig.enableHybridSearch && this.hybridSearch) {
                if (typeof query === 'string') {
                    results = await this.hybridSearch.search(query, searchOptions);
                } else {
                    // For direct embedding queries, use content-only search
                    results = await this.hybridSearch.search('', {
                        ...searchOptions,
                        searchMode: 'content_only'
                    });
                }
            } else {
                // Fallback to legacy vector search
                let queryEmbedding;
                if (typeof query === 'string') {
                    queryEmbedding = await this.embeddingService.generateEmbedding(query);
                } else {
                    queryEmbedding = query;
                }
                
                results = await this._executeVectorSearch(queryEmbedding, searchOptions);
            }

            // Format results
            const formattedResults = await this._formatResults(results, {
                format,
                maxContentLength,
                query: typeof query === 'string' ? query : null
            });

            return {
                results: formattedResults,
                query: typeof query === 'string' ? query : '[embedding]',
                total: results.length,
                search_mode: searchMode,
                search_capabilities: results.length > 0 ? results[0].search_mode : null,
                options
            };

        } catch (error) {
            this.logger.error('Memory search failed:', error);
            throw new Error(`Memory search failed: ${error.message}`);
        }
    }

    /**
     * Search similar memories (legacy compatibility)
     */
    async searchSimilar(query, limit = 10, threshold = 0.7, projectName = null, options = {}) {
        return this.search(query, {
            projectName,
            limit,
            threshold,
            format: 'raw',
            ...options
        });
    }

    /**
     * Execute vector similarity search with comprehensive filtering
     */
    async _executeVectorSearch(queryEmbedding, options) {
        const {
            projectId,
            memoryType,
            sessionId,
            recentOnly,
            processingStatus,
            importanceMin,
            dateFrom,
            limit,
            threshold,
            includeEmbeddings,
            excludeFailedProcessing
        } = options;

        // Build SQL query
        let sql = `
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

        // Apply filters
        if (projectId) {
            sql += ` AND m.project_id = $${++paramCount}`;
            params.push(projectId);
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
        } else if (excludeFailedProcessing) {
            sql += ` AND m.processing_status NOT IN ('failed', 'failed_permanent')`;
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

        // Apply similarity threshold and ordering
        sql += ` AND (1 - (m.embedding <=> $1::vector)) >= $${++paramCount}`;
        params.push(threshold);

        sql += ` ORDER BY similarity DESC, m.importance_score DESC, m.created_at DESC`;
        sql += ` LIMIT $${++paramCount}`;
        params.push(limit);

        const result = await this.db.query(sql, params);
        return result.rows;
    }

    /**
     * Format search results based on requested format
     */
    async _formatResults(results, options = {}) {
        const { format = 'raw', maxContentLength, query } = options;

        switch (format) {
            case 'markdown':
                return this._formatAsMarkdown(results, { maxContentLength, query });
            
            case 'summary':
                return this._formatAsSummary(results, { maxContentLength });
            
            case 'mcp':
                return this._formatForMCP(results, { maxContentLength, query });
            
            case 'raw':
            default:
                return results;
        }
    }

    /**
     * Format results as rich markdown (for MCP tools)
     */
    _formatForMCP(results, { maxContentLength = 500, query }) {
        if (results.length === 0) {
            return {
                content: [{
                    type: "text",
                    text: `🔍 No memories found${query ? ` for "${query}"` : ''}`
                }]
            };
        }

        const formatted = results.map((row, i) => {
            const similarity = (row.similarity * 100).toFixed(1);
            
            // Summary (up to maxContentLength chars)
            const summary = row.summary ? 
                (row.summary.length > maxContentLength ? 
                    row.summary.substring(0, maxContentLength) + '...' : 
                    row.summary) : 
                null;
            
            // Content preview (up to maxContentLength chars)
            const contentPreview = row.content.length > maxContentLength ? 
                row.content.substring(0, maxContentLength) + '...' : row.content;
            
            let result = `### ${i + 1}. Memory #${row.id} (${similarity}% match)
**Project:** ${row.project_name} | **Type:** ${row.memory_type}`;

            if (row.smart_tags?.length > 0) {
                result += `\n**Tags:** ${row.smart_tags.map(t => `\`${t}\``).join(' ')}`;
            }

            if (summary) {
                result += `\n\n**Summary:** ${summary}`;
            }
            
            result += `\n\n**Content:**\n${contentPreview}`;
            
            return result;
        }).join('\n\n---\n\n');

        return {
            content: [{
                type: "text",
                text: `🔍 Found ${results.length} memories${query ? ` for "${query}"` : ''}\n\n${formatted}`
            }]
        };
    }

    /**
     * Format results as markdown text
     */
    _formatAsMarkdown(results, { maxContentLength = 500, query }) {
        if (results.length === 0) {
            return `No memories found${query ? ` for "${query}"` : ''}.`;
        }

        const formatted = results.map((row, i) => {
            const similarity = (row.similarity * 100).toFixed(1);
            const contentPreview = maxContentLength && row.content.length > maxContentLength ? 
                row.content.substring(0, maxContentLength) + '...' : row.content;
            
            return `## ${i + 1}. ${row.memory_type} (${similarity}% match)
**Project:** ${row.project_name}
**Created:** ${new Date(row.created_at).toLocaleDateString()}

${contentPreview}`;
        }).join('\n\n---\n\n');

        return `# Search Results${query ? ` for "${query}"` : ''}\n\n${formatted}`;
    }

    /**
     * Format results as summary objects
     */
    _formatAsSummary(results, { maxContentLength = 200 }) {
        return results.map(row => ({
            id: row.id,
            similarity: Math.round(row.similarity * 100),
            project: row.project_name,
            type: row.memory_type,
            preview: row.content.length > maxContentLength ? 
                row.content.substring(0, maxContentLength) + '...' : row.content,
            summary: row.summary,
            tags: row.smart_tags || [],
            created: row.created_at,
            importance: row.importance_score
        }));
    }

    /**
     * Get search statistics
     */
    async getSearchStats(projectId = null) {
        try {
            let sql = `
                SELECT 
                    COUNT(*) as total_memories,
                    COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as searchable_memories,
                    COUNT(CASE WHEN processing_status = 'ready' THEN 1 END) as ready_memories,
                    COUNT(DISTINCT memory_type) as memory_types,
                    AVG(importance_score) as avg_importance
                FROM memories m
            `;

            const params = [];
            if (projectId) {
                sql += ' WHERE m.project_id = $1';
                params.push(projectId);
            }

            const result = await this.db.query(sql, params);
            return result.rows[0];
        } catch (error) {
            this.logger.error('Failed to get search stats:', error);
            return null;
        }
    }

    /**
     * Test search functionality
     */
    async testSearch() {
        try {
            // Test basic search
            const testResults = await this.search('test query', { limit: 1 });
            
            // Test stats
            const stats = await this.getSearchStats();
            
            return {
                searchable: testResults !== null,
                totalMemories: stats?.total_memories || 0,
                searchableMemories: stats?.searchable_memories || 0,
                readyMemories: stats?.ready_memories || 0
            };
        } catch (error) {
            this.logger.error('Search test failed:', error);
            return {
                searchable: false,
                error: error.message
            };
        }
    }

    /**
     * Find similar memories to a given memory
     */
    async findSimilar(memoryId, options = {}) {
        try {
            if (this.hybridSearch) {
                return await this.hybridSearch.findSimilar(memoryId, options);
            } else {
                // Fallback to legacy similar search
                return await this._legacyFindSimilar(memoryId, options);
            }
        } catch (error) {
            this.logger.error('Find similar memories failed:', error);
            throw error;
        }
    }

    /**
     * Get search capabilities for the current data
     */
    async getSearchCapabilities(projectId = null) {
        try {
            if (this.hybridSearch) {
                return await this.hybridSearch.getSearchCapabilities(projectId);
            } else {
                // Fallback capability check
                return {
                    total_memories: 0,
                    content_searchable: 0,
                    tag_searchable: 0,
                    hybrid_searchable: 0,
                    capabilities: {
                        content_only: true,
                        tags_only: false,
                        hybrid: false
                    }
                };
            }
        } catch (error) {
            this.logger.error('Failed to get search capabilities:', error);
            throw error;
        }
    }

    /**
     * Get search analytics
     */
    async getSearchAnalytics(options = {}) {
        try {
            if (this.hybridSearch) {
                return await this.hybridSearch.getSearchAnalytics(options);
            } else {
                return [];
            }
        } catch (error) {
            this.logger.error('Failed to get search analytics:', error);
            return [];
        }
    }

    /**
     * Legacy find similar implementation for fallback
     */
    async _legacyFindSimilar(memoryId, options = {}) {
        const { limit = 5, threshold = 0.7 } = options;

        try {
            // Get the source memory embedding
            const memoryResult = await this.db.query(`
                SELECT embedding, content
                FROM memories 
                WHERE id = $1 AND embedding IS NOT NULL
            `, [memoryId]);

            if (memoryResult.rows.length === 0) {
                return [];
            }

            const memory = memoryResult.rows[0];
            const embedding = JSON.parse(memory.embedding);

            // Search for similar memories
            return await this._executeVectorSearch(embedding, {
                threshold,
                limit,
                excludeIds: [memoryId]
            });

        } catch (error) {
            this.logger.error('Legacy find similar failed:', error);
            return [];
        }
    }
}

export default MemorySearchService; 