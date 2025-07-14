/**
 * Unified Insights v2 - Main Entry Point
 * 
 * Design Principles:
 * - Dependency Injection for testability
 * - Plugin architecture for extensibility
 * - Clear separation of concerns
 * - No hard-coded dependencies
 */

export { UnifiedInsightsV2Service } from './unified-insights-service.js';
export { InsightProcessorFactory } from './processors/processor-factory.js';
export { InsightEnricherFactory } from './enrichers/enricher-factory.js';
export { InsightStorageService } from './storage/insight-storage-service.js';
export { InsightQueryService } from './query/insight-query-service.js';
export { InsightTypes, InsightCategories, DetectionMethods } from './constants/insight-constants.js';

// Export configuration schema for validation
export { configSchema } from './config/config-schema.js';