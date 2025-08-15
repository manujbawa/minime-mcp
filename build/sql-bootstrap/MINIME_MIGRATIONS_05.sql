-- MiniMe-MCP Database Migrations and Updates
-- File: MINIME_MIGRATIONS_05.sql
-- Purpose: Contains all database migrations and structural updates
-- Instructions: This file is safe to run multiple times - it checks before making changes
-- Run this file as the last step in the SQL bootstrap sequence

-- ============================================================================
-- Migration 05.001: Add 'analysis' and 'general' to thoughts_type_valid constraint
-- Date: 2025-07-16
-- Description: Expands allowed thought types to include 'analysis' and 'general'
-- Safe to run multiple times - checks current constraint before updating
-- ============================================================================

DO $$
DECLARE
    current_constraint text;
    has_all_types boolean := true;
    expected_types text[] := ARRAY['reasoning', 'conclusion', 'question', 'hypothesis', 'observation', 'assumption', 'analysis', 'general'];
    type_text text;
BEGIN
    -- Get the current constraint definition
    SELECT pg_get_constraintdef(c.oid) INTO current_constraint
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'thoughts_type_valid' 
    AND n.nspname = 'public';
    
    -- Do a more thorough check for each required type
    IF current_constraint IS NULL THEN
        has_all_types := false;
        RAISE NOTICE 'Migration 05.001: thoughts_type_valid constraint does not exist';
    ELSE
        -- Check each expected type individually
        FOREACH type_text IN ARRAY expected_types
        LOOP
            IF current_constraint NOT LIKE '%' || type_text || '%' THEN
                has_all_types := false;
                RAISE NOTICE 'Migration 05.001: Missing type: %', type_text;
            END IF;
        END LOOP;
    END IF;
    
    -- Apply migration if any type is missing
    IF NOT has_all_types THEN
        RAISE NOTICE 'Migration 05.001: Updating thoughts_type_valid constraint...';
        
        -- Drop the existing constraint if it exists
        ALTER TABLE public.thoughts 
        DROP CONSTRAINT IF EXISTS thoughts_type_valid;
        
        -- Add the updated constraint with all types included
        ALTER TABLE public.thoughts 
        ADD CONSTRAINT thoughts_type_valid 
        CHECK ((thought_type)::text = ANY (ARRAY[
            ('reasoning'::character varying)::text, 
            ('conclusion'::character varying)::text, 
            ('question'::character varying)::text, 
            ('hypothesis'::character varying)::text, 
            ('observation'::character varying)::text, 
            ('assumption'::character varying)::text,
            ('analysis'::character varying)::text,
            ('general'::character varying)::text,
            ('alternative'::character varying)::text,
            ('branch'::character varying)::text,
            ('option'::character varying)::text,
            ('variant'::character varying)::text,
            ('fork'::character varying)::text
        ]));
        
        -- Add a comment to document this change
        COMMENT ON CONSTRAINT thoughts_type_valid ON public.thoughts 
        IS 'Valid thought types: reasoning, conclusion, question, hypothesis, observation, assumption, analysis, general, alternative, branch, option, variant, fork. Updated in migration 05.001';
        
        RAISE NOTICE 'Migration 05.001: Successfully updated thoughts_type_valid constraint';
    ELSE
        RAISE NOTICE 'Migration 05.001: All thought types present - skipping';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration 05.001: Error occurred: %', SQLERRM;
        RAISE;
END $$;

-- ============================================================================
-- Migration 05.002: Update search_analytics constraint to include all search modes
-- Date: 2025-07-17
-- Description: Adds 'semantic' and 'keyword' as valid search modes for better compatibility
-- ============================================================================

DO $$
DECLARE
    current_constraint text;
    has_all_modes boolean := true;
    expected_modes text[] := ARRAY['content_only', 'tags_only', 'hybrid', 'semantic', 'keyword'];
    mode_text text;
