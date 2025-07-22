-- =====================================================
-- MINIME DATABASE VALIDATION SCRIPT
-- File: MINIME_VALIDATION_1000.sql
-- Purpose: Validate all database migrations and schema changes
-- This file should be run after all migrations to ensure everything is properly applied
-- =====================================================

-- Create a temporary table to store validation results
CREATE TEMP TABLE IF NOT EXISTS validation_results (
    test_name TEXT,
    test_category TEXT,
    expected TEXT,
    actual TEXT,
    status TEXT,
    details TEXT
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a constraint exists and contains expected values
CREATE OR REPLACE FUNCTION check_constraint_contains(
    p_constraint_name TEXT,
    p_expected_values TEXT[]
) RETURNS TABLE(constraint_exists BOOLEAN, missing_values TEXT[]) AS $$
DECLARE
    v_constraint_def TEXT;
    v_missing_values TEXT[] := '{}';
    v_value TEXT;
BEGIN
    -- Get constraint definition
    SELECT pg_get_constraintdef(oid) INTO v_constraint_def
    FROM pg_constraint
    WHERE conname = p_constraint_name;
    
    IF v_constraint_def IS NULL THEN
        RETURN QUERY SELECT false, p_expected_values;
    ELSE
        -- Check each expected value
        FOREACH v_value IN ARRAY p_expected_values
        LOOP
            IF v_constraint_def NOT LIKE '%' || v_value || '%' THEN
                v_missing_values := array_append(v_missing_values, v_value);
            END IF;
        END LOOP;
        
        RETURN QUERY SELECT true, v_missing_values;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MIGRATION 05.001: Thought Types Validation
-- =====================================================

INSERT INTO validation_results 
WITH constraint_check AS (
    SELECT * FROM check_constraint_contains(
        'thoughts_type_valid', 
        ARRAY['analysis', 'general', 'reasoning', 'conclusion', 'question', 'hypothesis', 'observation', 'assumption']
    )
)
SELECT 
    'thoughts_type_valid constraint',
    'Migration 05.001',
    'All thought types including analysis and general',
    CASE 
        WHEN constraint_exists THEN 
            CASE 
                WHEN array_length(missing_values, 1) IS NULL OR array_length(missing_values, 1) = 0 
                THEN 'All types present' 
                ELSE 'Missing: ' || array_to_string(missing_values, ', ')
            END
        ELSE 'Constraint not found'
    END,
    CASE 
        WHEN constraint_exists AND (array_length(missing_values, 1) IS NULL OR array_length(missing_values, 1) = 0)
        THEN 'PASSED'
        ELSE 'FAILED'
    END,
    'Expected thought types: reasoning, conclusion, question, hypothesis, observation, assumption, analysis, general'
FROM constraint_check;

-- =====================================================
-- MIGRATION 05.002: Search Analytics Modes Validation
-- =====================================================

INSERT INTO validation_results 
WITH constraint_check AS (
    SELECT * FROM check_constraint_contains(
        'search_analytics_search_mode_check', 
        ARRAY['content_only', 'tags_only', 'hybrid', 'semantic', 'keyword']
    )
)
SELECT 
    'search_analytics_search_mode_check constraint',
    'Migration 05.002',
    'All search modes including semantic and keyword',
    CASE 
        WHEN constraint_exists THEN 
            CASE 
                WHEN array_length(missing_values, 1) IS NULL OR array_length(missing_values, 1) = 0 
                THEN 'All modes present' 
                ELSE 'Missing: ' || array_to_string(missing_values, ', ')
            END
        ELSE 'Constraint not found'
    END,
    CASE 
        WHEN constraint_exists AND (array_length(missing_values, 1) IS NULL OR array_length(missing_values, 1) = 0)
        THEN 'PASSED'
        ELSE 'FAILED'
    END,
    'Expected search modes: content_only, tags_only, hybrid, semantic, keyword'
FROM constraint_check;

-- =====================================================
-- MIGRATION 05.003: Unified Insights Source Types Validation
-- =====================================================

INSERT INTO validation_results 
WITH constraint_check AS (
    SELECT * FROM check_constraint_contains(
        'unified_insights_v2_source_type_check', 
        ARRAY['memory', 'pattern', 'cluster', 'memory_cluster', 'synthesis', 'manual']
    )
)
SELECT 
    'unified_insights_v2_source_type_check constraint',
    'Migration 05.003',
    'All source types including memory_cluster',
    CASE 
        WHEN constraint_exists THEN 
            CASE 
                WHEN array_length(missing_values, 1) IS NULL OR array_length(missing_values, 1) = 0 
                THEN 'All types present' 
                ELSE 'Missing: ' || array_to_string(missing_values, ', ')
            END
        ELSE 'Constraint not found'
    END,
    CASE 
        WHEN constraint_exists AND (array_length(missing_values, 1) IS NULL OR array_length(missing_values, 1) = 0)
        THEN 'PASSED'
        ELSE 'FAILED'
    END,
    'Expected source types: memory, pattern, cluster, memory_cluster, synthesis, manual'
FROM constraint_check;

-- =====================================================
-- TABLE EXISTENCE CHECKS
-- =====================================================

-- Check core tables exist
INSERT INTO validation_results
SELECT 
    table_name || ' table',
    'Core Tables',
    'Table exists',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN 'Exists' ELSE 'Missing' END,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = t.table_name
    ) THEN 'PASSED' ELSE 'FAILED' END,
    'Core table required for system operation'
FROM (VALUES 
    ('projects'),
    ('memories'),
    ('thoughts'),
    ('search_analytics'),
    ('unified_insights_v2'),
    ('insight_templates_v2'),
    ('insight_processing_queue_v2')
) AS t(table_name);

