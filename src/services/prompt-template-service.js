/**
 * Prompt Template Service
 * Manages LLM prompt templates using the existing minime_insights_prompt_templates table
 */

export class PromptTemplateService {
    constructor(logger, databaseService) {
        this.logger = logger;
        this.db = databaseService;
        this.cache = new Map(); // Cache active templates
    }

    /**
     * Initialize service and create default templates if needed
     */
    async initialize() {
        await this.ensureDefaultTemplates();
        await this.loadActiveTemplates();
    }

    /**
     * Get a prompt template by name
     */
    async getTemplate(templateName) {
        // Check cache first
        if (this.cache.has(templateName)) {
            return this.cache.get(templateName);
        }

        // Load from database using repository
        const result = await this.db.query(`
            SELECT * FROM minime_insights_prompt_templates
            WHERE name = $1 AND is_active = true
            LIMIT 1
        `, [templateName]);

        if (result.rows.length === 0) {
            throw new Error(`Template not found: ${templateName}`);
        }

        const template = result.rows[0];
        this.cache.set(templateName, template);
        return template;
    }

    /**
     * Build a prompt from template with parameters
     */
    async buildPrompt(templateName, parameters = {}) {
        const template = await this.getTemplate(templateName);
        
        let prompt = template.template;
        
        // Replace placeholders with parameters
        for (const [key, value] of Object.entries(parameters)) {
            const placeholder = `{${key}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
        }

        return {
            prompt,
            temperature: template.temperature,
            maxTokens: template.max_tokens,
            modelPreference: template.model_preference
        };
    }

    /**
     * Create or update a template using the repository
     */
    async upsertTemplate(templateData) {
        const result = await this.repository.upsert(templateData);
        
        // Clear cache for this template
        this.cache.delete(templateData.name);
        
        return result;
    }

    /**
     * Load all active templates into cache
     */
    async loadActiveTemplates() {
        const templates = await this.repository.getActiveTemplates();
        
        this.cache.clear();
        for (const template of templates) {
            this.cache.set(template.name, template);
        }

        this.logger.info(`Loaded ${templates.length} active templates`);
    }

    /**
     * Ensure default templates exist
     */
    async ensureDefaultTemplates() {
        const defaults = [
            {
                name: 'search_strategy',
                analysis_type: 'synthesis',
                template: `Given this search query, should we adjust the search strategy?

Query: "{query}"
Current Strategy: {strategy}

If the query has special requirements or nuances that need different boost values, provide adjustments.
Otherwise, return {"useDefault": true}

Return JSON:
{
  "useDefault": true/false,
  "adjustments": {
    "boost": { /* only values to change */ }
  },
  "reasoning": "Why adjustments are needed"
}`,
                defaultTemperature: 0.1,
                maxTokens: 300
            },
            {
                templateName: 'relevance_scoring',
                templateType: 'scoring',
                systemPrompt: 'You are an expert at evaluating the relevance of technical insights to user queries.',
                userPromptTemplate: `User Query: "{query}"
Query Type: {queryType}
Detected Technologies: {technologies}
Detected Problems: {problems}

Evaluate the relevance of each insight below to the user's query. Consider:
1. How directly the insight addresses the user's problem or question
2. Technology/domain alignment
3. Actionability of the solution for the user's context
4. Recency and confidence of the insight

For each insight, provide:
- relevance_score: 0.0 to 1.0 (how relevant to the query)
- relevance_explanation: Brief explanation of why it's relevant or not
- confidence_adjustment: -0.2 to +0.2 (adjust original confidence based on relevance)

Insights to evaluate:
{insights}

Return a JSON array with exactly {insightCount} objects:
[{
  "relevance_score": 0.0-1.0,
  "relevance_explanation": "explanation",
  "confidence_adjustment": -0.2 to +0.2
}]`,
                defaultTemperature: 0.1,
                maxTokens: 1000
            },
            {
                templateName: 'learning_phase',
                templateType: 'analysis',
                userPromptTemplate: `Analyze these insights about {technology} and determine the learning phase for each.

Learning phases:
- exploring: Initial discovery, basic understanding
- learning: Active learning, making mistakes, understanding gotchas
- struggling: Dealing with complex issues, quality problems
- mastering: Developing patterns, best practices
- expert: Architecture decisions, teaching others

Insights to analyze:
{insights}

Return JSON array with exactly {insightCount} learning phases:
["phase1", "phase2", ...]`,
                defaultTemperature: 0.1,
                maxTokens: 200
            },
            {
                templateName: 'weight_adjustment',
                templateType: 'scoring',
                userPromptTemplate: `Is this problem description unusual enough to need custom relevance weights?

Problem: "{problemDescription}"
Query Type: {queryType}

If this is a standard {queryType} query, return {"useDefaults": true}.
If it needs custom weights due to specific keywords or urgency, suggest adjustments.

Return JSON:
{
  "useDefaults": true/false,
  "adjustments": { /* only weights to change from defaults */ },
  "reason": "why custom weights are needed"
}`,
                defaultTemperature: 0.1,
                maxTokens: 200
            },
            {
                templateName: 'pattern_analysis',
                templateType: 'analysis',
                systemPrompt: 'You are an expert code analyst. Analyze the given code patterns and provide insights on their quality, effectiveness, and potential improvements.',
                userPromptTemplate: `Analyze the following coding pattern:

**Pattern Information:**
- Type: {patternType}
- Name: {patternName}
- Languages: {languages}
- Frequency: {frequency} occurrences across {projectCount} projects
- Current Confidence: {confidence}

**Pattern Description:**
{patternDescription}

**Example Code:**
\`\`\`
{exampleCode}
\`\`\`

**Context:**
{additionalContext}

Please provide:
1. **Quality Assessment**: Rate the pattern's quality and explain why
2. **Effectiveness Analysis**: How effective is this pattern for its intended purpose?
3. **Best Practices**: Does this follow coding best practices?
4. **Improvements**: Specific suggestions for improvement
5. **Risks**: Potential issues or anti-patterns to watch for
6. **Confidence Score**: Your confidence in this analysis (0.0-1.0)

Format your response as structured analysis with clear sections.`,
                defaultTemperature: 0.1,
                maxTokens: 2000
            }
        ];

