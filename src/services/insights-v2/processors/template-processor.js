/**
 * Template Processor
 * Processes insights using predefined templates (similar to L1)
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, DetectionMethods } from '../constants/insight-constants.js';

export class TemplateProcessor extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'TemplateProcessor';
    }

    getDetectionMethod() {
        return DetectionMethods.LLM_TEMPLATE;
    }

    async process(memory, options = {}) {
        const insights = [];
        
        try {
            // Get applicable templates for this memory type
            const templates = await this.getTemplatesForMemory(memory);
            
            if (templates.length === 0) {
                this.logger.debug('No templates found for memory type:', memory.memory_type);
                return insights;
            }

            // Process with each template
            for (const template of templates) {
                try {
                    const insight = await this.processWithTemplate(memory, template);
                    if (insight) {
                        insights.push(insight);
                    }
                } catch (error) {
                    this.logger.error(`Template processing failed for ${template.template_name}:`, error);
                }
            }

            return insights;

        } catch (error) {
            this.logger.error('Template processor error:', error);
            return insights;
        }
    }

    async getTemplatesForMemory(memory) {
        try {
            // First, try to get templates that specifically match the memory type
            // This query uses a flexible approach that doesn't require hardcoded mapping
            const result = await this.db.query(`
                SELECT t.* FROM insight_templates_v2 t
                WHERE t.is_active = true
                  AND (
                    -- Direct memory type match in tags or metadata
                    t.tags && ARRAY[$1]
                    -- OR memory type mentioned in description
                    OR t.description ILIKE '%' || $1 || '%'
                    -- OR template name contains memory type
                    OR t.template_name ILIKE '%' || $1 || '%'
                    -- OR category matches common patterns
                    OR (
                        ($1 IN ('code', 'bug', 'implementation_notes') AND t.template_category = 'development')
                        OR ($1 IN ('decision', 'architecture', 'design_decisions', 'system_patterns') AND t.template_category = 'architecture')
                        OR ($1 IN ('tech_context', 'tech_reference') AND t.template_category = 'technology')
                        OR ($1 IN ('thinking_sequence', 'reasoning') AND t.template_category = 'analysis')
                        OR ($1 IN ('progress', 'task', 'active_context') AND t.template_category = 'tracking')
                        OR ($1 IN ('requirements', 'prd', 'project_brief', 'project_prd', 'project_plan') AND t.template_category = 'planning')
                        OR ($1 IN ('lessons_learned', 'insight', 'learning') AND t.template_category = 'learning')
                    )
                    -- Always include general templates as fallback
                    OR t.template_category = 'general'
                    -- Always include universal templates
                    OR t.tags && ARRAY['universal', 'all_types']
                  )
                ORDER BY 
                    -- Prioritize direct matches
                    CASE 
                        WHEN t.tags && ARRAY[$1] THEN 0
                        WHEN t.template_name ILIKE '%' || $1 || '%' THEN 1
                        WHEN t.description ILIKE '%' || $1 || '%' THEN 2
                        WHEN t.template_category != 'general' THEN 3
                        ELSE 4
                    END,
                    t.created_at DESC
                LIMIT 5  -- Limit to prevent too many templates
            `, [memory.memory_type]);

            // If no specific templates found, at least get general ones
            if (result.rows.length === 0) {
                this.logger.debug(`No specific templates for ${memory.memory_type}, fetching general templates`);
                const generalResult = await this.db.query(`
                    SELECT * FROM insight_templates_v2
                    WHERE is_active = true
                      AND (template_category = 'general' OR tags && ARRAY['universal', 'all_types'])
                    ORDER BY created_at DESC
                    LIMIT 3
                `);
                return generalResult.rows;
            }

            return result.rows;

        } catch (error) {
            this.logger.error('Failed to get templates:', error);
            return [];
        }
    }

    async processWithTemplate(memory, template) {
        try {
            // Build prompt from template
            const prompt = this.buildPrompt(template, memory);
            
            // Call LLM
            const response = await this.llmService.generateAnalysis(prompt, {
                model: template.processing_config?.model,
                temperature: template.processing_config?.temperature || 0.7,
                maxTokens: template.processing_config?.max_tokens || 1000
            }, 'insightGeneration');

            if (!response || !response.content) {
                return null;
            }

            // Parse response
            const parsedInsight = this.parseTemplateResponse(response.content, template);
            
            // Build insight object
            return {
                insight_type: parsedInsight.type || InsightTypes.GENERAL,
                insight_category: template.template_category,
                insight_subcategory: template.template_name,
                title: parsedInsight.title || template.template_name,
                summary: parsedInsight.summary || response.content,
                detailed_content: parsedInsight.details || {},
                source_type: 'memory',
                source_ids: [memory.id],
                detection_method: this.getDetectionMethod(),
                detection_metadata: {
                    template_id: template.id,
                    template_name: template.template_name,
                    model: template.processing_config?.model
                },
                confidence_score: this.calculateConfidence(parsedInsight, response),
                technologies: parsedInsight.technologies || [],
                patterns: parsedInsight.patterns || [],
                recommendations: parsedInsight.recommendations || [],
                evidence: [{
                    type: 'template_response',
                    content: response.content,
                    source: 'llm'
                }],
                tags: this.generateTags(parsedInsight, template)
            };

        } catch (error) {
            this.logger.error('Failed to process with template:', error);
            return null;
        }
    }

    buildPrompt(template, memory) {
        let prompt = template.template_content;
        
        // Replace variables
        const variables = {
            content: memory.content,
            memory_type: memory.memory_type,
            project_name: memory.project_name || 'Unknown',
            created_at: memory.created_at,
            metadata: JSON.stringify(memory.metadata || {})
        };

        for (const [key, value] of Object.entries(variables)) {
            // Replace both {key} and {{key}} patterns for compatibility
            prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value);
            prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }

        return prompt;
    }

    parseTemplateResponse(content, template) {
        try {
            // Try to parse as JSON first
            if (content.trim().startsWith('{')) {
                return JSON.parse(content);
            }

            // Otherwise extract key information
            const parsed = {
                summary: content,
                technologies: [],
                patterns: [],
                recommendations: []
            };

            // Extract technologies mentioned
            const techMatches = content.match(/(?:uses?|implements?|built with|technology:|framework:)\s*([A-Za-z0-9\-\.]+)/gi) || [];
            parsed.technologies = techMatches.map(m => ({
                name: m.split(/:\s*/)[1] || m,
                confidence: 0.7
            }));

            // Extract recommendations
            const recMatches = content.match(/(?:recommend|suggest|should|consider)\s*:?\s*([^.!?]+[.!?])/gi) || [];
            parsed.recommendations = recMatches.map(m => ({
                text: m,
                priority: 'medium'
            }));

            return parsed;

        } catch (error) {
            this.logger.warn('Failed to parse template response as JSON:', error);
            return { summary: content };
        }
    }

    calculateConfidence(parsedInsight, llmResponse) {
        let confidence = 0.5; // Base confidence

        // Increase confidence based on response quality
        if (parsedInsight.title && parsedInsight.summary) confidence += 0.1;
        if (parsedInsight.technologies?.length > 0) confidence += 0.1;
        if (parsedInsight.patterns?.length > 0) confidence += 0.1;
        if (parsedInsight.recommendations?.length > 0) confidence += 0.1;
        if (parsedInsight.evidence?.length > 0) confidence += 0.1;

        return Math.min(confidence, 0.9);
    }

    generateTags(parsedInsight, template) {
        const tags = [];
        
        // Add template category
        tags.push(`template:${template.template_category}`);
        
        // Add technology tags
        if (parsedInsight.technologies) {
            parsedInsight.technologies.forEach(tech => {
                tags.push(`tech:${tech.name || tech}`);
            });
        }

        // Add pattern tags
        if (parsedInsight.patterns) {
            parsedInsight.patterns.forEach(pattern => {
                tags.push(`pattern:${pattern.name || pattern}`);
            });
        }

        return [...new Set(tags)]; // Remove duplicates
    }
}

export default TemplateProcessor;