-- MiniMe-MCP Fresh Installation Database Script
-- This script creates a clean database with all necessary structures and configuration data
-- Version: 0.1.7-v2
-- Generated: 2025-01-05

-- =====================================================
-- DATABASE CREATION
-- =====================================================

-- Note: Run these commands as postgres superuser if creating from scratch:
-- DROP DATABASE IF EXISTS minime_memories;
-- CREATE DATABASE minime_memories;

-- Connect to the database
\c minime_memories;

-- =====================================================
-- EXTENSIONS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--
-- PostgreSQL database dump
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

ALTER TABLE IF EXISTS ONLY public.unified_insights_v2 DROP CONSTRAINT IF EXISTS unified_insights_v2_supersedes_insight_id_fkey;
ALTER TABLE IF EXISTS ONLY public.unified_insights_v2 DROP CONSTRAINT IF EXISTS unified_insights_v2_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.thoughts DROP CONSTRAINT IF EXISTS thoughts_sequence_id_fkey;
ALTER TABLE IF EXISTS ONLY public.thoughts DROP CONSTRAINT IF EXISTS thoughts_revises_thought_id_fkey;
ALTER TABLE IF EXISTS ONLY public.thoughts DROP CONSTRAINT IF EXISTS thoughts_branch_from_thought_id_fkey;
ALTER TABLE IF EXISTS ONLY public.thinking_sequences DROP CONSTRAINT IF EXISTS thinking_sequences_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.thinking_sequences DROP CONSTRAINT IF EXISTS thinking_sequences_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.thinking_branches DROP CONSTRAINT IF EXISTS thinking_branches_sequence_id_fkey;
ALTER TABLE IF EXISTS ONLY public.thinking_branches DROP CONSTRAINT IF EXISTS thinking_branches_branch_from_thought_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tags DROP CONSTRAINT IF EXISTS tags_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pattern_library_v2 DROP CONSTRAINT IF EXISTS pattern_library_v2_evolution_from_pattern_fkey;
ALTER TABLE IF EXISTS ONLY public.memories DROP CONSTRAINT IF EXISTS memories_thinking_sequence_id_fkey;
ALTER TABLE IF EXISTS ONLY public.memories DROP CONSTRAINT IF EXISTS memories_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.memories DROP CONSTRAINT IF EXISTS memories_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.insight_generation_jobs DROP CONSTRAINT IF EXISTS insight_generation_jobs_project_id_fkey;
ALTER TABLE IF EXISTS ONLY public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_project_id_fkey;
DROP TRIGGER IF EXISTS update_thinking_sequences_updated_at ON public.thinking_sequences;
DROP TRIGGER IF EXISTS update_system_config_timestamp ON public.system_config;
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS update_memory_template_mappings_updated_at ON public.memory_template_mappings;
DROP TRIGGER IF EXISTS update_memories_updated_at ON public.memories;
DROP TRIGGER IF EXISTS update_embedding_models_updated_at ON public.embedding_models;
DROP TRIGGER IF EXISTS update_clustering_config_updated_at ON public.clustering_config;
DROP TRIGGER IF EXISTS trigger_update_unified_insights_search ON public.unified_insights_v2;
DROP TRIGGER IF EXISTS trigger_update_pattern_search ON public.pattern_library_v2;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_validation;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_type;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_technologies;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_tags;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_source_type;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_search;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_project;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_level;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_embedding;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_created;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_confidence;
DROP INDEX IF EXISTS public.idx_unified_insights_v2_category;
DROP INDEX IF EXISTS public.idx_thoughts_sequence_id;
DROP INDEX IF EXISTS public.idx_thoughts_revision;
DROP INDEX IF EXISTS public.idx_thoughts_number;
DROP INDEX IF EXISTS public.idx_thoughts_branch_id;
DROP INDEX IF EXISTS public.idx_thoughts_branch_from;
DROP INDEX IF EXISTS public.idx_thinking_seq_session_id;
DROP INDEX IF EXISTS public.idx_thinking_seq_project_id;
DROP INDEX IF EXISTS public.idx_thinking_seq_complete;
DROP INDEX IF EXISTS public.idx_thinking_branches_sequence;
DROP INDEX IF EXISTS public.idx_thinking_branches_active;
DROP INDEX IF EXISTS public.idx_templates_v2_name;
DROP INDEX IF EXISTS public.idx_templates_v2_category;
DROP INDEX IF EXISTS public.idx_templates_v2_active;
DROP INDEX IF EXISTS public.idx_technology_tracking_v2_preference;
DROP INDEX IF EXISTS public.idx_technology_tracking_v2_name;
DROP INDEX IF EXISTS public.idx_technology_tracking_v2_category;
DROP INDEX IF EXISTS public.idx_tags_usage;
DROP INDEX IF EXISTS public.idx_tags_name;
DROP INDEX IF EXISTS public.idx_tags_category;
DROP INDEX IF EXISTS public.idx_tags_active;
DROP INDEX IF EXISTS public.idx_tag_categories_active;
DROP INDEX IF EXISTS public.idx_system_config_category;
DROP INDEX IF EXISTS public.idx_sessions_type;
DROP INDEX IF EXISTS public.idx_sessions_project_id;
DROP INDEX IF EXISTS public.idx_sessions_active;
DROP INDEX IF EXISTS public.idx_search_analytics_search_mode;
DROP INDEX IF EXISTS public.idx_search_analytics_created_at;
DROP INDEX IF EXISTS public.idx_schedule_runs_type_time;
DROP INDEX IF EXISTS public.idx_processing_queue_v2_status;
DROP INDEX IF EXISTS public.idx_processing_queue_v2_priority;
DROP INDEX IF EXISTS public.idx_pattern_library_v2_signature;
DROP INDEX IF EXISTS public.idx_pattern_library_v2_search;
DROP INDEX IF EXISTS public.idx_pattern_library_v2_confidence;
DROP INDEX IF EXISTS public.idx_pattern_library_v2_category;
DROP INDEX IF EXISTS public.idx_memory_template_mappings_type;
DROP INDEX IF EXISTS public.idx_memories_type;
DROP INDEX IF EXISTS public.idx_memories_thinking_sequence_id;
DROP INDEX IF EXISTS public.idx_memories_task_type;
DROP INDEX IF EXISTS public.idx_memories_task_status;
DROP INDEX IF EXISTS public.idx_memories_task_priority;
DROP INDEX IF EXISTS public.idx_memories_task_completed;
DROP INDEX IF EXISTS public.idx_memories_tag_embedding_ivfflat;
DROP INDEX IF EXISTS public.idx_memories_tag_embedding_hnsw;
DROP INDEX IF EXISTS public.idx_memories_smart_tags;
DROP INDEX IF EXISTS public.idx_memories_session_id;
DROP INDEX IF EXISTS public.idx_memories_project_id;
DROP INDEX IF EXISTS public.idx_memories_processing_status_retry;
DROP INDEX IF EXISTS public.idx_memories_processing_status;
DROP INDEX IF EXISTS public.idx_memories_metadata;
DROP INDEX IF EXISTS public.idx_memories_memory_status;
DROP INDEX IF EXISTS public.idx_memories_importance;
DROP INDEX IF EXISTS public.idx_memories_hybrid_search;
DROP INDEX IF EXISTS public.idx_memories_embedding_model;
DROP INDEX IF EXISTS public.idx_memories_embedding_dims;
DROP INDEX IF EXISTS public.idx_memories_created_at;
DROP INDEX IF EXISTS public.idx_llm_analysis_type;
DROP INDEX IF EXISTS public.idx_llm_analysis_hash;
DROP INDEX IF EXISTS public.idx_llm_analysis_expires;
DROP INDEX IF EXISTS public.idx_generation_jobs_type;
DROP INDEX IF EXISTS public.idx_generation_jobs_status;
DROP INDEX IF EXISTS public.idx_generation_jobs_started;
DROP INDEX IF EXISTS public.idx_generation_jobs_project;
DROP INDEX IF EXISTS public.idx_embedding_models_provider;
DROP INDEX IF EXISTS public.idx_embedding_models_default;
DROP INDEX IF EXISTS public.idx_embedding_models_available;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_time_gran;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_time;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_project;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_metrics;
DROP INDEX IF EXISTS public.idx_analytics_snapshots_granularity;
ALTER TABLE IF EXISTS ONLY public.unified_insights_v2 DROP CONSTRAINT IF EXISTS unified_insights_v2_pkey;
ALTER TABLE IF EXISTS ONLY public.thoughts DROP CONSTRAINT IF EXISTS thoughts_pkey;
ALTER TABLE IF EXISTS ONLY public.thinking_sequences DROP CONSTRAINT IF EXISTS thinking_sequences_pkey;
ALTER TABLE IF EXISTS ONLY public.thinking_branches DROP CONSTRAINT IF EXISTS thinking_branches_pkey;
ALTER TABLE IF EXISTS ONLY public.thinking_branches DROP CONSTRAINT IF EXISTS thinking_branch_unique;
ALTER TABLE IF EXISTS ONLY public.technology_tracking_v2 DROP CONSTRAINT IF EXISTS technology_tracking_v2_technology_name_technology_category_key;
ALTER TABLE IF EXISTS ONLY public.technology_tracking_v2 DROP CONSTRAINT IF EXISTS technology_tracking_v2_pkey;
ALTER TABLE IF EXISTS ONLY public.tags DROP CONSTRAINT IF EXISTS tags_pkey;
ALTER TABLE IF EXISTS ONLY public.tags DROP CONSTRAINT IF EXISTS tags_category_id_tag_name_key;
ALTER TABLE IF EXISTS ONLY public.tag_categories DROP CONSTRAINT IF EXISTS tag_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.tag_categories DROP CONSTRAINT IF EXISTS tag_categories_category_name_key;
ALTER TABLE IF EXISTS ONLY public.system_config DROP CONSTRAINT IF EXISTS system_config_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_project_name_unique;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.search_analytics DROP CONSTRAINT IF EXISTS search_analytics_pkey;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_version_key;
ALTER TABLE IF EXISTS ONLY public.schema_migrations DROP CONSTRAINT IF EXISTS schema_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.schedule_runs DROP CONSTRAINT IF EXISTS schedule_runs_schedule_type_run_time_key;
ALTER TABLE IF EXISTS ONLY public.schedule_runs DROP CONSTRAINT IF EXISTS schedule_runs_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE IF EXISTS ONLY public.projects DROP CONSTRAINT IF EXISTS projects_name_unique;
ALTER TABLE IF EXISTS ONLY public.pattern_library_v2 DROP CONSTRAINT IF EXISTS pattern_library_v2_pkey;
ALTER TABLE IF EXISTS ONLY public.pattern_library_v2 DROP CONSTRAINT IF EXISTS pattern_library_v2_pattern_signature_key;
ALTER TABLE IF EXISTS ONLY public.memory_template_mappings DROP CONSTRAINT IF EXISTS memory_template_mappings_pkey;
ALTER TABLE IF EXISTS ONLY public.memories DROP CONSTRAINT IF EXISTS memories_pkey;
ALTER TABLE IF EXISTS ONLY public.llm_analysis_cache DROP CONSTRAINT IF EXISTS llm_analysis_cache_pkey;
ALTER TABLE IF EXISTS ONLY public.llm_analysis_cache DROP CONSTRAINT IF EXISTS llm_analysis_cache_content_hash_key;
ALTER TABLE IF EXISTS ONLY public.job_execution_stats DROP CONSTRAINT IF EXISTS job_execution_stats_pkey;
ALTER TABLE IF EXISTS ONLY public.insight_templates_v2 DROP CONSTRAINT IF EXISTS insight_templates_v2_template_name_key;
ALTER TABLE IF EXISTS ONLY public.insight_templates_v2 DROP CONSTRAINT IF EXISTS insight_templates_v2_pkey;
ALTER TABLE IF EXISTS ONLY public.insight_processing_queue_v2 DROP CONSTRAINT IF EXISTS insight_processing_queue_v2_pkey;
ALTER TABLE IF EXISTS ONLY public.insight_generation_jobs DROP CONSTRAINT IF EXISTS insight_generation_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.embedding_models DROP CONSTRAINT IF EXISTS embedding_models_pkey;
ALTER TABLE IF EXISTS ONLY public.embedding_models DROP CONSTRAINT IF EXISTS embedding_models_model_name_key;
ALTER TABLE IF EXISTS ONLY public.clustering_config DROP CONSTRAINT IF EXISTS clustering_config_pkey;
ALTER TABLE IF EXISTS ONLY public.clustering_config DROP CONSTRAINT IF EXISTS clustering_config_config_key_key;
ALTER TABLE IF EXISTS ONLY public.analytics_snapshots DROP CONSTRAINT IF EXISTS analytics_snapshots_pkey;
ALTER TABLE IF EXISTS public.unified_insights_v2 ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.thoughts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.thinking_sequences ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.thinking_branches ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.technology_tracking_v2 ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tags ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.tag_categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.search_analytics ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.schema_migrations ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.schedule_runs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.projects ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pattern_library_v2 ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.memory_template_mappings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.memories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.llm_analysis_cache ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.job_execution_stats ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.insight_templates_v2 ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.insight_processing_queue_v2 ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.insight_generation_jobs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.embedding_models ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clustering_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.analytics_snapshots ALTER COLUMN id DROP DEFAULT;
DROP VIEW IF EXISTS public.v2_insights_processing_stats;
DROP SEQUENCE IF EXISTS public.unified_insights_v2_id_seq;
DROP SEQUENCE IF EXISTS public.thoughts_id_seq;
DROP SEQUENCE IF EXISTS public.thinking_sequences_id_seq;
DROP SEQUENCE IF EXISTS public.thinking_branches_id_seq;
DROP TABLE IF EXISTS public.thinking_branches;
DROP SEQUENCE IF EXISTS public.technology_tracking_v2_id_seq;
DROP TABLE IF EXISTS public.technology_tracking_v2;
DROP SEQUENCE IF EXISTS public.tags_id_seq;
DROP VIEW IF EXISTS public.tag_usage_stats;
DROP TABLE IF EXISTS public.tags;
DROP SEQUENCE IF EXISTS public.tag_categories_id_seq;
DROP TABLE IF EXISTS public.tag_categories;
DROP TABLE IF EXISTS public.system_config;
DROP SEQUENCE IF EXISTS public.sessions_id_seq;
DROP SEQUENCE IF EXISTS public.search_analytics_id_seq;
DROP TABLE IF EXISTS public.search_analytics;
DROP SEQUENCE IF EXISTS public.schema_migrations_id_seq;
DROP TABLE IF EXISTS public.schema_migrations;
DROP SEQUENCE IF EXISTS public.schedule_runs_id_seq;
DROP TABLE IF EXISTS public.schedule_runs;
DROP SEQUENCE IF EXISTS public.projects_id_seq;
DROP VIEW IF EXISTS public.project_summary;
DROP SEQUENCE IF EXISTS public.pattern_library_v2_id_seq;
DROP SEQUENCE IF EXISTS public.memory_template_mappings_id_seq;
DROP TABLE IF EXISTS public.memory_template_mappings;
DROP VIEW IF EXISTS public.memory_statistics;
DROP VIEW IF EXISTS public.memory_search_view;
DROP VIEW IF EXISTS public.memory_search;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.projects;
DROP SEQUENCE IF EXISTS public.memories_id_seq;
DROP SEQUENCE IF EXISTS public.llm_analysis_cache_id_seq;
DROP TABLE IF EXISTS public.llm_analysis_cache;
DROP VIEW IF EXISTS public.job_performance_summary;
DROP SEQUENCE IF EXISTS public.job_execution_stats_id_seq;
DROP TABLE IF EXISTS public.job_execution_stats;
DROP SEQUENCE IF EXISTS public.insight_templates_v2_id_seq;
DROP TABLE IF EXISTS public.insight_templates_v2;
DROP SEQUENCE IF EXISTS public.insight_processing_queue_v2_id_seq;
DROP TABLE IF EXISTS public.insight_processing_queue_v2;
DROP SEQUENCE IF EXISTS public.insight_generation_jobs_id_seq;
DROP TABLE IF EXISTS public.insight_generation_jobs;
DROP VIEW IF EXISTS public.enrichment_status;
DROP TABLE IF EXISTS public.memories;
DROP SEQUENCE IF EXISTS public.embedding_models_id_seq;
DROP TABLE IF EXISTS public.embedding_models;
DROP VIEW IF EXISTS public.coding_patterns_v2_compat;
DROP TABLE IF EXISTS public.pattern_library_v2;
DROP SEQUENCE IF EXISTS public.clustering_config_id_seq;
DROP TABLE IF EXISTS public.clustering_config;
DROP SEQUENCE IF EXISTS public.analytics_snapshots_id_seq;
DROP TABLE IF EXISTS public.analytics_snapshots;
DROP VIEW IF EXISTS public.ai_insights_v2_compat;
DROP TABLE IF EXISTS public.unified_insights_v2;
DROP VIEW IF EXISTS public.active_thinking_progress;
DROP TABLE IF EXISTS public.thoughts;
DROP TABLE IF EXISTS public.thinking_sequences;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.update_unified_insights_search_vector();
DROP FUNCTION IF EXISTS public.update_task_timestamp();
DROP FUNCTION IF EXISTS public.update_system_config_timestamp();
DROP FUNCTION IF EXISTS public.update_pattern_library_search_vector();
DROP FUNCTION IF EXISTS public.update_minime_insights_timestamp();
DROP FUNCTION IF EXISTS public.update_learning_queue_timestamp();
DROP FUNCTION IF EXISTS public.queue_memory_enrichment();
DROP FUNCTION IF EXISTS public.memory_stats(project_id_param integer);
DROP FUNCTION IF EXISTS public.get_unprocessed_memories_v2(limit_count integer);
DROP FUNCTION IF EXISTS public.get_task_duplicate_stats(p_project_id integer);
DROP FUNCTION IF EXISTS public.cleanup_stale_l1_processing();
DROP FUNCTION IF EXISTS public.cleanup_orphaned_data();
DROP FUNCTION IF EXISTS public.cleanup_old_schedule_runs();
DROP FUNCTION IF EXISTS public.cleanup_old_generation_jobs();
DROP FUNCTION IF EXISTS public.cleanup_old_analytics_snapshots();
DROP FUNCTION IF EXISTS public.calculate_hybrid_similarity(content_embedding public.vector, tag_embedding public.vector, query_embedding public.vector, content_weight double precision, tag_weight double precision);
DROP FUNCTION IF EXISTS public.audit_job_status_change();
DROP FUNCTION IF EXISTS public.array_unique(arr anyarray);
DROP EXTENSION IF EXISTS vector;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pg_trgm;
--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';



