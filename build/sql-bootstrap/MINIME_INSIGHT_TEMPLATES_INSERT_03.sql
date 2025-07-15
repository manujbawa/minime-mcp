INSERT INTO public.insight_templates_v2 (template_name,template_category,template_version,template_content,template_variables,processing_config,output_schema,validation_rules,usage_count,success_rate,avg_confidence_score,avg_processing_time_ms,is_active,is_experimental,description,tags,created_by,created_at,updated_at) VALUES
   ('technical_implementation','technology','1.0','Extract technical insights from: {content}

JSON format:
{
  "confidence": 0.0-1.0,
  "implementations": [
    {
      "technology": "library/framework/tool name",
      "pattern": "what was implemented",
      "outcome": "result achieved",
      "gotchas": "pitfalls discovered"
    }
  ],
  "best_practices": ["practice1", "practice2"],
  "challenges": ["challenge1", "challenge2"],
  "key_learnings": "summary"
}

Focus on: technology choices, implementation patterns, debugging insights','[]','{"min_memories": 3}',NULL,'[]',0,NULL,NULL,NULL,true,false,NULL,'{}','system','2025-06-30 02:38:07.988','2025-06-30 02:38:07.988'),
   ('performance_security_discoveries','performance','1.0','Extract performance/security insights from: {content}

JSON format:
{
  "confidence": 0.0-1.0,
  "optimizations": [
    {
      "area": "performance or security",
      "issue": "bottleneck or vulnerability",
      "solution": "fix applied",
      "improvement": "measured result"
    }
  ],
  "practices": ["practice1", "practice2"],
  "tools_used": ["tool1", "tool2"],
  "key_learnings": "summary"
}

Focus on: bottlenecks fixed, vulnerabilities addressed, measurable improvements','[]','{"min_memories": 3}',NULL,'[]',0,NULL,NULL,NULL,true,false,NULL,'{}','system','2025-06-30 02:38:07.988','2025-06-30 02:38:07.988'),
   ('configuration_issues_fixes','devops','1.0','Extract infrastructure insights from: {content}

JSON format:
{
  "confidence": 0.0-1.0,
  "infrastructure": [
    {
      "component": "system/service/environment",
      "challenge": "issue encountered", 
      "solution": "how resolved",
      "tools": ["tool1", "tool2"]
    }
  ],
  "practices": ["practice1", "practice2"],
  "key_learnings": "summary"
}

Focus on: deployment issues, configuration problems, infrastructure decisions','[]','{"min_memories": 2}',NULL,'[]',0,NULL,NULL,NULL,true,false,NULL,'{}','system','2025-06-30 02:38:07.988','2025-06-30 02:38:07.988'),
   ('architecture_lessons_learned','architecture','1.0','Extract architectural insights from: {content}

JSON format:
{
  "confidence": 0.0-1.0,
  "decisions": [
    {
      "decision": "choice made",
      "rationale": "why chosen",
      "outcome": "result",
      "trade_offs": "what was sacrificed"
    }
  ],
  "patterns": ["pattern1", "pattern2"],
  "key_learnings": "summary"
}

Focus on: architectural decisions, design patterns, system design lessons','[]','{"min_memories": 3}',NULL,'[]',0,NULL,NULL,NULL,true,false,NULL,'{architecture,decision,system_patterns}','system','2025-06-30 02:38:07.988','2025-06-30 02:38:07.988'),
   ('cross_memory_patterns','cluster_analysis','1.0','Analyze patterns across these {memory_count} related memories:

{cluster_content}

JSON format:
{
  "confidence": 0.0-1.0,
  "key_patterns": [
    {
      "pattern": "recurring theme or behavior",
      "frequency": "how often it appears",
      "examples": ["specific examples"],
      "evolution": "how it changed over time"
    }
  ],
  "connections": [
    {
      "connection": "relationship between memories",
      "evidence": ["supporting examples"]
    }
  ],
  "insights": [
    {
      "insight": "key learning from the cluster",
      "category": "technical|process|decision|knowledge",
      "impact": "significance"
    }
  ],
  "timeline": ["chronological progression of key changes"],
  "key_learnings": "synthesis summary"
}

Focus on: recurring patterns, connections between memories, evolution over time

Analysis type: {analysis_type}','[]','{"max_memories": 30, "min_memories": 4, "is_cluster_template": true}',NULL,'[]',0,NULL,NULL,NULL,true,false,'Identifies recurring patterns, themes, and connections across a cluster of memories','{cluster,patterns,analysis}','system','2025-07-04 23:02:53.256','2025-07-04 23:02:53.256'),
   ('general_insights','general','1.0','JSON format:
{
  "insights": [
    {
      "title": "brief insight title",
      "description": "detailed description", 
      "category": "development|technology|process|other",
      "impact": "how this affects the project",
      "confidence": 0.0-1.0
    }
  ]
}

Focus on: key learnings, important decisions, development patterns, best practices

Examples:
✓ "PostgreSQL chosen over MongoDB for ACID compliance" (technology, 0.9)
✓ "PR templates improved team velocity 30%" (process, 0.85) 
✓ "Monorepo simplified dependency management" (development, 0.8)

Return {"insights": []} if no actionable insights found.','[]','{"min_memories": 1}',NULL,'[]',0,NULL,NULL,NULL,true,false,'General development insights and patterns','{universal,all_types}','system','2025-07-04 23:07:26.111','2025-07-04 23:07:26.111');
