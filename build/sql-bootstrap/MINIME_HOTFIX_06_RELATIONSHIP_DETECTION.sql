-- ============================================================================
-- HOTFIX: Fix detect_project_relationships function
-- Issue: Function references non-existent 'tags' column, should use 'smart_tags'
-- Date: 2025-08-07
-- ============================================================================

-- Drop and recreate the function with correct column references
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

-- Log the migration
INSERT INTO system_logs (level, message, metadata, created_at)
VALUES ('info', 'Applied HOTFIX 06: Fixed detect_project_relationships function', 
        jsonb_build_object('migration', 'MINIME_HOTFIX_06_RELATIONSHIP_DETECTION'), NOW());