BEGIN
    -- Get current constraint definition
    SELECT pg_get_constraintdef(c.oid) INTO current_constraint
    FROM pg_constraint c
    WHERE c.conname = 'search_analytics_search_mode_check';
    
    -- Check if constraint exists and has all modes
    IF current_constraint IS NULL THEN
        has_all_modes := false;
        RAISE NOTICE 'Migration 05.002: search_analytics_search_mode_check constraint does not exist';
    ELSE
        -- Check each expected mode individually
        FOREACH mode_text IN ARRAY expected_modes
        LOOP
            IF current_constraint NOT LIKE '%' || mode_text || '%' THEN
                has_all_modes := false;
                RAISE NOTICE 'Migration 05.002: Missing mode: %', mode_text;
            END IF;
        END LOOP;
    END IF;
    
    -- Apply migration if any mode is missing
    IF NOT has_all_modes THEN
        RAISE NOTICE 'Migration 05.002: Updating search_analytics constraint...';
        
        -- Drop the existing constraint
        ALTER TABLE public.search_analytics 
        DROP CONSTRAINT IF EXISTS search_analytics_search_mode_check;
        
        -- Add the updated constraint with all search modes
        ALTER TABLE public.search_analytics 
        ADD CONSTRAINT search_analytics_search_mode_check 
        CHECK ((search_mode)::text = ANY (ARRAY[
            ('content_only'::character varying)::text, 
            ('tags_only'::character varying)::text, 
            ('hybrid'::character varying)::text,
            ('semantic'::character varying)::text,
            ('keyword'::character varying)::text
        ]));
        
        RAISE NOTICE 'Migration 05.002: Successfully updated search_analytics constraint';
    ELSE
        RAISE NOTICE 'Migration 05.002: All search modes present - skipping';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration 05.002: Error occurred: %', SQLERRM;
        -- Don't re-raise if table doesn't exist
        IF SQLERRM NOT LIKE '%relation%does not exist%' THEN
            RAISE;
        END IF;
END $$;

-- ============================================================================
-- Migration 05.003: Update source_type constraint in unified_insights_v2 to include 'memory_cluster'
-- Date: 2025-07-17
-- Description: Adds 'memory_cluster' as a valid source type for cluster insights
-- ============================================================================

DO $$
DECLARE
    current_constraint TEXT;
BEGIN
    -- Get the current constraint definition
    SELECT pg_get_constraintdef(c.oid)
    INTO current_constraint
    FROM pg_constraint c
    JOIN pg_namespace n ON c.connamespace = n.oid
    WHERE c.conname = 'unified_insights_v2_source_type_check'
    AND n.nspname = 'public';
    
    -- Check if 'memory_cluster' is already in the constraint
    IF current_constraint IS NULL OR 
       current_constraint NOT LIKE '%memory_cluster%' THEN
        
        -- Drop the existing constraint
        ALTER TABLE unified_insights_v2 
        DROP CONSTRAINT IF EXISTS unified_insights_v2_source_type_check;
        
        -- Add the updated constraint with 'memory_cluster'
        ALTER TABLE unified_insights_v2 
        ADD CONSTRAINT unified_insights_v2_source_type_check 
        CHECK (source_type IN ('memory', 'pattern', 'cluster', 'memory_cluster', 'synthesis', 'manual'));
        
        RAISE NOTICE 'Migration 05.003: Successfully added memory_cluster to source_type constraint';
    ELSE
        RAISE NOTICE 'Migration 05.003: source_type constraint already includes memory_cluster - skipping';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration 05.003: Error updating source_type constraint: %', SQLERRM;
END $$;

-- ============================================================================
-- Future migrations can be appended below with incrementing numbers (05.004, etc.)
-- Each migration should:
-- 1. Check if it needs to be applied
-- 2. Apply changes only if necessary
-- 3. Be safe to run multiple times (idempotent)
-- ============================================================================

-- =====================================================
-- MIGRATION 05.004: Add project_id to insight_processing_queue_v2
-- =====================================================
DO $$
DECLARE
    column_exists boolean;
    constraint_exists boolean;
    index_exists boolean;
BEGIN
    -- Check if project_id column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'insight_processing_queue_v2' 
        AND column_name = 'project_id'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Migration 05.004: Adding project_id column to insight_processing_queue_v2';
        
        -- Add the column
        ALTER TABLE insight_processing_queue_v2 
        ADD COLUMN project_id INTEGER;
        
        RAISE NOTICE 'Migration 05.004: Column added successfully';
    ELSE
        RAISE NOTICE 'Migration 05.004: project_id column already exists';
    END IF;
    
    -- Check and add foreign key constraint
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_insight_queue_v2_project'
    ) INTO constraint_exists;
    
    IF NOT constraint_exists AND column_exists THEN
        ALTER TABLE insight_processing_queue_v2
        ADD CONSTRAINT fk_insight_queue_v2_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Migration 05.004: Foreign key constraint added';
    END IF;
    
    -- Check and create index
    SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_insight_queue_v2_project_id'
    ) INTO index_exists;
    
    IF NOT index_exists AND column_exists THEN
        CREATE INDEX idx_insight_queue_v2_project_id 
        ON insight_processing_queue_v2(project_id);
        
        RAISE NOTICE 'Migration 05.004: Index created';
    END IF;
    
    RAISE NOTICE 'Migration 05.004: Completed';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Migration 05.004: Error occurred: %', SQLERRM;
        RAISE;
