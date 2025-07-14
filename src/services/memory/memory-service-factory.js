/**
 * Memory Service Factory
 * Centralized creation of MemoryStorageService with proper dependency injection
 * Eliminates duplicate initialization logic across MCP tools and controllers
 */

import { MemoryStorageService } from './memory-storage-service.js';
import { MemoryTagGenerator } from './memory-tag-generator.js';
import { MemoryFormatter } from './memory-formatter.js';

export class MemoryServiceFactory {
    static memoryStorageService = null;

    /**
     * Create or get singleton MemoryStorageService with proper dependencies
     */
    static async createMemoryStorageService(dependencies = {}, options = {}) {
        // Return existing instance if available and dependencies match
        if (this.memoryStorageService && this._dependenciesMatch(dependencies)) {
            return this.memoryStorageService;
        }

        const {
            logger,
            databaseService,
            embeddingService = null,
            eventEmitter = null
        } = dependencies;

        if (!logger || !databaseService) {
            throw new Error('Logger and DatabaseService are required dependencies');
        }

        // Create tag generator if not provided
        const tagGenerator = new MemoryTagGenerator(logger);
        
        // Create formatter if not provided  
        const formatter = new MemoryFormatter(logger);

        // Default configuration for consistent behavior
        const defaultConfig = {
            enableTagGeneration: true,
            enableDuplicateDetection: true,
            enableBackgroundProcessing: true,
            maxTagsPerMemory: 5,
            duplicateThreshold: 0.95,
            importanceScoreDefault: 0.6,
            enableProjectStats: true,
            enableRelatedSuggestions: false,
            ...options // Allow overrides
        };

        // Create service with injected dependencies
        this.memoryStorageService = new MemoryStorageService(
            logger,
            {
                database: databaseService,
                tagGenerator,
                formatter,
                embedding: embeddingService,
                eventEmitter
            },
            defaultConfig
        );

        // Initialize the service
        await this.memoryStorageService.initialize();

        logger.info('MemoryStorageService created and initialized via factory');
        
        return this.memoryStorageService;
    }

    /**
     * Get existing service instance (throws if not created)
     */
    static getMemoryStorageService() {
        if (!this.memoryStorageService) {
            throw new Error('MemoryStorageService not yet created. Call createMemoryStorageService() first.');
        }
        return this.memoryStorageService;
    }

    /**
     * Reset singleton (useful for testing)
     */
    static reset() {
        this.memoryStorageService = null;
    }

    /**
     * Check if current dependencies are compatible (simple check)
     */
    static _dependenciesMatch(newDependencies) {
        // For now, just check if we have the same database service
        return this.memoryStorageService?.db === newDependencies.databaseService;
    }
} 