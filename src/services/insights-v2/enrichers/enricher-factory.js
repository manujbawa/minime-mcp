/**
 * Enricher Factory
 * Creates and manages insight enrichers based on configuration
 */

import { PatternMatchingEnricher } from './pattern-matching-enricher.js';
import { RelationshipEnricher } from './relationship-enricher.js';
import { TechnologyExtractionEnricher } from './technology-extraction-enricher.js';

export class InsightEnricherFactory {
    constructor(dependencies) {
        this.dependencies = dependencies;
        this.logger = dependencies.logger;
        this.enrichers = new Map();
        this.initialized = false;
    }

    /**
     * Initialize factory and available enrichers
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        this.logger.info('Initializing Insight Enricher Factory...');

        // Register available enrichers
        this.registerEnricher('pattern_matching', PatternMatchingEnricher);
        this.registerEnricher('relationship_finding', RelationshipEnricher);
        this.registerEnricher('technology_extraction', TechnologyExtractionEnricher);

        this.initialized = true;
        this.logger.info('Insight Enricher Factory initialized');
    }

    /**
     * Register an enricher class
     */
    registerEnricher(name, EnricherClass) {
        this.enrichers.set(name, EnricherClass);
        this.logger.debug(`Registered enricher: ${name}`);
    }

    /**
     * Get enrichers based on configuration
     */
    async getEnrichers(config = {}) {
        const activeEnrichers = [];

        // Pattern matching enricher
        if (config.enablePatternMatching) {
            const enricher = await this.createEnricher('pattern_matching');
            if (enricher) activeEnrichers.push(enricher);
        }

        // Relationship finding enricher
        if (config.enableRelationshipFinding) {
            const enricher = await this.createEnricher('relationship_finding');
            if (enricher) activeEnrichers.push(enricher);
        }

        // Technology extraction enricher
        if (config.enableTechnologyExtraction) {
            const enricher = await this.createEnricher('technology_extraction');
            if (enricher) activeEnrichers.push(enricher);
        }

        this.logger.debug(`Active enrichers: ${activeEnrichers.map(e => e.name).join(', ')}`);
        return activeEnrichers;
    }

    /**
     * Create an enricher instance
     */
    async createEnricher(name) {
        const EnricherClass = this.enrichers.get(name);
        
        if (!EnricherClass) {
            this.logger.warn(`Unknown enricher: ${name}`);
            return null;
        }

        try {
            const enricher = new EnricherClass(this.dependencies);
            await enricher.initialize();
            return enricher;
        } catch (error) {
            this.logger.error(`Failed to create enricher ${name}:`, error);
            return null;
        }
    }

    /**
     * Cleanup all enrichers
     */
    async cleanup() {
        // Cleanup logic if needed
        this.logger.info('Enricher Factory cleanup complete');
    }
}

export default InsightEnricherFactory;