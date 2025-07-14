/**
 * Hybrid Search Engine
 * Core component that orchestrates content and tag search strategies
 */

import { ContentSearchStrategy } from './content-search-strategy.js';
import { TagSearchStrategy } from './tag-search-strategy.js';
import { SearchResultCombiner } from './search-result-combiner.js';

export class HybridSearchEngine {
    constructor(logger, databaseService, embeddingService, configService = null) {
        this.logger = logger;
        this.db = databaseService;
        this.embeddingService = embeddingService;
        this.configService = configService;
        
        // Initialize search strategies
        this.contentSearch = new ContentSearchStrategy(logger, databaseService, embeddingService);
        this.tagSearch = new TagSearchStrategy(logger, databaseService, embeddingService);
        this.resultCombiner = new SearchResultCombiner(logger);
        
        // Default configuration
        this.defaultConfig = {
            contentWeight: 0.7,
            tagWeight: 0.3,
            hybridEnabled: true,
            overlapBoost: 0.1,
            maxBoost: 0.95,
            analyticsEnabled: true
        };
    }

    /**
     * Main hybrid search method
     */
    async search(query, options = {}) {
        const startTime = Date.now();
        
        try {
            // Get configuration
            const config = await this._getSearchConfig();
            
            const {
                searchMode = 'hybrid',
                contentWeight = config.contentWeight,
                tagWeight = config.tagWeight,
                threshold = 0.7,
                limit = 10,
                enableOverlapBoost = true,
                enableDiversity = false,
                ...searchOptions
            } = options;

            // Validate weights
            this._validateWeights(contentWeight, tagWeight);

            // Generate query embedding once for efficiency
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            let results = [];
            let searchStats = {
                query,
                search_mode: searchMode,
                content_weight: contentWeight,
                tag_weight: tagWeight,
                execution_time_ms: 0,
                results_count: 0
            };

            // Execute search based on mode
            switch (searchMode) {
                case 'content_only':
                    results = await this.contentSearch.searchByEmbedding(queryEmbedding, {
                        ...searchOptions,
                        threshold,
                        limit
                    });
                    break;

                case 'tags_only':
                    results = await this.tagSearch.searchByEmbedding(queryEmbedding, {
                        ...searchOptions,
                        threshold,
                        limit
                    });
                    break;

                case 'hybrid':
                default:
                    results = await this._executeHybridSearch(queryEmbedding, {
                        contentWeight,
                        tagWeight,
                        threshold,
                        limit,
                        enableOverlapBoost,
                        enableDiversity,
                        ...searchOptions
                    });
                    break;
            }

            // Apply post-processing
            if (enableDiversity && results.length > 0) {
                results = this.resultCombiner.diversifyResults(results, {
                    maxSimilarMemoryType: Math.ceil(limit / 3),
                    maxSimilarProject: Math.ceil(limit / 2)
                });
            }

            // Calculate execution time and update stats
            searchStats.execution_time_ms = Date.now() - startTime;
            searchStats.results_count = results.length;
            searchStats.avg_similarity = results.length > 0 ? 
                results.reduce((sum, r) => sum + r.similarity, 0) / results.length : 0;

            // Store analytics if enabled
            if (config.analyticsEnabled) {
                await this._storeSearchAnalytics(searchStats, searchOptions);
            }

            this.logger.debug(`Hybrid search completed: ${results.length} results in ${searchStats.execution_time_ms}ms`);

            return results;

        } catch (error) {
            this.logger.error('Hybrid search failed:', error);
            throw new Error(`Hybrid search failed: ${error.message}`);
        }
    }

