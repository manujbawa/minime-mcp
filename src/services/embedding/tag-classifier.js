/**
 * Hierarchical Tag Classifier Service
 * Implements two-step classification optimized for 7B parameter models
 * Uses database-driven taxonomy for dynamic tag management
 */

export class HierarchicalTagClassifier {
    constructor(logger, dbPool, llmService, mcpPromptsService = null) {
        this.logger = logger;
        this.db = dbPool;
        this.llm = llmService;
        this.prompts = mcpPromptsService;
        
        // Cache for tag taxonomy
        this.categoryCache = null;
        this.tagCache = new Map(); // categoryId -> tags[]
        this.cacheExpiry = Date.now() + (60 * 60 * 1000); // 1 hour
        
        // Configuration
        this.config = {
            maxTags: 6,
            minTags: 3,
            temperature: 0.1,
            maxRetries: 2,
            cacheEnabled: true
        };
    }

    /**
     * Extract JSON from LLM response that might contain markdown or explanatory text
     */
    _extractJsonFromResponse(response) {
        const trimmed = response.trim();
        
        // Try to parse as-is first (pure JSON)
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            // If that fails, try to extract JSON from markdown code blocks
            const jsonBlockMatch = trimmed.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
            if (jsonBlockMatch) {
                try {
                    return JSON.parse(jsonBlockMatch[1]);
                } catch (e2) {
                    // Fall through to other methods
                }
            }
            
            // Try to find JSON array in the response
            const arrayMatch = trimmed.match(/\[[\s\S]*?\]/);
            if (arrayMatch) {
                try {
                    return JSON.parse(arrayMatch[0]);
                } catch (e3) {
                    // Fall through to final fallback
                }
            }
            
            // If all else fails, throw the original error
            throw e;
        }
    }

    /**
     * Extract comma-delimited response from LLM that might contain extra text
     */
    _extractCommaDelimitedResponse(response) {
        const trimmed = response.trim();
        
        // Look for comma-separated values (with or without quotes)
        const commaMatch = trimmed.match(/([a-zA-Z0-9_\-\s,]+)/);
        if (commaMatch) {
            // Split by comma and clean up each item
            return commaMatch[1]
                .split(',')
                .map(item => item.trim().replace(/['"]/g, ''))
                .filter(item => item.length > 0);
        }
        
        // Fallback: split the entire response by comma
        return trimmed
            .split(',')
            .map(item => item.trim().replace(/['"]/g, ''))
            .filter(item => item.length > 0);
    }

    /**
     * Main classification method - uses centralized prompt or falls back to hierarchical
     */
    async classifyContent(content, options = {}) {
        const {
            memoryType = 'note',
            projectContext = null,
            quickMode = false
        } = options;

        try {
            // Step 1: Extract obvious tags from content patterns
            const quickTags = this._extractObviousTags(content);
            
            if (quickMode) {
                return {
                    tags: quickTags.slice(0, this.config.maxTags),
                    confidence: 0.7,
                    method: 'quick'
                };
            }

            // Step 2: Use centralized classification if available - JSON RESPONSE FORMAT
            if (this.prompts) {
                let response;
                let classifiedTags = [];
                let attempts = 0;
                const maxAttempts = 3;
                
                // Retry loop for malformed responses
                while (attempts < maxAttempts) {
                    attempts++;
                    
                    try {
                        response = await this.llm.generateResponse(
                            this.prompts.buildTagClassificationPrompt({
                                content: content.substring(0, 16000),
                                memory_type: memoryType
                            }), 
                            {
                                temperature: this.config.temperature + (attempts - 1) * 0.1, // Slightly increase temperature on retries
                                max_tokens: 300 // Increased for JSON format
                            }
                        );

                        // Extract and parse JSON response
                        const jsonData = this._extractJsonFromResponse(response);
                        
                        // Validate JSON structure
                        if (!Array.isArray(jsonData)) {
                            throw new Error('Response is not a JSON array');
                        }
                        
                        // Extract tags from JSON objects
                        classifiedTags = jsonData
                            .filter(item => item && typeof item === 'object' && item.topic)
                            .map(item => {
                                // Combine topic and language if both present
                                if (item.language && item.language !== 'None' && item.language !== 'Generic') {
                                    return `${item.topic} (${item.language})`;
                                }
                                return item.topic;
                            })
                            .filter(tag => tag && tag.length > 1);
                        
                        // Check if we got valid tags
                        if (classifiedTags.length > 0) {
                            break; // Success, exit retry loop
                        } else if (attempts < maxAttempts) {
                            this.logger.warn(`Tag classification attempt ${attempts} returned no valid tags from JSON: ${JSON.stringify(jsonData)}`);
                            continue; // Retry
                        }
                        
                    } catch (error) {
                        this.logger.error(`Tag classification attempt ${attempts} failed:`, error);
                        this.logger.debug(`Raw response was: "${response}"`);
                        if (attempts >= maxAttempts) {
                            // Final fallback: try to extract comma-delimited tags from raw response
                            try {
                                classifiedTags = this._extractCommaDelimitedResponse(response);
                                if (classifiedTags.length > 0) {
                                    this.logger.warn('Fell back to comma-delimited parsing after JSON parsing failed');
                                    break;
                                }
                            } catch (fallbackError) {
                                this.logger.error('Both JSON and comma-delimited parsing failed');
                            }
                            throw error; // Re-throw on final attempt
                        }
                        // Continue to next attempt
                    }
                }
                
                // Basic normalization to ensure consistency
                const normalizedTags = classifiedTags
                    .map(tag => this._normalizeTagName(tag))
                    .filter(tag => tag && tag.length > 0)
                    .slice(0, this.config.maxTags);

                this.logger.debug(`Tag classification completed after ${attempts} attempts: ${normalizedTags}`);

                return {
                    tags: normalizedTags,
                    confidence: 0.9,
                    method: 'centralized_json',
                    attempts: attempts
                };
            }

            // Fallback: Load categories and tags from database (only if no prompts service)
            const categories = await this.loadCategories();
            
            // Step 3: Two-phase LLM classification
            const enrichedTags = await this._performHierarchicalClassification(
                content,
                memoryType,
                projectContext,
                quickTags,
                categories
            );

            // Step 4: Update usage statistics
            await this.updateTagUsage(enrichedTags);

            return {
                tags: enrichedTags,
                confidence: 0.9,
                method: 'hierarchical'
            };

        } catch (error) {
            this.logger.error('Tag classification failed:', error);
            // Fallback to quick tags on error
            return {
                tags: this._extractObviousTags(content).slice(0, this.config.maxTags),
                confidence: 0.5,
                method: 'fallback',
                error: error.message
            };
        }
    }

    /**
     * Load active categories from database with caching
     */
    async loadCategories() {
        // Check cache
        if (this.config.cacheEnabled && this.categoryCache && Date.now() < this.cacheExpiry) {
            return this.categoryCache;
        }

        const query = `
            SELECT id, category_name, description, selection_prompt, priority
            FROM tag_categories
            WHERE is_active = true
            ORDER BY priority ASC
        `;

        const result = await this.db.query(query);
        this.categoryCache = result.rows;
        this.cacheExpiry = Date.now() + (60 * 60 * 1000); // Refresh cache every hour
        
        return this.categoryCache;
    }

    /**
     * Load tags for specific categories
     */
    async loadTagsForCategories(categoryIds) {
        const uncachedIds = categoryIds.filter(id => !this.tagCache.has(id));
        
        if (uncachedIds.length > 0) {
            const query = `
                SELECT category_id, tag_name, description, aliases
                FROM tags
                WHERE category_id = ANY($1) AND is_active = true
                ORDER BY usage_count DESC
            `;

            const result = await this.db.query(query, [uncachedIds]);
            
            // Group by category and cache
            for (const row of result.rows) {
                if (!this.tagCache.has(row.category_id)) {
                    this.tagCache.set(row.category_id, []);
                }
                this.tagCache.get(row.category_id).push(row);
            }
        }

        // Return requested tags
        const tags = {};
        for (const id of categoryIds) {
            tags[id] = this.tagCache.get(id) || [];
        }
        return tags;
    }

    /**
     * Two-step hierarchical classification
     */
    async _performHierarchicalClassification(content, memoryType, projectContext, quickTags, categories) {
        // Phase 1: Select relevant categories
        const relevantCategories = await this._selectRelevantCategories(
            content,
            memoryType,
            categories
        );

        if (relevantCategories.length === 0) {
            return quickTags.slice(0, this.config.maxTags);
        }

        // Phase 2: Select specific tags from relevant categories
        const categoryIds = relevantCategories.map(c => c.id);
        const availableTags = await this.loadTagsForCategories(categoryIds);
        
        const selectedTags = await this._selectSpecificTags(
            content,
            memoryType,
            projectContext,
            relevantCategories,
            availableTags,
            quickTags
        );

        return this._validateAndNormalizeTags(selectedTags);
    }

    /**
     * Phase 1: Select relevant categories using LLM with centralized prompt
     */
    async _selectRelevantCategories(content, memoryType, categories) {
        try {
            // Use centralized tag classification prompt if available
            if (this.prompts) {
                const response = await this.llm.generateResponse(
                    this.prompts.buildTagClassificationPrompt({
                        content: content.substring(0, 16000),
                        memory_type: memoryType
                    }), 
                    {
                        temperature: this.config.temperature,
                        max_tokens: 150
                    }
                );

                const selectedNames = this._extractCommaDelimitedResponse(response);
                return categories.filter(c => selectedNames.includes(c.category_name));
            }

            // Fallback to basic prompt if MCP prompts service not available
            const prompt = `You are a code analyzer that identifies relevant categories for development content.

Content to analyze:
${content.substring(0, 16000)}

Memory Type: ${memoryType}

Available Categories:
${categories.map(c => `- ${c.category_name}: ${c.selection_prompt}`).join('\n')}

Select 2-4 most relevant categories that apply to this content.
Return ONLY the category names as a comma-delimited string, nothing else.

Example: Technology, Architecture, Phase`;

            const response = await this.llm.generateResponse(prompt, {
                temperature: this.config.temperature,
                max_tokens: 100
            });

            const selectedNames = this._extractCommaDelimitedResponse(response);
            return categories.filter(c => selectedNames.includes(c.category_name));
        } catch (error) {
            this.logger.error('Category selection failed:', error);
            // Default to first 3 categories
            return categories.slice(0, 3);
        }
    }

    /**
     * Phase 2: Select specific tags from categories (now using centralized classification)
     */
    async _selectSpecificTags(content, memoryType, projectContext, categories, availableTags, quickTags) {
        try {
            // Since we're using the comprehensive centralized prompt, 
            // we can directly return the categories as tags
            if (this.prompts) {
                // The centralized prompt already provides the best tags
                // Just return the category names as tags
                return categories.map(cat => cat.category_name);
            }

            // Fallback to detailed tag selection if MCP prompts not available
            const tagsByCategory = categories.map(cat => ({
                category: cat.category_name,
                tags: availableTags[cat.id].map(t => t.tag_name).join(', ')
            }));

            const prompt = `You are a precise tag classifier for development content.

Content: ${content.substring(0, 16000)}
Type: ${memoryType}
${projectContext ? `Project: ${projectContext}` : ''}
Already detected: ${quickTags.join(', ')}

Available tags by category:
${tagsByCategory.map(tc => `${tc.category}: ${tc.tags}`).join('\n')}

Rules:
1. Select ${this.config.minTags}-${this.config.maxTags} most specific and relevant tags
2. Include already detected tags if they're in the available list
3. Prefer specific tags over general ones
4. Ensure good coverage across categories
5. ONLY use tags from the provided lists

Return ONLY the tag names as a comma-delimited string, nothing else.`;

            const response = await this.llm.generateResponse(prompt, {
                temperature: this.config.temperature,
                max_tokens: 150
            });

            return this._extractCommaDelimitedResponse(response);
        } catch (error) {
            this.logger.error('Tag selection failed:', error);
            return quickTags;
        }
    }

    /**
     * Extract obvious tags using pattern matching
     */
    _extractObviousTags(content) {
        const tags = new Set();
        const contentLower = content.toLowerCase();

        // Technology detection patterns
        const techPatterns = {
            'javascript': /\b(javascript|\.js|node\.js|nodejs)\b/i,
            'typescript': /\b(typescript|\.ts|\.tsx)\b/i,
            'python': /\b(python|\.py|django|flask)\b/i,
            'react': /\b(react|jsx|usestate|useeffect)\b/i,
            'docker': /\b(docker|dockerfile|container)\b/i,
            'kubernetes': /\b(kubernetes|k8s|kubectl)\b/i,
            'api': /\b(api|endpoint|rest|graphql)\b/i,
            'database': /\b(database|sql|postgres|mongodb|query)\b/i
        };

        // Architecture patterns
        const archPatterns = {
            'authentication': /\b(auth|jwt|oauth|login|password)\b/i,
            'caching': /\b(cache|redis|memcache|cached)\b/i,
            'testing': /\b(test|spec|jest|pytest|unit\s+test)\b/i,
            'performance': /\b(performance|optimize|latency|speed)\b/i,
            'security': /\b(security|vulnerability|encryption|xss|csrf)\b/i
        };

        // Phase patterns
        const phasePatterns = {
            'bugfix': /\b(bug|fix|issue|error|broken)\b/i,
            'feature': /\b(feature|implement|add|new\s+functionality)\b/i,
            'refactor': /\b(refactor|cleanup|improve|reorganize)\b/i,
            'deployment': /\b(deploy|deployment|ci\/cd|pipeline)\b/i
        };

        // Domain patterns
        const domainPatterns = {
            'frontend': /\b(frontend|ui|user\s+interface|css|html)\b/i,
            'backend': /\b(backend|server|api|database|service)\b/i,
            'devops': /\b(devops|deployment|infrastructure|ci\/cd)\b/i
        };

        // Check all patterns
        const allPatterns = {
            ...techPatterns,
            ...archPatterns,
            ...phasePatterns,
            ...domainPatterns
        };

        for (const [tag, pattern] of Object.entries(allPatterns)) {
            if (pattern.test(contentLower)) {
                tags.add(tag);
            }
        }

        // Check for specific code patterns
        if (content.includes('```')) tags.add('code');
        if (/function|const|class|import|export/.test(content)) tags.add('implementation');
        if (/TODO|FIXME|NOTE/.test(content)) tags.add('todo');

        return Array.from(tags);
    }

    /**
     * Validate and normalize selected tags
     */
    async _validateAndNormalizeTags(tags) {
        // Get all valid tags from database for normalization
        const query = `
            SELECT tag_name, aliases 
            FROM tags 
            WHERE is_active = true
        `;
        
        const result = await this.db.query(query);
        const validTags = new Map();
        
        // Build valid tag map including aliases
        for (const row of result.rows) {
            validTags.set(row.tag_name.toLowerCase(), row.tag_name);
            if (row.aliases) {
                for (const alias of row.aliases) {
                    validTags.set(alias.toLowerCase(), row.tag_name);
                }
            }
        }

        // Normalize and validate
        const normalizedTags = [];
        const seen = new Set();
        
        for (const tag of tags) {
            // First try to find existing tag (for normalization)
            const existingTag = validTags.get(tag.toLowerCase());
            
            if (existingTag && !seen.has(existingTag)) {
                // Use existing tag from database
                normalizedTags.push(existingTag);
                seen.add(existingTag);
            } else {
                // Allow AI-generated tags with basic validation
                const cleanTag = this._normalizeTagName(tag);
                if (cleanTag && cleanTag.length >= 2 && cleanTag.length <= 50 && !seen.has(cleanTag)) {
                    normalizedTags.push(cleanTag);
                    seen.add(cleanTag);
                }
            }
        }

        // Ensure we have at least minTags
        if (normalizedTags.length < this.config.minTags) {
            // Add some default tags based on content
            const defaults = ['general', 'development', 'note'];
            for (const def of defaults) {
                if (normalizedTags.length < this.config.minTags && !seen.has(def)) {
                    normalizedTags.push(def);
                    seen.add(def);
                }
            }
        }

        return normalizedTags.slice(0, this.config.maxTags);
    }

    /**
     * Normalize tag name for consistency
     */
    _normalizeTagName(tag) {
        if (!tag || typeof tag !== 'string') return null;
        
        // Basic cleanup and normalization
        return tag
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\-_]/g, '-')  // Replace invalid chars with hyphens
            .replace(/-+/g, '-')            // Replace multiple hyphens with single
            .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
    }

    /**
     * Update tag usage statistics
     */
    async updateTagUsage(tagNames) {
        if (tagNames.length === 0) return;

        const query = `
            UPDATE tags 
            SET usage_count = usage_count + 1
            WHERE tag_name = ANY($1)
        `;

        try {
            await this.db.query(query, [tagNames]);
        } catch (error) {
            this.logger.error('Failed to update tag usage:', error);
        }
    }

    /**
     * Generate enhanced summary for content using MCP prompts system
     */
    async generateSummary(content, memoryType = 'note', maxLength = 500) {
        try {
            // Use enhanced summary prompt if available
            if (this.prompts) {
                const prompt = this.prompts.buildMemorySummaryPrompt({
                    content: content,
                    memory_type: memoryType,
                    max_length: maxLength
                });

                const response = await this.llm.generateResponse(prompt, {
                    temperature: 0.1,
                    max_tokens: Math.ceil(maxLength / 3) // Roughly 3 chars per token
                });

                const summary = response.trim().replace(/^["']|["']$/g, '');
                return summary.substring(0, maxLength);
            }

            // Fallback to basic summary if prompts service not available
            const basicPrompt = `Summarize this development content in one concise sentence (max ${maxLength} chars):
       
${content.substring(0, 1000)}

Summary:`;

            const response = await this.llm.generateResponse(basicPrompt, {
                temperature: 0.1,
                max_tokens: Math.ceil(maxLength / 4)
            });

            const summary = response.trim().replace(/^["']|["']$/g, '');
            return summary.substring(0, maxLength);

        } catch (error) {
            this.logger.error('Summary generation failed:', error);
            // Fallback to first line or sentence
            const firstLine = content.split('\n')[0];
            return firstLine.substring(0, maxLength);
        }
    }

    /**
     * Clear caches - useful for testing or when tags are updated
     */
    clearCache() {
        this.categoryCache = null;
        this.tagCache.clear();
        this.cacheExpiry = Date.now();
    }
}