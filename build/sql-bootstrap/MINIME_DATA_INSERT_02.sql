

-- Tag Categories (for organizing tags)
INSERT INTO tag_categories (category_name, description, selection_prompt, priority, is_active) VALUES
('general', 'General purpose tags', 'Select for general categorization', 1, true),
('technical', 'Technical and technology-related tags', 'Select for technical concepts', 2, true),
('architectural', 'Architecture and design patterns', 'Select for architectural decisions', 3, true),
('performance', 'Performance and optimization', 'Select for performance-related items', 4, true),
('security', 'Security-related tags', 'Select for security concerns', 5, true),
('workflow', 'Development workflow and process', 'Select for workflow items', 6, true);

-- Tags (predefined common tags)
INSERT INTO tags (tag_name, category_id, description) VALUES
('bug', (SELECT id FROM tag_categories WHERE category_name = 'general'), 'Bug or issue'),
('feature', (SELECT id FROM tag_categories WHERE category_name = 'general'), 'New feature'),
('refactor', (SELECT id FROM tag_categories WHERE category_name = 'general'), 'Code refactoring'),
('optimization', (SELECT id FROM tag_categories WHERE category_name = 'performance'), 'Performance optimization'),
('security-fix', (SELECT id FROM tag_categories WHERE category_name = 'security'), 'Security vulnerability fix'),
('api', (SELECT id FROM tag_categories WHERE category_name = 'technical'), 'API-related'),
('database', (SELECT id FROM tag_categories WHERE category_name = 'technical'), 'Database-related'),
('architecture', (SELECT id FROM tag_categories WHERE category_name = 'architectural'), 'Architectural decision');


-- Sample project for testing
INSERT INTO projects (name, description, settings) VALUES
('Sample Project', 'A sample project for testing MiniMe-MCP', 
 '{"auto_tag": true, "enable_insights": true, "default_importance": 0.5}'::jsonb);

-- Memory Template Mappings (maps memory types to insight templates)

INSERT INTO memory_template_mappings (memory_type, template_names, priority) VALUES
('code', ARRAY['code_patterns', 'technical_gotchas_pitfalls', 'general_insights'], 10),
('bug', ARRAY['debugging_discoveries', 'bug_fix_insights', 'general_insights'], 10),
('decision', ARRAY['decision_rationale_extractor', 'architectural_decisions', 'general_insights'], 10),
('insight', ARRAY['learning_progress_tracker', 'general_insights'], 10),
('general', ARRAY['general_insights'], 5),
('progress', ARRAY['progress_patterns', 'general_insights'], 10),
('summary', ARRAY['summary_insights', 'general_insights'], 10),
('release_version', ARRAY['release_patterns', 'general_insights'], 10),
('prd', ARRAY['requirements_insights', 'general_insights'], 10),
('project_brief', ARRAY['project_insights', 'requirements_insights', 'general_insights'], 10),
('product_context', ARRAY['product_insights', 'general_insights'], 10),
('active_context', ARRAY['context_insights', 'general_insights'], 10),
('system_patterns', ARRAY['architectural_decisions', 'code_patterns', 'general_insights'], 10),
('tech_context', ARRAY['technical_gotchas_pitfalls', 'general_insights'], 10),
('tech_reference', ARRAY['technical_gotchas_pitfalls', 'general_insights'], 10),
('architecture', ARRAY['architectural_decisions', 'system_design_patterns', 'general_insights'], 10),
('requirements', ARRAY['requirements_insights', 'general_insights'], 10),
('design_decisions', ARRAY['decision_rationale_extractor', 'architectural_decisions', 'general_insights'], 10),
('implementation_notes', ARRAY['code_patterns', 'technical_gotchas_pitfalls', 'general_insights'], 10),
('lessons_learned', ARRAY['learning_progress_tracker', 'retrospective_insights', 'general_insights'], 10),
('task', ARRAY['task_patterns', 'general_insights'], 10),
('rule', ARRAY['rule_patterns', 'general_insights'], 10),
('reasoning', ARRAY['thinking_insights', 'problem_solving_patterns', 'general_insights'], 10),
('project_brief_doc', ARRAY['project_insights', 'general_insights'], 10),
('project_prd', ARRAY['requirements_insights', 'general_insights'], 10),
('project_plan', ARRAY['planning_insights', 'general_insights'], 10),
('thinking_sequence', ARRAY['thinking_insights', 'problem_solving_patterns', 'general_insights'], 10),
('pattern_library_v2', ARRAY['code_patterns', 'system_design_patterns', 'general_insights'], 10)
ON CONFLICT DO NOTHING;

--

-- Dumped from database version 15.13 (Debian 15.13-0+deb12u1)
-- Dumped by pg_dump version 17.5 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0; -- Removed: Only available in PostgreSQL 17+
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', 'public', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SELECT pg_catalog.setval('public.insight_templates_v2_id_seq', 200, true);


