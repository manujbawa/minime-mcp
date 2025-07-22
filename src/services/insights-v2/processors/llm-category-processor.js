/**
 * LLM Category Processor
 * Uses LLM to detect patterns and generate insights based on categories
 * Replaces the pattern detection from learning-pipeline-llm.js
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, InsightCategories, DetectionMethods, PatternCategories } from '../constants/insight-constants.js';

export class LLMCategoryProcessor extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        
        // Cache for prompts
        this.promptCache = new Map();
        
        // Processing configuration
        this.config = {
            ...this.config,
            temperature: 0.1,
            maxTokens: 2000,
            enableValidation: true,
            minPatternConfidence: 0.6
        };
    }

    async initialize() {
        // Load prompts from database
        await this.loadPrompts();
    }

    async loadPrompts() {
        try {
            // Load prompts from insight_templates_v2
            const result = await this.db.query(`
                SELECT template_name, template_content, processing_config, description
                FROM insight_templates_v2
                WHERE is_active = true
            `);
            
            // Also store template descriptions for classification
            this.templateDescriptions = {};
            
            for (const row of result.rows) {
                this.promptCache.set(row.template_name, {
                    content: row.template_content,
                    config: row.processing_config || {}
                });
                
                if (row.description) {
                    this.templateDescriptions[row.template_name] = row.description;
                }
            }
            
            this.logger.info(`Loaded ${this.promptCache.size} prompts from insight_templates_v2`);
            
            if (this.promptCache.size === 0) {
                this.logger.warn('No prompts found in database, using defaults');
                this.useDefaultPrompts();
            }
        } catch (error) {
            this.logger.error('Failed to load prompts:', error);
            // Use default prompts as fallback
            this.useDefaultPrompts();
        }
    }

    useDefaultPrompts() {
        // Fallback prompts if database is unavailable
        this.promptCache.set('detect_patterns', {
            content: this.getDefaultPatternPrompt(),
            config: { temperature: 0.1, maxTokens: 2000 }
        });
    }

    getDetectionMethod() {
        return DetectionMethods.LLM_CATEGORY;
    }

    async process(memory, options = {}) {
        const startTime = Date.now();
        
        try {
            this.logger.info(`[LLMCategoryProcessor] Starting to process memory ${memory.id}`);
            
            if (!this.shouldProcess(memory, options)) {
                this.logger.info(`[LLMCategoryProcessor] Memory ${memory.id} skipped by shouldProcess check`);
                return [];
            }
            
            this.logger.info(`[LLMCategoryProcessor] Memory ${memory.id} passed shouldProcess check`);
            
            // Extract technologies first
            this.logger.info(`[LLMCategoryProcessor] Extracting technologies for memory ${memory.id}`);
            const technologies = await this.extractTechnologies(memory);
            this.logger.info(`[LLMCategoryProcessor] Found ${technologies.length} technologies`);
            
            // Detect patterns
            this.logger.info(`[LLMCategoryProcessor] Detecting patterns for memory ${memory.id}`);
            const patterns = await this.detectPatterns(memory, technologies);
            this.logger.info(`[LLMCategoryProcessor] Detected ${patterns.length} patterns`);
            
            // Generate insights from patterns
            this.logger.info(`[LLMCategoryProcessor] Generating insights from patterns`);
            const insights = await this.generateInsights(memory, patterns, technologies);
            this.logger.info(`[LLMCategoryProcessor] Generated ${insights.length} insights`);
            
            // Validate if enabled
            if (this.config.enableValidation && insights.length > 0) {
                this.logger.info(`[LLMCategoryProcessor] Validating insights`);
                const validated = await this.validateInsights(insights, memory);
                this.logger.info(`[LLMCategoryProcessor] ${validated.length} insights passed validation`);
                this.updateMetrics(Date.now() - startTime, true);
                return validated;
            }
            
            this.updateMetrics(Date.now() - startTime, true);
            return insights;
            
        } catch (error) {
            this.logger.error(`[LLMCategoryProcessor] Error processing memory ${memory.id}:`, error);
            this.updateMetrics(Date.now() - startTime, false);
            return [this.handleError(error, memory)];
        }
    }

    async extractTechnologies(memory) {
        try {
            // Use smart_tags from memory instead of calling LLM
            if (memory.smart_tags && Array.isArray(memory.smart_tags)) {
                this.logger.info(`[LLMCategoryProcessor] Using ${memory.smart_tags.length} smart_tags from memory`);
                
                // Convert smart_tags to technology format
                const technologies = memory.smart_tags
                    .filter(tag => tag && tag.length > 0)
                    .map(tag => ({
                        name: tag,
                        type: 'tag',
                        confidence: 0.9 // High confidence since these are pre-extracted
                    }));
                
                return technologies;
            }
            
            this.logger.info(`[LLMCategoryProcessor] No smart_tags found in memory, checking for prompt`);
            
            const prompt = this.promptCache.get('extract_technologies');
            this.logger.info(`[LLMCategoryProcessor] Extract technologies prompt found: ${!!prompt}`);
            
            if (!prompt) {
                this.logger.info(`[LLMCategoryProcessor] No technology extraction prompt, returning empty`);
                return [];
            }
            
            const filledPrompt = prompt.content.replace('{content}', memory.content);
            this.logger.info(`[LLMCategoryProcessor] Calling LLM for technology extraction`);
            
            const response = await this.llmService.generateAnalysis(
                filledPrompt,
                {
                    temperature: prompt.config.temperature || 0.1,
                    maxTokens: prompt.config.maxTokens || 800
                },
                'technology_extraction'
            );
            
            this.logger.info(`[LLMCategoryProcessor] LLM response received: ${!!response}`);
            
            const techs = this.parseTechnologies(response);
            this.logger.info(`[LLMCategoryProcessor] Parsed ${techs.length} technologies`);
            return techs;
        } catch (error) {
            this.logger.error('[LLMCategoryProcessor] Technology extraction failed:', error);
            return [];
        }
    }

    async classifyTemplates(memory) {
        try {
            // Build template list with descriptions
            const templateList = Object.entries(this.templateDescriptions)
                .filter(([name, _]) => name !== 'general_insights') // Save general for fallback
                .map(([name, desc]) => `- ${name}: ${desc}`)
                .join('\n');

            const classificationPrompt = `INSTRUCTION: You are a JSON extraction system. Return ONLY valid JSON. No other text allowed.

TASK: Select UP TO 2 most relevant analysis templates for the content below.

Available Templates:
${templateList}

Content to analyze:
${memory.content}

RETURN ONLY A JSON ARRAY with 1-2 template names, most relevant first.
Example response: ["technical_gotchas_pitfalls", "debugging_discoveries"]
DO NOT include any explanation or text outside the JSON array.`;

            // Log the full prompt for debugging
            this.logger.info('[LLMCategoryProcessor] FULL Classification prompt:', classificationPrompt);

            const response = await this.llmService.generateAnalysis(
                classificationPrompt,
                { temperature: 0.1, maxTokens: 100 },
                'template_classification'
            );
            
            // Log the full raw response
            this.logger.info('[LLMCategoryProcessor] FULL LLM response:', response.content);
            
            // Check for repetitive symbols before parsing
            if (/[@#*]{5,}/.test(response.content)) {
                this.logger.error('[LLMCategoryProcessor] Response contains repetitive symbols');
                return [];
            }
            
            // Parse the response
            const cleanedResponse = response.content.trim()
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            
            // Validate it's not empty or invalid
            if (!cleanedResponse || cleanedResponse.length < 2) {
                this.logger.error('[LLMCategoryProcessor] Empty or invalid response');
                return [];
            }
            
            let templates;
            try {
                templates = JSON.parse(cleanedResponse);
            } catch (jsonError) {
                this.logger.error('[LLMCategoryProcessor] Failed to parse JSON response:', jsonError);
                this.logger.debug('Cleaned response that failed:', cleanedResponse);
                return [];
            }
            
            if (Array.isArray(templates) && templates.length > 0) {
                // Validate that templates exist
                const validTemplates = templates
                    .slice(0, 2)
                    .filter(t => this.promptCache.has(t));
                
                if (validTemplates.length > 0) {
                    this.logger.info(`[LLMCategoryProcessor] Selected templates: ${validTemplates.join(', ')}`);
                    return validTemplates;
                }
            }
            
            return [];
        } catch (error) {
            this.logger.error('Template classification failed:', error);
            return [];
        }
    }

    async detectPatterns(memory, technologies) {
        try {
            // Use LLM to classify and select up to 2 templates
            let selectedTemplates = await this.classifyTemplates(memory);
            
            // Fallback logic
            if (selectedTemplates.length === 0) {
                this.logger.info('[LLMCategoryProcessor] No templates selected by LLM, using general_insights');
                selectedTemplates = ['general_insights'];
            }
            
            // Process with each selected template and collect all patterns
            const allPatterns = [];
            
            for (const templateName of selectedTemplates) {
                const prompt = this.promptCache.get(templateName);
                this.logger.info(`[LLMCategoryProcessor] Processing with template: ${templateName}, found: ${!!prompt}`);
                
                if (!prompt) {
                    this.logger.warn(`[LLMCategoryProcessor] Template ${templateName} not found in cache`);
                    continue;
                }
                
                try {
                    // L1 prompts expect different variables
                    const context = {
                        // For L1 prompts
                        content: memory.content,
                        metadata: JSON.stringify(memory.metadata || {}),
                        smart_tags: JSON.stringify(memory.smart_tags || []),
                        memory_type: memory.memory_type,
                        project_name: memory.project_name || 'General Development',
                        // For other prompts that might use these
                        memoryContent: memory.content,
                        memoryType: memory.memory_type,
                        technologies: this.formatTechnologies(technologies),
                        patternCategories: this.formatPatternCategories(),
                        projectName: memory.project_name || 'General Development'
                    };
                    
                    const filledPrompt = this.fillTemplate(prompt.content, context);
                    
                    const response = await this.llmService.generateAnalysis(
                        filledPrompt,
                        {
                            temperature: prompt.config.temperature || 0.1,
                            maxTokens: prompt.config.maxTokens || 2000
                        },
                        'pattern_detection'
                    );
                    
                    this.logger.debug(`LLM response type: ${typeof response}, has content: ${!!response.content}`);
                    if (response.content) {
                        this.logger.debug(`Response preview: ${response.content.substring(0, 200)}...`);
                    }
                    
                    const patterns = this.parsePatterns(response);
                    this.logger.info(`[LLMCategoryProcessor] Template ${templateName} produced ${patterns.length} patterns`);
                    
                    // Add template source to each pattern for tracking
                    patterns.forEach(p => p.sourceTemplate = templateName);
                    allPatterns.push(...patterns);
                    
                } catch (error) {
                    this.logger.error(`Pattern detection failed for template ${templateName}:`, error);
                }
            }
            
            // Deduplicate patterns if needed
            const uniquePatterns = this.deduplicatePatterns(allPatterns);
            this.logger.info(`[LLMCategoryProcessor] Total unique patterns: ${uniquePatterns.length}`);
            
            return uniquePatterns;
        } catch (error) {
            this.logger.error('Pattern detection failed:', error);
            return [];
        }
    }

    deduplicatePatterns(patterns) {
        if (!patterns || patterns.length === 0) return [];
        
        // Use pattern signature or name+category as key for deduplication
        const seen = new Map();
        
        for (const pattern of patterns) {
            const key = pattern.signature || `${pattern.name}_${pattern.category}`;
            
            if (!seen.has(key)) {
                seen.set(key, pattern);
            } else {
                // If we've seen this pattern, merge any unique evidence
                const existing = seen.get(key);
                if (pattern.evidence && existing.evidence) {
                    const combinedEvidence = [...new Set([...existing.evidence, ...pattern.evidence])];
                    existing.evidence = combinedEvidence;
                }
                // Keep the higher confidence score
                if (pattern.confidence > existing.confidence) {
                    existing.confidence = pattern.confidence;
                }
            }
        }
        
        return Array.from(seen.values());
    }

    async generateInsights(memory, patterns, technologies) {
        const insights = [];
        
        // Group patterns by category
        const patternsByCategory = this.groupPatternsByCategory(patterns);
        
        for (const [category, categoryPatterns] of Object.entries(patternsByCategory)) {
            if (categoryPatterns.length === 0) continue;
            
            // Create insight for each pattern category
            const insight = this.createCategoryInsight(memory, category, categoryPatterns);
            
            // Add technologies
            technologies.forEach(tech => this.addTechnology(insight, tech));
            
            // Add patterns
            categoryPatterns.forEach(pattern => this.addPattern(insight, pattern));
            
            // Add evidence
            this.addEvidence(insight, {
                type: 'pattern_detection',
                content: `Detected ${categoryPatterns.length} ${category} patterns`,
                confidence: insight.confidence_score
            });
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(category, categoryPatterns);
            recommendations.forEach(rec => this.addRecommendation(insight, rec));
            
            insights.push(insight);
        }
        
        return insights;
    }

    createCategoryInsight(memory, category, patterns) {
        const avgConfidence = patterns.reduce((sum, p) => sum + (p.confidence || 0.3), 0) / patterns.length;
        const patternNames = patterns.map(p => p.name).join(', ');
        
        // Ensure minimum confidence of 0.2 for any detected pattern
        const finalConfidence = Math.max(avgConfidence, 0.2);
        
        return this.createBaseInsight(memory, {
            type: this.mapCategoryToType(category),
            category: category,
            subcategory: patterns[0]?.subcategory || null,
            title: `${this.getCategoryTitle(category)} Patterns Detected`,
            summary: `Found ${patterns.length} ${category} patterns: ${patternNames}`,
            confidence: finalConfidence
        });
    }

    mapCategoryToType(category) {
        const mapping = {
            'architectural': InsightTypes.PATTERN,
            'design': InsightTypes.PATTERN,
            'api': InsightTypes.PATTERN,
            'security': InsightTypes.SECURITY_ISSUE,
            'performance': InsightTypes.PERFORMANCE_ISSUE,
            'antipatterns': InsightTypes.ANTI_PATTERN,
            'quality': InsightTypes.CODE_SMELL,
            'bug': InsightTypes.BUG
        };
        
        return mapping[category] || InsightTypes.PATTERN;
    }

    getCategoryTitle(category) {
        const titles = {
            'architectural': 'Architectural',
            'design': 'Design',
            'api': 'API & Integration',
            'security': 'Security',
            'performance': 'Performance',
            'antipatterns': 'Anti-Pattern',
            'quality': 'Code Quality'
        };
        
        return titles[category] || category;
    }

    generateRecommendations(category, patterns) {
        const recommendations = [];
        
        // Category-specific recommendations
        switch (category) {
            case 'antipatterns':
                recommendations.push({
                    action: 'Refactor anti-patterns',
                    priority: 'high',
                    reasoning: 'Anti-patterns can lead to maintenance issues',
                    impact: 'high'
                });
                break;
                
            case 'security':
                recommendations.push({
                    action: 'Review security patterns implementation',
                    priority: 'high',
                    reasoning: 'Security patterns need careful implementation',
                    impact: 'critical'
                });
                break;
                
            case 'performance':
                recommendations.push({
                    action: 'Benchmark performance patterns',
                    priority: 'medium',
                    reasoning: 'Verify performance improvements',
                    impact: 'medium'
                });
                break;
        }
        
        return recommendations;
    }

    async validateInsights(insights, memory) {
        // Simple validation - can be enhanced
        return insights.filter(insight => {
            return insight.confidence_score >= this.config.minPatternConfidence &&
                   insight.patterns.length > 0;
        });
    }

    // Parsing methods
    
    parseTechnologies(response) {
        try {
            const content = response.content || '';
            
            // Check for repetitive symbols
            if (/[@#*]{5,}/.test(content)) {
                this.logger.error('[LLMCategoryProcessor] Technology response contains repetitive symbols');
                return [];
            }
            
            // Try to extract JSON from code block first
            let jsonStr = '';
            const codeBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1];
            } else {
                // Try to find JSON object in the content
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
            }
            
            if (!jsonStr) {
                return [];
            }
            
            // Clean up common JSON issues
            jsonStr = jsonStr
                .replace(/,\s*}/g, '}')  // Remove trailing commas
                .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                .replace(/'/g, '"')      // Replace single quotes with double quotes
                .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
                .replace(/"\s*"/g, '"')  // Fix double quotes
                .replace(/\n\s*\n/g, '\n') // Remove extra newlines
                .replace(/[\x00-\x1F\x7F]/g, (match) => {
                    // Replace control characters with escaped versions
                    const controlChars = {
                        '\b': '\\b',
                        '\f': '\\f',
                        '\n': '\\n',
                        '\r': '\\r',
                        '\t': '\\t'
                    };
                    return controlChars[match] || ' ';
                }); // Handle control characters
            
            try {
                const parsed = JSON.parse(jsonStr);
                return parsed.technologies || [];
            } catch (parseError) {
                this.logger.error('Technology JSON parse error after cleanup:', parseError);
                
                // Try more aggressive cleanup
                try {
                    let aggressiveClean = jsonStr
                        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    const parsed = JSON.parse(aggressiveClean);
                    this.logger.info('Successfully parsed technologies after aggressive cleanup');
                    return parsed.technologies || [];
                } catch (secondError) {
                    this.logger.error('Failed technology parsing even after aggressive cleanup:', secondError);
                    return [];
                }
            }
            
        } catch (error) {
            this.logger.error('Failed to parse technologies:', error);
            return [];
        }
    }

    parsePatterns(response) {
        try {
            const content = response.content || '';
            
            // Check for repetitive symbols
            if (/[@#*]{5,}/.test(content)) {
                this.logger.error('[LLMCategoryProcessor] Pattern response contains repetitive symbols');
                return [];
            }
            
            // Log the raw response for debugging
            this.logger.info('[LLMCategoryProcessor] parsePatterns - Raw LLM response:', {
                preview: content.substring(0, 500),
                length: content.length,
                startsWith: content.substring(0, 50)
            });
            
            // Try to extract JSON from code block first
            let jsonStr = '';
            const codeBlockMatch = content.match(/```json\n([\s\S]*?)\n```/);
            if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1];
                this.logger.debug('Found JSON in code block');
            } else {
                // Try to find JSON object in the content
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                    this.logger.debug('Found JSON object in content');
                }
            }
            
            if (!jsonStr) {
                this.logger.warn('No JSON found in LLM response');
                // Check if response contains error message
                if (content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')) {
                    this.logger.error('LLM returned error:', content);
                }
                return [];
            }
            
            this.logger.info('[LLMCategoryProcessor] JSON string before cleanup:', {
                preview: jsonStr.substring(0, 200),
                length: jsonStr.length,
                firstChar: jsonStr.charAt(0),
                firstCharCode: jsonStr.charCodeAt(0)
            });
            
            // Clean up common JSON issues
            jsonStr = jsonStr
                .replace(/,\s*}/g, '}')  // Remove trailing commas
                .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                .replace(/'/g, '"')      // Replace single quotes with double quotes
                .replace(/(\w+):/g, '"$1":') // Quote unquoted keys
                .replace(/"\s*"/g, '"')  // Fix double quotes
                .replace(/\n\s*\n/g, '\n') // Remove extra newlines
                .replace(/[\x00-\x1F\x7F]/g, (match) => {
                    // Replace control characters with escaped versions
                    const controlChars = {
                        '\b': '\\b',
                        '\f': '\\f',
                        '\n': '\\n',
                        '\r': '\\r',
                        '\t': '\\t'
                    };
                    return controlChars[match] || ' ';
                }); // Handle control characters
            
            this.logger.info('[LLMCategoryProcessor] JSON string after cleanup:', {
                preview: jsonStr.substring(0, 200),
                length: jsonStr.length,
                firstChar: jsonStr.charAt(0),
                firstCharCode: jsonStr.charCodeAt(0)
            });
            
            try {
                const parsed = JSON.parse(jsonStr);
                
                // Check if this is an L1 response format
                if (parsed.confidence !== undefined && parsed.key_findings && parsed.insight) {
                    this.logger.info('Detected L1 response format, converting to patterns');
                    
                    // Convert L1 format to pattern format
                    const patterns = [];
                    if (parsed.key_findings && parsed.key_findings.length > 0) {
                        patterns.push({
                            name: parsed.key_findings[0] || 'Identified Pattern',
                            category: this.inferCategoryFromTags(parsed.tags || []),
                            subcategory: parsed.tags ? parsed.tags[0] : null,
                            description: parsed.insight || 'Pattern identified from analysis',
                            confidence: parsed.confidence || 0.7,
                            evidence: parsed.key_findings || [],
                            implications: parsed.insight || '',
                            context: parsed.confidence_reasoning || ''
                        });
                    }
                    
                    return patterns.map(pattern => ({
                        ...pattern,
                        signature: this.generatePatternSignature(pattern)
                    }));
                }
                
                // Standard pattern format
                return (parsed.patterns || []).map(pattern => ({
                    ...pattern,
                    signature: this.generatePatternSignature(pattern),
                    confidence: pattern.confidence || 0.7
                }));
            } catch (parseError) {
                this.logger.error('JSON parse error after cleanup:', parseError);
                this.logger.debug('Cleaned JSON string:', jsonStr.substring(0, 500) + '...');
                
                // Try more aggressive cleanup
                try {
                    // Remove all control characters except space, tab, newline
                    let aggressiveClean = jsonStr
                        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
                        .replace(/\s+/g, ' ') // Normalize whitespace
                        .trim();
                    
                    const parsed = JSON.parse(aggressiveClean);
                    this.logger.info('Successfully parsed after aggressive cleanup');
                    return (parsed.patterns || []).map(pattern => ({
                        ...pattern,
                        signature: this.generatePatternSignature(pattern),
                        confidence: pattern.confidence || 0.7
                    }));
                } catch (secondError) {
                    this.logger.error('Failed even after aggressive cleanup:', secondError);
                    
                    // Last resort - try to extract meaningful information from the response
                    if (content.length > 50) {
                        this.logger.info('Attempting fallback pattern extraction from non-JSON response');
                        
                        // Look for pattern-like descriptions in the text
                        const fallbackPattern = {
                            name: 'Content Analysis',
                            category: 'general',
                            description: 'LLM provided analysis but not in expected JSON format',
                            confidence: 0.3,
                            evidence: [content.substring(0, 200)],
                            implications: 'Manual review recommended',
                            context: 'Fallback pattern extraction'
                        };
                        
                        return [fallbackPattern];
                    }
                    
                    return [];
                }
            }
            
        } catch (error) {
            this.logger.error('Failed to parse patterns:', error);
            return [];
        }
    }

    // Helper methods
    
    formatTechnologies(technologies) {
        if (!technologies || technologies.length === 0) {
            return 'No specific technologies identified';
        }
        
        return technologies
            .map(t => `${t.name}${t.version ? ` ${t.version}` : ''}`)
            .join(', ');
    }

    formatPatternCategories() {
        return Object.entries(PatternCategories)
            .map(([key, cat]) => `**${cat.name}**: ${cat.subcategories.join(', ')}`)
            .join('\n');
    }

    fillTemplate(template, context) {
        return template.replace(/{(\w+)}/g, (match, key) => context[key] || match);
    }

    groupPatternsByCategory(patterns) {
        const grouped = {};
        
        for (const pattern of patterns) {
            const category = pattern.category || 'general';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(pattern);
        }
        
        return grouped;
    }

    shouldProcess(memory, options) {
        // Process all memory types with content
        const skipTypes = ['system', 'processing_marker'];
        if (skipTypes.includes(memory.memory_type)) {
            return false;
        }
        
        // Process if has substantial content
        return memory.content && memory.content.length > 50;
    }

    getDefaultPatternPrompt() {
        return `INSTRUCTION: You are a JSON extraction system. Return ONLY valid JSON. No other text allowed.

TASK: Analyze the memory content below to identify software development patterns.

Memory Type: {memoryType}
Technologies: {technologies}

CONTENT TO ANALYZE:
{memoryContent}

AVAILABLE PATTERN CATEGORIES:
{patternCategories}

PATTERN IDENTIFICATION CRITERIA:
1. Must be a concrete, identifiable pattern (not vague observations)
2. Must have specific evidence from the content
3. Must fit into one of the categories above
4. Must have clear implications for development

REQUIRED JSON STRUCTURE:
{
  "patterns": [
    {
      "name": "<specific pattern name>",
      "category": "<category from list above>",
      "subcategory": "<subcategory if applicable>",
      "description": "<what this pattern does/represents>",
      "confidence": <0.0-1.0>,
      "evidence": ["<specific quote or reference from content>"],
      "implications": "<impact of this pattern on the project>",
      "context": "<when/where this pattern is used>"
    }
  ]
}

CONFIDENCE SCORING:
- 0.9-1.0: Explicit pattern with clear evidence
- 0.7-0.9: Strong indicators of pattern
- 0.5-0.7: Moderate evidence of pattern
- Below 0.5: Weak or uncertain pattern

FALLBACK BEHAVIOR:
If no clear patterns are found, return:
{
  "patterns": []
}

CRITICAL REQUIREMENTS:
- Return ONLY the JSON object
- Start your response with {
- End your response with }
- Do NOT include any explanations, markdown, or text outside the JSON
- All string values must be properly quoted
- All arrays must be properly formatted
- Confidence must be a number, not a string

RETURN ONLY THE JSON OBJECT. START YOUR RESPONSE WITH {`;
    }
    
    generatePatternSignature(pattern) {
        const key = `${pattern.category}_${pattern.name}`
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_');
        return key;
    }
    
    inferCategoryFromTags(tags) {
        if (!tags || tags.length === 0) return 'general';
        
        const tagStr = tags.join(' ').toLowerCase();
        
        if (tagStr.includes('api') || tagStr.includes('integration')) {
            return 'api';
        } else if (tagStr.includes('architect') || tagStr.includes('design')) {
            return 'architectural';
        } else if (tagStr.includes('debug') || tagStr.includes('error')) {
            return 'debugging';
        } else if (tagStr.includes('perform')) {
            return 'performance';
        } else if (tagStr.includes('security')) {
            return 'security';
        } else if (tagStr.includes('gotcha') || tagStr.includes('pitfall')) {
            return 'antipatterns';
        }
        
        return 'general';
    }
}

export default LLMCategoryProcessor;