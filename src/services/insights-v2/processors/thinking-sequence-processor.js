/**
 * Thinking Sequence Processor for Unified Insights V2
 * Processes completed thinking sequences to extract meta-learning insights
 */

export class ThinkingSequenceProcessor {
    constructor(logger, config = {}) {
        this.logger = logger;
        this.name = 'thinking_sequence_processor';
        this.config = {
            maxSummaryLength: 1000,
            includeAllThoughts: false,
            extractPatterns: true,
            ...config
        };
    }

    /**
     * Check if this processor can handle the given task
     */
    canProcess(taskType, payload) {
        return taskType === 'thinking_sequence_insights' && payload?.sequence;
    }

    /**
     * Process a thinking sequence to generate insights
     */
    async process(task) {
        const { sequence, projectName } = task.payload;
        const insights = [];

        try {
            // Generate main reasoning process insight
            const mainInsight = await this.generateReasoningInsight(sequence, projectName);
            if (mainInsight) {
                insights.push(mainInsight);
            }

            // Extract pattern insights if enabled
            if (this.config.extractPatterns) {
                const patternInsights = await this.extractReasoningPatterns(sequence, projectName);
                insights.push(...patternInsights);
            }

            // Generate decision quality insight
            const qualityInsight = await this.analyzeDecisionQuality(sequence, projectName);
            if (qualityInsight) {
                insights.push(qualityInsight);
            }

            return insights;
        } catch (error) {
            this.logger.error('Error processing thinking sequence:', error);
            return insights;
        }
    }

    /**
     * Generate main insight summarizing the reasoning process
     */
    async generateReasoningInsight(sequence, projectName) {
        const thoughtsByType = this.groupThoughtsByType(sequence.thoughts);
        const branchCount = new Set(sequence.thoughts.map(t => t.branch_id).filter(Boolean)).size;
        
        // Prepare thought chain for LLM summarization
        const thoughtChain = sequence.thoughts
            .map(t => `[${t.thought_type}] ${t.content}`)
            .join('\n\n');
        
        // Generate summary using LLM if available
        let summary = sequence.summary || 'Reasoning process completed';
        let keyConsiderations = [];
        let alternativesExplored = [];
        
        // Extract key information from thoughts
        keyConsiderations = this.extractKeyConsiderations(sequence.thoughts);
        alternativesExplored = this.extractAlternatives(sequence.thoughts);
        
        return {
            insight_type: 'reasoning_process',
            insight_category: 'meta_learning',
            insight_subcategory: 'decision_making',
            title: `Reasoning: ${sequence.goal}`,
            summary: this.generateSummaryText(sequence, thoughtsByType, branchCount),
            detailed_content: {
                goal: sequence.goal,
                conclusion: sequence.summary,
                thought_count: sequence.thoughts.length,
                branch_count: branchCount,
                thought_types: Object.keys(thoughtsByType).map(type => ({
                    type,
                    count: thoughtsByType[type].length
                })),
                key_considerations: keyConsiderations,
                alternatives_explored: alternativesExplored,
                reasoning_depth: this.calculateReasoningDepth(sequence.thoughts),
                confidence_progression: this.extractConfidenceProgression(sequence.thoughts)
            },
            source_type: 'thinking_sequence',
            source_ids: [sequence.id],
            detection_method: 'thinking_sequence_analysis',
            confidence_score: 0.9,
            relevance_score: 0.8,
            impact_score: this.calculateImpactScore(sequence),
            tags: this.generateTags(sequence),
            technologies: this.extractTechnologies(thoughtChain),
            patterns: this.extractPatterns(sequence.thoughts),
            evidence: this.extractEvidence(sequence.thoughts),
            recommendations: this.generateRecommendations(sequence)
        };
    }