END $$;

-- ============================================================================
-- Migration Summary and Validation
-- ============================================================================
DO $$
DECLARE
    thoughts_valid boolean;
    search_valid boolean;
    project_id_valid boolean;
    insights_valid boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==== MIGRATION VALIDATION SUMMARY ====';
    
    -- Validate thoughts constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conname = 'thoughts_type_valid'
        AND pg_get_constraintdef(c.oid) LIKE '%general%'
        AND pg_get_constraintdef(c.oid) LIKE '%analysis%'
    ) INTO thoughts_valid;
    
    IF thoughts_valid THEN
        RAISE NOTICE '✅ thoughts_type_valid: Contains all required types';
    ELSE
        RAISE NOTICE '❌ thoughts_type_valid: Missing required types';
    END IF;
    
    -- Validate search_analytics constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conname = 'search_analytics_search_mode_check'
        AND pg_get_constraintdef(c.oid) LIKE '%keyword%'
        AND pg_get_constraintdef(c.oid) LIKE '%semantic%'
    ) INTO search_valid;
    
    IF search_valid THEN
        RAISE NOTICE '✅ search_analytics: Contains all required modes';
    ELSE
        RAISE NOTICE '❌ search_analytics: Missing required modes';
    END IF;
    
    -- Validate project_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'insight_processing_queue_v2'
        AND column_name = 'project_id'
    ) INTO project_id_valid;
    
    IF project_id_valid THEN
        RAISE NOTICE '✅ insight_processing_queue_v2: project_id column exists';
    ELSE
        RAISE NOTICE '❌ insight_processing_queue_v2: project_id column missing';
    END IF;
    
    -- Validate unified_insights constraint
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        WHERE c.conname = 'unified_insights_v2_source_type_check'
        AND pg_get_constraintdef(c.oid) LIKE '%memory_cluster%'
    ) INTO insights_valid;
    
    IF insights_valid THEN
        RAISE NOTICE '✅ unified_insights_v2: Contains memory_cluster type';
    ELSE
        RAISE NOTICE '❌ unified_insights_v2: Missing memory_cluster type';
    END IF;
    
    RAISE NOTICE '';
    IF thoughts_valid AND search_valid AND project_id_valid AND insights_valid THEN
        RAISE NOTICE '✅ ALL MIGRATIONS VALIDATED SUCCESSFULLY';
    ELSE
        RAISE NOTICE '⚠️  SOME MIGRATIONS NEED TO BE APPLIED';
        RAISE NOTICE 'Run this migration file again to fix any issues.';
    END IF;
    RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- Migration 05.005: Add token_metadata column to memories table
-- Date: 2025-01-07
-- Description: Adds JSONB column to track token counts for content, summary, and tags
-- Safe to run multiple times - checks if column exists before adding
-- ============================================================================

DO $$
BEGIN
    -- Check if token_metadata column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'memories' 
        AND column_name = 'token_metadata'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Migration 05.005: Adding token_metadata column to memories table...';
        
        -- Add the column
        ALTER TABLE public.memories 
        ADD COLUMN token_metadata JSONB;
        
        -- Add a comment to document the column
        COMMENT ON COLUMN public.memories.token_metadata IS 
        'Token count breakdown: {content_tokens, summary_tokens, tags_tokens, total_tokens, calculation_method, calculated_at}';
        
        -- Create an index for efficient token analytics queries
        CREATE INDEX idx_memories_token_total ON public.memories (((token_metadata->>'total_tokens')::int));
        CREATE INDEX idx_memories_project_token ON public.memories (project_id, ((token_metadata->>'total_tokens')::int));
        
        RAISE NOTICE 'Migration 05.005: Successfully added token_metadata column and indexes';
    ELSE
        RAISE NOTICE 'Migration 05.005: token_metadata column already exists (skipping)';
    END IF;
END $$;

-- ============================================================================
-- Migration 05.006: Add project linking support
-- Date: 2025-01-08
-- Description: Adds project_links table for many-to-many relationships between projects
-- Safe to run multiple times - checks if structures exist before creating
-- ============================================================================

