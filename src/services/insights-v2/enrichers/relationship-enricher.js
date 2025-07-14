/**
 * Relationship Enricher
 * Finds and adds relationships between insights
 */

import { BaseEnricher } from './base-enricher.js';

export class RelationshipEnricher extends BaseEnricher {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'RelationshipEnricher';
    }

    async enrich(insight, memory) {
        try {
            // Find related insights
            const relatedInsights = await this.findRelatedInsights(insight, memory);
            
            // Update relationships
            if (relatedInsights.length > 0) {
                insight.related_insight_ids = [
                    ...(insight.related_insight_ids || []),
                    ...relatedInsights.map(r => r.id)
                ];
                
                // Remove duplicates
                insight.related_insight_ids = [...new Set(insight.related_insight_ids)];
                
                // Add relationship evidence
                for (const related of relatedInsights) {
                    this.addEvidence(insight, {
                        type: 'relationship',
                        content: `Related to: ${related.title} (${related.relationship_type})`,
                        source: `insight_${related.id}`,
                        confidence: related.similarity_score
                    });
                }
            }

            // Check for contradictions
            const contradictions = relatedInsights.filter(r => 
                r.relationship_type === 'contradicts'
            );
            
            if (contradictions.length > 0) {
                insight.contradicts_insight_ids = contradictions.map(c => c.id);
                
                this.addRecommendation(insight, {
                    text: `Review ${contradictions.length} potentially contradicting insights`,
                    type: 'contradiction_review',
                    priority: 'high'
                });
            }

            // Check if this insight supersedes others
            const superseded = await this.findSupersededInsights(insight);
            if (superseded.length > 0) {
                // Mark older insights as superseded
                for (const old of superseded) {
                    await this.markAsSuperseded(old.id, insight.id);
                }
                
                this.addEvidence(insight, {
                    type: 'supersession',
                    content: `Supersedes ${superseded.length} older insights`,
                    confidence: 0.8
                });
            }

            return insight;

        } catch (error) {
            this.logger.error('Relationship enrichment failed:', error);
            return insight;
        }
    }

    /**
     * Find insights related to the current one
     */
    async findRelatedInsights(insight, memory) {
        try {
            const result = await this.db.query(`
                WITH current_insight AS (
                    SELECT $1::text as category, $2::jsonb as technologies
                )
                SELECT 
                    i.id,
                    i.title,
                    i.insight_category,
                    i.confidence_score,
                    -- Calculate similarity
                    CASE 
                        WHEN i.insight_category = $1 THEN 0.8
                        WHEN i.insight_subcategory = $1 THEN 0.6
                        ELSE 0.4
                    END as similarity_score,
                    -- Determine relationship type
                    CASE 
                        WHEN i.insight_type = $3 AND i.insight_category = $1 THEN 'similar'
                        WHEN i.confidence_score < 0.3 AND $4 > 0.7 THEN 'contradicts'
                        ELSE 'related'
                    END as relationship_type
                FROM unified_insights_v2 i
                WHERE 
                    i.id != $5
                    AND i.project_id = $6
                    AND (
                        -- Same category
                        i.insight_category = $1
                        -- Or overlapping technologies
                        OR i.technologies ?| ARRAY(
                            SELECT jsonb_array_elements_text($2)
                        )
                        -- Or same source memories
                        OR i.source_ids && $7
                    )
                ORDER BY similarity_score DESC
                LIMIT 20
            `, [
                insight.insight_category,
                JSON.stringify(insight.technologies || []),
                insight.insight_type,
                insight.confidence_score,
                insight.id || 0, // Use 0 if no ID yet
                memory.project_id,
                insight.source_ids || [memory.id]
            ]);

            return result.rows;

        } catch (error) {
            this.logger.error('Failed to find related insights:', error);
            return [];
        }
    }

    /**
     * Find insights that this one supersedes
     */
    async findSupersededInsights(insight) {
        try {
            // Only check if confidence is high
            if (insight.confidence_score < 0.7) {
                return [];
            }

            const result = await this.db.query(`
                SELECT id, title, created_at
                FROM unified_insights_v2
                WHERE 
                    insight_type = $1
                    AND insight_category = $2
                    AND confidence_score < $3
                    AND created_at < NOW() - INTERVAL '7 days'
                    AND validation_status != 'validated'
                    AND supersedes_insight_id IS NULL
                ORDER BY created_at ASC
                LIMIT 5
            `, [
                insight.insight_type,
                insight.insight_category,
                insight.confidence_score
            ]);

            return result.rows;

        } catch (error) {
            this.logger.error('Failed to find superseded insights:', error);
            return [];
        }
    }

    /**
     * Mark an insight as superseded
     */
    async markAsSuperseded(oldInsightId, newInsightId) {
        try {
            await this.db.query(`
                UPDATE unified_insights_v2
                SET 
                    supersedes_insight_id = $2,
                    validation_status = 'superseded',
                    updated_at = NOW()
                WHERE id = $1
            `, [oldInsightId, newInsightId]);

        } catch (error) {
            this.logger.error('Failed to mark insight as superseded:', error);
        }
    }
}

export default RelationshipEnricher;