-- =====================================================
-- EXTENSION CHECKS
-- =====================================================

INSERT INTO validation_results
SELECT 
    'pgvector extension',
    'Extensions',
    'Extension installed',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN 'Installed' ELSE 'Not installed' END,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) THEN 'PASSED' ELSE 'FAILED' END,
    'Required for embedding storage and similarity search';

-- =====================================================
-- INDEX CHECKS
-- =====================================================

INSERT INTO validation_results
SELECT 
    indexname || ' index',
    'Performance Indexes',
    'Index exists',
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = idx.indexname
    ) THEN 'Exists' ELSE 'Missing' END,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname = idx.indexname
    ) THEN 'PASSED' ELSE 'WARNING' END,
    'Performance optimization index'
FROM (VALUES 
    ('idx_memories_embedding'),
    ('idx_memories_smart_tags_gin'),
    ('idx_memories_project_created'),
    ('idx_unified_insights_v2_embedding')
) AS idx(indexname);

-- =====================================================
-- TRIGGER CHECKS
-- =====================================================

INSERT INTO validation_results
SELECT 
    tg.trigger_name || ' on ' || tg.table_name,
    'Triggers',
    'Trigger exists',
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = tg.trigger_name 
        AND event_object_table = tg.table_name
    ) THEN 'Exists' ELSE 'Missing' END,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_schema = 'public' 
        AND trigger_name = tg.trigger_name 
        AND event_object_table = tg.table_name
    ) THEN 'PASSED' ELSE 'WARNING' END,
    'Auto-update trigger for timestamps'
FROM (VALUES 
    ('update_memories_updated_at', 'memories'),
    ('update_projects_updated_at', 'projects'),
    ('update_thoughts_updated_at', 'thoughts')
) AS tg(trigger_name, table_name);

-- =====================================================
-- DATA INTEGRITY CHECKS
-- =====================================================

-- Check for orphaned thoughts
INSERT INTO validation_results
SELECT 
    'Orphaned thoughts check',
    'Data Integrity',
    'No orphaned thoughts',
    CASE 
        WHEN COUNT(*) = 0 THEN 'None found'
        ELSE COUNT(*) || ' orphaned thoughts found'
    END,
    CASE WHEN COUNT(*) = 0 THEN 'PASSED' ELSE 'WARNING' END,
    'Thoughts should have valid thinking sequence references'
FROM thoughts t
LEFT JOIN thinking_sequences ts ON t.sequence_id = ts.id
WHERE ts.id IS NULL;

-- Check for memories without projects
INSERT INTO validation_results
SELECT 
    'Memories without projects',
    'Data Integrity',
    'All memories have projects',
    CASE 
        WHEN COUNT(*) = 0 THEN 'All memories have projects'
        ELSE COUNT(*) || ' memories without projects'
    END,
    CASE WHEN COUNT(*) = 0 THEN 'PASSED' ELSE 'WARNING' END,
    'Memories should belong to projects'
FROM memories m
LEFT JOIN projects p ON m.project_id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- CONFIGURATION CHECKS
-- =====================================================

-- Check if sample templates are loaded
INSERT INTO validation_results
SELECT 
    'Insight templates',
    'Configuration',
    'Templates loaded',
    'Found ' || COUNT(*) || ' templates',
    CASE WHEN COUNT(*) > 0 THEN 'PASSED' ELSE 'WARNING' END,
    'Insight templates should be loaded for v2 processing'
FROM insight_templates_v2
WHERE is_active = true;

-- =====================================================
-- MIGRATION 05.004: Project ID Column Validation
-- =====================================================

INSERT INTO validation_results
SELECT 
    'project_id column in insight_processing_queue_v2',
    'Migration 05.004',
    'Column exists',
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'insight_processing_queue_v2' 
            AND column_name = 'project_id'
        ) THEN 'Column exists'
        ELSE 'Column missing'
    END,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'insight_processing_queue_v2' 
            AND column_name = 'project_id'
        ) THEN 'PASSED'
        ELSE 'FAILED'
    END,
    'Required for thinking sequence insights';

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

-- Display results
SELECT 
    test_category,
    test_name,
    expected,
    actual,
    status,
    details
FROM validation_results
ORDER BY 
    CASE status 
        WHEN 'FAILED' THEN 1 
        WHEN 'WARNING' THEN 2 
        WHEN 'PASSED' THEN 3 
    END,
    test_category,
    test_name;

-- Summary counts
SELECT 
    status,
    COUNT(*) as count
FROM validation_results
GROUP BY status
ORDER BY 
    CASE status 
        WHEN 'FAILED' THEN 1 
        WHEN 'WARNING' THEN 2 
        WHEN 'PASSED' THEN 3 
    END;

-- Overall status
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM validation_results WHERE status = 'FAILED') THEN
            '❌ VALIDATION FAILED - Critical issues found'
        WHEN EXISTS (SELECT 1 FROM validation_results WHERE status = 'WARNING') THEN
            '⚠️  VALIDATION PASSED WITH WARNINGS - Non-critical issues found'
        ELSE
            '✅ VALIDATION PASSED - All checks successful'
    END as overall_status,
    (SELECT COUNT(*) FROM validation_results WHERE status = 'FAILED') as failed_count,
    (SELECT COUNT(*) FROM validation_results WHERE status = 'WARNING') as warning_count,
    (SELECT COUNT(*) FROM validation_results WHERE status = 'PASSED') as passed_count;

-- Clean up
DROP FUNCTION IF EXISTS check_constraint_contains(TEXT, TEXT[]);
DROP TABLE IF EXISTS validation_results;