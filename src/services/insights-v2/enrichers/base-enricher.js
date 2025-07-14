/**
 * Base Enricher Class
 * Abstract base class for all insight enrichers
 */

export class BaseEnricher {
    constructor(dependencies) {
        this.db = dependencies.db;
        this.logger = dependencies.logger;
        this.embeddingService = dependencies.embeddingService;
        this.name = this.constructor.name;
        this.initialized = false;
    }

    /**
     * Initialize the enricher
     */
    async initialize() {
        // Override in subclasses if needed
        this.initialized = true;
    }

    /**
     * Enrich an insight with additional data
     * @param {Object} insight - The insight to enrich
     * @param {Object} memory - The source memory
     * @returns {Object} Enriched insight
     */
    async enrich(insight, memory) {
        throw new Error('enrich() must be implemented by subclass');
    }

    /**
     * Helper to add tags to insight
     */
    addTags(insight, newTags) {
        if (!insight.tags) {
            insight.tags = [];
        }
        
        const uniqueTags = new Set([...insight.tags, ...newTags]);
        insight.tags = Array.from(uniqueTags);
        
        return insight;
    }

    /**
     * Helper to add technology to insight
     */
    addTechnology(insight, tech) {
        if (!insight.technologies) {
            insight.technologies = [];
        }
        
        // Check if technology already exists
        const exists = insight.technologies.some(t => 
            t.name === tech.name && t.category === tech.category
        );
        
        if (!exists) {
            insight.technologies.push({
                name: tech.name,
                category: tech.category || 'unknown',
                version: tech.version || null,
                confidence: tech.confidence || 0.5
            });
        }
        
        return insight;
    }

    /**
     * Helper to add pattern to insight
     */
    addPattern(insight, pattern) {
        if (!insight.patterns) {
            insight.patterns = [];
        }
        
        // Check if pattern already exists
        const exists = insight.patterns.some(p => 
            p.signature === pattern.signature
        );
        
        if (!exists) {
            insight.patterns.push({
                name: pattern.name,
                category: pattern.category,
                signature: pattern.signature,
                evidence: pattern.evidence || []
            });
        }
        
        return insight;
    }

    /**
     * Helper to add recommendation
     */
    addRecommendation(insight, recommendation) {
        if (!insight.recommendations) {
            insight.recommendations = [];
        }
        
        insight.recommendations.push({
            text: recommendation.text,
            priority: recommendation.priority || 'medium',
            type: recommendation.type || 'general'
        });
        
        return insight;
    }

    /**
     * Helper to add evidence
     */
    addEvidence(insight, evidence) {
        if (!insight.evidence) {
            insight.evidence = [];
        }
        
        insight.evidence.push({
            type: evidence.type || 'text',
            content: evidence.content,
            source: evidence.source || 'memory',
            confidence: evidence.confidence || 0.5
        });
        
        return insight;
    }
}

export default BaseEnricher;