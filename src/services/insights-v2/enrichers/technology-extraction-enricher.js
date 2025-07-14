/**
 * Technology Extraction Enricher
 * Extracts and tracks technology usage from insights
 */

import { BaseEnricher } from './base-enricher.js';

export class TechnologyExtractionEnricher extends BaseEnricher {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'TechnologyExtractionEnricher';
        
        // Common technology patterns
        this.techPatterns = {
            languages: /\b(javascript|typescript|python|java|go|rust|c\+\+|ruby|php|swift|kotlin|scala)\b/gi,
            frameworks: /\b(react|vue|angular|express|django|flask|spring|rails|laravel|nextjs|nuxt)\b/gi,
            databases: /\b(postgresql|postgres|mysql|mongodb|redis|elasticsearch|cassandra|dynamodb)\b/gi,
            cloud: /\b(aws|azure|gcp|google cloud|heroku|vercel|netlify|cloudflare)\b/gi,
            tools: /\b(docker|kubernetes|jenkins|github|gitlab|terraform|ansible|nginx|apache)\b/gi,
            libraries: /\b(lodash|axios|moment|jquery|bootstrap|tailwind|material-ui|antd)\b/gi
        };
    }

    async enrich(insight, memory) {
        try {
            // Extract technologies from content
            const extractedTechs = this.extractTechnologies(insight, memory);
            
            // Add extracted technologies
            for (const tech of extractedTechs) {
                this.addTechnology(insight, tech);
            }

            // Update technology tracking
            if (extractedTechs.length > 0) {
                await this.updateTechnologyTracking(extractedTechs, memory.project_id);
                
                // Add technology-specific tags
                const techTags = extractedTechs.map(t => `tech:${t.name.toLowerCase()}`);
                this.addTags(insight, techTags);
            }

            // Add technology recommendations
            await this.addTechnologyRecommendations(insight, extractedTechs);

            return insight;

        } catch (error) {
            this.logger.error('Technology extraction enrichment failed:', error);
            return insight;
        }
    }

    /**
     * Extract technologies from insight and memory content
     */
    extractTechnologies(insight, memory) {
        const technologies = [];
        const seen = new Set();
        
        // Combine all text to analyze
        const textToAnalyze = [
            insight.title,
            insight.summary,
            memory.content,
            JSON.stringify(insight.detailed_content)
        ].join(' ').toLowerCase();

        // Extract using patterns
        for (const [category, pattern] of Object.entries(this.techPatterns)) {
            const matches = textToAnalyze.match(pattern) || [];
            
            for (const match of matches) {
                const techName = match.toLowerCase();
                const key = `${category}:${techName}`;
                
                if (!seen.has(key)) {
                    seen.add(key);
                    technologies.push({
                        name: techName,
                        category: category,
                        confidence: 0.8, // High confidence for pattern match
                        source: 'pattern_extraction'
                    });
                }
            }
        }

        // Also check existing technologies in insight
        if (insight.technologies && Array.isArray(insight.technologies)) {
            for (const tech of insight.technologies) {
                // Skip if no name or category
                if (!tech.name || !tech.category) {
                    this.logger.warn('Skipping technology without name or category:', tech);
                    continue;
                }
                
                const key = `${tech.category}:${tech.name}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    technologies.push({
                        name: tech.name,
                        category: tech.category,
                        confidence: tech.confidence || 0.7,
                        source: tech.source || 'insight_extraction'
                    });
                }
            }
        }

        return technologies;
    }

    /**
     * Update technology tracking table
     */
    async updateTechnologyTracking(technologies, projectId) {
        try {
            for (const tech of technologies) {
                // Skip if missing required fields
                if (!tech.name || !tech.category) {
                    this.logger.warn('Skipping technology tracking for incomplete tech:', tech);
                    continue;
                }
                
                await this.db.query(`
                    INSERT INTO technology_tracking_v2 (
                        technology_name,
                        technology_category,
                        total_occurrences,
                        project_count,
                        preference_score,
                        projects_using,
                        last_seen_at
                    ) VALUES (
                        $1, $2, 1, 1, 0.5,
                        $3::jsonb,
                        NOW()
                    )
                    ON CONFLICT (technology_name, technology_category) 
                    DO UPDATE SET
                        total_occurrences = technology_tracking_v2.total_occurrences + 1,
                        last_seen_at = NOW(),
                        projects_using = CASE 
                            WHEN NOT technology_tracking_v2.projects_using @> $3::jsonb
                            THEN technology_tracking_v2.projects_using || $3::jsonb
                            ELSE technology_tracking_v2.projects_using
                        END,
                        project_count = jsonb_array_length(
                            CASE 
                                WHEN NOT technology_tracking_v2.projects_using @> $3::jsonb
                                THEN technology_tracking_v2.projects_using || $3::jsonb
                                ELSE technology_tracking_v2.projects_using
                            END
                        )
                `, [
                    tech.name,
                    tech.category,
                    JSON.stringify([{
                        project_id: projectId,
                        last_used: new Date().toISOString()
                    }])
                ]);
            }
        } catch (error) {
            this.logger.error('Failed to update technology tracking:', error);
        }
    }

    /**
     * Add technology-based recommendations
     */
    async addTechnologyRecommendations(insight, technologies) {
        try {
            // Check for outdated technologies
            const outdatedTechs = technologies.filter(t => 
                this.isOutdated(t.name)
            );
            
            if (outdatedTechs.length > 0) {
                this.addRecommendation(insight, {
                    text: `Consider updating ${outdatedTechs.map(t => t.name).join(', ')} to newer alternatives`,
                    type: 'technology_update',
                    priority: 'medium'
                });
            }

            // Check for security concerns
            const securityConcerns = await this.checkSecurityConcerns(technologies);
            if (securityConcerns.length > 0) {
                for (const concern of securityConcerns) {
                    this.addRecommendation(insight, {
                        text: concern,
                        type: 'security',
                        priority: 'high'
                    });
                }
            }

            // Technology stack coherence
            const stackIssues = this.checkStackCoherence(technologies);
            if (stackIssues.length > 0) {
                for (const issue of stackIssues) {
                    this.addRecommendation(insight, {
                        text: issue,
                        type: 'architecture',
                        priority: 'medium'
                    });
                }
            }

        } catch (error) {
            this.logger.error('Failed to add technology recommendations:', error);
        }
    }

    /**
     * Check if a technology is outdated
     */
    isOutdated(techName) {
        const outdatedTechs = {
            'jquery': 'Consider modern alternatives like vanilla JS or React',
            'moment': 'Consider date-fns or native Date APIs',
            'grunt': 'Consider webpack or vite',
            'bower': 'Use npm or yarn instead'
        };
        
        return outdatedTechs.hasOwnProperty(techName.toLowerCase());
    }

    /**
     * Check for security concerns in technologies
     */
    async checkSecurityConcerns(technologies) {
        const concerns = [];
        
        // Check for known vulnerable combinations
        const techNames = technologies.map(t => t.name.toLowerCase());
        
        if (techNames.includes('express') && !techNames.includes('helmet')) {
            concerns.push('Consider adding helmet.js for Express security headers');
        }
        
        if (techNames.includes('mongodb') && !techNames.includes('mongoose')) {
            concerns.push('Ensure proper MongoDB query sanitization without an ORM');
        }
        
        return concerns;
    }

    /**
     * Check technology stack coherence
     */
    checkStackCoherence(technologies) {
        const issues = [];
        const techNames = technologies.map(t => t.name.toLowerCase());
        
        // Check for multiple frontend frameworks
        const frontendFrameworks = ['react', 'vue', 'angular'];
        const usedFrameworks = frontendFrameworks.filter(f => techNames.includes(f));
        
        if (usedFrameworks.length > 1) {
            issues.push(`Multiple frontend frameworks detected (${usedFrameworks.join(', ')}). Consider consolidating.`);
        }
        
        // Check for mismatched backend technologies
        if (techNames.includes('django') && techNames.includes('express')) {
            issues.push('Mixed backend frameworks detected. Consider architectural consistency.');
        }
        
        return issues;
    }
}

export default TechnologyExtractionEnricher;