        for (const template of defaults) {
            try {
                // Check if template exists
                const exists = await this.db.query(
                    'SELECT 1 FROM llm_prompt_templates WHERE template_name = $1 LIMIT 1',
                    [template.templateName]
                );

                if (exists.rows.length === 0) {
                    await this.upsertTemplate(template);
                    this.logger.info(`Created default template: ${template.templateName}`);
                }
            } catch (error) {
                this.logger.error(`Failed to create default template ${template.templateName}:`, error);
            }
        }
    }

    /**
     * Get all templates of a specific type
     */
    async getTemplatesByType(templateType) {
        const result = await this.db.query(`
            SELECT * FROM llm_prompt_templates
            WHERE template_type = $1 AND is_active = true
            ORDER BY template_name
        `, [templateType]);

        return result.rows;
    }

    /**
     * Get template history
     */
    async getTemplateHistory(templateName) {
        const result = await this.db.query(`
            SELECT version, created_at, updated_at, is_active
            FROM llm_prompt_templates
            WHERE template_name = $1
            ORDER BY version DESC
        `, [templateName]);

        return result.rows;
    }

    /**
     * Rollback to a previous version
     */
    async rollbackTemplate(templateName, version) {
        try {
            // Deactivate current version
            await this.db.query(
                'UPDATE llm_prompt_templates SET is_active = false WHERE template_name = $1',
                [templateName]
            );

            // Activate specified version
            await this.db.query(`
                UPDATE llm_prompt_templates 
                SET is_active = true 
                WHERE template_name = $1 AND version = $2
            `, [templateName, version]);

            // Update cache
            this.cache.delete(templateName);
            
            this.logger.info(`Rolled back ${templateName} to version ${version}`);
            return { success: true };

        } catch (error) {
            this.logger.error('Failed to rollback template:', error);
            throw error;
        }
    }
}

export default PromptTemplateService;