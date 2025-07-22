/**
 * Service Initializer
 * Handles proper initialization of all services with dependency injection
 */

import serviceRegistry from './service-registry.js';
import DatabaseService from './database-service.js';
import ConfigService from './config-service.js';
import { EmbeddingService } from './embedding/embedding-service.js';
import { LLMService } from './llm-service.js';
import { MemoryDeduplicationService } from './task-deduplication-service.js';
import AnalyticsCollector from './analytics-collector.js';
import { SequentialThinkingService } from './sequential-thinking-service.js';
import { MCPToolsV3 } from './mcp-tools-v3.js';
import { MCPResourcesService } from './mcp-resources.js';
import { MCPPromptsService } from './mcp-prompts.js';
import { MCPRootsService } from './mcp-roots.js';
import { MCPSamplingService } from './mcp-sampling.js';
import { OllamaManagementService } from './ollama-management-service.js';
import { OllamaClient, HierarchicalTagClassifier } from './embedding/index.js';
import { MemorySearchService } from './memory/memory-search-service.js';
import { MemoryStorageService } from './memory/memory-storage-service.js';
import { MemoryFormatter } from './memory/memory-formatter.js';
import { MemoryTagGenerator } from './memory/memory-tag-generator.js';
import ProjectManagementService from './project-management-service.js';
import TaskManagementService from './task-management-service.js';
import ReasoningService from './reasoning-service.js';
import { initializeUnifiedInsightsV2 } from './insights-v2/unified-insights-v2-integration.js';
import ConfigThresholdsService from './config-thresholds.js';

/**
 * Initialize all services in the correct order with proper dependencies
 */