DO $$
BEGIN
    -- Check if project_links table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'project_links' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Migration 05.006: Creating project_links table...';
        
        -- Create project_links table
        CREATE TABLE public.project_links (
            id SERIAL PRIMARY KEY,
            source_project_id INTEGER NOT NULL,
            target_project_id INTEGER NOT NULL,
            link_type VARCHAR(50) NOT NULL DEFAULT 'related',
            visibility VARCHAR(20) DEFAULT 'full',
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by VARCHAR(255),
            CONSTRAINT fk_source_project FOREIGN KEY (source_project_id) 
                REFERENCES projects(id) ON DELETE CASCADE,
            CONSTRAINT fk_target_project FOREIGN KEY (target_project_id) 
                REFERENCES projects(id) ON DELETE CASCADE,
            CONSTRAINT unique_project_link UNIQUE (source_project_id, target_project_id, link_type),
            CONSTRAINT no_self_link CHECK (source_project_id != target_project_id),
            CONSTRAINT valid_link_type CHECK (link_type IN 
                ('related', 'parent', 'child', 'dependency', 'fork', 'template')),
            CONSTRAINT valid_visibility CHECK (visibility IN ('full', 'metadata_only', 'none'))
        );
        
        -- Create indexes for performance
        CREATE INDEX idx_project_links_source ON project_links(source_project_id);
        CREATE INDEX idx_project_links_target ON project_links(target_project_id);
        CREATE INDEX idx_project_links_type ON project_links(link_type);
        CREATE INDEX idx_project_links_visibility ON project_links(visibility);
        
        -- Add comment to document the table
        COMMENT ON TABLE public.project_links IS 
        'Many-to-many relationships between projects with visibility control';
        
        RAISE NOTICE 'Migration 05.006: Successfully created project_links table and indexes';
    ELSE
        RAISE NOTICE 'Migration 05.006: project_links table already exists (skipping)';
    END IF;
    
    -- Create or replace the bidirectional view
    RAISE NOTICE 'Migration 05.006: Creating/updating project_relationships view...';
    
    CREATE OR REPLACE VIEW project_relationships AS
    SELECT 
        source_project_id as project_id,
        target_project_id as related_project_id,
        link_type,
        visibility,
        metadata,
        created_at,
        created_by,
        'outgoing' as direction
    FROM project_links
    UNION ALL
    SELECT 
        target_project_id as project_id,
        source_project_id as related_project_id,
        CASE 
            WHEN link_type = 'parent' THEN 'child'
            WHEN link_type = 'child' THEN 'parent'
            ELSE link_type
        END as link_type,
        visibility,
        metadata,
        created_at,
        created_by,
        'incoming' as direction
    FROM project_links;
    
    COMMENT ON VIEW project_relationships IS 
    'Bidirectional view of project relationships for easier querying';
    
    RAISE NOTICE 'Migration 05.006: Project linking support completed successfully';
END $$;