--
-- Name: thinking_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thinking_sequences (
    id integer NOT NULL,
    project_id integer NOT NULL,
    session_id integer NOT NULL,
    sequence_name character varying(255) NOT NULL,
    description text,
    goal text,
    is_complete boolean DEFAULT false,
    completion_summary text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT thinking_seq_name_not_empty CHECK ((length(TRIM(BOTH FROM sequence_name)) > 0))
);


--
-- Name: thoughts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thoughts (
    id integer NOT NULL,
    sequence_id integer NOT NULL,
    thought_number integer NOT NULL,
    total_thoughts integer NOT NULL,
    content text NOT NULL,
    thought_type character varying(50) DEFAULT 'reasoning'::character varying,
    confidence_level double precision DEFAULT 0.5,
    next_thought_needed boolean DEFAULT true,
    is_revision boolean DEFAULT false,
    revises_thought_id integer,
    branch_from_thought_id integer,
    branch_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT thoughts_confidence_valid CHECK (((confidence_level >= (0.0)::double precision) AND (confidence_level <= (1.0)::double precision))),
    CONSTRAINT thoughts_content_not_empty CHECK ((length(TRIM(BOTH FROM content)) > 0)),
    CONSTRAINT thoughts_not_branch_self CHECK ((branch_from_thought_id <> id)),
    CONSTRAINT thoughts_not_revise_self CHECK ((revises_thought_id <> id)),
    CONSTRAINT thoughts_number_positive CHECK ((thought_number > 0)),
    CONSTRAINT thoughts_total_positive CHECK ((total_thoughts > 0)),
    CONSTRAINT thoughts_type_valid CHECK (((thought_type)::text = ANY (ARRAY[('reasoning'::character varying)::text, ('conclusion'::character varying)::text, ('question'::character varying)::text, ('hypothesis'::character varying)::text, ('observation'::character varying)::text, ('assumption'::character varying)::text])))
);



