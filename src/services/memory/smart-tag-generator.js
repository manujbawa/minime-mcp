/**
 * Smart Tag Generator Service
 * Generates relevant tags from content
 * Follows single responsibility principle
 */

export class SmartTagGenerator {
    constructor(logger) {
        this.logger = logger;
        
        // Tag patterns organized by category
        this.tagPatterns = {
            languages: {
                javascript: /\b(javascript|\.js|node|npm|yarn)\b/i,
                typescript: /\b(typescript|\.ts|tsc|tsconfig)\b/i,
                python: /\b(python|\.py|pip|conda|django|flask)\b/i,
                java: /\b(java|\.java|maven|gradle|spring)\b/i,
                go: /\b(golang|\.go|go\s+mod)\b/i,
                rust: /\b(rust|cargo|\.rs)\b/i,
                cpp: /\b(c\+\+|cpp|\.cpp|\.hpp)\b/i,
                csharp: /\b(c#|csharp|\.cs|dotnet)\b/i
            },
            
            frameworks: {
                react: /\b(react|jsx|tsx|hooks?|component)\b/i,
                vue: /\b(vue|vuex|nuxt|\.vue)\b/i,
                angular: /\b(angular|rxjs|ngrx)\b/i,
                express: /\b(express|middleware|router)\b/i,
                nextjs: /\b(next\.?js|getServerSideProps|getStaticProps)\b/i,
                django: /\b(django|models\.py|views\.py)\b/i,
                fastapi: /\b(fastapi|pydantic|uvicorn)\b/i,
                spring: /\b(spring|boot|mvc|jpa)\b/i
            },
            
            tools: {
                docker: /\b(docker|dockerfile|container|compose)\b/i,
                kubernetes: /\b(kubernetes|k8s|kubectl|helm)\b/i,
                git: /\b(git|github|gitlab|commit|branch|merge)\b/i,
                webpack: /\b(webpack|bundle|loader|plugin)\b/i,
                vite: /\b(vite|rollup|esbuild)\b/i,
                jest: /\b(jest|test|spec|mock|spy)\b/i,
                pytest: /\b(pytest|test_|fixture|parametrize)\b/i,
                terraform: /\b(terraform|hcl|provider|resource)\b/i
            },
            
            concepts: {
                api: /\b(api|endpoint|rest|graphql|grpc)\b/i,
                database: /\b(database|sql|query|postgres|mysql|mongodb)\b/i,
                frontend: /\b(frontend|ui|ux|css|html|dom)\b/i,
                backend: /\b(backend|server|api|service|microservice)\b/i,
                testing: /\b(test|spec|unit|integration|e2e)\b/i,
                deployment: /\b(deploy|ci\/cd|pipeline|release)\b/i,
                security: /\b(security|auth|oauth|jwt|encryption)\b/i,
                performance: /\b(performance|optimization|cache|speed)\b/i,
                architecture: /\b(architecture|design|pattern|solid|dry)\b/i,
                bugfix: /\b(bug|fix|error|issue|debug)\b/i,
                feature: /\b(feature|implement|add|create|new)\b/i,
                refactor: /\b(refactor|cleanup|improve|optimize)\b/i,
                documentation: /\b(docs?|documentation|readme|guide)\b/i,
                configuration: /\b(config|settings|env|environment)\b/i
            }
        };
        
        // Common technology abbreviations
        this.abbreviations = {
            'ML': 'machine-learning',
            'AI': 'artificial-intelligence',
            'CI/CD': 'cicd',
            'API': 'api',
            'UI': 'user-interface',
            'UX': 'user-experience',
            'DB': 'database',
            'K8s': 'kubernetes',
            'JS': 'javascript',
            'TS': 'typescript',
            'FE': 'frontend',
            'BE': 'backend'
        };
    }

    /**
     * Generate smart tags from content
     */
    generateTags(content, memoryType = null, maxTags = 5) {
        const tags = new Set();
        const contentLower = content.toLowerCase();
        
        // Add memory type as a tag if significant
        if (memoryType && this.isSignificantType(memoryType)) {
            tags.add(memoryType);
        }
        
        // Extract tags from each category
        for (const [category, patterns] of Object.entries(this.tagPatterns)) {
            for (const [tag, pattern] of Object.entries(patterns)) {
                if (pattern.test(content) && tags.size < maxTags) {
                    tags.add(tag);
                }
            }
        }
        
        // Extract abbreviations
        for (const [abbr, expanded] of Object.entries(this.abbreviations)) {
            const abbrPattern = new RegExp(`\\b${abbr}\\b`, 'i');
            if (abbrPattern.test(content) && tags.size < maxTags) {
                tags.add(expanded);
            }
        }
        
        // Extract custom tags from hashtags or bracketed terms
        const customTags = this.extractCustomTags(content);
        for (const tag of customTags) {
            if (tags.size < maxTags) {
                tags.add(tag);
            }
        }
        
        // If no tags found, add generic ones based on content
        if (tags.size === 0) {
            tags.add(this.generateGenericTag(contentLower));
        }
        
        return Array.from(tags);
    }

    /**
     * Check if memory type is significant enough to be a tag
     */
    isSignificantType(type) {
        const significantTypes = [
            'bug', 'feature', 'refactor', 'security', 
            'performance', 'documentation', 'architecture'
        ];
        return significantTypes.includes(type);
    }

    /**
     * Extract custom tags from content
     */
    extractCustomTags(content) {
        const tags = new Set();
        
        // Extract hashtags
        const hashtagPattern = /#(\w+)/g;
        const hashtags = content.match(hashtagPattern) || [];
        hashtags.forEach(tag => {
            tags.add(tag.substring(1).toLowerCase());
        });
        
        // Extract bracketed tags like [performance] or {bugfix}
        const bracketPattern = /[\[\{](\w+)[\]\}]/g;
        const bracketTags = content.match(bracketPattern) || [];
        bracketTags.forEach(tag => {
            const cleaned = tag.replace(/[\[\{\]\}]/g, '').toLowerCase();
            tags.add(cleaned);
        });
        
        return Array.from(tags);
    }

    /**
     * Generate a generic tag based on content
     */
    generateGenericTag(contentLower) {
        if (contentLower.includes('learn')) return 'learning';
        if (contentLower.includes('idea')) return 'idea';
        if (contentLower.includes('question')) return 'question';
        if (contentLower.includes('todo')) return 'todo';
        if (contentLower.includes('note')) return 'note';
        return 'general';
    }

    /**
     * Get related tags for a given tag
     */
    getRelatedTags(tag) {
        const relationships = {
            'javascript': ['node', 'npm', 'typescript', 'react', 'vue'],
            'typescript': ['javascript', 'node', 'types'],
            'react': ['javascript', 'frontend', 'component', 'hooks'],
            'python': ['pip', 'django', 'flask', 'fastapi'],
            'docker': ['container', 'kubernetes', 'deployment'],
            'api': ['rest', 'graphql', 'backend', 'endpoint'],
            'database': ['sql', 'postgres', 'mysql', 'mongodb'],
            'testing': ['jest', 'pytest', 'unit', 'integration'],
            'bug': ['fix', 'error', 'debug', 'issue'],
            'feature': ['implement', 'add', 'new', 'enhancement']
        };
        
        return relationships[tag] || [];
    }

    /**
     * Normalize tag for consistency
     */
    normalizeTag(tag) {
        return tag
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Get tag category
     */
    getTagCategory(tag) {
        for (const [category, patterns] of Object.entries(this.tagPatterns)) {
            if (patterns[tag]) {
                return category;
            }
        }
        return 'other';
    }
}

export default SmartTagGenerator;