-- Create relationship detection function (outside DO block)
CREATE OR REPLACE FUNCTION detect_project_relationships(
    p_project_id INTEGER,
    p_min_references INTEGER DEFAULT 3,
    p_min_shared_tags INTEGER DEFAULT 5
)
RETURNS TABLE (
    suggested_project_id INTEGER,
    suggested_project_name VARCHAR,
    link_type VARCHAR,
    confidence FLOAT,
    evidence JSONB
) AS $$
BEGIN
        RETURN QUERY
        WITH 
        -- Cross-references: find memories that reference other project names
        cross_refs AS (
            SELECT 
                p2.id as project_id,
                p2.name as project_name,
                COUNT(*) as ref_count,
                array_agg(DISTINCT substring(m1.content from 
                    position(p2.name in m1.content) for 100)) as samples
            FROM memories m1
            JOIN projects p2 ON p2.id != p_project_id
            WHERE m1.project_id = p_project_id
            AND (m1.content ILIKE '%' || p2.name || '%' OR p2.name = ANY(m1.smart_tags))
            GROUP BY p2.id, p2.name
            HAVING COUNT(*) >= p_min_references
        ),
        -- Shared tags: find projects with overlapping tags
        shared_tags AS (
            SELECT 
                m2.project_id,
                p2.name as project_name,
                COUNT(DISTINCT tag) as shared_tag_count,
                array_agg(DISTINCT tag ORDER BY tag) as common_tags
            FROM (
                SELECT unnest(smart_tags) as tag 
                FROM memories 
                WHERE project_id = p_project_id
            ) t1
            JOIN memories m2 ON t1.tag = ANY(m2.smart_tags) AND m2.project_id != p_project_id
            JOIN projects p2 ON p2.id = m2.project_id
            GROUP BY m2.project_id, p2.name
            HAVING COUNT(DISTINCT tag) >= p_min_shared_tags
        )
        -- Combine results and calculate confidence
        SELECT 
            COALESCE(cr.project_id, st.project_id) as suggested_project_id,
            COALESCE(cr.project_name, st.project_name) as suggested_project_name,
            CASE 
                -- Naming patterns for parent/child detection
                WHEN cr.project_name LIKE (SELECT name FROM projects WHERE id = p_project_id) || '-%' THEN 'child'
                WHEN (SELECT name FROM projects WHERE id = p_project_id) LIKE cr.project_name || '-%' THEN 'parent'
                -- High reference count suggests dependency
                WHEN cr.ref_count > 10 THEN 'dependency'
                -- Default to related
                ELSE 'related'
            END::VARCHAR as link_type,
            -- Calculate confidence score (0-1)
            LEAST(1.0, GREATEST(
                COALESCE(cr.ref_count::float / 20, 0),
                COALESCE(st.shared_tag_count::float / 20, 0)
            )) as confidence,
            -- Build evidence JSON
            jsonb_build_object(
                'references', COALESCE(cr.ref_count, 0),
                'reference_samples', COALESCE(cr.samples, ARRAY[]::text[]),
                'shared_tags', COALESCE(st.shared_tag_count, 0),
                'common_tags', COALESCE(st.common_tags, ARRAY[]::text[])
            ) as evidence
        FROM cross_refs cr
        FULL OUTER JOIN shared_tags st ON cr.project_id = st.project_id
        WHERE NOT EXISTS (
            -- Exclude already linked projects
            SELECT 1 FROM project_links 
            WHERE (source_project_id = p_project_id AND target_project_id = COALESCE(cr.project_id, st.project_id))
            OR (target_project_id = p_project_id AND source_project_id = COALESCE(cr.project_id, st.project_id))
        )
        ORDER BY confidence DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_project_relationships IS 
'Analyzes memories to detect potential relationships between projects based on references and shared tags';

-- ============================================================================
-- FINAL VALIDATION including token_metadata and project_links
-- ============================================================================

DO $$
DECLARE
    thoughts_valid boolean := false;
    search_valid boolean := false;
    project_id_valid boolean := false;
    insights_valid boolean := false;
    token_metadata_valid boolean := false;
    project_links_valid boolean := false;
BEGIN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'FINAL MIGRATION VALIDATION';
    RAISE NOTICE '====================================';
    
    -- Validate thoughts constraint
    thoughts_valid := EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'thoughts_type_valid'
    );
    RAISE NOTICE 'Thoughts constraint valid: %', thoughts_valid;
    
    -- Validate search_analytics constraint
    search_valid := EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'search_analytics_search_mode_check'
    );
    RAISE NOTICE 'Search analytics constraint valid: %', search_valid;
    
    -- Validate project_id column in queue
    project_id_valid := EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insight_processing_queue_v2' 
        AND column_name = 'project_id'
    );
    RAISE NOTICE 'Project ID column valid: %', project_id_valid;
    
    -- Validate insights constraint  
    insights_valid := EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unified_insights_v2_insight_type_check'
    );
    RAISE NOTICE 'Insights constraint valid: %', insights_valid;
    
    -- Validate token_metadata column
    token_metadata_valid := EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'memories' 
        AND column_name = 'token_metadata'
        AND table_schema = 'public'
    );
    RAISE NOTICE 'Token metadata column valid: %', token_metadata_valid;
    
    -- Validate project_links table
    project_links_valid := EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'project_links'
        AND table_schema = 'public'
    );
    RAISE NOTICE 'Project links table valid: %', project_links_valid;
    
    IF thoughts_valid AND search_valid AND project_id_valid AND insights_valid AND token_metadata_valid AND project_links_valid THEN
        RAISE NOTICE '✅ ALL MIGRATIONS VALIDATED SUCCESSFULLY';
    ELSE
        RAISE NOTICE '⚠️  SOME MIGRATIONS NEED TO BE APPLIED';
        RAISE NOTICE 'Run this migration file again to fix any issues.';
    END IF;
    RAISE NOTICE '====================================';
END $$;