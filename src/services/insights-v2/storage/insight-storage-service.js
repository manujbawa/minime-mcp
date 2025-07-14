/**
 * Insight Storage Service
 * Handles persistence of insights to the database
 */

export class InsightStorageService {
    constructor(dependencies) {
        this.db = dependencies.db;
        this.logger = dependencies.logger;
        this.config = dependencies.config || {};
    }

    /**
     * Store insights in the database
     */
    async storeInsights(insights, metadata = {}) {
        const storedInsights = [];
        
        this.logger.info(`[StorageService] Attempting to store ${insights.length} insights`);
        
        for (const insight of insights) {
            try {
                this.logger.debug(`[StorageService] Storing insight: ${insight.insight_type} - ${insight.title}`);
                
                // Log the insight structure for debugging
                this.logger.debug(`[StorageService] Insight data:`, {
                    type: insight.insight_type,
                    category: insight.insight_category,
                    hasPatterns: !!insight.patterns && insight.patterns.length > 0,
                    patternsCount: insight.patterns?.length || 0,
                    confidence: insight.confidence_score
                });
                
                const stored = await this.storeInsight(insight, metadata);
                if (stored) {
                    storedInsights.push(stored);
                    this.logger.debug(`[StorageService] Successfully stored insight ID: ${stored.id}`);
                } else {
                    this.logger.warn(`[StorageService] Failed to store insight (no result returned)`);
                }
            } catch (error) {
                this.logger.error('[StorageService] Failed to store insight:', error);
            }
        }
        
        this.logger.info(`[StorageService] Stored ${storedInsights.length} of ${insights.length} insights`);
        return storedInsights;
    }

    /**
     * Store a single insight
     */
    async storeInsight(insight, metadata = {}) {
        try {
            // Prepare the insight data
            const data = {
                ...insight,
                system_version: 'v2',
                created_at: new Date(),
                updated_at: new Date()
            };

            // Insert the insight
            const result = await this.db.query(`
                INSERT INTO unified_insights_v2 (
                    insight_type, insight_category, insight_subcategory,
                    title, summary, detailed_content,
                    source_type, source_ids, detection_method, detection_metadata,
                    system_version, insight_level,
                    confidence_score, relevance_score, impact_score,
                    project_id, related_insight_ids,
                    technologies, patterns, entities,
                    recommendations, action_items, evidence,
                    embedding, embedding_model,
                    tags, custom_metadata,
                    created_at, updated_at, validation_status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
                ) RETURNING *
            `, [
                data.insight_type,
                data.insight_category,
                data.insight_subcategory,
                data.title,
                data.summary,
                JSON.stringify(data.detailed_content || {}),
                data.source_type,
                data.source_ids || [],
                data.detection_method,
                JSON.stringify(data.detection_metadata || {}),
                data.system_version,
                data.insight_level || 'L1',
                data.confidence_score || 0.5,
                data.relevance_score,
                data.impact_score,
                data.project_id,
                data.related_insight_ids || [],
                JSON.stringify(data.technologies || []),
                JSON.stringify(data.patterns || []),
                JSON.stringify(data.entities || []),
                JSON.stringify(data.recommendations || []),
                JSON.stringify(data.action_items || []),
                JSON.stringify(data.evidence || []),
                data.embedding ? JSON.stringify(data.embedding) : null,
                data.embedding_model,
                data.tags || [],
                JSON.stringify({ ...data.custom_metadata, processingId: metadata.processingId }),
                data.created_at,
                data.updated_at,
                data.validation_status || 'pending' // Use the validation_status from the insight object
            ]);

            this.logger.debug(`Stored insight: ${result.rows[0].id}`);
            return result.rows[0];

        } catch (error) {
            this.logger.error('Failed to store insight:', error);
            throw error;
        }
    }

    /**
     * Update an existing insight
     */
    async updateInsight(insightId, updates) {
        try {
            const result = await this.db.query(`
                UPDATE unified_insights_v2
                SET 
                    updated_at = NOW(),
                    ${Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ')}
                WHERE id = $1
                RETURNING *
            `, [insightId, ...Object.values(updates)]);

            return result.rows[0];

        } catch (error) {
            this.logger.error('Failed to update insight:', error);
            throw error;
        }
    }

    /**
     * Check if similar insight exists
     */
    async checkDuplicate(insight) {
        try {
            const result = await this.db.query(`
                SELECT id, confidence_score
                FROM unified_insights_v2
                WHERE 
                    insight_type = $1
                    AND insight_category = $2
                    AND project_id = $3
                    AND title = $4
                    AND created_at > NOW() - INTERVAL '24 hours'
                LIMIT 1
            `, [
                insight.insight_type,
                insight.insight_category,
                insight.project_id,
                insight.title
            ]);

            return result.rows[0];

        } catch (error) {
            this.logger.error('Failed to check duplicate:', error);
            return null;
        }
    }
}

export default InsightStorageService;