    /**
     * Extract reasoning patterns from the sequence
     */
    async extractReasoningPatterns(sequence, projectName) {
        const patterns = [];
        
        // Pattern: Depth of analysis
        if (sequence.thoughts.length > 10) {
            patterns.push({
                insight_type: 'pattern',
                insight_category: 'reasoning',
                insight_subcategory: 'analysis_depth',
                title: 'Deep Analysis Pattern Detected',
                summary: `Thorough analysis with ${sequence.thoughts.length} thoughts for: ${sequence.goal}`,
                confidence_score: 0.8,
                source_type: 'thinking_sequence',
                source_ids: [sequence.id]
            });
        }
        
        // Pattern: Alternative exploration
        const branches = new Set(sequence.thoughts.map(t => t.branch_id).filter(Boolean));
        if (branches.size > 0) {
            patterns.push({
                insight_type: 'pattern',
                insight_category: 'reasoning',
                insight_subcategory: 'alternative_thinking',
                title: 'Alternative Exploration Pattern',
                summary: `Explored ${branches.size} alternative approaches for decision making`,
                confidence_score: 0.85,
                source_type: 'thinking_sequence',
                source_ids: [sequence.id]
            });
        }
        
        return patterns;
    }

    /**
     * Analyze decision quality based on reasoning process
     */
    async analyzeDecisionQuality(sequence, projectName) {
        const metrics = {
            thoughtCount: sequence.thoughts.length,
            questionCount: sequence.thoughts.filter(t => t.thought_type === 'question').length,
            hypothesisCount: sequence.thoughts.filter(t => t.thought_type === 'hypothesis').length,
            hasConclusion: sequence.thoughts.some(t => t.thought_type === 'conclusion'),
            averageConfidence: this.calculateAverageConfidence(sequence.thoughts)
        };
        
        const qualityScore = this.calculateQualityScore(metrics);
        
        if (qualityScore < 0.5) {
            return {
                insight_type: 'improvement',
                insight_category: 'decision_quality',
                title: 'Quick Decision - Consider More Analysis',
                summary: `Decision made with limited analysis (${metrics.thoughtCount} thoughts). Consider exploring more alternatives.`,
                confidence_score: 0.7,
                source_type: 'thinking_sequence',
                source_ids: [sequence.id],
                recommendations: [{
                    description: 'Consider adding more questions and hypotheses before concluding',
                    priority: 'medium'
                }]
            };
        }
        
        return null;
    }

    // Helper methods
    
    groupThoughtsByType(thoughts) {
        return thoughts.reduce((acc, thought) => {
            const type = thought.thought_type || 'general';
            if (!acc[type]) acc[type] = [];
            acc[type].push(thought);
            return acc;
        }, {});
    }
    
    extractKeyConsiderations(thoughts) {
        return thoughts
            .filter(t => t.thought_type === 'observation' || t.thought_type === 'reasoning')
            .slice(0, 5)
            .map(t => t.content.substring(0, 100) + '...');
    }
    
    extractAlternatives(thoughts) {
        return thoughts
            .filter(t => t.branch_id || t.thought_type === 'hypothesis')
            .map(t => ({
                content: t.content.substring(0, 100) + '...',
                branch: t.branch_id || 'main'
            }));
    }
    
    calculateReasoningDepth(thoughts) {
        const depth = thoughts.length;
        if (depth < 5) return 'shallow';
        if (depth < 10) return 'moderate';
        if (depth < 20) return 'deep';
        return 'very_deep';
    }
    
    extractConfidenceProgression(thoughts) {
        return thoughts
            .filter(t => t.confidence_level != null)
            .map(t => ({
                thought_number: t.thought_number,
                confidence: t.confidence_level
            }));
    }
    
    generateSummaryText(sequence, thoughtsByType, branchCount) {
        const parts = [`Analyzed "${sequence.goal}" through ${sequence.thoughts.length} thoughts`];
        
        if (branchCount > 0) {
            parts.push(`exploring ${branchCount} alternative approaches`);
        }
        
        const mainTypes = Object.keys(thoughtsByType)
            .filter(type => thoughtsByType[type].length > 1)
            .slice(0, 3);
        
        if (mainTypes.length > 0) {
            parts.push(`with focus on ${mainTypes.join(', ')}`);
        }
        
        parts.push(`Conclusion: ${sequence.summary || 'Decision reached'}`);
        
        return parts.join(', ') + '.';
    }
    