    /**
     * Execute hybrid search combining content and tag strategies
     */
    async _executeHybridSearch(queryEmbedding, options = {}) {
        const {
            contentWeight = 0.7,
            tagWeight = 0.3,
            threshold = 0.7,
            limit = 10,
            enableOverlapBoost = true,
            ...searchOptions
        } = options;

        try {
            // Execute both searches in parallel for efficiency
            const [contentResults, tagResults] = await Promise.all([
                this.contentSearch.searchByEmbedding(queryEmbedding, {
                    ...searchOptions,
                    threshold,
                    limit: Math.ceil(limit * 1.5) // Get more results for better combination
                }).catch(error => {
                    this.logger.warn('Content search failed in hybrid mode:', error);
                    return [];
                }),
                
                this.tagSearch.searchByEmbedding(queryEmbedding, {
                    ...searchOptions,
                    threshold,
                    limit: Math.ceil(limit * 1.5) // Get more results for better combination
                }).catch(error => {
                    this.logger.warn('Tag search failed in hybrid mode:', error);
                    return [];
                })
            ]);

            // Combine results
            let combinedResults;
            if (enableOverlapBoost) {
                combinedResults = this.resultCombiner.mergeWithBoost(contentResults, tagResults, {
                    contentWeight,
                    tagWeight,
                    overlapBoost: 0.1,
                    maxBoost: 0.95
                });
            } else {
                combinedResults = this.resultCombiner.combine(contentResults, tagResults, {
                    contentWeight,
                    tagWeight
                });
            }

            // Limit final results
            const finalResults = combinedResults.slice(0, limit);

            // Log combination statistics
            const stats = this.resultCombiner.getCombinationStats(contentResults, tagResults, combinedResults);
            this.logger.debug('Hybrid search combination stats:', stats);

            return finalResults;

        } catch (error) {
            this.logger.error('Hybrid search execution failed:', error);
            throw error;
        }
    }

    /**
     * Search with automatic fallback strategy
     */
    async searchWithFallback(query, options = {}) {
        try {
            // Try hybrid search first
            const results = await this.search(query, { ...options, searchMode: 'hybrid' });
            
            if (results.length > 0) {
                return results;
            }

            // Fallback to content-only search
            this.logger.debug('Hybrid search returned no results, falling back to content-only');
            const contentResults = await this.search(query, { ...options, searchMode: 'content_only' });
            
            if (contentResults.length > 0) {
                return contentResults;
            }

            // Final fallback to tag-only search
            this.logger.debug('Content search returned no results, falling back to tag-only');
            return await this.search(query, { ...options, searchMode: 'tags_only' });

        } catch (error) {
            this.logger.error('Search with fallback failed:', error);
            throw error;
        }
    }

    /**
     * Find similar memories to a given memory using hybrid approach
     */
    async findSimilar(memoryId, options = {}) {
        try {
            const { limit = 5, excludeSelf = true } = options;

            // Get the source memory
            const memoryResult = await this.db.query(`
                SELECT embedding, tag_embedding, content, smart_tags, memory_type
                FROM memories 
                WHERE id = $1
            `, [memoryId]);

            if (memoryResult.rows.length === 0) {
                return [];
            }

            const memory = memoryResult.rows[0];
            const searchOptions = {
                ...options,
                limit,
                excludeIds: excludeSelf ? [memoryId] : []
            };

            // Use both embeddings if available
            if (memory.embedding && memory.tag_embedding) {
                const contentEmbedding = JSON.parse(memory.embedding);
                const tagEmbedding = JSON.parse(memory.tag_embedding);

                const [contentResults, tagResults] = await Promise.all([
                    this.contentSearch.searchByEmbedding(contentEmbedding, searchOptions),
                    this.tagSearch.searchByEmbedding(tagEmbedding, searchOptions)
                ]);

                return this.resultCombiner.combine(contentResults, tagResults, {
                    contentWeight: 0.6, // Slightly favor content for similarity
                    tagWeight: 0.4
                });

            } else if (memory.embedding) {
                const contentEmbedding = JSON.parse(memory.embedding);
                return await this.contentSearch.searchByEmbedding(contentEmbedding, searchOptions);

            } else if (memory.tag_embedding) {
                const tagEmbedding = JSON.parse(memory.tag_embedding);
                return await this.tagSearch.searchByEmbedding(tagEmbedding, searchOptions);

            } else {
                // Fallback to text-based search using content
                return await this.search(memory.content.substring(0, 200), searchOptions);
            }

        } catch (error) {
            this.logger.error('Find similar memories failed:', error);
            throw error;
        }
    }