--
-- Name: unified_insights_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unified_insights_v2 (
    id integer NOT NULL,
    insight_type character varying(50) NOT NULL,
    insight_category character varying(50) NOT NULL,
    insight_subcategory character varying(50),
    title text NOT NULL,
    summary text NOT NULL,
    detailed_content jsonb DEFAULT '{}'::jsonb NOT NULL,
    source_type character varying(20) NOT NULL,
    source_ids integer[] NOT NULL,
    detection_method character varying(50) NOT NULL,
    detection_metadata jsonb DEFAULT '{}'::jsonb,
    system_version character varying(10) DEFAULT 'v2'::character varying,
    insight_level character varying(10) DEFAULT 'L1'::character varying,
    confidence_score double precision DEFAULT 0.5 NOT NULL,
    relevance_score double precision DEFAULT 0.5,
    impact_score double precision DEFAULT 0.5,
    validation_status character varying(20) DEFAULT 'pending'::character varying,
    validation_metadata jsonb DEFAULT '{}'::jsonb,
    project_id integer,
    related_insight_ids integer[] DEFAULT '{}'::integer[],
    supersedes_insight_id integer,
    contradicts_insight_ids integer[] DEFAULT '{}'::integer[],
    technologies jsonb DEFAULT '[]'::jsonb,
    patterns jsonb DEFAULT '[]'::jsonb,
    entities jsonb DEFAULT '[]'::jsonb,
    recommendations jsonb DEFAULT '[]'::jsonb,
    action_items jsonb DEFAULT '[]'::jsonb,
    evidence jsonb DEFAULT '[]'::jsonb,
    search_vector tsvector,
    embedding_model character varying(50),
    tags text[] DEFAULT '{}'::text[],
    custom_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone,
    is_cross_project boolean DEFAULT false,
    project_occurrences jsonb DEFAULT '[]'::jsonb,
    embedding public.vector(1024),
    validation_stage character varying(50) DEFAULT 'pending'::character varying,
    validation_reason text,
    CONSTRAINT unified_insights_v2_confidence_score_check CHECK (((confidence_score >= (0)::double precision) AND (confidence_score <= (1)::double precision))),
    CONSTRAINT unified_insights_v2_impact_score_check CHECK (((impact_score >= (0)::double precision) AND (impact_score <= (1)::double precision))),
    CONSTRAINT unified_insights_v2_relevance_score_check CHECK (((relevance_score >= (0)::double precision) AND (relevance_score <= (1)::double precision)))
);


--
-- Name: TABLE unified_insights_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.unified_insights_v2 IS 'Unified insights system v2 - combines L1/L2, learning pipeline, and mini-insights';


--
-- Name: analytics_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_snapshots (
    id integer NOT NULL,
    snapshot_time timestamp without time zone NOT NULL,
    granularity character varying(20) NOT NULL,
    project_id integer,
    metrics jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT analytics_snapshots_granularity_check CHECK (((granularity)::text = ANY (ARRAY[('minute'::character varying)::text, ('hour'::character varying)::text, ('day'::character varying)::text])))
);


--
-- Name: analytics_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.analytics_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: analytics_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.analytics_snapshots_id_seq OWNED BY public.analytics_snapshots.id;