export async function initializeServices(logger) {
    logger.info('Initializing services...');

    try {
        // Level 1: Core services with no dependencies
        const databaseService = new DatabaseService(logger);
        await databaseService.initialize();
        serviceRegistry.register('database', databaseService);

        const configService = new ConfigService(databaseService, logger);
        serviceRegistry.register('config', configService);

        // Initialize unified Ollama client
        const ollamaClient = new OllamaClient(logger);
        serviceRegistry.register('ollama', ollamaClient);
        
        // Check Ollama availability
        const ollamaAvailable = await ollamaClient.isAvailable();
        logger.info(`Ollama availability: ${ollamaAvailable ? 'Connected' : 'Not available'} at ${ollamaClient.host}`);

        // Level 2: Services that depend on database/config
        const llmService = new LLMService(logger, databaseService, configService);
        serviceRegistry.register('llm', llmService);

        const analyticsCollector = new AnalyticsCollector(databaseService, configService, logger);
        serviceRegistry.register('analytics', analyticsCollector);

        // MCP prompts service (needed for enhanced summaries)
        const mcpPromptsService = new MCPPromptsService(logger, databaseService);
        serviceRegistry.register('mcpPrompts', mcpPromptsService);

        // Tag classifier that depends on LLM and MCP prompts
        const tagClassifier = new HierarchicalTagClassifier(logger, databaseService, llmService, mcpPromptsService);
        serviceRegistry.register('tagClassifier', tagClassifier);

        // Embedding service with tag classifier
        const embeddingService = new EmbeddingService(logger, databaseService);
        embeddingService.setTagClassifier(tagClassifier); // We'll add this method
        serviceRegistry.register('embedding', embeddingService);

        // Memory search service - unified search functionality
        const memorySearchService = new MemorySearchService(logger, databaseService, embeddingService, configService);
        serviceRegistry.register('memorySearch', memorySearchService);

        // Level 3: Services that depend on Level 2 services
        const sequentialThinkingService = new SequentialThinkingService(logger, databaseService, embeddingService);
        serviceRegistry.register('sequentialThinking', sequentialThinkingService);

        const memoryDeduplicationService = new MemoryDeduplicationService(
            logger, 
            databaseService, 
            embeddingService, 
            llmService
        );
        serviceRegistry.register('deduplication', memoryDeduplicationService);

        // Initialize memory services
        const memoryFormatter = new MemoryFormatter();
        const memoryTagGenerator = new MemoryTagGenerator(
            logger,
            tagClassifier // Use the existing tag classifier
        );
        
        const memoryStorageService = new MemoryStorageService(
            logger,
            {
                database: databaseService,
                tagGenerator: memoryTagGenerator,
                formatter: memoryFormatter,
                embedding: embeddingService,
                eventEmitter: null // Can be added later if needed
            }
        );
        await memoryStorageService.initialize();
        serviceRegistry.register('memory', memoryStorageService);

        // Initialize project, task, and reasoning services
        const projectManagementService = new ProjectManagementService(
            logger,
            databaseService,
            serviceRegistry.get('memory')
        );
        serviceRegistry.register('projectManagement', projectManagementService);

        const taskManagementService = new TaskManagementService(
            logger,
            databaseService,
            serviceRegistry.get('memory')
        );
        serviceRegistry.register('taskManagement', taskManagementService);

        const reasoningService = new ReasoningService(
            logger,
            databaseService,
            serviceRegistry.get('memory')
        );
        serviceRegistry.register('reasoning', reasoningService);

        // Level 4: MCP services
        // V3 tools with clean architecture
        const mcpToolsService = new MCPToolsV3(
            logger, 
            databaseService,
            {
                memoryService: serviceRegistry.get('memory'),
                memorySearchService: memorySearchService,
                unifiedSearch: null, // Will be set after initialization
                rulesService: null, // Not implemented yet
                sequentialThinking: sequentialThinkingService,
                taskService: null, // Not implemented yet
                embeddingService: embeddingService,
                llmService: llmService,
                projectManagementService: projectManagementService,
                taskManagementService: taskManagementService,
                reasoningService: reasoningService
            }
        );
        
        logger.info('Using clean architecture V3 MCP tools (8 tools)');
        serviceRegistry.register('mcpTools', mcpToolsService);

        const mcpResourcesService = new MCPResourcesService(logger, databaseService);
        serviceRegistry.register('mcpResources', mcpResourcesService);

        // mcpPromptsService already created and registered above in Level 2

        const mcpRootsService = new MCPRootsService(logger);
        serviceRegistry.register('mcpRoots', mcpRootsService);

        const mcpSamplingService = new MCPSamplingService(logger, databaseService);
        serviceRegistry.register('mcpSampling', mcpSamplingService);

        const ollamaManagementService = new OllamaManagementService(logger);
        serviceRegistry.register('ollamaManagement', ollamaManagementService);

        // Level 7: Unified Insights v2
        logger.info('Initializing Unified Insights v2 system');
        
        // Initialize Unified Insights v2
        const unifiedInsightsV2 = await initializeUnifiedInsightsV2(
            logger,
            databaseService,
            embeddingService,
            llmService
        );
        serviceRegistry.register('unifiedInsightsV2', unifiedInsightsV2);
        
        // Update MCP tools to use v2
        if (mcpToolsService.services) {
            mcpToolsService.services.unifiedInsights = unifiedInsightsV2;
        }
        
        // Initialize ConfigThresholdsService
        const configThresholdsService = new ConfigThresholdsService(logger, configService);
        await configThresholdsService.initialize();
        serviceRegistry.register('configThresholds', configThresholdsService);
        
        // Initialize V2 Async Processor for batch jobs
        const { V2AsyncProcessor } = await import('./insights-v2/queue/v2-async-processor.js');
        const v2AsyncProcessor = new V2AsyncProcessor({
            db: databaseService,
            logger: logger,
            unifiedInsightsV2: unifiedInsightsV2,
            processorFactory: unifiedInsightsV2.processorFactory,
            configThresholds: configThresholdsService
        });
        serviceRegistry.register('v2AsyncProcessor', v2AsyncProcessor);
        
        logger.info('Unified Insights v2 integrated with MCP tools and async processor initialized');

        // Start background processing for embedding service
        embeddingService.startBackgroundProcessing();
        
        // Mark registry as initialized
        serviceRegistry.setInitialized();
        
        logger.info('All services initialized successfully');
        return serviceRegistry;

    } catch (error) {
        logger.error('Failed to initialize services:', error);
        throw error;
    }
}

/**
 * Get a service from the registry
 */
export function getService(name) {
    if (!serviceRegistry.isInitialized()) {
        throw new Error('Services not initialized. Call initializeServices() first.');
    }
    return serviceRegistry.get(name);
}

/**
 * Shutdown all services gracefully
 */
export async function shutdownServices(logger) {
    logger.info('Shutting down services...');

    try {
        // Stop embedding service background processing
        const embeddingService = serviceRegistry.get('embedding');
        if (embeddingService && embeddingService.stopBackgroundProcessing) {
            embeddingService.stopBackgroundProcessing();
        }

        // Close database connections
        const databaseService = serviceRegistry.get('database');
        if (databaseService && databaseService.disconnect) {
            await databaseService.disconnect();
        }

        // Clear the registry
        serviceRegistry.clear();
        
        logger.info('All services shut down successfully');
    } catch (error) {
        logger.error('Error during service shutdown:', error);
        throw error;
    }
}

export default {
    initializeServices,
    getService,
    shutdownServices
};