--
-- PostgreSQL database dump complete
--


-- =====================================================
-- ADDITIONAL CONFIGURATIONS FROM init-v2.sql
-- =====================================================

-- Clustering configuration (using config_key structure)
INSERT INTO clustering_config (config_key, config_value, description) VALUES
('cluster_params', '{"min_size": 2, "similarity_threshold": 0.6, "time_window_days": 7, "max_cluster_size": 20}', 'Clustering parameters'),
('feature_flags', '{"clustering_enabled": true, "embedding_similarity": false, "tag_similarity": true}', 'Feature toggles for clustering'),
('performance', '{"batch_size": 100, "parallel_clusters": 5, "timeout_seconds": 300}', 'Performance settings')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- VIEWS AND FUNCTIONS
-- =====================================================



-- System configuration data
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('ai_insights_enabled', 'false', 'Enable AI insights generation', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('ai_insights_schedule_minutes', '60', 'Minutes between AI insights generation runs', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('analytics_enabled', 'true', 'Enable analytics collection', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('analytics_interval_minutes', '30', 'Time interval for analytics snapshots (1-60)', 'analytics', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('analytics_retention_days', '7', 'Days to retain minute-level analytics data', 'analytics', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('auto_tagging_enabled', 'false', 'Automatically tag memories based on content', 'features', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('cache_ttl_seconds', '300', 'Cache time-to-live in seconds', 'performance', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('embeddings_enabled', 'true', 'Enable embedding generation', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('hybrid_search_content_weight', '"0.7"', 'Weight for content embedding in hybrid search (0.0-1.0)', 'search', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('hybrid_search_enabled', '"true"', 'Enable hybrid content + tag embedding search', 'search', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('hybrid_search_tag_weight', '"0.3"', 'Weight for tag embedding in hybrid search (0.0-1.0)', 'search', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('learning_batch_size', '10', 'Number of memories to process per learning cycle', 'learning', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('learning_confidence_threshold', '0.5', 'Minimum confidence score for pattern detection (0-1)', 'learning', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('learning_enabled', 'true', 'Enable/disable meta-learning system', 'learning', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('learning_pipeline_enabled', 'true', 'Enable learning pipeline processing', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('learning_pipeline_schedule_minutes', '15', 'Minutes between learning pipeline runs', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('max_concurrent_operations', '5', 'Maximum concurrent database operations', 'performance', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('memory_deduplication_similarity_threshold', '0.75', 'Similarity threshold for general memory deduplication (0-1)', 'deduplication', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('model_embedding', '"mxbai-embed-large"', 'Embedding model name', 'models', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('model_llm', '"deepseek-coder:6.7b"', 'LLM model name', 'models', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('ollama_host', '"http://host.docker.internal:11434"', 'Ollama server host URL', 'models', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('pattern_min_frequency', '3', 'Minimum occurrences required for pattern recognition', 'learning', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('tag_embedding_dimensions', '"1024"', 'Dimensions of tag embeddings', 'search', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('tag_embedding_model', '"mxbai-embed-large:latest"', 'Model used for generating tag embeddings', 'search', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('task_deduplication_enabled', 'false', 'Enable automatic task deduplication analysis', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('task_deduplication_llm_confidence_threshold', '0.7', 'Minimum LLM confidence score to mark tasks as duplicates (0-1)', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('task_deduplication_schedule_minutes', '30', 'Minutes between automatic deduplication runs', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('task_deduplication_similarity_threshold', '0.75', 'Minimum vector similarity score to consider tasks as potential duplicates (0-1)', 'jobs', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('task_management_enabled', 'true', 'Enable task management features', 'features', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;
INSERT INTO system_config (key, value, description, category, updated_at, updated_by) VALUES ('thinking_sequences_enabled', 'false', 'Enable sequential thinking system', 'features', CURRENT_TIMESTAMP, 'system') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP;

-- Embedding models data
INSERT INTO embedding_models (model_name, dimensions, provider, model_size_mb, description, is_available, is_default, config, created_at) VALUES ('all-minilm', 384, 'ollama', 45, 'Lightweight embedding model for basic similarity search', false, false, '{"quantization": "q4_0", "context_length": 256}'::jsonb, CURRENT_TIMESTAMP) ON CONFLICT (model_name) DO UPDATE SET is_available = EXCLUDED.is_available, is_default = EXCLUDED.is_default;
INSERT INTO embedding_models (model_name, dimensions, provider, model_size_mb, description, is_available, is_default, config, created_at) VALUES ('mxbai-embed-large:latest', 1024, 'ollama', 669, 'MxBai Embed Large model for high-quality text embeddings', true, true, '{"quantization": "F16", "output_format": "vector", "context_length": 512}'::jsonb, CURRENT_TIMESTAMP) ON CONFLICT (model_name) DO UPDATE SET is_available = EXCLUDED.is_available, is_default = EXCLUDED.is_default;

