/**
 * Memory Tag Generator Service
 * Composable component for intelligent tag generation
 * Supports both pattern-based and AI-powered tag classification
 */

export class MemoryTagGenerator {
    constructor(logger, tagClassifier = null) {
        this.logger = logger;
        this.tagClassifier = tagClassifier;
        
        // Quick pattern-based tags with priority scoring
        this.quickPatterns = {
            // Programming Languages & Frameworks
            technology: {
                // Frontend
                'react': { pattern: /\b(react|jsx|tsx|component|hook|usestate|useeffect)\b/i, priority: 0.9 },
                'vue': { pattern: /\b(vue|vuex|nuxt|composition-api)\b/i, priority: 0.9 },
                'angular': { pattern: /\b(angular|typescript|rxjs|observable)\b/i, priority: 0.9 },
                'svelte': { pattern: /\b(svelte|sveltekit)\b/i, priority: 0.9 },
                'nextjs': { pattern: /\b(next\.?js|nextjs|next)\b/i, priority: 0.8 },
                
                // Backend
                'nodejs': { pattern: /\b(node\.?js|express|fastify|koa)\b/i, priority: 0.9 },
                'python': { pattern: /\b(python|django|flask|fastapi|pip|conda)\b/i, priority: 0.9 },
                'java': { pattern: /\b(java|spring|maven|gradle)\b/i, priority: 0.9 },
                'csharp': { pattern: /\b(c#|\.net|asp\.net|nuget)\b/i, priority: 0.9 },
                'golang': { pattern: /\b(go|golang|goroutine)\b/i, priority: 0.9 },
                'rust': { pattern: /\b(rust|cargo|rustc)\b/i, priority: 0.9 },
                'php': { pattern: /\b(php|laravel|symfony|composer)\b/i, priority: 0.9 },
                
                // Languages
                'javascript': { pattern: /\b(javascript|js|es6|es2015|es2020)\b/i, priority: 0.8 },
                'typescript': { pattern: /\b(typescript|ts|interface|type)\b/i, priority: 0.8 },
                'html': { pattern: /\b(html|html5|dom|semantic)\b/i, priority: 0.7 },
                'css': { pattern: /\b(css|css3|sass|scss|less|tailwind)\b/i, priority: 0.7 },
                
                // Databases
                'postgresql': { pattern: /\b(postgres|postgresql|pg|psql)\b/i, priority: 0.8 },
                'mysql': { pattern: /\b(mysql|mariadb)\b/i, priority: 0.8 },
                'mongodb': { pattern: /\b(mongo|mongodb|mongoose)\b/i, priority: 0.8 },
                'redis': { pattern: /\b(redis|cache|session-store)\b/i, priority: 0.8 },
                'sqlite': { pattern: /\b(sqlite|sqlite3)\b/i, priority: 0.7 },
                
                // Cloud & Infrastructure
                'aws': { pattern: /\b(aws|amazon|s3|ec2|lambda|cloudformation)\b/i, priority: 0.8 },
                'azure': { pattern: /\b(azure|microsoft|azure-functions)\b/i, priority: 0.8 },
                'gcp': { pattern: /\b(gcp|google-cloud|firebase)\b/i, priority: 0.8 },
                'docker': { pattern: /\b(docker|dockerfile|container|image)\b/i, priority: 0.8 },
                'kubernetes': { pattern: /\b(k8s|kubernetes|kubectl|helm)\b/i, priority: 0.8 },
                
                // Tools & Services
                'git': { pattern: /\b(git|github|gitlab|bitbucket)\b/i, priority: 0.7 },
                'api': { pattern: /\b(api|rest|graphql|endpoint)\b/i, priority: 0.8 },
                'websocket': { pattern: /\b(websocket|ws|socket\.io)\b/i, priority: 0.8 },
                'microservices': { pattern: /\b(microservice|microservices|service-mesh)\b/i, priority: 0.8 }
            },
            
            // Development Context
            context: {
                'bugfix': { pattern: /\b(bug|fix|error|issue|debugging)\b/i, priority: 0.9 },
                'feature': { pattern: /\b(feature|implement|add|create|new)\b/i, priority: 0.8 },
                'refactor': { pattern: /\b(refactor|cleanup|optimize|restructure)\b/i, priority: 0.8 },
                'testing': { pattern: /\b(test|spec|jest|mocha|cypress|playwright|unit|integration)\b/i, priority: 0.8 },
                'documentation': { pattern: /\b(docs|documentation|readme|guide|tutorial)\b/i, priority: 0.7 },
                'performance': { pattern: /\b(performance|optimization|speed|latency|throughput)\b/i, priority: 0.8 },
                'security': { pattern: /\b(security|auth|authentication|authorization|jwt|oauth|vulnerability)\b/i, priority: 0.9 },
                'deployment': { pattern: /\b(deploy|deployment|ci\/cd|pipeline|release)\b/i, priority: 0.8 },
                'migration': { pattern: /\b(migration|migrate|upgrade|update)\b/i, priority: 0.7 },
                'configuration': { pattern: /\b(config|configuration|settings|env|environment)\b/i, priority: 0.7 }
            },
            
            // Architecture & Design
            architecture: {
                'frontend': { pattern: /\b(frontend|client-side|ui|user-interface)\b/i, priority: 0.8 },
                'backend': { pattern: /\b(backend|server-side|api|service)\b/i, priority: 0.8 },
                'fullstack': { pattern: /\b(fullstack|full-stack|end-to-end)\b/i, priority: 0.8 },
                'database': { pattern: /\b(database|db|schema|query|sql|nosql)\b/i, priority: 0.8 },
                'architecture': { pattern: /\b(architecture|design|pattern|structure)\b/i, priority: 0.8 },
                'scalability': { pattern: /\b(scalability|scale|scaling|load|capacity)\b/i, priority: 0.8 },
                'monitoring': { pattern: /\b(monitoring|logging|metrics|observability)\b/i, priority: 0.7 },
                'integration': { pattern: /\b(integration|webhook|third-party|external)\b/i, priority: 0.7 }
            },
            
            // Project Management
            project: {
                'planning': { pattern: /\b(planning|plan|roadmap|strategy)\b/i, priority: 0.7 },
                'milestone': { pattern: /\b(milestone|deadline|sprint|iteration)\b/i, priority: 0.8 },
                'requirements': { pattern: /\b(requirements|specification|criteria|acceptance)\b/i, priority: 0.7 },
                'review': { pattern: /\b(review|feedback|retrospective|analysis)\b/i, priority: 0.7 },
                'decision': { pattern: /\b(decision|choice|alternative|option)\b/i, priority: 0.8 },
                'research': { pattern: /\b(research|investigation|analysis|study)\b/i, priority: 0.7 }
            }
        };
        
        // Memory type specific tag patterns
        this.typeSpecificPatterns = {
            code: {
                'algorithm': /\b(algorithm|sort|search|recursive|iterative)\b/i,
                'data-structure': /\b(array|list|map|set|tree|graph|hash)\b/i,
                'async': /\b(async|await|promise|callback|concurrent)\b/i,
                'error-handling': /\b(try|catch|error|exception|throw)\b/i,
                'validation': /\b(validate|validation|sanitize|check)\b/i
            },
            decision: {
                'trade-off': /\b(trade-off|pros|cons|comparison|versus)\b/i,
                'evaluation': /\b(evaluation|assess|analyze|consider)\b/i,
                'recommendation': /\b(recommend|suggest|propose|advise)\b/i,
                'rationale': /\b(rationale|reason|because|justification)\b/i
            },
            rule: {
                'convention': /\b(convention|standard|guideline|practice)\b/i,
                'policy': /\b(policy|rule|constraint|restriction)\b/i,
                'best-practice': /\b(best-practice|recommended|should|must)\b/i,
                'coding-standard': /\b(coding|style|format|linting)\b/i
            },
            progress: {
                'completion': /\b(complete|done|finished|delivered)\b/i,
                'milestone': /\b(milestone|phase|stage|sprint)\b/i,
                'status': /\b(status|progress|update|report)\b/i,
                'achievement': /\b(achievement|accomplished|success)\b/i
            }
        };
        
        // Tag categories for organization
        this.tagCategories = {
            technology: ['react', 'nodejs', 'python', 'javascript', 'typescript', 'docker', 'kubernetes'],
            context: ['bugfix', 'feature', 'refactor', 'testing', 'documentation', 'performance', 'security'],
            architecture: ['frontend', 'backend', 'database', 'api', 'microservices', 'scalability'],
            project: ['planning', 'milestone', 'requirements', 'decision', 'research']
        };
    }

    /**
     * Generate tags for memory content
     */
    async generate(content, memoryType, options = {}) {
        const {
            projectContext = null,
            useAI = false,
            maxTags = 5,
            includeTypeSpecific = true,
            prioritizeRelevance = true
        } = options;
        
        try {
            // 1. Generate quick pattern-based tags
            const quickTags = this._generateQuickTags(content, memoryType, {
                includeTypeSpecific,
                projectContext
            });
            
            // 2. AI-powered enhancement (if available)
            if (useAI && this.tagClassifier) {
                const aiTags = await this._generateAITags(content, memoryType, {
                    projectContext,
                    quickTags,
                    maxTags
                });
                
                return this._mergeTags(quickTags, aiTags, {
                    maxTags,
                    prioritizeRelevance
                });
            }
            
            // 3. Return top quick tags
            return this._selectTopTags(quickTags, maxTags, prioritizeRelevance);
            
        } catch (error) {
            this.logger.error('Tag generation failed:', error);
            
            // Fallback to basic tags
            return [memoryType, 'general'];
        }
    }

    /**
     * Generate quick pattern-based tags
     */
    _generateQuickTags(content, memoryType, options = {}) {
        const { includeTypeSpecific = true, projectContext } = options;
        const contentLower = content.toLowerCase();
        const foundTags = [];
        
        // 1. General pattern matching
        for (const [category, patterns] of Object.entries(this.quickPatterns)) {
            for (const [tag, config] of Object.entries(patterns)) {
                const matches = content.match(config.pattern) || [];
                if (matches.length > 0) {
                    foundTags.push({
                        tag,
                        category,
                        score: config.priority * Math.min(matches.length / 2, 1), // Diminishing returns
                        matchCount: matches.length,
                        source: 'pattern'
                    });
                }
            }
        }
        
        // 2. Memory type specific tags
        if (includeTypeSpecific && this.typeSpecificPatterns[memoryType]) {
            for (const [tag, pattern] of Object.entries(this.typeSpecificPatterns[memoryType])) {
                const matches = content.match(pattern) || [];
                if (matches.length > 0) {
                    foundTags.push({
                        tag,
                        category: 'type-specific',
                        score: 0.8 * Math.min(matches.length / 2, 1),
                        matchCount: matches.length,
                        source: 'type-specific'
                    });
                }
            }
        }
        
        // 3. Project context enhancement
        if (projectContext) {
            const contextTags = this._extractContextTags(content, projectContext);
            foundTags.push(...contextTags);
        }
        
        // 4. Always include memory type as a tag
        foundTags.push({
            tag: memoryType,
            category: 'memory-type',
            score: 1.0,
            matchCount: 1,
            source: 'memory-type'
        });
        
        return foundTags;
    }

    /**
     * Generate AI-powered tags
     */
    async _generateAITags(content, memoryType, options = {}) {
        const { projectContext, quickTags, maxTags } = options;
        
        try {
            // Extract existing tag names for context
            const existingTags = quickTags.map(t => t.tag);
            
            const aiResult = await this.tagClassifier.classifyContent(content, {
                memoryType,
                projectContext,
                existingTags,
                maxTags: Math.max(maxTags, 8), // Get more for better selection
                quickMode: false
            });
            
            // Convert AI tags to our format
            return (aiResult.tags || []).map(tag => ({
                tag: this._normalizeTag(tag),
                category: 'ai-generated',
                score: aiResult.confidence || 0.7,
                matchCount: 1,
                source: 'ai'
            }));
            
        } catch (error) {
            this.logger.error('AI tag generation failed:', error);
            return [];
        }
    }

    /**
     * Extract context-aware tags based on project information
     */
    _extractContextTags(content, projectContext) {
        const contextTags = [];
        const contentLower = content.toLowerCase();
        const projectLower = projectContext.toLowerCase();
        
        // Technology stack inference
        const techStack = this._inferTechStack(projectLower);
        for (const tech of techStack) {
            if (contentLower.includes(tech)) {
                contextTags.push({
                    tag: tech,
                    category: 'context-tech',
                    score: 0.6,
                    matchCount: 1,
                    source: 'project-context'
                });
            }
        }
        
        // Project phase detection
        const phase = this._detectProjectPhase(contentLower);
        if (phase) {
            contextTags.push({
                tag: phase,
                category: 'project-phase',
                score: 0.7,
                matchCount: 1,
                source: 'project-context'
            });
        }
        
        return contextTags;
    }

    /**
     * Infer technology stack from project context
     */
    _inferTechStack(projectContext) {
        const techStack = [];
        
        const techIndicators = {
            'react': ['react', 'frontend', 'ui', 'component'],
            'nodejs': ['node', 'backend', 'server', 'api'],
            'python': ['python', 'django', 'flask', 'ml', 'ai'],
            'docker': ['docker', 'container', 'deployment'],
            'aws': ['aws', 'cloud', 'lambda', 's3'],
            'database': ['db', 'database', 'sql', 'postgres', 'mongo']
        };
        
        for (const [tech, indicators] of Object.entries(techIndicators)) {
            if (indicators.some(indicator => projectContext.includes(indicator))) {
                techStack.push(tech);
            }
        }
        
        return techStack;
    }

    /**
     * Detect project development phase
     */
    _detectProjectPhase(content) {
        const phases = {
            'planning': ['plan', 'design', 'requirement', 'specification'],
            'development': ['implement', 'code', 'build', 'develop'],
            'testing': ['test', 'qa', 'validation', 'verification'],
            'deployment': ['deploy', 'release', 'production', 'launch'],
            'maintenance': ['maintain', 'fix', 'update', 'patch']
        };
        
        for (const [phase, keywords] of Object.entries(phases)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                return phase;
            }
        }
        
        return null;
    }

    /**
     * Merge quick tags and AI tags intelligently
     */
    _mergeTags(quickTags, aiTags, options = {}) {
        const { maxTags, prioritizeRelevance } = options;
        
        // Combine all tags
        const allTags = [...quickTags, ...aiTags];
        
        // Remove duplicates, keeping highest score
        const tagMap = new Map();
        for (const tagObj of allTags) {
            const normalizedTag = this._normalizeTag(tagObj.tag);
            if (!tagMap.has(normalizedTag) || tagMap.get(normalizedTag).score < tagObj.score) {
                tagMap.set(normalizedTag, {
                    ...tagObj,
                    tag: normalizedTag
                });
            }
        }
        
        const uniqueTags = Array.from(tagMap.values());
        
        return this._selectTopTags(uniqueTags, maxTags, prioritizeRelevance);
    }

    /**
     * Select top tags based on scoring and relevance
     */
    _selectTopTags(tags, maxTags, prioritizeRelevance = true) {
        // Sort by score (descending)
        let sortedTags = tags.sort((a, b) => b.score - a.score);
        
        if (prioritizeRelevance) {
            // Ensure diversity across categories
            const selectedTags = [];
            const categoryCount = {};
            
            for (const tag of sortedTags) {
                const category = tag.category || 'general';
                const categoryLimit = this._getCategoryLimit(category, maxTags);
                
                if (!categoryCount[category]) {
                    categoryCount[category] = 0;
                }
                
                if (categoryCount[category] < categoryLimit && selectedTags.length < maxTags) {
                    selectedTags.push(tag.tag);
                    categoryCount[category]++;
                }
            }
            
            return selectedTags;
        }
        
        // Simple top-N selection
        return sortedTags.slice(0, maxTags).map(t => t.tag);
    }

    /**
     * Get category limit for tag diversity
     */
    _getCategoryLimit(category, maxTags) {
        const limits = {
            'memory-type': 1,           // Always include memory type
            'technology': Math.ceil(maxTags * 0.4),    // 40% for tech tags
            'context': Math.ceil(maxTags * 0.3),       // 30% for context tags
            'architecture': Math.ceil(maxTags * 0.2),  // 20% for architecture tags
            'project': Math.ceil(maxTags * 0.2),       // 20% for project tags
            'type-specific': Math.ceil(maxTags * 0.3), // 30% for type-specific tags
            'ai-generated': Math.ceil(maxTags * 0.5),  // 50% for AI tags
            'general': Math.ceil(maxTags * 0.2)        // 20% for general tags
        };
        
        return limits[category] || Math.ceil(maxTags * 0.2);
    }

    /**
     * Normalize tag names for consistency
     */
    _normalizeTag(tag) {
        return tag
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')  // Replace non-alphanumeric with hyphens
            .replace(/-+/g, '-')          // Collapse multiple hyphens
            .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
    }

    /**
     * Get tag suggestions for content
     */
    async getSuggestions(content, memoryType, options = {}) {
        const { maxSuggestions = 10, includeDescriptions = true } = options;
        
        // Generate comprehensive tags without limits
        const allTags = await this.generate(content, memoryType, {
            ...options,
            maxTags: 20,
            useAI: true
        });
        
        if (!includeDescriptions) {
            return allTags.slice(0, maxSuggestions);
        }
        
        // Add descriptions for UI
        return allTags.slice(0, maxSuggestions).map(tag => ({
            tag,
            description: this._getTagDescription(tag),
            category: this._getTagCategory(tag)
        }));
    }

    /**
     * Get tag description for UI
     */
    _getTagDescription(tag) {
        const descriptions = {
            // Technology
            'react': 'React.js frontend framework',
            'nodejs': 'Node.js backend runtime',
            'python': 'Python programming language',
            'docker': 'Docker containerization',
            'kubernetes': 'Kubernetes orchestration',
            
            // Context
            'bugfix': 'Bug fixes and error resolution',
            'feature': 'New feature implementation',
            'refactor': 'Code refactoring and cleanup',
            'testing': 'Testing and quality assurance',
            'security': 'Security-related content',
            
            // Architecture
            'frontend': 'Frontend/client-side development',
            'backend': 'Backend/server-side development',
            'database': 'Database-related content',
            'api': 'API design and implementation',
            
            // Project
            'planning': 'Project planning and strategy',
            'milestone': 'Project milestones and progress',
            'decision': 'Design and technical decisions'
        };
        
        return descriptions[tag] || `${tag} related content`;
    }

    /**
     * Get tag category for organization
     */
    _getTagCategory(tag) {
        for (const [category, tags] of Object.entries(this.tagCategories)) {
            if (tags.includes(tag)) {
                return category;
            }
        }
        return 'general';
    }

    /**
     * Test tag generation with sample content
     */
    async test() {
        const testCases = [
            {
                content: 'Implemented React component with useState hook for form validation',
                memoryType: 'code',
                expectedTags: ['react', 'frontend', 'validation']
            },
            {
                content: 'Fixed critical security vulnerability in authentication middleware',
                memoryType: 'code',
                expectedTags: ['bugfix', 'security', 'authentication']
            },
            {
                content: 'Decided to use PostgreSQL over MongoDB for better ACID compliance',
                memoryType: 'decision',
                expectedTags: ['postgresql', 'database', 'decision']
            }
        ];
        
        const results = [];
        
        for (const testCase of testCases) {
            try {
                const tags = await this.generate(testCase.content, testCase.memoryType, {
                    maxTags: 5,
                    useAI: false // Test pattern-based only
                });
                
                const matchedExpected = testCase.expectedTags.filter(expected => 
                    tags.some(tag => tag.includes(expected) || expected.includes(tag))
                );
                
                results.push({
                    content: testCase.content.substring(0, 50) + '...',
                    memoryType: testCase.memoryType,
                    expectedTags: testCase.expectedTags,
                    generatedTags: tags,
                    matchedCount: matchedExpected.length,
                    totalExpected: testCase.expectedTags.length
                });
                
            } catch (error) {
                results.push({
                    content: testCase.content.substring(0, 50) + '...',
                    error: error.message
                });
            }
        }
        
        return {
            totalTests: testCases.length,
            averageMatches: results.reduce((sum, r) => sum + (r.matchedCount || 0), 0) / results.length,
            results
        };
    }
} 