    /**
     * Get search analytics and performance metrics
     */
    async getSearchAnalytics(options = {}) {
        const { days = 7, searchMode = null } = options;

        try {
            let sql = `
                SELECT 
                    search_mode,
                    COUNT(*) as total_searches,
                    AVG(execution_time_ms) as avg_execution_time,
                    AVG(results_count) as avg_results_count,
                    AVG(avg_similarity) as avg_similarity_score,
                    DATE_TRUNC('day', created_at) as search_date
                FROM search_analytics 
                WHERE created_at > NOW() - INTERVAL '${days} days'
            `;

            const params = [];
            if (searchMode) {
                sql += ` AND search_mode = $1`;
                params.push(searchMode);
            }

            sql += `
                GROUP BY search_mode, DATE_TRUNC('day', created_at)
                ORDER BY search_date DESC, search_mode
            `;

            const result = await this.db.query(sql, params);
            return result.rows;

        } catch (error) {
            this.logger.error('Failed to get search analytics:', error);
            return [];
        }
    }

    /**
     * Get search configuration from database or use defaults
     */
    async _getSearchConfig() {
        try {
            if (!this.configService) {
                return this.defaultConfig;
            }

            const config = await this.configService.getAll();
            return {
                contentWeight: parseFloat(config.hybrid_search_content_weight || this.defaultConfig.contentWeight),
                tagWeight: parseFloat(config.hybrid_search_tag_weight || this.defaultConfig.tagWeight),
                hybridEnabled: config.hybrid_search_enabled === 'true',
                analyticsEnabled: config.search_analytics_enabled !== 'false'
            };

        } catch (error) {
            this.logger.warn('Failed to get search config, using defaults:', error);
            return this.defaultConfig;
        }
    }

    /**
     * Store search analytics
     */
    async _storeSearchAnalytics(stats, options) {
        try {
            await this.db.query(`
                INSERT INTO search_analytics (
                    query_text, search_mode, content_weight, tag_weight,
                    results_count, avg_similarity, execution_time_ms,
                    project_name, memory_type
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                stats.query,
                stats.search_mode,
                stats.content_weight,
                stats.tag_weight,
                stats.results_count,
                stats.avg_similarity,
                stats.execution_time_ms,
                options.projectName || null,
                options.memoryType || null
            ]);

        } catch (error) {
            this.logger.warn('Failed to store search analytics:', error);
        }
    }

    /**
     * Validate search weights
     */
    _validateWeights(contentWeight, tagWeight) {
        if (contentWeight < 0 || contentWeight > 1) {
            throw new Error('Content weight must be between 0 and 1');
        }
        if (tagWeight < 0 || tagWeight > 1) {
            throw new Error('Tag weight must be between 0 and 1');
        }
        if (Math.abs((contentWeight + tagWeight) - 1.0) > 0.01) {
            throw new Error('Content weight and tag weight must sum to 1.0');
        }
    }

    /**
     * Get search capabilities based on available data
     */
    async getSearchCapabilities(projectId = null) {
        try {
            let sql = `
                SELECT 
                    COUNT(*) as total_memories,
                    COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as content_searchable,
                    COUNT(CASE WHEN tag_embedding IS NOT NULL THEN 1 END) as tag_searchable,
                    COUNT(CASE WHEN embedding IS NOT NULL AND tag_embedding IS NOT NULL THEN 1 END) as hybrid_searchable
                FROM memories
                WHERE processing_status NOT IN ('failed', 'failed_permanent')
            `;

            const params = [];
            if (projectId) {
                sql += ` AND project_id = $1`;
                params.push(projectId);
            }

            const result = await this.db.query(sql, params);
            const stats = result.rows[0];

            return {
                total_memories: parseInt(stats.total_memories),
                content_searchable: parseInt(stats.content_searchable),
                tag_searchable: parseInt(stats.tag_searchable),
                hybrid_searchable: parseInt(stats.hybrid_searchable),
                capabilities: {
                    content_only: stats.content_searchable > 0,
                    tags_only: stats.tag_searchable > 0,
                    hybrid: stats.hybrid_searchable > 0
                }
            };

        } catch (error) {
            this.logger.error('Failed to get search capabilities:', error);
            return {
                total_memories: 0,
                content_searchable: 0,
                tag_searchable: 0,
                hybrid_searchable: 0,
                capabilities: {
                    content_only: false,
                    tags_only: false,
                    hybrid: false
                }
            };
        }
    }
} 