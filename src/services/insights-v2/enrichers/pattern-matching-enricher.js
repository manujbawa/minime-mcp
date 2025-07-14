/**
 * Pattern Matching Enricher
 * Enriches insights by matching against known patterns
 */

import { BaseEnricher } from './base-enricher.js';

export class PatternMatchingEnricher extends BaseEnricher {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'PatternMatchingEnricher';
    }

    async enrich(insight, memory) {
        try {
            // Skip if no content to analyze
            if (!memory.content || !insight.summary) {
                return insight;
            }

            // Look for patterns in the pattern library
            const patterns = await this.findMatchingPatterns(insight, memory);
            
            // Add matched patterns to insight
            for (const pattern of patterns) {
                this.addPattern(insight, {
                    name: pattern.pattern_name,
                    category: pattern.pattern_category,
                    signature: pattern.pattern_signature,
                    evidence: [{
                        type: 'pattern_match',
                        content: `Matched pattern: ${pattern.pattern_name}`,
                        confidence: pattern.confidence_score
                    }]
                });

                // Add pattern-specific tags
                if (pattern.tags && pattern.tags.length > 0) {
                    this.addTags(insight, pattern.tags);
                }
            }

            // Add pattern-based recommendations
            if (patterns.length > 0) {
                this.addRecommendation(insight, {
                    text: `Consider reviewing ${patterns.length} identified patterns for best practices`,
                    type: 'pattern_review',
                    priority: patterns.some(p => p.pattern_type === 'anti-pattern') ? 'high' : 'medium'
                });
            }

            return insight;

        } catch (error) {
            this.logger.error('Pattern matching enrichment failed:', error);
            return insight; // Return unchanged on error
        }
    }

    /**
     * Find patterns that match the insight content
     */
    async findMatchingPatterns(insight, memory) {
        try {
            // Search for patterns related to the insight category and content
            const result = await this.db.query(`
                SELECT 
                    p.*,
                    COUNT(DISTINCT p2.id) as related_patterns_count
                FROM pattern_library_v2 p
                LEFT JOIN pattern_library_v2 p2 
                    ON p2.id = ANY(p.related_patterns)
                WHERE 
                    -- Category match
                    (p.pattern_category = $1 OR p.pattern_subcategory = $1)
                    -- Or technology match
                    OR EXISTS (
                        SELECT 1 FROM unnest(p.technologies) AS tech
                        WHERE tech = ANY($2::text[])
                    )
                    -- Or text similarity (if we have embeddings)
                    OR (
                        p.search_vector @@ plainto_tsquery('english', $3)
                    )
                GROUP BY p.id
                ORDER BY 
                    p.confidence_score DESC,
                    p.frequency_count DESC
                LIMIT 10
            `, [
                insight.insight_category,
                insight.technologies ? insight.technologies.map(t => t.name) : [],
                insight.summary.substring(0, 200) // Use first 200 chars for search
            ]);

            return result.rows;

        } catch (error) {
            this.logger.error('Failed to find matching patterns:', error);
            return [];
        }
    }
}

export default PatternMatchingEnricher;