/**
 * Clustering Processor
 * Groups similar memories and generates cluster-based insights
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, DetectionMethods } from '../constants/insight-constants.js';

export class ClusteringProcessor extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'ClusteringProcessor';
    }

    getDetectionMethod() {
        return DetectionMethods.CLUSTERING;
    }

    async process(memory, options = {}) {
        // Clustering is typically a batch process, not for individual memories
        // This processor would be used by the queue system for batch processing
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
                
                const insight = await this.generateClusterInsight(cluster);
                if (insight) {
                    insights.push(insight);
                }
            } else {
                // Find similar memories using embeddings
                const clusters = await this.clusterMemories(memories);
                
                // Generate insights for each cluster
                for (const cluster of clusters) {
                    if (cluster.memories.length >= 3) { // Minimum cluster size
                        const insight = await this.generateClusterInsight(cluster);
                        if (insight) {
                            insights.push(insight);
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
            // Use LLM to analyze the cluster
            const analysis = await this.analyzeClusterWithLLM(cluster);
            
            if (!analysis) {
                // Fallback to basic analysis
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
            this.logger.error('Failed to generate cluster insight:', error);
            return null;
        }
    }

    async analyzeClusterWithLLM(cluster) {
        try {
            // Prepare memory summaries for analysis
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
        // Simple theme extraction - would be more sophisticated in production
        const themes = [];
        const contentWords = memories
            .map(m => m.content.toLowerCase().split(/\s+/))
            .flat()
            .filter(word => word.length > 4); // Only consider words > 4 chars
        
        // Count word frequency
        const wordCount = contentWords.reduce((count, word) => {
            count[word] = (count[word] || 0) + 1;
            return count;
        }, {});

        // Find common words (appear in at least 50% of memories)
        const threshold = memories.length * 0.5;
        for (const [word, count] of Object.entries(wordCount)) {
            if (count >= threshold) {
                themes.push(word);
            }
        }

        return themes.slice(0, 5); // Top 5 themes
    }

    calculateTimeSpan(memories) {
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

export default ClusteringProcessor;