--
-- Name: clustering_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clustering_config (
    id integer NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: clustering_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clustering_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clustering_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clustering_config_id_seq OWNED BY public.clustering_config.id;


--
-- Name: pattern_library_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pattern_library_v2 (
    id integer NOT NULL,
    pattern_signature character varying(255) NOT NULL,
    pattern_name character varying(255) NOT NULL,
    pattern_category character varying(50) NOT NULL,
    pattern_subcategory character varying(50),
    pattern_type character varying(50) NOT NULL,
    description text NOT NULL,
    problem_statement text,
    solution_approach text,
    consequences text,
    frequency_count integer DEFAULT 1,
    projects_seen text[] DEFAULT '{}'::text[],
    last_seen_at timestamp with time zone DEFAULT now(),
    first_seen_at timestamp with time zone DEFAULT now(),
    confidence_score double precision DEFAULT 0.7,
    effectiveness_score double precision,
    adoption_rate double precision,
    example_codes jsonb DEFAULT '[]'::jsonb,
    evidence_links integer[] DEFAULT '{}'::integer[],
    related_patterns integer[] DEFAULT '{}'::integer[],
    alternative_patterns integer[] DEFAULT '{}'::integer[],
    evolution_from_pattern integer,
    technologies text[] DEFAULT '{}'::text[],
    contexts jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    search_vector tsvector,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE pattern_library_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.pattern_library_v2 IS 'Centralized pattern library with usage tracking and evolution';



--
-- Name: embedding_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.embedding_models (
    id integer NOT NULL,
    model_name character varying(100) NOT NULL,
    dimensions integer NOT NULL,
    provider character varying(50) DEFAULT 'ollama'::character varying NOT NULL,
    model_size_mb integer,
    description text,
    is_available boolean DEFAULT false,
    is_default boolean DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT embedding_models_dims_valid CHECK (((dimensions > 0) AND (dimensions <= 4096))),
    CONSTRAINT embedding_models_provider_valid CHECK (((provider)::text = ANY (ARRAY[('ollama'::character varying)::text, ('openai'::character varying)::text, ('huggingface'::character varying)::text, ('local'::character varying)::text])))
);


--
-- Name: embedding_models_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.embedding_models_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: embedding_models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.embedding_models_id_seq OWNED BY public.embedding_models.id;


--
-- Name: memories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memories (
    id integer NOT NULL,
    project_id integer NOT NULL,
    session_id integer,
    content text NOT NULL,
    memory_type character varying(100) DEFAULT 'general'::character varying,
    summary text,
    embedding public.vector,
    embedding_model character varying(100) DEFAULT 'mxbai-embed-large'::character varying,
    embedding_dimensions integer DEFAULT 1024,
    importance_score double precision DEFAULT 0.5,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    smart_tags text[],
    processing_status character varying(20) DEFAULT 'pending'::character varying,
    processing_error text,
    processed_at timestamp without time zone,
    retry_count integer DEFAULT 0,
    last_retry_at timestamp with time zone,
    memory_status character varying(50) DEFAULT 'active'::character varying,
    last_processed_for_insights timestamp without time zone,
    insight_processing_count integer DEFAULT 0,
    l1_processing_attempts integer DEFAULT 0,
    last_l1_error text,
    tag_embedding public.vector(1024),
    thinking_sequence_id integer,
    CONSTRAINT memories_content_not_empty CHECK ((length(TRIM(BOTH FROM content)) > 0)),
    CONSTRAINT memories_embedding_dims_valid CHECK (((embedding_dimensions > 0) AND (embedding_dimensions <= 4096))),
    CONSTRAINT memories_importance_valid CHECK (((importance_score >= (0.0)::double precision) AND (importance_score <= (1.0)::double precision))),
    CONSTRAINT memories_processing_status_check CHECK (((processing_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text, ('ready'::character varying)::text, ('failed'::character varying)::text, ('failed_permanent'::character varying)::text])))
);


--
-- Name: TABLE memories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.memories IS 'Core memory storage with AI-enriched smart_tags and summaries';


--
-- Name: COLUMN memories.smart_tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.memories.smart_tags IS 'AI-generated tags using hierarchical classification';


--
-- Name: COLUMN memories.processing_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.memories.processing_status IS 'Enrichment status: pending, processing, ready, failed, failed_permanent';


--
-- Name: COLUMN memories.retry_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.memories.retry_count IS 'Number of enrichment retry attempts';


--
-- Name: COLUMN memories.memory_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.memories.memory_status IS 'Status of the memory (active, completed, archived, draft, etc.)';


--
-- Name: COLUMN memories.tag_embedding; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.memories.tag_embedding IS 'Vector embedding of smart_tags for semantic tag search';

--
-- Name: insight_generation_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_generation_jobs (
    id integer NOT NULL,
    job_type character varying(50) NOT NULL,
    trigger_type character varying(50),
    project_id integer,
    template_ids integer[],
    status character varying(20) DEFAULT 'pending'::character varying,
    insights_generated integer DEFAULT 0,
    error_message text,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: insight_generation_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insight_generation_jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insight_generation_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insight_generation_jobs_id_seq OWNED BY public.insight_generation_jobs.id;


--
-- Name: insight_processing_queue_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_processing_queue_v2 (
    id integer NOT NULL,
    task_type character varying(50) NOT NULL,
    task_priority integer DEFAULT 5,
    source_type character varying(50) NOT NULL,
    source_ids integer[] NOT NULL,
    task_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    processor_id character varying(100),
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    scheduled_for timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    result_summary jsonb,
    error_message text,
    insights_generated integer DEFAULT 0,
    created_by character varying(50) DEFAULT 'system'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT insight_processing_queue_v2_task_priority_check CHECK (((task_priority >= 1) AND (task_priority <= 10)))
);


--
-- Name: TABLE insight_processing_queue_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.insight_processing_queue_v2 IS 'Async processing queue for insight generation tasks';


--
-- Name: insight_processing_queue_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insight_processing_queue_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insight_processing_queue_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insight_processing_queue_v2_id_seq OWNED BY public.insight_processing_queue_v2.id;


--
-- Name: insight_templates_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_templates_v2 (
    id integer NOT NULL,
    template_name character varying(100) NOT NULL,
    template_category character varying(50) NOT NULL,
    template_version character varying(10) DEFAULT '1.0'::character varying,
    template_content text NOT NULL,
    template_variables jsonb DEFAULT '[]'::jsonb,
    processing_config jsonb DEFAULT '{}'::jsonb,
    output_schema jsonb,
    validation_rules jsonb DEFAULT '[]'::jsonb,
    usage_count integer DEFAULT 0,
    success_rate double precision,
    avg_confidence_score double precision,
    avg_processing_time_ms integer,
    is_active boolean DEFAULT true,
    is_experimental boolean DEFAULT false,
    description text,
    tags text[] DEFAULT '{}'::text[],
    created_by character varying(50) DEFAULT 'system'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE insight_templates_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.insight_templates_v2 IS 'Unified template storage for all insight generation methods';


--
-- Name: insight_templates_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.insight_templates_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: insight_templates_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.insight_templates_v2_id_seq OWNED BY public.insight_templates_v2.id;


--
-- Name: job_execution_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_execution_stats (
    id integer NOT NULL,
    job_name character varying(100) NOT NULL,
    execution_time timestamp without time zone NOT NULL,
    stats jsonb,
    error text,
    status character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: job_execution_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.job_execution_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: job_execution_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.job_execution_stats_id_seq OWNED BY public.job_execution_stats.id;



--
-- Name: llm_analysis_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_analysis_cache (
    id integer NOT NULL,
    content_hash character varying(64) NOT NULL,
    analysis_type character varying(50) NOT NULL,
    model_used character varying(100) DEFAULT 'qwen2.5:8b'::character varying NOT NULL,
    input_data jsonb NOT NULL,
    analysis_result jsonb NOT NULL,
    confidence_score double precision,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '30 days'::interval),
    CONSTRAINT llm_analysis_confidence_valid CHECK (((confidence_score IS NULL) OR ((confidence_score >= (0.0)::double precision) AND (confidence_score <= (1.0)::double precision))))
);


--
-- Name: llm_analysis_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.llm_analysis_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: llm_analysis_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.llm_analysis_cache_id_seq OWNED BY public.llm_analysis_cache.id;


--
-- Name: memories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.memories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: memories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.memories_id_seq OWNED BY public.memories.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT projects_name_not_empty CHECK ((length(TRIM(BOTH FROM name)) > 0))
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    project_id integer NOT NULL,
    session_name character varying(255) NOT NULL,
    session_type character varying(50) DEFAULT 'mixed'::character varying NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sessions_name_not_empty CHECK ((length(TRIM(BOTH FROM session_name)) > 0)),
    CONSTRAINT sessions_type_valid CHECK (((session_type)::text = ANY (ARRAY[('memory'::character varying)::text, ('thinking'::character varying)::text, ('mixed'::character varying)::text])))
);


--
-- Name: memory_template_mappings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memory_template_mappings (
    id integer NOT NULL,
    memory_type character varying(50) NOT NULL,
    template_names text[] NOT NULL,
    priority integer DEFAULT 10,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: memory_template_mappings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.memory_template_mappings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: memory_template_mappings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.memory_template_mappings_id_seq OWNED BY public.memory_template_mappings.id;


--
-- Name: pattern_library_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pattern_library_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pattern_library_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pattern_library_v2_id_seq OWNED BY public.pattern_library_v2.id;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: schedule_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schedule_runs (
    id integer NOT NULL,
    schedule_type character varying(50) NOT NULL,
    run_time timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: schedule_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schedule_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schedule_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schedule_runs_id_seq OWNED BY public.schedule_runs.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    id integer NOT NULL,
    version character varying(50) NOT NULL,
    description text,
    applied_at timestamp with time zone DEFAULT now(),
    checksum character varying(64),
    execution_time_ms integer DEFAULT 0
);


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.schema_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: schema_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.schema_migrations_id_seq OWNED BY public.schema_migrations.id;


--
-- Name: search_analytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_analytics (
    id integer NOT NULL,
    query_text text NOT NULL,
    search_mode character varying(20) NOT NULL,
    content_weight double precision,
    tag_weight double precision,
    results_count integer DEFAULT 0 NOT NULL,
    avg_similarity double precision,
    execution_time_ms integer,
    project_name character varying(255),
    memory_type character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT search_analytics_search_mode_check CHECK (((search_mode)::text = ANY (ARRAY[('content_only'::character varying)::text, ('tags_only'::character varying)::text, ('hybrid'::character varying)::text])))
);


--
-- Name: search_analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.search_analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: search_analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.search_analytics_id_seq OWNED BY public.search_analytics.id;


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    key character varying(255) NOT NULL,
    value jsonb NOT NULL,
    description text,
    category character varying(100) DEFAULT 'general'::character varying,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255) DEFAULT 'system'::character varying
);


--
-- Name: tag_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tag_categories (
    id integer NOT NULL,
    category_name character varying(50) NOT NULL,
    description text,
    selection_prompt text,
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tag_categories; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tag_categories IS 'Hierarchical tag taxonomy for AI-powered memory enrichment';


--
-- Name: tag_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tag_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tag_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tag_categories_id_seq OWNED BY public.tag_categories.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    category_id integer,
    tag_name character varying(50) NOT NULL,
    description text,
    aliases text[],
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tags IS 'Predefined tags within categories for consistent classification';



--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: technology_tracking_v2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.technology_tracking_v2 (
    id integer NOT NULL,
    technology_name character varying(255) NOT NULL,
    technology_category character varying(50) NOT NULL,
    technology_subcategory character varying(50),
    versions_used jsonb DEFAULT '[]'::jsonb,
    current_version character varying(50),
    total_occurrences integer DEFAULT 1,
    project_count integer DEFAULT 1,
    projects_using jsonb DEFAULT '[]'::jsonb,
    preference_score double precision DEFAULT 0.5,
    sentiment_score double precision DEFAULT 0.5,
    adoption_trend character varying(20),
    use_cases jsonb DEFAULT '[]'::jsonb,
    paired_technologies jsonb DEFAULT '[]'::jsonb,
    replaced_technologies text[] DEFAULT '{}'::text[],
    problems_solved jsonb DEFAULT '[]'::jsonb,
    known_issues jsonb DEFAULT '[]'::jsonb,
    best_practices jsonb DEFAULT '[]'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE technology_tracking_v2; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.technology_tracking_v2 IS 'Technology usage tracking with preferences and trends';


--
-- Name: technology_tracking_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.technology_tracking_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: technology_tracking_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.technology_tracking_v2_id_seq OWNED BY public.technology_tracking_v2.id;


--
-- Name: thinking_branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thinking_branches (
    id integer NOT NULL,
    sequence_id integer NOT NULL,
    branch_id character varying(255) NOT NULL,
    branch_name character varying(255) NOT NULL,
    branch_from_thought_id integer NOT NULL,
    description text,
    rationale text,
    is_active boolean DEFAULT true,
    is_merged boolean DEFAULT false,
    merge_summary text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT thinking_branch_id_not_empty CHECK ((length(TRIM(BOTH FROM branch_id)) > 0)),
    CONSTRAINT thinking_branch_name_not_empty CHECK ((length(TRIM(BOTH FROM branch_name)) > 0))
);


--
-- Name: thinking_branches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thinking_branches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thinking_branches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thinking_branches_id_seq OWNED BY public.thinking_branches.id;


--
-- Name: thinking_sequences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thinking_sequences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thinking_sequences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thinking_sequences_id_seq OWNED BY public.thinking_sequences.id;


--
-- Name: thoughts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.thoughts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: thoughts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.thoughts_id_seq OWNED BY public.thoughts.id;


--
-- Name: unified_insights_v2_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unified_insights_v2_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unified_insights_v2_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unified_insights_v2_id_seq OWNED BY public.unified_insights_v2.id;


--
-- Name: analytics_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_snapshots ALTER COLUMN id SET DEFAULT nextval('public.analytics_snapshots_id_seq'::regclass);


--
-- Name: clustering_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clustering_config ALTER COLUMN id SET DEFAULT nextval('public.clustering_config_id_seq'::regclass);


--
-- Name: embedding_models id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embedding_models ALTER COLUMN id SET DEFAULT nextval('public.embedding_models_id_seq'::regclass);


--
-- Name: insight_generation_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_generation_jobs ALTER COLUMN id SET DEFAULT nextval('public.insight_generation_jobs_id_seq'::regclass);


--
-- Name: insight_processing_queue_v2 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_processing_queue_v2 ALTER COLUMN id SET DEFAULT nextval('public.insight_processing_queue_v2_id_seq'::regclass);


--
-- Name: insight_templates_v2 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_templates_v2 ALTER COLUMN id SET DEFAULT nextval('public.insight_templates_v2_id_seq'::regclass);


--
-- Name: job_execution_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_execution_stats ALTER COLUMN id SET DEFAULT nextval('public.job_execution_stats_id_seq'::regclass);


--
-- Name: llm_analysis_cache id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_analysis_cache ALTER COLUMN id SET DEFAULT nextval('public.llm_analysis_cache_id_seq'::regclass);


--
-- Name: memories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories ALTER COLUMN id SET DEFAULT nextval('public.memories_id_seq'::regclass);


--
-- Name: memory_template_mappings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_template_mappings ALTER COLUMN id SET DEFAULT nextval('public.memory_template_mappings_id_seq'::regclass);


--
-- Name: pattern_library_v2 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pattern_library_v2 ALTER COLUMN id SET DEFAULT nextval('public.pattern_library_v2_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: schedule_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_runs ALTER COLUMN id SET DEFAULT nextval('public.schedule_runs_id_seq'::regclass);


--
-- Name: schema_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations ALTER COLUMN id SET DEFAULT nextval('public.schema_migrations_id_seq'::regclass);


--
-- Name: search_analytics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_analytics ALTER COLUMN id SET DEFAULT nextval('public.search_analytics_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: tag_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_categories ALTER COLUMN id SET DEFAULT nextval('public.tag_categories_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: technology_tracking_v2 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_tracking_v2 ALTER COLUMN id SET DEFAULT nextval('public.technology_tracking_v2_id_seq'::regclass);


--
-- Name: thinking_branches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_branches ALTER COLUMN id SET DEFAULT nextval('public.thinking_branches_id_seq'::regclass);


--
-- Name: thinking_sequences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_sequences ALTER COLUMN id SET DEFAULT nextval('public.thinking_sequences_id_seq'::regclass);


--
-- Name: thoughts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thoughts ALTER COLUMN id SET DEFAULT nextval('public.thoughts_id_seq'::regclass);


--
-- Name: unified_insights_v2 id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_insights_v2 ALTER COLUMN id SET DEFAULT nextval('public.unified_insights_v2_id_seq'::regclass);


--
-- Name: analytics_snapshots analytics_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_snapshots
    ADD CONSTRAINT analytics_snapshots_pkey PRIMARY KEY (id);


--
-- Name: clustering_config clustering_config_config_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clustering_config
    ADD CONSTRAINT clustering_config_config_key_key UNIQUE (config_key);


--
-- Name: clustering_config clustering_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clustering_config
    ADD CONSTRAINT clustering_config_pkey PRIMARY KEY (id);


--
-- Name: embedding_models embedding_models_model_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embedding_models
    ADD CONSTRAINT embedding_models_model_name_key UNIQUE (model_name);


--
-- Name: embedding_models embedding_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embedding_models
    ADD CONSTRAINT embedding_models_pkey PRIMARY KEY (id);


--
-- Name: insight_generation_jobs insight_generation_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_generation_jobs
    ADD CONSTRAINT insight_generation_jobs_pkey PRIMARY KEY (id);


--
-- Name: insight_processing_queue_v2 insight_processing_queue_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_processing_queue_v2
    ADD CONSTRAINT insight_processing_queue_v2_pkey PRIMARY KEY (id);


--
-- Name: insight_templates_v2 insight_templates_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_templates_v2
    ADD CONSTRAINT insight_templates_v2_pkey PRIMARY KEY (id);


--
-- Name: insight_templates_v2 insight_templates_v2_template_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_templates_v2
    ADD CONSTRAINT insight_templates_v2_template_name_key UNIQUE (template_name);


--
-- Name: job_execution_stats job_execution_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_execution_stats
    ADD CONSTRAINT job_execution_stats_pkey PRIMARY KEY (id);


--
-- Name: llm_analysis_cache llm_analysis_cache_content_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_analysis_cache
    ADD CONSTRAINT llm_analysis_cache_content_hash_key UNIQUE (content_hash);


--
-- Name: llm_analysis_cache llm_analysis_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_analysis_cache
    ADD CONSTRAINT llm_analysis_cache_pkey PRIMARY KEY (id);


--
-- Name: memories memories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories
    ADD CONSTRAINT memories_pkey PRIMARY KEY (id);


--
-- Name: memory_template_mappings memory_template_mappings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_template_mappings
    ADD CONSTRAINT memory_template_mappings_pkey PRIMARY KEY (id);


--
-- Name: pattern_library_v2 pattern_library_v2_pattern_signature_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pattern_library_v2
    ADD CONSTRAINT pattern_library_v2_pattern_signature_key UNIQUE (pattern_signature);


--
-- Name: pattern_library_v2 pattern_library_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pattern_library_v2
    ADD CONSTRAINT pattern_library_v2_pkey PRIMARY KEY (id);


--
-- Name: projects projects_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_name_unique UNIQUE (name);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: schedule_runs schedule_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_runs
    ADD CONSTRAINT schedule_runs_pkey PRIMARY KEY (id);


--
-- Name: schedule_runs schedule_runs_schedule_type_run_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schedule_runs
    ADD CONSTRAINT schedule_runs_schedule_type_run_time_key UNIQUE (schedule_type, run_time);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_version_key UNIQUE (version);


--
-- Name: search_analytics search_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_analytics
    ADD CONSTRAINT search_analytics_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_project_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_project_name_unique UNIQUE (project_id, session_name);


--
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (key);


--
-- Name: tag_categories tag_categories_category_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_categories
    ADD CONSTRAINT tag_categories_category_name_key UNIQUE (category_name);


--
-- Name: tag_categories tag_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tag_categories
    ADD CONSTRAINT tag_categories_pkey PRIMARY KEY (id);


--
-- Name: tags tags_category_id_tag_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_category_id_tag_name_key UNIQUE (category_id, tag_name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: technology_tracking_v2 technology_tracking_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_tracking_v2
    ADD CONSTRAINT technology_tracking_v2_pkey PRIMARY KEY (id);


--
-- Name: technology_tracking_v2 technology_tracking_v2_technology_name_technology_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.technology_tracking_v2
    ADD CONSTRAINT technology_tracking_v2_technology_name_technology_category_key UNIQUE (technology_name, technology_category);


--
-- Name: thinking_branches thinking_branch_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_branches
    ADD CONSTRAINT thinking_branch_unique UNIQUE (sequence_id, branch_id);


--
-- Name: thinking_branches thinking_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_branches
    ADD CONSTRAINT thinking_branches_pkey PRIMARY KEY (id);


--
-- Name: thinking_sequences thinking_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_sequences
    ADD CONSTRAINT thinking_sequences_pkey PRIMARY KEY (id);


--
-- Name: thoughts thoughts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thoughts
    ADD CONSTRAINT thoughts_pkey PRIMARY KEY (id);


--
-- Name: unified_insights_v2 unified_insights_v2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_insights_v2
    ADD CONSTRAINT unified_insights_v2_pkey PRIMARY KEY (id);


--
-- Name: idx_analytics_snapshots_granularity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_granularity ON public.analytics_snapshots USING btree (granularity);


--
-- Name: idx_analytics_snapshots_metrics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_metrics ON public.analytics_snapshots USING gin (metrics);


--
-- Name: idx_analytics_snapshots_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_project ON public.analytics_snapshots USING btree (project_id) WHERE (project_id IS NOT NULL);


--
-- Name: idx_analytics_snapshots_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_time ON public.analytics_snapshots USING btree (snapshot_time DESC);


--
-- Name: idx_analytics_snapshots_time_gran; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analytics_snapshots_time_gran ON public.analytics_snapshots USING btree (snapshot_time DESC, granularity);


--
-- Name: idx_embedding_models_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embedding_models_available ON public.embedding_models USING btree (is_available) WHERE (is_available = true);


--
-- Name: idx_embedding_models_default; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embedding_models_default ON public.embedding_models USING btree (is_default) WHERE (is_default = true);


--
-- Name: idx_embedding_models_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_embedding_models_provider ON public.embedding_models USING btree (provider);


--
-- Name: idx_generation_jobs_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generation_jobs_project ON public.insight_generation_jobs USING btree (project_id);


--
-- Name: idx_generation_jobs_started; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generation_jobs_started ON public.insight_generation_jobs USING btree (started_at DESC);


--
-- Name: idx_generation_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generation_jobs_status ON public.insight_generation_jobs USING btree (status);


--
-- Name: idx_generation_jobs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_generation_jobs_type ON public.insight_generation_jobs USING btree (job_type, trigger_type);


--
-- Name: idx_llm_analysis_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_analysis_expires ON public.llm_analysis_cache USING btree (expires_at);


--
-- Name: idx_llm_analysis_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_analysis_hash ON public.llm_analysis_cache USING btree (content_hash);


--
-- Name: idx_llm_analysis_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_llm_analysis_type ON public.llm_analysis_cache USING btree (analysis_type);


--
-- Name: idx_memories_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_created_at ON public.memories USING btree (created_at DESC);


--
-- Name: idx_memories_embedding_dims; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_embedding_dims ON public.memories USING btree (embedding_dimensions);


--
-- Name: idx_memories_embedding_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_embedding_model ON public.memories USING btree (embedding_model);


--
-- Name: idx_memories_hybrid_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_hybrid_search ON public.memories USING btree (processing_status, memory_type, project_id) WHERE ((embedding IS NOT NULL) AND (tag_embedding IS NOT NULL));


--
-- Name: idx_memories_importance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_importance ON public.memories USING btree (importance_score DESC);


--
-- Name: idx_memories_memory_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_memory_status ON public.memories USING btree (memory_status);


--
-- Name: idx_memories_metadata; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_metadata ON public.memories USING gin (metadata);


--
-- Name: idx_memories_processing_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_processing_status ON public.memories USING btree (processing_status);


--
-- Name: idx_memories_processing_status_retry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_processing_status_retry ON public.memories USING btree (processing_status, retry_count) WHERE ((processing_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('failed'::character varying)::text]));


--
-- Name: idx_memories_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_project_id ON public.memories USING btree (project_id);


--
-- Name: idx_memories_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_session_id ON public.memories USING btree (session_id);


--
-- Name: idx_memories_smart_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_smart_tags ON public.memories USING gin (smart_tags);


--
-- Name: idx_memories_tag_embedding_hnsw; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_tag_embedding_hnsw ON public.memories USING hnsw (tag_embedding public.vector_cosine_ops) WITH (m='16', ef_construction='64');


--
-- Name: idx_memories_tag_embedding_ivfflat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_tag_embedding_ivfflat ON public.memories USING ivfflat (tag_embedding public.vector_cosine_ops) WITH (lists='100');


--
-- Name: idx_memories_task_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_task_completed ON public.memories USING btree (((metadata ->> 'completed_at'::text))) WHERE (((memory_type)::text = 'task'::text) AND ((metadata ->> 'completed_at'::text) IS NOT NULL));


--
-- Name: idx_memories_task_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_task_priority ON public.memories USING btree (((metadata ->> 'priority'::text))) WHERE ((memory_type)::text = 'task'::text);


--
-- Name: idx_memories_task_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_task_status ON public.memories USING btree (((metadata ->> 'status'::text))) WHERE ((memory_type)::text = 'task'::text);


--
-- Name: idx_memories_task_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_task_type ON public.memories USING btree (((metadata ->> 'task_type'::text))) WHERE ((memory_type)::text = 'task'::text);


--
-- Name: idx_memories_thinking_sequence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_thinking_sequence_id ON public.memories USING btree (thinking_sequence_id) WHERE (thinking_sequence_id IS NOT NULL);


--
-- Name: idx_memories_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memories_type ON public.memories USING btree (memory_type);


--
-- Name: idx_memory_template_mappings_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_memory_template_mappings_type ON public.memory_template_mappings USING btree (memory_type) WHERE (is_active = true);


--
-- Name: idx_pattern_library_v2_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pattern_library_v2_category ON public.pattern_library_v2 USING btree (pattern_category);


--
-- Name: idx_pattern_library_v2_confidence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pattern_library_v2_confidence ON public.pattern_library_v2 USING btree (confidence_score DESC);


--
-- Name: idx_pattern_library_v2_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pattern_library_v2_search ON public.pattern_library_v2 USING gin (search_vector);


--
-- Name: idx_pattern_library_v2_signature; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pattern_library_v2_signature ON public.pattern_library_v2 USING btree (pattern_signature);


--
-- Name: idx_processing_queue_v2_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_queue_v2_priority ON public.insight_processing_queue_v2 USING btree (task_priority, scheduled_for);


--
-- Name: idx_processing_queue_v2_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_processing_queue_v2_status ON public.insight_processing_queue_v2 USING btree (status, scheduled_for);


--
-- Name: idx_schedule_runs_type_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_schedule_runs_type_time ON public.schedule_runs USING btree (schedule_type, run_time DESC);


--
-- Name: idx_search_analytics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_analytics_created_at ON public.search_analytics USING btree (created_at);


--
-- Name: idx_search_analytics_search_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_analytics_search_mode ON public.search_analytics USING btree (search_mode);


--
-- Name: idx_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_active ON public.sessions USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_sessions_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_project_id ON public.sessions USING btree (project_id);


--
-- Name: idx_sessions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_type ON public.sessions USING btree (session_type);


--
-- Name: idx_system_config_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_config_category ON public.system_config USING btree (category);


--
-- Name: idx_tag_categories_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tag_categories_active ON public.tag_categories USING btree (is_active);


--
-- Name: idx_tags_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_active ON public.tags USING btree (is_active);


--
-- Name: idx_tags_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_category ON public.tags USING btree (category_id);


--
-- Name: idx_tags_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_name ON public.tags USING btree (tag_name);


--
-- Name: idx_tags_usage; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tags_usage ON public.tags USING btree (usage_count DESC);


--
-- Name: idx_technology_tracking_v2_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_technology_tracking_v2_category ON public.technology_tracking_v2 USING btree (technology_category);


--
-- Name: idx_technology_tracking_v2_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_technology_tracking_v2_name ON public.technology_tracking_v2 USING btree (technology_name);


--
-- Name: idx_technology_tracking_v2_preference; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_technology_tracking_v2_preference ON public.technology_tracking_v2 USING btree (preference_score DESC);


--
-- Name: idx_templates_v2_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_v2_active ON public.insight_templates_v2 USING btree (is_active);


--
-- Name: idx_templates_v2_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_v2_category ON public.insight_templates_v2 USING btree (template_category);


--
-- Name: idx_templates_v2_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_templates_v2_name ON public.insight_templates_v2 USING btree (template_name);


--
-- Name: idx_thinking_branches_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thinking_branches_active ON public.thinking_branches USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_thinking_branches_sequence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thinking_branches_sequence ON public.thinking_branches USING btree (sequence_id);


--
-- Name: idx_thinking_seq_complete; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thinking_seq_complete ON public.thinking_sequences USING btree (is_complete);


--
-- Name: idx_thinking_seq_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thinking_seq_project_id ON public.thinking_sequences USING btree (project_id);


--
-- Name: idx_thinking_seq_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thinking_seq_session_id ON public.thinking_sequences USING btree (session_id);


--
-- Name: idx_thoughts_branch_from; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thoughts_branch_from ON public.thoughts USING btree (branch_from_thought_id) WHERE (branch_from_thought_id IS NOT NULL);


--
-- Name: idx_thoughts_branch_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thoughts_branch_id ON public.thoughts USING btree (branch_id) WHERE (branch_id IS NOT NULL);


--
-- Name: idx_thoughts_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thoughts_number ON public.thoughts USING btree (sequence_id, thought_number);


--
-- Name: idx_thoughts_revision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thoughts_revision ON public.thoughts USING btree (revises_thought_id) WHERE (revises_thought_id IS NOT NULL);


--
-- Name: idx_thoughts_sequence_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thoughts_sequence_id ON public.thoughts USING btree (sequence_id);


--
-- Name: idx_unified_insights_v2_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_category ON public.unified_insights_v2 USING btree (insight_category);


--
-- Name: idx_unified_insights_v2_confidence; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_confidence ON public.unified_insights_v2 USING btree (confidence_score DESC);


--
-- Name: idx_unified_insights_v2_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_created ON public.unified_insights_v2 USING btree (created_at DESC);


--
-- Name: idx_unified_insights_v2_embedding; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_embedding ON public.unified_insights_v2 USING ivfflat (embedding public.vector_cosine_ops);


--
-- Name: idx_unified_insights_v2_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_level ON public.unified_insights_v2 USING btree (insight_level);


--
-- Name: idx_unified_insights_v2_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_project ON public.unified_insights_v2 USING btree (project_id);


--
-- Name: idx_unified_insights_v2_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_search ON public.unified_insights_v2 USING gin (search_vector);


--
-- Name: idx_unified_insights_v2_source_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_source_type ON public.unified_insights_v2 USING btree (source_type);


--
-- Name: idx_unified_insights_v2_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_tags ON public.unified_insights_v2 USING gin (tags);


--
-- Name: idx_unified_insights_v2_technologies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_technologies ON public.unified_insights_v2 USING gin (technologies);


--
-- Name: idx_unified_insights_v2_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_type ON public.unified_insights_v2 USING btree (insight_type);


--
-- Name: idx_unified_insights_v2_validation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unified_insights_v2_validation ON public.unified_insights_v2 USING btree (validation_status, validation_stage) WHERE ((validation_status)::text = ANY ((ARRAY['pending'::character varying, 'validated'::character varying, 'rejected'::character varying])::text[]));



--
-- Name: analytics_snapshots analytics_snapshots_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_snapshots
    ADD CONSTRAINT analytics_snapshots_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: insight_generation_jobs insight_generation_jobs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_generation_jobs
    ADD CONSTRAINT insight_generation_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: memories memories_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories
    ADD CONSTRAINT memories_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: memories memories_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories
    ADD CONSTRAINT memories_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: memories memories_thinking_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories
    ADD CONSTRAINT memories_thinking_sequence_id_fkey FOREIGN KEY (thinking_sequence_id) REFERENCES public.thinking_sequences(id) ON DELETE SET NULL;


--
-- Name: pattern_library_v2 pattern_library_v2_evolution_from_pattern_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pattern_library_v2
    ADD CONSTRAINT pattern_library_v2_evolution_from_pattern_fkey FOREIGN KEY (evolution_from_pattern) REFERENCES public.pattern_library_v2(id);


--
-- Name: sessions sessions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: tags tags_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.tag_categories(id) ON DELETE CASCADE;


--
-- Name: thinking_branches thinking_branches_branch_from_thought_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_branches
    ADD CONSTRAINT thinking_branches_branch_from_thought_id_fkey FOREIGN KEY (branch_from_thought_id) REFERENCES public.thoughts(id) ON DELETE CASCADE;


--
-- Name: thinking_branches thinking_branches_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_branches
    ADD CONSTRAINT thinking_branches_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.thinking_sequences(id) ON DELETE CASCADE;


--
-- Name: thinking_sequences thinking_sequences_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_sequences
    ADD CONSTRAINT thinking_sequences_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: thinking_sequences thinking_sequences_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thinking_sequences
    ADD CONSTRAINT thinking_sequences_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: thoughts thoughts_branch_from_thought_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thoughts
    ADD CONSTRAINT thoughts_branch_from_thought_id_fkey FOREIGN KEY (branch_from_thought_id) REFERENCES public.thoughts(id) ON DELETE SET NULL;


--
-- Name: thoughts thoughts_revises_thought_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thoughts
    ADD CONSTRAINT thoughts_revises_thought_id_fkey FOREIGN KEY (revises_thought_id) REFERENCES public.thoughts(id) ON DELETE SET NULL;


--
-- Name: thoughts thoughts_sequence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thoughts
    ADD CONSTRAINT thoughts_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES public.thinking_sequences(id) ON DELETE CASCADE;


--
-- Name: unified_insights_v2 unified_insights_v2_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_insights_v2
    ADD CONSTRAINT unified_insights_v2_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: unified_insights_v2 unified_insights_v2_supersedes_insight_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unified_insights_v2
    ADD CONSTRAINT unified_insights_v2_supersedes_insight_id_fkey FOREIGN KEY (supersedes_insight_id) REFERENCES public.unified_insights_v2(id);


--
-- PostgreSQL database dump complete
--


-- =====================================================
-- SEQUENCE RESETS
-- =====================================================
-- Set all sequences to appropriate starting values

ALTER SEQUENCE IF EXISTS analytics_snapshots_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS clustering_config_id_seq RESTART WITH 100;
ALTER SEQUENCE IF EXISTS embedding_models_id_seq RESTART WITH 100;
ALTER SEQUENCE IF EXISTS insight_generation_jobs_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS insight_processing_queue_v2_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS insight_templates_v2_id_seq RESTART WITH 100;
ALTER SEQUENCE IF EXISTS job_execution_stats_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS llm_analysis_cache_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS memories_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS memory_template_mappings_id_seq RESTART WITH 100;
ALTER SEQUENCE IF EXISTS pattern_library_v2_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 100;
ALTER SEQUENCE IF EXISTS schedule_runs_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS schema_migrations_id_seq RESTART WITH 100;
ALTER SEQUENCE IF EXISTS search_analytics_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS tag_categories_id_seq RESTART WITH 100;
ALTER SEQUENCE IF EXISTS tags_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS technology_tracking_v2_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS thinking_branches_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS thinking_sequences_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS thoughts_id_seq RESTART WITH 1000;
ALTER SEQUENCE IF EXISTS unified_insights_v2_id_seq RESTART WITH 1000;


SET default_table_access_method = heap;

--
-- Name: ai_insights_v2_compat; Type: VIEW; Schema: public; Owner: -
--

-- =====================================================
-- CONFIGURATION DATA EXPORT
-- =====================================================


--
-- Name: array_unique(anyarray); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.array_unique(arr anyarray) RETURNS anyarray
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT ARRAY(SELECT DISTINCT unnest(arr))
$$;


--
-- Name: audit_job_status_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_job_status_change() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO minime_insights_audit_log (
            action_type, entity_type, entity_id, action_details
        ) VALUES (
            'job_status_changed',
            'job',
            NEW.id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'job_type', NEW.job_type
            )
        );
    END IF;
    RETURN NEW;
END;
$$;



--
-- Name: v2_insights_processing_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v2_insights_processing_stats AS
 SELECT count(DISTINCT m.id) AS total_memories,
    count(DISTINCT
        CASE
            WHEN ((m.processing_status)::text = 'ready'::text) THEN m.id
            ELSE NULL::integer
        END) AS ready_memories,
    count(DISTINCT ui.source_ids[1]) AS processed_memories,
    count(DISTINCT ui.id) AS total_insights,
    count(DISTINCT
        CASE
            WHEN ((ui.validation_status)::text = 'validated'::text) THEN ui.id
            ELSE NULL::integer
        END) AS validated_insights,
    count(DISTINCT
        CASE
            WHEN ((ui.validation_status)::text = 'pending'::text) THEN ui.id
            ELSE NULL::integer
        END) AS pending_insights,
    count(DISTINCT
        CASE
            WHEN ((ui.validation_status)::text = 'rejected'::text) THEN ui.id
            ELSE NULL::integer
        END) AS rejected_insights,
    count(DISTINCT
        CASE
            WHEN ((ui.source_type)::text = 'cluster'::text) THEN ui.id
            ELSE NULL::integer
        END) AS cluster_insights,
    max(ui.created_at) AS last_insight_created
   FROM (public.memories m
     LEFT JOIN public.unified_insights_v2 ui ON ((m.id = ANY (ui.source_ids))))
  WHERE (((ui.system_version)::text = 'v2'::text) OR (ui.id IS NULL));

--
-- Name: tag_usage_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.tag_usage_stats AS
 SELECT tc.category_name,
    tc.priority,
    t.tag_name,
    t.usage_count,
    count(DISTINCT m.id) AS memory_count
   FROM ((public.tags t
     JOIN public.tag_categories tc ON ((t.category_id = tc.id)))
     LEFT JOIN public.memories m ON (((t.tag_name)::text = ANY (m.smart_tags))))
  WHERE (t.is_active = true)
  GROUP BY tc.category_name, tc.priority, t.tag_name, t.usage_count
  ORDER BY tc.priority, t.usage_count DESC;



--
-- Name: memory_search; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.memory_search AS
 SELECT m.id,
    m.project_id,
    m.session_id,
    m.content,
    m.memory_type,
    m.summary,
    m.importance_score,
    m.smart_tags,
    m.embedding,
    m.created_at,
    m.updated_at,
    m.processing_status,
    p.name AS project_name,
    s.session_name,
    s.session_type
   FROM ((public.memories m
     JOIN public.projects p ON ((m.project_id = p.id)))
     LEFT JOIN public.sessions s ON ((m.session_id = s.id)));


--
-- Name: memory_search_view; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.memory_search_view AS
 SELECT m.id,
    m.project_id,
    m.session_id,
    m.content,
    m.memory_type,
    m.summary,
    m.processing_status,
    m.importance_score,
    m.smart_tags,
    m.metadata,
    m.embedding,
    m.tag_embedding,
    m.embedding_model,
    m.embedding_dimensions,
    m.created_at,
    m.updated_at,
    p.name AS project_name,
    s.session_name,
        CASE
            WHEN ((m.embedding IS NOT NULL) AND (m.tag_embedding IS NOT NULL)) THEN 'hybrid'::text
            WHEN (m.embedding IS NOT NULL) THEN 'content_only'::text
            WHEN (m.tag_embedding IS NOT NULL) THEN 'tags_only'::text
            ELSE 'no_search'::text
        END AS search_capability
   FROM ((public.memories m
     JOIN public.projects p ON ((m.project_id = p.id)))
     LEFT JOIN public.sessions s ON ((m.session_id = s.id)))
  WHERE ((m.processing_status)::text <> ALL (ARRAY[('failed'::character varying)::text, ('failed_permanent'::character varying)::text]));





--
-- Name: active_thinking_progress; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.active_thinking_progress AS
 SELECT ts.id AS sequence_id,
    ts.project_id,
    ts.session_id,
    ts.sequence_name,
    ts.description,
    ts.goal,
    count(t.id) AS current_thoughts,
    max(t.thought_number) AS latest_thought_number,
    max(t.total_thoughts) AS estimated_total,
    count(DISTINCT t.branch_id) AS active_branches,
    max(t.created_at) AS last_thought_at,
        CASE
            WHEN (max(t.total_thoughts) > 0) THEN round((((max(t.thought_number))::numeric / (max(t.total_thoughts))::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS progress_percentage
   FROM (public.thinking_sequences ts
     LEFT JOIN public.thoughts t ON ((ts.id = t.sequence_id)))
  WHERE (ts.is_complete = false)
  GROUP BY ts.id, ts.project_id, ts.session_id, ts.sequence_name, ts.description, ts.goal;


--
-- Name: memory_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.memory_statistics AS
 SELECT p.name AS project_name,
    count(m.id) AS total_memories,
    count(
        CASE
            WHEN ((m.processing_status)::text = 'ready'::text) THEN 1
            ELSE NULL::integer
        END) AS enriched_memories,
    count(
        CASE
            WHEN ((m.smart_tags IS NOT NULL) AND (array_length(m.smart_tags, 1) > 0)) THEN 1
            ELSE NULL::integer
        END) AS tagged_memories,
    count(
        CASE
            WHEN (m.summary IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS summarized_memories,
    round((avg(m.importance_score))::numeric, 3) AS avg_importance,
    max(m.created_at) AS last_memory_at
   FROM (public.memories m
     JOIN public.projects p ON ((m.project_id = p.id)))
  GROUP BY p.id, p.name
  ORDER BY (count(m.id)) DESC;



--
-- Name: project_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.project_summary AS
 SELECT p.id,
    p.name,
    p.description,
    p.created_at,
    p.updated_at,
    count(DISTINCT s.id) AS session_count,
    count(DISTINCT m.id) AS memory_count,
    count(DISTINCT ts.id) AS thinking_sequence_count,
    max(GREATEST(COALESCE(s.updated_at, p.created_at), COALESCE(m.updated_at, p.created_at), COALESCE(ts.updated_at, p.created_at))) AS last_activity
   FROM (((public.projects p
     LEFT JOIN public.sessions s ON ((p.id = s.project_id)))
     LEFT JOIN public.memories m ON ((p.id = m.project_id)))
     LEFT JOIN public.thinking_sequences ts ON ((p.id = ts.project_id)))
  GROUP BY p.id, p.name, p.description, p.created_at, p.updated_at;


--
-- Name: calculate_hybrid_similarity(public.vector, public.vector, public.vector, double precision, double precision); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_hybrid_similarity(content_embedding public.vector, tag_embedding public.vector, query_embedding public.vector, content_weight double precision DEFAULT 0.7, tag_weight double precision DEFAULT 0.3) RETURNS double precision
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    -- Handle null embeddings
    IF content_embedding IS NULL AND tag_embedding IS NULL THEN
        RETURN 0.0;
    ELSIF content_embedding IS NULL THEN
        RETURN tag_weight * (1 - (tag_embedding <=> query_embedding));
    ELSIF tag_embedding IS NULL THEN
        RETURN content_weight * (1 - (content_embedding <=> query_embedding));
    ELSE
        RETURN (content_weight * (1 - (content_embedding <=> query_embedding))) + 
               (tag_weight * (1 - (tag_embedding <=> query_embedding)));
    END IF;
END;
$$;



--
-- Name: enrichment_status; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.enrichment_status AS
 SELECT memories.processing_status,
    count(*) AS count,
    round((((count(*))::numeric * 100.0) / sum(count(*)) OVER ()), 2) AS percentage
   FROM public.memories
  WHERE (memories.processing_status IS NOT NULL)
  GROUP BY memories.processing_status
  ORDER BY
        CASE memories.processing_status
            WHEN 'ready'::text THEN 1
            WHEN 'pending'::text THEN 2
            WHEN 'processing'::text THEN 3
            WHEN 'failed'::text THEN 4
            WHEN 'failed_permanent'::text THEN 5
            ELSE NULL::integer
        END;


--
-- Name: cleanup_old_analytics_snapshots(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_analytics_snapshots() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    minute_retention_days INTEGER;
    hour_retention_days INTEGER;
BEGIN
    -- Get retention settings from config
    SELECT (value::text)::integer INTO minute_retention_days 
    FROM system_config 
    WHERE key = 'analytics_retention_days';
    
    -- Default if not found
    IF minute_retention_days IS NULL THEN
        minute_retention_days := 7;
    END IF;
    
    hour_retention_days := 30;
    
    -- Delete old minute-level data
    DELETE FROM analytics_snapshots 
    WHERE granularity = 'minute' 
    AND snapshot_time < CURRENT_TIMESTAMP - INTERVAL '1 day' * minute_retention_days;
    
    -- Delete old hour-level data
    DELETE FROM analytics_snapshots 
    WHERE granularity = 'hour' 
    AND snapshot_time < CURRENT_TIMESTAMP - INTERVAL '1 day' * hour_retention_days;
    
    -- Day-level data is kept indefinitely
END;
$$;


--
-- Name: coding_patterns_v2_compat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.coding_patterns_v2_compat AS
 SELECT pattern_library_v2.id,
    pattern_library_v2.pattern_type,
    pattern_library_v2.pattern_category,
    pattern_library_v2.pattern_name,
    pattern_library_v2.pattern_signature,
    pattern_library_v2.description AS pattern_description,
    pattern_library_v2.frequency_count,
    pattern_library_v2.confidence_score,
    pattern_library_v2.technologies AS languages,
    pattern_library_v2.projects_seen,
    pattern_library_v2.created_at
   FROM public.pattern_library_v2;


--
-- Name: cleanup_old_generation_jobs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_generation_jobs() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM insight_generation_jobs 
  WHERE started_at < NOW() - INTERVAL '90 days'
  AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_old_schedule_runs(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_old_schedule_runs() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM schedule_runs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_orphaned_data(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_orphaned_data() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up memories without valid sessions (if session was deleted)
    -- Note: This is handled by ON DELETE SET NULL, but good to verify
    
    -- Clean up old thinking branches that are inactive and old
    DELETE FROM thinking_branches 
    WHERE is_active = false 
    AND created_at < NOW() - INTERVAL '30 days'
    AND is_merged = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;


--
-- Name: cleanup_stale_l1_processing(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.cleanup_stale_l1_processing() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM l1_memories_in_processing
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


--
-- Name: job_performance_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.job_performance_summary AS
 SELECT insight_generation_jobs.trigger_type,
    date(insight_generation_jobs.started_at) AS date,
    count(*) AS total_jobs,
    count(*) FILTER (WHERE ((insight_generation_jobs.status)::text = 'completed'::text)) AS completed_jobs,
    count(*) FILTER (WHERE ((insight_generation_jobs.status)::text = 'failed'::text)) AS failed_jobs,
    avg(EXTRACT(epoch FROM (insight_generation_jobs.completed_at - insight_generation_jobs.started_at))) AS avg_duration_seconds,
    sum(insight_generation_jobs.insights_generated) AS total_insights_generated
   FROM public.insight_generation_jobs
  WHERE (insight_generation_jobs.started_at >= (now() - '30 days'::interval))
  GROUP BY insight_generation_jobs.trigger_type, (date(insight_generation_jobs.started_at))
  ORDER BY (date(insight_generation_jobs.started_at)) DESC, (count(*)) DESC;



--
-- Name: get_task_duplicate_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_task_duplicate_stats(p_project_id integer DEFAULT NULL::integer) RETURNS TABLE(total_tasks integer, active_tasks integer, duplicate_tasks integer, duplicate_percentage numeric, avg_confidence numeric, last_dedup_run timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tasks,
        COUNT(*) FILTER (WHERE metadata->>'status' IN ('pending', 'in_progress'))::INTEGER as active_tasks,
        COUNT(*) FILTER (WHERE metadata->>'status' = 'duplicate')::INTEGER as duplicate_tasks,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(COUNT(*) FILTER (WHERE metadata->>'status' = 'duplicate')::DECIMAL / COUNT(*) * 100, 2)
            ELSE 0
        END as duplicate_percentage,
        ROUND(AVG((metadata->>'duplicate_confidence')::DECIMAL) FILTER (WHERE metadata->>'status' = 'duplicate'), 2) as avg_confidence,
        MAX((metadata->>'marked_duplicate_at')::TIMESTAMP WITH TIME ZONE) FILTER (WHERE metadata->>'status' = 'duplicate') as last_dedup_run
    FROM memories
    WHERE memory_type = 'task'
    AND (p_project_id IS NULL OR project_id = p_project_id);
END;
$$;


--
-- Name: get_unprocessed_memories_v2(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_unprocessed_memories_v2(limit_count integer DEFAULT 100) RETURNS TABLE(id integer, content text, memory_type character varying, project_id integer, metadata jsonb, created_at timestamp without time zone, importance_score numeric, smart_tags text[], embedding public.vector, summary text, project_name character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH processed_memory_ids AS (
        SELECT DISTINCT unnest(source_ids) as memory_id
        FROM unified_insights_v2
        WHERE source_type = 'memory'
        AND system_version = 'v2'
        AND insight_type != 'processing_marker'
    )
    SELECT 
        m.id,
        m.content,
        m.memory_type,
        m.project_id,
        m.metadata,
        m.created_at,
        m.importance_score,
        m.smart_tags,
        m.embedding,
        m.summary,
        p.name as project_name
    FROM memories m
    JOIN projects p ON m.project_id = p.id
    WHERE m.processing_status = 'ready'
        AND m.id NOT IN (SELECT memory_id FROM processed_memory_ids)
        AND m.content IS NOT NULL
        AND LENGTH(m.content) > 10
    ORDER BY m.importance_score DESC, m.created_at DESC
    LIMIT limit_count;
END;
$$;


--
-- Name: memory_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.memory_stats(project_id_param integer DEFAULT NULL::integer) RETURNS TABLE(total_memories bigint, total_size_mb numeric, avg_importance numeric, memory_types jsonb, recent_activity jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_memories,
        ROUND(SUM(LENGTH(content) + COALESCE(LENGTH(summary), 0))::NUMERIC / 1024 / 1024, 2) as total_size_mb,
        ROUND(AVG(importance_score)::NUMERIC, 3) as avg_importance,
        JSON_AGG(DISTINCT memory_type)::JSONB as memory_types,
        JSON_BUILD_OBJECT(
            'last_24h', COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END),
            'last_week', COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END),
            'last_month', COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)
        )::JSONB as recent_activity
    FROM memories m
    WHERE (project_id_param IS NULL OR m.project_id = project_id_param);
END;
$$;


--
-- Name: queue_memory_enrichment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.queue_memory_enrichment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only queue if processing_status is 'pending'
    IF NEW.processing_status = 'pending' THEN
        INSERT INTO memory_enrichment_queue (memory_id, priority)
        VALUES (NEW.id, 5)
        ON CONFLICT (memory_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_learning_queue_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_learning_queue_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_minime_insights_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_minime_insights_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_pattern_library_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_pattern_library_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.pattern_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$;


--
-- Name: update_system_config_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_system_config_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: update_task_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_task_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: update_unified_insights_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_unified_insights_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;



CREATE VIEW public.ai_insights_v2_compat AS
 SELECT unified_insights_v2.id,
    unified_insights_v2.project_id,
    unified_insights_v2.insight_type,
    unified_insights_v2.title AS query_template,
    unified_insights_v2.summary AS generated_insight,
    unified_insights_v2.confidence_score,
    unified_insights_v2.source_ids AS source_memory_ids,
    unified_insights_v2.custom_metadata AS metadata,
    unified_insights_v2.embedding,
    unified_insights_v2.tags AS smart_tags,
    unified_insights_v2.insight_level AS level_tag,
    unified_insights_v2.detailed_content AS level_data,
    unified_insights_v2.created_at
   FROM public.unified_insights_v2;



-- Function to update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
 $$ LANGUAGE plpgsql;

-- Create monitoring view for V2 insights processing
CREATE OR REPLACE VIEW v2_insights_processing_stats AS
SELECT 
    COUNT(DISTINCT m.id) as total_memories,
    COUNT(DISTINCT CASE WHEN m.processing_status = 'ready' THEN m.id END) as ready_memories,
    COUNT(DISTINCT ui.source_ids[1]) as processed_memories,
    COUNT(DISTINCT ui.id) as total_insights,
    COUNT(DISTINCT CASE WHEN ui.validation_status = 'validated' THEN ui.id END) as validated_insights,
    COUNT(DISTINCT CASE WHEN ui.validation_status = 'pending' THEN ui.id END) as pending_insights,
    COUNT(DISTINCT CASE WHEN ui.validation_status = 'rejected' THEN ui.id END) as rejected_insights,
    COUNT(DISTINCT CASE WHEN ui.source_type = 'cluster' THEN ui.id END) as cluster_insights,
    MAX(ui.created_at) as last_insight_created
FROM memories m
LEFT JOIN unified_insights_v2 ui ON m.id = ANY(ui.source_ids)
WHERE ui.system_version = 'v2' OR ui.id IS NULL;

CREATE TRIGGER trigger_update_pattern_search BEFORE INSERT OR UPDATE ON public.pattern_library_v2 FOR EACH ROW EXECUTE FUNCTION public.update_pattern_library_search_vector();



--
-- Name: pattern_library_v2 trigger_update_pattern_search; Type: TRIGGER; Schema: public; Owner: -
--



--
-- Name: unified_insights_v2 trigger_update_unified_insights_search; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_unified_insights_search BEFORE INSERT OR UPDATE ON public.unified_insights_v2 FOR EACH ROW EXECUTE FUNCTION public.update_unified_insights_search_vector();


--
-- Name: clustering_config update_clustering_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clustering_config_updated_at BEFORE UPDATE ON public.clustering_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: embedding_models update_embedding_models_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_embedding_models_updated_at BEFORE UPDATE ON public.embedding_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: memories update_memories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: memory_template_mappings update_memory_template_mappings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_memory_template_mappings_updated_at BEFORE UPDATE ON public.memory_template_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_config update_system_config_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_system_config_timestamp BEFORE UPDATE ON public.system_config FOR EACH ROW EXECUTE FUNCTION public.update_system_config_timestamp();


--
-- Name: thinking_sequences update_thinking_sequences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_thinking_sequences_updated_at BEFORE UPDATE ON public.thinking_sequences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();



-- -----------------------------------------------------------------------------
-- 5. PROCESSING_JOBS TABLE (Track long-running analysis jobs)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS minime_insights_processing_jobs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    job_type TEXT NOT NULL CHECK (job_type IN ('clustering', 'insight_generation', 'synthesis', 'full_reprocess')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    
    -- Scope
    memory_filter JSONB DEFAULT '{}', -- Criteria for memories to process
    cluster_ids JSONB DEFAULT '[]', -- Specific clusters to process
    
    -- Progress tracking
    total_items INTEGER,
    processed_items INTEGER DEFAULT 0,
    progress_percentage REAL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Results
    created_clusters INTEGER DEFAULT 0,
    created_insights INTEGER DEFAULT 0,
    errors_encountered INTEGER DEFAULT 0,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_minime_insights_jobs_status ON minime_insights_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_minime_insights_jobs_type ON minime_insights_processing_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_minime_insights_jobs_created_at ON minime_insights_processing_jobs(created_at);


-- =====================================================
-- FINAL NOTES
-- =====================================================
-- 1. Run this script on a fresh database: psql -d minime_memories -f minime-startup.sql
-- 2. Insight templates are loaded from the container's init-v2.sql during startup
-- 3. Make sure to pull both Ollama models:
--    - ollama pull deepseek-coder:6.7b (or your chosen LLM)
--    - ollama pull mxbai-embed-large (required for embeddings)
-- 4. Override LLM model with: -e LLM_MODEL="your-model"
-- 5. Override max tokens with: -e LLM_MAX_TOKENS="8000"

-- EOF < /dev/null -- Removed: Invalid SQL syntax