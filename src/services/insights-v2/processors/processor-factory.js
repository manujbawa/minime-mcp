/**
 * Processor Factory
 * Creates and manages different insight processors
 * Supports plugin architecture for easy extension
 */

import { LLMCategoryProcessor } from './llm-category-processor.js';
import { TemplateProcessor } from './template-processor.js';
import { PatternDetectorProcessor } from './pattern-detector-processor.js';
import { ClusteringProcessor } from './clustering-processor.js';
import { ClusteringProcessorV2 } from './clustering-processor-v2.js';
import { CodeAnalyzerProcessor } from './code-analyzer-processor.js';
import { BugAnalyzerProcessor } from './bug-analyzer-processor.js';
import { DecisionAnalyzerProcessor } from './decision-analyzer-processor.js';
import { ThinkingSequenceProcessor } from './thinking-sequence-processor.js';

export class InsightProcessorFactory {
    constructor(dependencies) {
        this.logger = dependencies.logger;
        this.dependencies = dependencies;
        
        // Registry of available processors
        this.processorRegistry = new Map();
        this.processorInstances = new Map();
        
        // Register built-in processors
        this.registerBuiltInProcessors();
    }

    registerBuiltInProcessors() {
        // Core processors
        this.register('llm_category', LLMCategoryProcessor);
        this.register('template_processor', TemplateProcessor);
        this.register('pattern_detector', PatternDetectorProcessor);
        this.register('clustering', ClusteringProcessorV2); // Use V2 with template support
        
        // Specialized processors
        this.register('code_analyzer', CodeAnalyzerProcessor);
        this.register('bug_analyzer', BugAnalyzerProcessor);
        this.register('decision_analyzer', DecisionAnalyzerProcessor);
        this.register('thinking_sequence', ThinkingSequenceProcessor);
    }

    /**
     * Register a new processor type
     */
    register(name, ProcessorClass) {
        if (this.processorRegistry.has(name)) {
            this.logger.warn(`Processor ${name} already registered, overwriting`);
        }
        
        this.processorRegistry.set(name, ProcessorClass);
        this.logger.debug(`Registered processor: ${name}`);
    }

    /**
     * Get processors based on strategy
     */
    async getProcessors(strategy) {
        const processors = [];
        
        this.logger.info(`[ProcessorFactory] Getting processors for strategy:`, strategy);
        
        for (const processorName of strategy.processors) {
            this.logger.info(`[ProcessorFactory] Loading processor: ${processorName}`);
            const processor = await this.getProcessor(processorName);
            if (processor) {
                processors.push(processor);
                this.logger.info(`[ProcessorFactory] Successfully loaded processor: ${processorName}`);
            } else {
                this.logger.warn(`[ProcessorFactory] Failed to load processor: ${processorName}`);
            }
        }
        
        this.logger.info(`[ProcessorFactory] Loaded ${processors.length} processors out of ${strategy.processors.length} requested`);
        return processors;
    }

    /**
     * Get a single processor instance
     */
    async getProcessor(name) {
        // Check if already instantiated
        if (this.processorInstances.has(name)) {
            return this.processorInstances.get(name);
        }
        
        // Get processor class
        const ProcessorClass = this.processorRegistry.get(name);
        if (!ProcessorClass) {
            this.logger.error(`Unknown processor: ${name}`);
            return null;
        }
        
        try {
            // Create instance
            const processor = new ProcessorClass({
                ...this.dependencies,
                name
            });
            
            // Initialize if needed
            if (processor.initialize) {
                await processor.initialize();
            }
            
            // Cache instance
            this.processorInstances.set(name, processor);
            
            return processor;
        } catch (error) {
            this.logger.error(`Failed to create processor ${name}:`, error);
            return null;
        }
    }

    /**
     * Initialize all registered processors
     */
    async initialize() {
        this.logger.info('Initializing processors...');
        
        // Pre-initialize commonly used processors
        const commonProcessors = ['llm_category', 'pattern_detector'];
        
        for (const name of commonProcessors) {
            await this.getProcessor(name);
        }
        
        this.logger.info(`Initialized ${this.processorInstances.size} processors`);
    }

    /**
     * Clean up all processor instances
     */
    async cleanup() {
        for (const [name, processor] of this.processorInstances) {
            if (processor.cleanup) {
                try {
                    await processor.cleanup();
                } catch (error) {
                    this.logger.error(`Failed to cleanup processor ${name}:`, error);
                }
            }
        }
        
        this.processorInstances.clear();
    }

    /**
     * Get list of available processors
     */
    getAvailableProcessors() {
        return Array.from(this.processorRegistry.keys());
    }

    /**
     * Check if a processor is available
     */
    hasProcessor(name) {
        return this.processorRegistry.has(name);
    }
}

export default InsightProcessorFactory;