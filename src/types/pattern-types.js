/**
 * Comprehensive Pattern Types for MiniMe-MCP
 * This defines all the coding patterns that can be detected and tracked
 */

export const PATTERN_CATEGORIES = {
  // Architectural Patterns
  ARCHITECTURAL: {
    name: 'architectural',
    patterns: [
      'mvc', 'mvp', 'mvvm', 'layered_architecture', 'microservices',
      'monolithic', 'serverless', 'event_driven', 'plugin_architecture',
      'clean_architecture', 'hexagonal_architecture', 'onion_architecture',
      'domain_driven_design', 'service_oriented', 'pipe_and_filter'
    ]
  },
  
  // Design Patterns (Gang of Four + Modern)
  CREATIONAL: {
    name: 'creational',
    patterns: [
      'singleton', 'factory', 'abstract_factory', 'builder', 'prototype',
      'dependency_injection', 'service_locator', 'object_pool', 'lazy_initialization'
    ]
  },
  
  STRUCTURAL: {
    name: 'structural',
    patterns: [
      'adapter', 'bridge', 'composite', 'decorator', 'facade',
      'flyweight', 'proxy', 'module', 'mixin', 'extension_object'
    ]
  },
  
  BEHAVIORAL: {
    name: 'behavioral',
    patterns: [
      'observer', 'strategy', 'command', 'iterator', 'mediator',
      'memento', 'chain_of_responsibility', 'state', 'template_method',
      'visitor', 'interpreter', 'null_object', 'specification'
    ]
  },
  
  // Concurrency Patterns
  CONCURRENCY: {
    name: 'concurrency',
    patterns: [
      'thread_pool', 'mutex', 'semaphore', 'monitor', 'barrier',
      'producer_consumer', 'readers_writers', 'scheduler', 'thread_local_storage',
      'active_object', 'reactor', 'proactor', 'half_sync_half_async'
    ]
  },
  
  // Data Processing Patterns
  DATA_PROCESSING: {
    name: 'data_processing',
    patterns: [
      'batch_processing', 'stream_processing', 'etl', 'elt', 'map_reduce',
      'pipeline', 'dataflow', 'event_sourcing', 'cqrs', 'saga',
      'outbox', 'transactional_outbox', 'change_data_capture'
    ]
  },
  
  // API & Integration Patterns
  API_PATTERNS: {
    name: 'api_patterns',
    patterns: [
      'rest', 'graphql', 'grpc', 'soap', 'websocket',
      'webhook', 'polling', 'long_polling', 'sse', 'api_gateway',
      'bff', 'api_composition', 'api_versioning', 'rate_limiting',
      'circuit_breaker', 'retry', 'timeout', 'bulkhead'
    ]
  },
  
  // Messaging Patterns
  MESSAGING: {
    name: 'messaging',
    patterns: [
      'pub_sub', 'message_queue', 'request_reply', 'correlation_id',
      'message_router', 'message_translator', 'message_filter',
      'splitter', 'aggregator', 'resequencer', 'content_enricher',
      'claim_check', 'normalizer', 'canonical_data_model'
    ]
  },
  
  // Database Patterns
  DATABASE: {
    name: 'database',
    patterns: [
      'repository', 'unit_of_work', 'identity_map', 'data_mapper',
      'active_record', 'table_data_gateway', 'row_data_gateway',
      'dao', 'dto', 'lazy_loading', 'eager_loading', 'optimistic_locking',
      'pessimistic_locking', 'sharding', 'replication', 'read_write_splitting'
    ]
  },
  
  // Cloud & Distributed Patterns
  DISTRIBUTED: {
    name: 'distributed',
    patterns: [
      'service_discovery', 'load_balancing', 'circuit_breaker',
      'retry_with_backoff', 'timeout', 'health_check', 'sidecar',
      'ambassador', 'anti_corruption_layer', 'gateway_aggregation',
      'strangler_fig', 'compensating_transaction', 'competing_consumers'
    ]
  },
  
  // Security Patterns
  SECURITY: {
    name: 'security',
    patterns: [
      'authentication', 'authorization', 'oauth', 'jwt', 'session_management',
      'input_validation', 'output_encoding', 'parameterized_queries',
      'least_privilege', 'defense_in_depth', 'fail_secure', 'audit_logging',
      'encryption_at_rest', 'encryption_in_transit', 'key_management'
    ]
  },
  
  // Performance Patterns
  PERFORMANCE: {
    name: 'performance',
    patterns: [
      'caching', 'memoization', 'lazy_evaluation', 'eager_evaluation',
      'object_pooling', 'connection_pooling', 'flyweight', 'copy_on_write',
      'double_buffering', 'prefetching', 'batch_processing', 'async_processing',
      'parallel_processing', 'load_shedding', 'backpressure'
    ]
  },
  
  // Error Handling Patterns
  ERROR_HANDLING: {
    name: 'error_handling',
    patterns: [
      'try_catch', 'error_codes', 'exceptions', 'result_type',
      'maybe_monad', 'either_monad', 'validation', 'dead_letter_queue',
      'retry_logic', 'fallback', 'fail_fast', 'graceful_degradation',
      'error_aggregation', 'error_context', 'structured_logging'
    ]
  },
  
  // Testing Patterns
  TESTING: {
    name: 'testing',
    patterns: [
      'unit_test', 'integration_test', 'e2e_test', 'smoke_test',
      'regression_test', 'mock', 'stub', 'spy', 'fake',
      'test_fixture', 'test_data_builder', 'object_mother',
      'page_object', 'screenplay', 'bdd', 'tdd', 'property_based'
    ]
  },
  
  // Frontend Patterns
  FRONTEND: {
    name: 'frontend',
    patterns: [
      'component', 'container_presentational', 'hoc', 'render_props',
      'hooks', 'provider', 'compound_component', 'controlled_component',
      'uncontrolled_component', 'portal', 'error_boundary', 'suspense',
      'lazy_loading', 'code_splitting', 'progressive_enhancement'
    ]
  },
  
  // Mobile Patterns
  MOBILE: {
    name: 'mobile',
    patterns: [
      'offline_first', 'sync_conflict_resolution', 'push_notification',
      'deep_linking', 'app_shell', 'responsive_design', 'adaptive_design',
      'gesture_handling', 'navigation_patterns', 'state_restoration'
    ]
  },
  
  // DevOps & Infrastructure Patterns
  DEVOPS: {
    name: 'devops',
    patterns: [
      'ci_cd', 'blue_green_deployment', 'canary_deployment',
      'feature_flags', 'dark_launching', 'rolling_deployment',
      'immutable_infrastructure', 'infrastructure_as_code',
      'gitops', 'chaos_engineering', 'observability'
    ]
  },
  
  // Code Organization Patterns
  CODE_ORGANIZATION: {
    name: 'code_organization',
    patterns: [
      'module_pattern', 'namespace', 'barrel_export', 'index_export',
      'feature_folder', 'layer_folder', 'domain_folder', 'shared_kernel',
      'bounded_context', 'aggregate', 'value_object', 'entity',
      'domain_service', 'application_service', 'infrastructure_service'
    ]
  },

  // Process & Methodology Patterns
  PROCESS_METHODOLOGY: {
    name: 'process_methodology',
    patterns: [
      'agile', 'scrum', 'kanban', 'waterfall', 'lean', 'xp',
      'pair_programming', 'mob_programming', 'code_review', 'pull_request',
      'trunk_based_development', 'git_flow', 'github_flow', 'feature_branching',
      'semantic_versioning', 'continuous_integration', 'continuous_delivery',
      'technical_debt_management', 'refactoring', 'legacy_modernization'
    ]
  },

  // Cloud Platform Patterns
  CLOUD_PLATFORMS: {
    name: 'cloud_platforms',
    patterns: [
      'aws_lambda', 'aws_s3', 'aws_rds', 'aws_ec2', 'aws_ecs', 'aws_eks',
      'azure_functions', 'azure_storage', 'azure_sql', 'azure_aks',
      'gcp_cloud_functions', 'gcp_storage', 'gcp_sql', 'gcp_gke',
      'serverless_computing', 'function_as_service', 'platform_as_service',
      'infrastructure_as_service', 'edge_computing', 'multi_cloud',
      'hybrid_cloud', 'cloud_native', 'twelve_factor_app'
    ]
  },

  // Data Engineering Patterns
  DATA_ENGINEERING: {
    name: 'data_engineering',
    patterns: [
      'etl', 'elt', 'data_pipeline', 'data_lake', 'data_warehouse',
      'data_mesh', 'stream_processing', 'batch_processing', 'real_time_processing',
      'map_reduce', 'apache_spark', 'apache_flink', 'apache_kafka',
      'apache_airflow', 'data_lineage', 'data_catalog', 'data_governance',
      'data_quality', 'data_validation', 'schema_evolution', 'time_series_data',
      'geospatial_data', 'big_data', 'data_partitioning', 'data_sharding'
    ]
  },

  // Algorithm & Data Structure Patterns
  ALGORITHMS: {
    name: 'algorithms',
    patterns: [
      'sorting_algorithms', 'search_algorithms', 'graph_algorithms', 'tree_algorithms',
      'dynamic_programming', 'greedy_algorithms', 'divide_and_conquer',
      'backtracking', 'recursion', 'memoization', 'big_o_optimization',
      'hash_tables', 'linked_lists', 'arrays', 'stacks', 'queues',
      'binary_trees', 'balanced_trees', 'graphs', 'heaps', 'tries',
      'bloom_filters', 'consistent_hashing', 'merkle_trees'
    ]
  },

  // Reliability & Resilience Patterns
  RELIABILITY: {
    name: 'reliability',
    patterns: [
      'disaster_recovery', 'backup_strategies', 'high_availability',
      'fault_tolerance', 'graceful_degradation', 'failover', 'failback',
      'redundancy', 'replication', 'clustering', 'auto_scaling',
      'elasticity', 'chaos_engineering', 'fault_injection',
      'circuit_breaker_testing', 'disaster_recovery_testing',
      'business_continuity', 'rpo_rto_planning', 'incident_response'
    ]
  },

  // Observability & Monitoring Patterns
  OBSERVABILITY: {
    name: 'observability',
    patterns: [
      'monitoring', 'logging', 'metrics', 'tracing', 'distributed_tracing',
      'apm', 'application_performance_monitoring', 'infrastructure_monitoring',
      'synthetic_monitoring', 'real_user_monitoring', 'alerting',
      'dashboards', 'sli_slo_sla', 'error_budgets', 'incident_management',
      'postmortem_analysis', 'root_cause_analysis', 'observability_driven_development',
      'telemetry', 'health_checks', 'heartbeat_monitoring'
    ]
  },

  // Deployment & Release Patterns
  DEPLOYMENT: {
    name: 'deployment',
    patterns: [
      'blue_green_deployment', 'canary_deployment', 'rolling_deployment',
      'a_b_testing', 'feature_flags', 'feature_toggles', 'dark_launching',
      'progressive_delivery', 'immutable_deployment', 'zero_downtime_deployment',
      'database_migrations', 'backward_compatibility', 'forward_compatibility',
      'deployment_pipelines', 'release_trains', 'hotfix_deployment',
      'rollback_strategies', 'deployment_automation'
    ]
  },

  // Programming Paradigm Patterns
  PROGRAMMING_PARADIGMS: {
    name: 'programming_paradigms',
    patterns: [
      'object_oriented_programming', 'functional_programming', 'procedural_programming',
      'reactive_programming', 'aspect_oriented_programming', 'event_driven_programming',
      'declarative_programming', 'imperative_programming', 'logic_programming',
      'asynchronous_programming', 'synchronous_programming', 'concurrent_programming',
      'parallel_programming', 'multithreading', 'multiprocessing',
      'coroutines', 'generators', 'async_await', 'promises', 'futures',
      'immutability', 'pure_functions', 'higher_order_functions', 'closures',
      'dependency_inversion', 'inversion_of_control', 'aspect_weaving'
    ]
  },

  // Network & Protocol Patterns
  NETWORK_PROTOCOLS: {
    name: 'network_protocols',
    patterns: [
      'http_https', 'tcp_ip', 'udp', 'dns', 'dhcp', 'ssl_tls',
      'websockets', 'webrtc', 'grpc', 'mqtt', 'amqp', 'stomp',
      'load_balancing', 'reverse_proxy', 'forward_proxy', 'cdn',
      'api_gateway', 'service_mesh', 'network_security',
      'vpn', 'firewall_rules', 'rate_limiting', 'ddos_protection'
    ]
  },

  // User Experience Patterns
  USER_EXPERIENCE: {
    name: 'user_experience',
    patterns: [
      'responsive_design', 'adaptive_design', 'mobile_first', 'progressive_web_apps',
      'single_page_applications', 'multi_page_applications', 'server_side_rendering',
      'client_side_rendering', 'static_site_generation', 'accessibility',
      'internationalization', 'localization', 'progressive_enhancement',
      'graceful_degradation', 'user_centered_design', 'design_systems',
      'component_libraries', 'atomic_design', 'material_design',
      'human_interface_guidelines', 'usability_testing', 'a11y_compliance'
    ]
  },

  // Quality Assurance Patterns
  QUALITY_ASSURANCE: {
    name: 'quality_assurance',
    patterns: [
      'static_analysis', 'code_quality_metrics', 'code_coverage',
      'mutation_testing', 'property_based_testing', 'fuzz_testing',
      'performance_testing', 'load_testing', 'stress_testing',
      'security_testing', 'penetration_testing', 'vulnerability_scanning',
      'compliance_testing', 'accessibility_testing', 'usability_testing',
      'compatibility_testing', 'regression_testing', 'smoke_testing',
      'sanity_testing', 'acceptance_testing', 'exploratory_testing'
    ]
  },

  // Infrastructure & Operations Patterns
  INFRASTRUCTURE_OPS: {
    name: 'infrastructure_ops',
    patterns: [
      'infrastructure_as_code', 'configuration_management', 'provisioning',
      'terraform', 'ansible', 'puppet', 'chef', 'kubernetes',
      'docker_containerization', 'virtualization', 'orchestration',
      'service_discovery', 'container_orchestration', 'helm_charts',
      'gitops', 'infrastructure_monitoring', 'capacity_planning',
      'resource_optimization', 'cost_optimization', 'patch_management',
      'backup_automation', 'secrets_management', 'certificate_management'
    ]
  }
};

// Flatten all patterns for easy validation
export const ALL_PATTERN_TYPES = Object.values(PATTERN_CATEGORIES)
  .flatMap(category => category.patterns);

// Get category for a pattern
export function getPatternCategory(patternType) {
  for (const [key, category] of Object.entries(PATTERN_CATEGORIES)) {
    if (category.patterns.includes(patternType)) {
      return category.name;
    }
  }
  return 'unknown';
}

// Get all patterns in a category
export function getPatternsInCategory(categoryName) {
  const category = Object.values(PATTERN_CATEGORIES)
    .find(cat => cat.name === categoryName);
  return category ? category.patterns : [];
}

// Validate if a pattern type is valid
export function isValidPatternType(patternType) {
  return ALL_PATTERN_TYPES.includes(patternType);
}