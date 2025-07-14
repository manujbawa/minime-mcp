/**
 * Clustering Processor V2
 * Enhanced version that uses cluster-specific templates
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, DetectionMethods } from '../constants/insight-constants.js';

export class ClusteringProcessorV2 extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'ClusteringProcessorV2';
    }

    getDetectionMethod() {
        return DetectionMethods.CLUSTERING;
    }

    async getClusterAnalysisTemplates() {
        try {
            const result = await this.db.query(
                `SELECT * FROM insight_templates_v2 
                 WHERE template_category = 'cluster_analysis' 
                 AND is_active = true
                 ORDER BY id`,
                []
            );
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to fetch cluster analysis templates:', error);
            return [];
        }
    }

    async process(memory, options = {}) {
        // Clustering is typically a batch process, not for individual memories
        this.logger.debug('Clustering processor called for individual memory - skipping');
        return [];
    }

    /**
     * Process a batch of memories for clustering
     */
    async processBatch(memories, options = {}) {
        const insights = [];
        
        try {
            // If cluster metadata is provided, use it directly
            if (options.clusterMetadata) {
                const cluster = {
                    ...options.clusterMetadata,
                    memories: memories
                };
                
                const clusterInsights = await this.generateClusterInsight(cluster);
                if (clusterInsights) {
                    // Handle both single insight and array of insights
                    if (Array.isArray(clusterInsights)) {
                        insights.push(...clusterInsights);
                    } else {
                        insights.push(clusterInsights);
                    }
                }
            } else {
                // Find similar memories using embeddings
                const clusters = await this.clusterMemories(memories);
                
                // Generate insights for each cluster
                for (const cluster of clusters) {
                    if (cluster.memories.length >= 3) { // Minimum cluster size
                        const clusterInsights = await this.generateClusterInsight(cluster);
                        if (clusterInsights) {
                            // Handle both single insight and array of insights
                            if (Array.isArray(clusterInsights)) {
                                insights.push(...clusterInsights);
                            } else {
                                insights.push(clusterInsights);
                            }
                        }
                    }
                }
            }

            return insights;

        } catch (error) {
            this.logger.error('Clustering process failed:', error);
            return insights;
        }
    }

    async clusterMemories(memories) {
        // Simplified clustering - in production would use proper clustering algorithms
        const clusters = [];
        const threshold = 0.8; // Similarity threshold
        
        // Group by memory type first
        const typeGroups = memories.reduce((groups, memory) => {
            if (!groups[memory.memory_type]) {
                groups[memory.memory_type] = [];
            }
            groups[memory.memory_type].push(memory);
            return groups;
        }, {});

        // For each type, create clusters
        for (const [type, typeMemories] of Object.entries(typeGroups)) {
            const typeClusters = [{
                type,
                memories: typeMemories,
                centroid: null
            }];
            
            clusters.push(...typeClusters);
        }

        return clusters;
    }

    async generateClusterInsight(cluster) {
        try {
            this.logger.debug(`Generating insights for cluster with ${cluster.memories.length} memories`);
            
            // Define analysis types
            const analysisTypes = {
                "technical_evolution": "Focus on: how approaches evolved, key breakthroughs, lessons learned",
                "root_cause": "Focus on: issue patterns, debugging approaches, systemic problems",
                "decision_impact": "Focus on: decision outcomes, assumption validation, hindsight insights",
                "knowledge_synthesis": "Focus on: key learnings, best practices, knowledge gaps",
                "workflow_optimization": "Focus on: process improvements, bottlenecks, efficiency gains",
                "security_patterns": "Focus on: vulnerability patterns, security measures, compliance",
                "cross_patterns": "Focus on: recurring themes, causal relationships, meta-insights"
            };

            // Get all cluster analysis templates
            const templates = await this.getClusterAnalysisTemplates();
            
            if (!templates || templates.length === 0) {
                this.logger.warn('No cluster analysis templates found');
                return await this.generateDefaultClusterInsight(cluster);
            }

            const insights = [];
            
            // Loop through each template
            for (const template of templates) {
                this.logger.info(`Processing template: ${template.template_name}`);
                
                // Loop through each analysis type
                for (const [analysisType, focusText] of Object.entries(analysisTypes)) {
                    this.logger.debug(`Analyzing cluster with template ${template.id} and type: ${analysisType}`);
                    
                    // Analyze with this template and analysis type
                    const analysis = await this.analyzeClusterWithTemplate(
                        cluster, 
                        template, 
                        analysisType
                    );
                    
                    if (analysis) {
                        const insight = this.buildInsightFromTemplateAnalysis(
                            cluster, 
                            template, 
                            analysis,
                            analysisType
                        );
                        insights.push(insight);
                    }
                }
            }
            
            this.logger.info(`Generated ${insights.length} insights from ${templates.length} templates`);
            return insights;

        } catch (error) {
            this.logger.error('Failed to generate cluster insights:', error);
            return null;
        }
    }

    async selectClusterTemplate(cluster) {
        try {
            // Query for cluster analysis templates
            const result = await this.db.query(`
                SELECT * FROM insight_templates_v2
                WHERE template_category = 'cluster_analysis'
                  AND is_active = true
                ORDER BY id
            `);
            
            const templates = result.rows;
            
            if (templates.length === 0) {
                return null;
            }
            
            // Analyze cluster characteristics
            const memoryTypes = [...new Set(cluster.memories.map(m => m.memory_type))];
            const hasDecisions = memoryTypes.includes('decision');
            const hasBugs = memoryTypes.includes('bug');
            const hasCode = memoryTypes.includes('code');
            const hasWorkflow = memoryTypes.includes('process') || memoryTypes.includes('workflow');
            
            // Check content for specific patterns
            const combinedContent = cluster.memories.map(m => m.content).join(' ').toLowerCase();
            const hasSecurity = combinedContent.includes('security') || 
                               combinedContent.includes('vulnerability') ||
                               combinedContent.includes('authentication');
            const hasEvolution = cluster.memories.length > 5 && 
                               (cluster.timeSpan?.days || 0) > 7;
            
            // Score each template based on relevance
            const templateScores = templates.map(template => {
                let score = 0;
                
                switch (template.template_name) {
                    case 'security_insights_cluster':
                        if (hasSecurity) score += 10;
                        if (hasBugs) score += 3;
                        break;
                    case 'root_cause_cluster_analysis':
                        if (hasBugs) score += 10;
                        if (hasCode) score += 3;
                        break;
                    case 'decision_impact_cluster':
                        if (hasDecisions) score += 10;
                        score += Math.min(cluster.memories.length / 5, 3);
                        break;
                    case 'technical_evolution_cluster':
                        if (hasCode) score += 5;
                        if (hasEvolution) score += 8;
                        break;
                    case 'knowledge_synthesis_cluster':
                        if (cluster.memories.length > 10) score += 5;
                        if (memoryTypes.length > 2) score += 3;
                        break;
                    case 'workflow_optimization_cluster':
                        if (hasWorkflow) score += 10;
                        break;
                    case 'cross_memory_patterns':
                        // Default template, always has some relevance
                        score += 2;
                        score += Math.min(cluster.memories.length / 10, 3);
                        break;
                }
                
                return { template, score };
            });
            
            // Select template with highest score
            templateScores.sort((a, b) => b.score - a.score);
            return templateScores[0].score > 0 ? templateScores[0].template : null;
            
        } catch (error) {
            this.logger.error('Failed to select cluster template:', error);
            return null;
        }
    }

    async analyzeClusterWithTemplate(cluster, template, analysisType = null) {
        try {
            // Build cluster content with full details
            const clusterContent = cluster.memories.map((m, i) => {
                const date = new Date(m.created_at).toLocaleDateString();
                const tags = m.smart_tags?.join(', ') || 'no tags';
                return `Memory ${i + 1} (${m.memory_type}, ${date}, tags: ${tags}):\n${m.content}`;
            }).join('\n\n---\n\n');
            
            // Calculate metadata
            const memoryTypes = [...new Set(cluster.memories.map(m => m.memory_type))];
            const timeSpan = this.calculateTimeSpan(cluster.memories);
            const commonThemes = this.extractCommonThemes(cluster.memories);
            
            // Build comprehensive variable map
            const variables = {
                // Basic counts
                memory_count: cluster.memories.length,
                decision_count: cluster.memories.filter(m => m.memory_type === 'decision').length,
                related_count: cluster.memories.filter(m => m.memory_type !== 'decision').length,
                
                // Time information
                time_span: `${timeSpan.days} days (${new Date(timeSpan.start).toLocaleDateString()} to ${new Date(timeSpan.end).toLocaleDateString()})`,
                
                // Content analysis
                common_themes: commonThemes.join(', ') || 'none identified',
                memory_types: memoryTypes.join(', '),
                smart_tags: cluster.commonTags?.join(', ') || 'none',
                topics: commonThemes.join(', ') || 'various',
                
                // Project information
                project_name: cluster.memories[0]?.project_name || 'Unknown',
                projects: [...new Set(cluster.memories.map(m => m.project_name).filter(Boolean))].join(', ') || 'Unknown',
                
                // Severity for security templates
                severity_levels: this.extractSeverityLevels(cluster.memories),
                
                // The actual content
                cluster_content: clusterContent,
                
                // Analysis type
                analysis_type: analysisType || 'general'
            };
            
            // Replace all variables in template
            let prompt = template.template_content;
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`{${key}}`, 'g');
                prompt = prompt.replace(regex, String(value));
            }
            
            // Verify no unreplaced variables remain
            const unreplaced = prompt.match(/{[^}]+}/g);
            if (unreplaced) {
                this.logger.warn('Unreplaced template variables:', unreplaced);
            }
            
            // Call LLM with the populated template - temperature fixed at 0.1
            const response = await this.llmService.generateAnalysis(prompt, {
                temperature: 0.1,  // Fixed at 0.1 as requested
                maxTokens: template.processing_config?.max_tokens || 1500
            });
            
            // Parse response
            let analysis;
            try {
                analysis = JSON.parse(response.content);
            } catch (parseError) {
                this.logger.error('Failed to parse template response:', parseError);
                this.logger.debug('Raw response:', response.content);
                return null;
            }
            
            // Add computed fields
            analysis.cluster_size = cluster.memories.length;
            analysis.time_span = timeSpan;
            analysis.common_themes = commonThemes;
            analysis.template_used = template.template_name;
            
            return analysis;

        } catch (error) {
            this.logger.error('Template-based cluster analysis failed:', error);
            return null;
        }
    }

    buildInsightFromTemplateAnalysis(cluster, template, analysis, analysisType = null) {
        // Build insight structure based on template response
        const insight = {
            insight_type: InsightTypes.CROSS_MEMORY_PATTERN,
            insight_category: 'cluster_analysis',
            insight_subcategory: analysisType || template.template_name,  // Use analysis type as subcategory
            title: analysis.title || this.generateTitle(analysisType || template.template_name, analysis),
            summary: analysis.summary || this.generateSummary(analysisType || template.template_name, analysis, cluster),
            detailed_content: analysis,
            source_type: 'memory_cluster',
            source_ids: cluster.memories.map(m => m.id),
            detection_method: this.getDetectionMethod(),
            detection_metadata: {
                cluster_id: cluster.id,
                cluster_type: cluster.type,
                clustering_method: 'similarity_grouping',
                template_used: template.template_name,
                template_id: template.id,
                template_category: template.template_category,
                analysis_type: analysisType  // Add analysis type tracking
            },
            confidence_score: analysis.confidence || 0.8,
            recommendations: this.extractRecommendations(analysis),
            patterns: this.extractPatterns(analysis),
            evidence: analysis.evidence || [],
            tags: [...this.generateTags(cluster, template, analysis), analysisType].filter(Boolean)
        };
        
        // Add action items if present
        if (analysis.action_items || analysis.actionItems) {
            insight.action_items = analysis.action_items || analysis.actionItems;
        }
        
        return insight;
    }

    generateTitle(analysisType, analysis) {
        // Generate title based on analysis type
        switch (analysisType) {
            case 'technical_evolution':
                return `Technical Evolution: ${analysis.key_learnings || 'Multiple Approaches'}`;
            case 'root_cause':
                return `Root Cause Analysis: ${analysis.insights?.[0]?.insight || 'Multiple Issues'}`;
            case 'decision_impact':
                return `Decision Impact: ${analysis.insights?.[0]?.insight || 'Multiple Decisions'}`;
            case 'knowledge_synthesis':
                return `Knowledge Synthesis: ${analysis.key_learnings || 'Multiple Topics'}`;
            case 'workflow_optimization':
                return `Workflow Optimization: ${analysis.insights?.[0]?.insight || 'Process Improvements'}`;
            case 'security_patterns':
                return `Security Patterns: ${analysis.insights?.[0]?.insight || 'Security Analysis'}`;
            case 'cross_patterns':
                return `Cross-Pattern Analysis: ${analysis.key_patterns?.[0]?.pattern || 'Multiple Patterns'}`;
            default:
                return `${analysisType}: Cluster Analysis`;
        }
    }

    generateSummary(analysisType, analysis, cluster) {
        const count = cluster.memories.length;
        const days = cluster.timeSpan?.days || 0;
        
        switch (analysisType) {
            case 'technical_evolution':
                return `Analyzed technical evolution across ${count} memories over ${days} days. ${analysis.key_patterns?.length || 0} patterns identified.`;
            case 'root_cause':
                return `Performed root cause analysis on ${count} memories, identifying ${analysis.insights?.length || 0} key insights.`;
            case 'decision_impact':
                return `Analyzed decision impact across ${count} memories over ${days} days.`;
            case 'knowledge_synthesis':
                return `Synthesized knowledge from ${count} memories spanning ${days} days.`;
            case 'workflow_optimization':
                return `Analyzed workflow patterns across ${count} memories to identify optimizations.`;
            case 'security_patterns':
                return `Analyzed security patterns in ${count} memories, identifying ${analysis.insights?.length || 0} security insights.`;
            case 'cross_patterns':
                return `Identified ${analysis.key_patterns?.length || 0} cross-cutting patterns across ${count} memories.`;
            default:
                return `Analyzed cluster of ${count} memories over ${days} days using ${analysisType} analysis.`;
        }
    }

    extractRecommendations(analysis) {
        const recommendations = [];
        
        // Direct recommendations
        if (analysis.recommendations) {
            analysis.recommendations.forEach(rec => {
                recommendations.push({
                    text: rec,
                    priority: 'medium',
                    type: 'action'
                });
            });
        }
        
        // Hindsight recommendations (decision template)
        if (analysis.hindsight_recommendations) {
            analysis.hindsight_recommendations.forEach(rec => {
                recommendations.push({
                    text: rec,
                    priority: 'high',
                    type: 'improvement'
                });
            });
        }
        
        // Preventive measures (root cause template)
        if (analysis.preventive_measures) {
            analysis.preventive_measures.forEach(measure => {
                recommendations.push({
                    text: `Implement: ${measure}`,
                    priority: 'high',
                    type: 'preventive'
                });
            });
        }
        
        return recommendations;
    }

    extractPatterns(analysis) {
        const patterns = [];
        
        // Recurring patterns
        if (analysis.recurring_patterns) {
            analysis.recurring_patterns.forEach(p => {
                patterns.push({
                    type: 'recurring',
                    name: p.pattern,
                    frequency: p.frequency,
                    impact: p.impact,
                    confidence: analysis.confidence || 0.8
                });
            });
        }
        
        // Evolution patterns
        if (analysis.evolution_timeline) {
            patterns.push({
                type: 'evolution',
                name: 'Technical Evolution',
                stages: analysis.evolution_timeline.length,
                timeline: analysis.evolution_timeline,
                confidence: analysis.confidence || 0.8
            });
        }
        
        // Root cause patterns
        if (analysis.common_root_causes) {
            analysis.common_root_causes.forEach(cause => {
                patterns.push({
                    type: 'root_cause',
                    name: cause,
                    frequency: analysis.issues_analyzed?.filter(i => i.root_cause === cause).length || 1,
                    confidence: analysis.confidence || 0.8
                });
            });
        }
        
        // Workflow patterns
        if (analysis.workflow_bottlenecks) {
            analysis.workflow_bottlenecks.forEach(b => {
                patterns.push({
                    type: 'bottleneck',
                    name: b.bottleneck,
                    impact: b.impact,
                    solution: b.solution,
                    confidence: analysis.confidence || 0.8
                });
            });
        }
        
        return patterns;
    }

    generateTags(cluster, template, analysis) {
        const tags = new Set();
        
        // Base tags
        tags.add(`cluster:${cluster.type}`);
        tags.add(`template:${template.template_name}`);
        
        // Common tags from cluster
        if (cluster.commonTags) {
            cluster.commonTags.forEach(tag => tags.add(tag));
        }
        
        // Analysis-specific tags
        if (analysis.tags) {
            analysis.tags.forEach(tag => tags.add(tag));
        }
        
        // Template-specific tags
        if (template.tags) {
            template.tags.forEach(tag => tags.add(tag));
        }
        
        // Add tags based on findings
        if (analysis.vulnerabilities_found?.length > 0) {
            tags.add('has-vulnerabilities');
        }
        if (analysis.evolution_timeline?.length > 3) {
            tags.add('complex-evolution');
        }
        if (analysis.common_root_causes?.length > 0) {
            tags.add('root-cause-identified');
        }
        
        return Array.from(tags);
    }

    extractSeverityLevels(memories) {
        const severities = new Set();
        const severityKeywords = {
            critical: ['critical', 'severe', 'emergency', 'urgent'],
            high: ['high', 'important', 'major'],
            medium: ['medium', 'moderate', 'normal'],
            low: ['low', 'minor', 'trivial']
        };
        
        memories.forEach(memory => {
            const content = memory.content.toLowerCase();
            for (const [level, keywords] of Object.entries(severityKeywords)) {
                if (keywords.some(keyword => content.includes(keyword))) {
                    severities.add(level);
                }
            }
        });
        
        return Array.from(severities).join(', ') || 'various';
    }

    async generateDefaultClusterInsight(cluster) {
        // Fallback to basic analysis when no template is available
        try {
            const analysis = await this.analyzeClusterWithLLM(cluster);
            
            if (!analysis) {
                // Ultimate fallback
                const commonThemes = this.extractCommonThemes(cluster.memories);
                
                return {
                    insight_type: InsightTypes.CLUSTER,
                    insight_category: 'pattern',
                    insight_subcategory: cluster.type,
                    title: `Pattern in ${cluster.type} memories`,
                    summary: `Identified pattern across ${cluster.memories.length} ${cluster.type} memories`,
                    detailed_content: {
                        cluster_size: cluster.memories.length,
                        memory_type: cluster.type,
                        common_themes: commonThemes,
                        time_span: this.calculateTimeSpan(cluster.memories)
                    },
                    source_type: 'cluster',
                    source_ids: cluster.memories.map(m => m.id),
                    detection_method: this.getDetectionMethod(),
                    confidence_score: Math.min(0.5 + (cluster.memories.length * 0.1), 0.9),
                    tags: [`cluster:${cluster.type}`, ...commonThemes.map(t => `theme:${t}`)]
                };
            }
            
            // Use LLM analysis
            return {
                insight_type: InsightTypes.CLUSTER,
                insight_category: analysis.category || 'pattern',
                insight_subcategory: cluster.type,
                title: analysis.title,
                summary: analysis.summary,
                detailed_content: {
                    cluster_size: cluster.memories.length,
                    memory_type: cluster.type,
                    pattern: analysis.pattern,
                    root_cause: analysis.rootCause,
                    evolution: analysis.evolution,
                    time_span: cluster.timeSpan || this.calculateTimeSpan(cluster.memories),
                    common_tags: cluster.commonTags || []
                },
                source_type: 'cluster',
                source_ids: cluster.memories.map(m => m.id),
                detection_method: this.getDetectionMethod(),
                detection_metadata: {
                    cluster_id: cluster.id,
                    llm_analysis: true
                },
                confidence_score: analysis.confidence || 0.8,
                recommendations: analysis.recommendations || [],
                action_items: analysis.actionItems || [],
                evidence: analysis.evidence || [],
                tags: [
                    `cluster:${cluster.type}`,
                    ...(analysis.tags || []),
                    ...(cluster.commonTags || [])
                ]
            };
        } catch (error) {
            this.logger.error('Default cluster insight generation failed:', error);
            return null;
        }
    }

    async analyzeClusterWithLLM(cluster) {
        // Fallback LLM analysis without template
        try {
            const memorySummaries = cluster.memories.map((m, i) => 
                `Memory ${i + 1} (${new Date(m.created_at).toLocaleDateString()}): ${m.summary || m.content.substring(0, 200)}...`
            ).join('\n\n');

            const prompt = `Analyze this cluster of ${cluster.memories.length} related ${cluster.type} memories and identify patterns, root causes, and insights.

Memory Type: ${cluster.type}
Time Span: ${cluster.timeSpan?.days || 0} days
Common Tags: ${cluster.commonTags?.join(', ') || 'none'}

Memories:
${memorySummaries}

Provide a JSON response with:
{
  "title": "Brief, specific title for the pattern/insight",
  "summary": "2-3 sentence summary of the key finding",
  "pattern": "Description of the pattern observed across these memories",
  "rootCause": "Potential root cause or common factor (if applicable)",
  "evolution": "How this issue/pattern evolved over time (if applicable)",
  "category": "cross_memory_pattern|recurring_issue|evolution|systematic_problem",
  "confidence": 0.0-1.0,
  "recommendations": ["actionable recommendation 1", "..."],
  "actionItems": ["specific action 1", "..."],
  "evidence": ["specific example from memories", "..."],
  "tags": ["relevant", "tags"]
}`;

            const response = await this.llmService.generateAnalysis(prompt, {
                temperature: 0.3,
                maxTokens: 1000
            });

            const analysis = JSON.parse(response.content);
            return analysis;

        } catch (error) {
            this.logger.error('LLM cluster analysis failed:', error);
            return null;
        }
    }

    extractCommonThemes(memories) {
        // Enhanced theme extraction
        const themes = [];
        const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'some', 'any', 'few', 'many', 'much', 'most', 'other', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once']);
        
        // Extract meaningful words
        const contentWords = memories
            .map(m => m.content.toLowerCase().split(/\W+/))
            .flat()
            .filter(word => word.length > 3 && !stopWords.has(word));
        
        // Count word frequency
        const wordCount = contentWords.reduce((count, word) => {
            count[word] = (count[word] || 0) + 1;
            return count;
        }, {});
        
        // Find common words (appear in at least 30% of memories)
        const threshold = Math.max(2, memories.length * 0.3);
        const commonWords = Object.entries(wordCount)
            .filter(([word, count]) => count >= threshold)
            .sort((a, b) => b[1] - a[1])
            .map(([word]) => word);
        
        // Also extract from smart tags
        const tagThemes = memories
            .flatMap(m => m.smart_tags || [])
            .reduce((count, tag) => {
                count[tag] = (count[tag] || 0) + 1;
                return count;
            }, {});
        
        const commonTags = Object.entries(tagThemes)
            .filter(([tag, count]) => count >= threshold)
            .map(([tag]) => tag);
        
        // Combine and deduplicate
        return [...new Set([...commonWords.slice(0, 5), ...commonTags])];
    }

    calculateTimeSpan(memories) {
        if (memories.length === 0) {
            return { start: new Date(), end: new Date(), days: 0 };
        }
        
        const dates = memories.map(m => new Date(m.created_at));
        const min = new Date(Math.min(...dates));
        const max = new Date(Math.max(...dates));
        const days = Math.ceil((max - min) / (1000 * 60 * 60 * 24));
        
        return {
            start: min.toISOString(),
            end: max.toISOString(),
            days
        };
    }
}

export default ClusteringProcessorV2;