    calculateImpactScore(sequence) {
        // Higher impact for deeper analysis and more alternatives
        const depthScore = Math.min(sequence.thoughts.length / 20, 1) * 0.5;
        const branchScore = Math.min(
            new Set(sequence.thoughts.map(t => t.branch_id).filter(Boolean)).size / 3, 
            1
        ) * 0.3;
        const conclusionScore = sequence.summary ? 0.2 : 0.1;
        
        return depthScore + branchScore + conclusionScore;
    }
    
    generateTags(sequence) {
        const tags = ['reasoning', 'decision'];
        
        if (sequence.thoughts.length > 10) {
            tags.push('deep-analysis');
        }
        
        if (sequence.thoughts.some(t => t.branch_id)) {
            tags.push('alternatives-explored');
        }
        
        // Extract domain-specific tags from goal
        const goalWords = sequence.goal.toLowerCase().split(/\s+/);
        const domainTags = goalWords
            .filter(w => w.length > 4 && !['should', 'would', 'could', 'which'].includes(w))
            .slice(0, 3);
        
        return [...tags, ...domainTags];
    }
    
    extractTechnologies(thoughtChain) {
        // Simple technology extraction - could be enhanced with NLP
        const techPatterns = [
            /\b(react|angular|vue|next\.?js|nuxt)\b/gi,
            /\b(node|python|java|typescript|javascript)\b/gi,
            /\b(docker|kubernetes|aws|gcp|azure)\b/gi,
            /\b(postgres|mysql|mongodb|redis)\b/gi,
            /\b(rest|graphql|grpc|websocket)\b/gi
        ];
        
        const technologies = new Set();
        
        techPatterns.forEach(pattern => {
            const matches = thoughtChain.match(pattern);
            if (matches) {
                matches.forEach(match => technologies.add(match.toLowerCase()));
            }
        });
        
        return Array.from(technologies);
    }
    
    extractPatterns(thoughts) {
        const patterns = [];
        
        // Question-first pattern
        if (thoughts[0]?.thought_type === 'question') {
            patterns.push({
                pattern: 'question_first_approach',
                description: 'Started reasoning with questions'
            });
        }
        
        // Iterative refinement pattern
        const revisionCount = thoughts.filter(t => t.is_revision).length;
        if (revisionCount > 0) {
            patterns.push({
                pattern: 'iterative_refinement',
                description: `Revised thinking ${revisionCount} times`
            });
        }
        
        return patterns;
    }
    
    extractEvidence(thoughts) {
        return thoughts
            .filter(t => t.thought_type === 'observation' || t.thought_type === 'reasoning')
            .slice(0, 3)
            .map(t => ({
                description: t.content.substring(0, 150) + '...',
                type: t.thought_type,
                confidence: t.confidence_level || 0.5
            }));
    }
    
    generateRecommendations(sequence) {
        const recommendations = [];
        
        // Recommend based on thought distribution
        const thoughtsByType = this.groupThoughtsByType(sequence.thoughts);
        
        if (!thoughtsByType.question || thoughtsByType.question.length < 2) {
            recommendations.push({
                description: 'Consider asking more questions to explore the problem space',
                priority: 'medium'
            });
        }
        
        if (!thoughtsByType.hypothesis) {
            recommendations.push({
                description: 'Try forming hypotheses before jumping to conclusions',
                priority: 'low'
            });
        }
        
        return recommendations;
    }
    
    calculateAverageConfidence(thoughts) {
        const confidences = thoughts
            .map(t => t.confidence_level)
            .filter(c => c != null);
        
        if (confidences.length === 0) return 0.5;
        
        return confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    }
    
    calculateQualityScore(metrics) {
        let score = 0;
        
        // Depth score (0-0.3)
        score += Math.min(metrics.thoughtCount / 10, 1) * 0.3;
        
        // Question score (0-0.2)
        score += Math.min(metrics.questionCount / 3, 1) * 0.2;
        
        // Hypothesis score (0-0.2)
        score += Math.min(metrics.hypothesisCount / 2, 1) * 0.2;
        
        // Conclusion score (0-0.1)
        score += metrics.hasConclusion ? 0.1 : 0;
        
        // Confidence score (0-0.2)
        score += metrics.averageConfidence * 0.2;
        
        return score;
    }
}

export default ThinkingSequenceProcessor;