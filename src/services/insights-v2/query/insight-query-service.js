/**
 * Insight Query Service
 * Handles searching and retrieving insights
 */

export class InsightQueryService {
    constructor(dependencies) {
        this.db = dependencies.db;
        this.embeddingService = dependencies.embeddingService;
        this.logger = dependencies.logger;
        this.config = dependencies.config || {};
    }

    /**
     * Search insights with flexible criteria
     */
    async search(criteria = {}, options = {}) {
        try {
            const {
                insightTypes,
                categories,
                subcategories,
                projectId,
                minConfidence,
                maxConfidence,
                timeRange,
                tags,
                technologies,
                includeAllCategories,
                includeRelationships,
                includeTimeline,
                includeMetrics,
                searchText,
                limit = 50,
                offset = 0
            } = criteria;

            // Build WHERE clauses
            const whereClauses = [];
            const params = [];
            let paramIndex = 1;

            // System version
            whereClauses.push('system_version = $' + paramIndex++);
            params.push('v2');

            // Project filter
            if (projectId) {
                whereClauses.push('project_id = $' + paramIndex++);
                params.push(projectId);
            }

            // Type filters
            if (insightTypes && insightTypes.length > 0) {
                whereClauses.push('insight_type = ANY($' + paramIndex++ + ')');
                params.push(insightTypes);
            }

            // Category filters
            if (!includeAllCategories && categories && categories.length > 0) {
                whereClauses.push('(insight_category = ANY($' + paramIndex + ') OR insight_subcategory = ANY($' + paramIndex + '))');
                params.push(categories);
                paramIndex++;
            }

            // Confidence range
            if (minConfidence !== undefined) {
                whereClauses.push('confidence_score >= $' + paramIndex++);
                params.push(minConfidence);
            }
            if (maxConfidence !== undefined) {
                whereClauses.push('confidence_score <= $' + paramIndex++);
                params.push(maxConfidence);
            }

            // Time range
            if (timeRange) {
                whereClauses.push(`created_at >= NOW() - ($${paramIndex}::text)::interval`);
                params.push(timeRange);
                paramIndex++;
            }

            // Tags filter
            if (tags && tags.length > 0) {
                whereClauses.push('tags && $' + paramIndex++);
                params.push(tags);
            }

            // Technologies filter
            if (technologies && technologies.length > 0) {
                whereClauses.push(`
                    EXISTS (
                        SELECT 1 FROM jsonb_array_elements(technologies) AS tech
                        WHERE tech->>'name' = ANY($${paramIndex++})
                    )
                `);
                params.push(technologies);
            }

            // Text search
            let searchTextParamIndex = null;
            if (searchText) {
                searchTextParamIndex = paramIndex;
                whereClauses.push('search_vector @@ plainto_tsquery($' + paramIndex++ + ')');
                params.push(searchText);
            }

            // Build the query
            const whereClause = whereClauses.length > 0 
                ? 'WHERE ' + whereClauses.join(' AND ')
                : '';

            // Main query
            const query = `
                SELECT 
                    i.*,
                    p.name as project_name,
                    ${includeRelationships ? `
                        COALESCE(
                            (SELECT COUNT(*) FROM unified_insights_v2 r 
                             WHERE r.id = ANY(i.related_insight_ids)),
                            0
                        ) as related_count,
                    ` : ''}
                    ${includeMetrics ? `
                        jsonb_build_object(
                            'avg_confidence', AVG(confidence_score) OVER(),
                            'total_in_category', COUNT(*) OVER(PARTITION BY insight_category)
                        ) as metrics,
                    ` : ''}
                    COUNT(*) OVER() as total_count
                FROM unified_insights_v2 i
                LEFT JOIN projects p ON i.project_id = p.id
                ${whereClause}
                ORDER BY 
                    ${searchText ? 'ts_rank(search_vector, plainto_tsquery($' + searchTextParamIndex + ')) DESC,' : ''}
                    confidence_score DESC,
                    created_at DESC
                LIMIT $${paramIndex++} OFFSET $${paramIndex++}
            `;

            params.push(limit, offset);

            const result = await this.db.query(query, params);
            
            return {
                insights: result.rows,
                total: result.rows[0]?.total_count || 0,
                timeRange: timeRange || 'all',
                criteria
            };

        } catch (error) {
            this.logger.error('Failed to search insights:', error);
            throw error;
        }
    }

    /**
     * Get insight by ID with full details
     */
    async getById(insightId, options = {}) {
        try {
            const result = await this.db.query(`
                SELECT 
                    i.*,
                    p.name as project_name,
                    ${options.includeRelated ? `
                        COALESCE(
                            json_agg(
                                DISTINCT jsonb_build_object(
                                    'id', r.id,
                                    'title', r.title,
                                    'type', r.insight_type,
                                    'category', r.insight_category
                                )
                            ) FILTER (WHERE r.id IS NOT NULL),
                            '[]'::json
                        ) as related_insights,
                    ` : ''}
                    ${options.includeEvidence ? `
                        COALESCE(evidence, '[]'::jsonb) as full_evidence,
                    ` : ''}
                    ${options.includeRecommendations ? `
                        COALESCE(recommendations, '[]'::jsonb) as full_recommendations,
                    ` : ''}
                    1 as dummy
                FROM unified_insights_v2 i
                LEFT JOIN projects p ON i.project_id = p.id
                ${options.includeRelated ? `
                    LEFT JOIN unified_insights_v2 r ON r.id = ANY(i.related_insight_ids)
                ` : ''}
                WHERE i.id = $1
                GROUP BY i.id, p.name
            `, [insightId]);

            return result.rows[0];

        } catch (error) {
            this.logger.error('Failed to get insight by ID:', error);
            throw error;
        }
    }

    /**
     * Find similar insights using embeddings
     */
    async findSimilar(insightId, limit = 10) {
        try {
            const result = await this.db.query(`
                WITH target AS (
                    SELECT embedding FROM unified_insights_v2 WHERE id = $1
                )
                SELECT 
                    i.id,
                    i.title,
                    i.summary,
                    i.insight_type,
                    i.insight_category,
                    i.confidence_score,
                    i.embedding <=> t.embedding as distance
                FROM unified_insights_v2 i, target t
                WHERE 
                    i.id != $1
                    AND i.embedding IS NOT NULL
                ORDER BY distance
                LIMIT $2
            `, [insightId, limit]);

            return result.rows;

        } catch (error) {
            this.logger.error('Failed to find similar insights:', error);
            return [];
        }
    }
}

export default InsightQueryService;