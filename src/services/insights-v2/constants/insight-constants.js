/**
 * Insight Constants
 * Centralized constants for the insights system
 */

export const InsightTypes = {
    PATTERN: 'pattern',
    BUG: 'bug',
    DECISION: 'decision',
    LEARNING: 'learning',
    TECH_DISCOVERY: 'tech_discovery',
    PROGRESS: 'progress',
    MILESTONE: 'milestone',
    IMPROVEMENT: 'improvement',
    ANTI_PATTERN: 'anti_pattern',
    BEST_PRACTICE: 'best_practice',
    CODE_SMELL: 'code_smell',
    SECURITY_ISSUE: 'security_issue',
    PERFORMANCE_ISSUE: 'performance_issue',
    DEBT: 'debt',
    GENERAL: 'general',
    CLUSTER: 'cluster',
    CODE_QUALITY: 'code_quality',
    BUG_PATTERN: 'bug_pattern',
    DECISION_PATTERN: 'decision_pattern'
};

export const InsightCategories = {
    ARCHITECTURAL: 'architectural',
    DESIGN: 'design',
    API: 'api',
    SECURITY: 'security',
    PERFORMANCE: 'performance',
    QUALITY: 'quality',
    TESTING: 'testing',
    DEPLOYMENT: 'deployment',
    OBSERVABILITY: 'observability',
    DATA: 'data',
    FRAMEWORK: 'framework',
    LIBRARY: 'library',
    CONFIGURATION: 'configuration',
    DEBUGGING: 'debugging',
    LEARNING: 'learning',
    PROGRESS: 'progress',
    PRODUCTIVITY: 'productivity',
    MAINTENANCE: 'maintenance',
    REFACTORING: 'refactoring',
    GENERAL: 'general'
};

export const DetectionMethods = {
    LLM_CATEGORY: 'llm_category',
    LLM_TEMPLATE: 'llm_template',
    CLUSTERING: 'clustering',
    PATTERN_MATCHING: 'pattern_matching',
    SYNTHESIS: 'synthesis',
    MANUAL: 'manual',
    RULE_BASED: 'rule_based',
    CODE_ANALYSIS: 'code_analysis',
    BUG_ANALYSIS: 'bug_analysis',
    DECISION_ANALYSIS: 'decision_analysis'
};

export const InsightLevels = {
    L1: 'L1', // Direct insights from memories
    L2: 'L2', // Synthesized insights across memories
    L3: 'L3'  // Meta insights across projects
};

export const ValidationStatus = {
    PENDING: 'pending',
    VALIDATED: 'validated',
    REJECTED: 'rejected',
    AUTO_VALIDATED: 'auto_validated'
};

export const SourceTypes = {
    MEMORY: 'memory',
    PATTERN: 'pattern',
    CLUSTER: 'cluster',
    SYNTHESIS: 'synthesis',
    MANUAL: 'manual'
};

export const TaskTypes = {
    PATTERN_DETECTION: 'pattern_detection',
    SYNTHESIS: 'synthesis',
    VALIDATION: 'validation',
    ENRICHMENT: 'enrichment',
    CLUSTERING: 'clustering',
    EMBEDDING_GENERATION: 'embedding_generation'
};

export const ProcessingStatus = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    RETRY: 'retry'
};

// Pattern categories from LLM learning pipeline
export const PatternCategories = {
    ARCHITECTURAL: {
        name: 'Architectural Patterns',
        subcategories: ['microservices', 'monolithic', 'serverless', 'event_driven', 
                       'layered', 'hexagonal', 'clean_architecture', 'domain_driven']
    },
    DESIGN: {
        name: 'Design Patterns',
        subcategories: ['creational', 'structural', 'behavioral', 'concurrency',
                       'functional', 'reactive']
    },
    DATA: {
        name: 'Data Patterns',
        subcategories: ['database_design', 'caching', 'data_flow', 'etl', 
                       'streaming', 'batch_processing', 'data_modeling']
    },
    API: {
        name: 'API & Integration Patterns',
        subcategories: ['rest', 'graphql', 'grpc', 'event_sourcing', 'saga',
                       'circuit_breaker', 'bulkhead', 'timeout']
    },
    SECURITY: {
        name: 'Security Patterns',
        subcategories: ['authentication', 'authorization', 'encryption', 'input_validation',
                       'secure_communication', 'access_control']
    },
    DEPLOYMENT: {
        name: 'Deployment Patterns',
        subcategories: ['blue_green', 'canary', 'rolling', 'feature_flags',
                       'infrastructure_as_code', 'containerization']
    },
    OBSERVABILITY: {
        name: 'Observability Patterns',
        subcategories: ['monitoring', 'logging', 'tracing', 'alerting', 
                       'metrics', 'health_checks', 'debugging']
    },
    PERFORMANCE: {
        name: 'Performance Patterns',
        subcategories: ['caching', 'load_balancing', 'async_processing', 'batching',
                       'connection_pooling', 'lazy_loading', 'prefetching']
    },
    DEVELOPMENT: {
        name: 'Development Process Patterns',
        subcategories: ['testing_strategy', 'code_organization', 'branching_strategy',
                       'code_review', 'pair_programming', 'refactoring']
    },
    QUALITY: {
        name: 'Quality Assurance Patterns',
        subcategories: ['static_analysis', 'code_coverage', 'continuous_integration',
                       'automated_testing', 'error_handling', 'validation']
    },
    ANTIPATTERNS: {
        name: 'Anti-Patterns',
        subcategories: ['code_smells', 'architectural_debt', 'performance_issues', 
                       'security_vulnerabilities', 'maintenance_problems']
    }
};

// Technology categories for tracking
export const TechnologyCategories = {
    LANGUAGE: 'language',
    FRAMEWORK: 'framework',
    LIBRARY: 'library',
    DATABASE: 'database',
    TOOL: 'tool',
    SERVICE: 'service',
    PLATFORM: 'platform',
    PROTOCOL: 'protocol'
};

// Confidence thresholds
export const ConfidenceThresholds = {
    HIGH: 0.8,
    MEDIUM: 0.5,
    LOW: 0.3,
    MINIMUM: 0.1
};

// Default configurations
export const DefaultConfigs = {
    BATCH_SIZE: 10,
    MAX_CONCURRENT: 5,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
    DEDUP_WINDOW_HOURS: 24,
    ARCHIVE_AFTER_DAYS: 90
};