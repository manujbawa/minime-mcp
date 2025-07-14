/**
 * Decision Analyzer Processor
 * Analyzes decision-making patterns and outcomes
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, DetectionMethods } from '../constants/insight-constants.js';

export class DecisionAnalyzerProcessor extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'DecisionAnalyzerProcessor';
    }

    getDetectionMethod() {
        return DetectionMethods.DECISION_ANALYSIS;
    }

    async process(memory, options = {}) {
        if (memory.memory_type !== 'decision') {
            return [];
        }

        const insights = [];
        
        try {
            // Analyze the decision
            const decisionInsight = await this.analyzeDecision(memory);
            if (decisionInsight) insights.push(decisionInsight);

            // Check for decision patterns
            const patterns = await this.checkDecisionPatterns(memory);
            insights.push(...patterns);

            return insights;

        } catch (error) {
            this.logger.error('Decision analysis failed:', error);
            return insights;
        }
    }

    async analyzeDecision(memory) {
        const analysis = await this.extractDecisionInfo(memory);
        
        // Calculate confidence based on how much information was extracted
        const infoCompleteness = [
            analysis.factors.length > 0,
            analysis.alternatives.length > 0,
            analysis.rationale !== '',
            analysis.evidence.length > 0,
            analysis.stakeholders.length > 0,
            analysis.topic !== 'Decision Analysis'
        ];
        const confidenceScore = 0.5 + (infoCompleteness.filter(Boolean).length * 0.08);
        
        return {
            insight_type: InsightTypes.DECISION,
            insight_category: 'decision_making',
            insight_subcategory: analysis.type,
            title: `Decision Analysis: ${analysis.topic}`,
            summary: analysis.summary,
            detailed_content: {
                decision_type: analysis.type,
                factors: analysis.factors,
                alternatives: analysis.alternatives,
                rationale: analysis.rationale,
                impact: analysis.impact,
                stakeholders: analysis.stakeholders,
                risks: analysis.risks,
                success_criteria: analysis.success_criteria,
                has_thinking_sequence: !!memory.thinking_sequence_id
            },
            source_type: 'memory',
            source_ids: [memory.id],
            detection_method: this.getDetectionMethod(),
            detection_metadata: {
                used_llm: true,
                thinking_sequence_id: memory.thinking_sequence_id
            },
            confidence_score: confidenceScore,
            recommendations: this.generateDecisionRecommendations(analysis),
            evidence: analysis.evidence,
            tags: ['decision', `type:${analysis.type}`, `impact:${analysis.impact}`]
        };
    }

    async checkDecisionPatterns(memory) {
        const insights = [];
        
        // Look for decision-making patterns
        const patterns = [
            {
                name: 'technical_debt_tradeoff',
                pattern: /technical\s+debt|quick\s+fix|temporary\s+solution|workaround/i,
                insight: 'Technical debt decision detected'
            },
            {
                name: 'architecture_choice',
                pattern: /architecture|framework|technology\s+stack|platform/i,
                insight: 'Architectural decision detected'
            },
            {
                name: 'performance_vs_features',
                pattern: /performance|optimization|features?|functionality/i,
                insight: 'Performance vs features tradeoff detected'
            }
        ];

        for (const pattern of patterns) {
            if (pattern.pattern.test(memory.content)) {
                insights.push({
                    insight_type: InsightTypes.DECISION_PATTERN,
                    insight_category: 'decision_making',
                    insight_subcategory: pattern.name,
                    title: pattern.insight,
                    summary: `Identified ${pattern.name} decision pattern`,
                    source_type: 'memory',
                    source_ids: [memory.id],
                    detection_method: this.getDetectionMethod(),
                    confidence_score: 0.6,
                    tags: ['decision-pattern', pattern.name]
                });
            }
        }

        return insights;
    }

    async extractDecisionInfo(memory) {
        // First check if this memory has a thinking_sequence_id to get full context
        let fullContext = memory.content;
        
        if (memory.thinking_sequence_id) {
            try {
                // Fetch the full thinking sequence for better analysis
                const sequenceResult = await this.db.query(`
                    SELECT ts.goal, ts.sequence_name, ts.completion_summary
                    FROM thinking_sequences ts
                    WHERE ts.id = $1
                `, [memory.thinking_sequence_id]);
                
                if (sequenceResult.rows.length > 0) {
                    const sequence = sequenceResult.rows[0];
                    fullContext = `Goal: ${sequence.goal}\n\nDecision: ${memory.content}\n\nSummary: ${sequence.completion_summary || ''}`;
                }
            } catch (error) {
                this.logger.warn('Failed to fetch thinking sequence:', error);
            }
        }

        // Use LLM to extract decision information
        try {
            const prompt = `Analyze this decision and extract key information.

Decision Content:
${fullContext}

Extract and return a JSON object with:
{
  "topic": "Brief, specific topic of the decision (not 'Unknown Decision')",
  "summary": "2-3 sentence summary of what was decided and why",
  "type": "architectural|technical|process|organizational|strategic",
  "factors": ["key factor 1", "key factor 2", ...],
  "alternatives": ["alternative option 1", "alternative option 2", ...],
  "rationale": "The main reasoning behind this decision",
  "impact": "high|medium|low",
  "stakeholders": ["affected party 1", "affected party 2", ...],
  "evidence": [
    {
      "type": "research|data|experience|constraint",
      "content": "specific evidence that supported the decision",
      "source": "where this evidence came from"
    }
  ],
  "risks": ["potential risk 1", "potential risk 2", ...],
  "success_criteria": ["how we'll know this decision was right", ...]
}

Focus on extracting concrete, specific information from the content.`;

            const response = await this.llmService.generateAnalysis(prompt, {
                temperature: 0.3,
                maxTokens: 800
            }, 'decision_analysis');

            // Try to parse the response
            let analysis;
            try {
                // Clean up the response content
                let cleanContent = response.content;
                if (cleanContent.includes('```json')) {
                    cleanContent = cleanContent.match(/```json\n?([\s\S]*?)\n?```/)?.[1] || cleanContent;
                }
                analysis = JSON.parse(cleanContent);
            } catch (parseError) {
                this.logger.warn('Failed to parse LLM response as JSON, using fallback extraction');
                // Try to extract key information from the text response
                analysis = this.extractFromText(response.content);
            }
            
            // Validate and provide defaults for missing fields
            return {
                topic: analysis.topic || this.extractTopic(memory.content),
                summary: analysis.summary || memory.content.substring(0, 200),
                type: analysis.type || 'general',
                factors: Array.isArray(analysis.factors) ? analysis.factors : [],
                alternatives: Array.isArray(analysis.alternatives) ? analysis.alternatives : [],
                rationale: analysis.rationale || this.extractRationale(memory.content),
                impact: analysis.impact || 'medium',
                stakeholders: Array.isArray(analysis.stakeholders) ? analysis.stakeholders : [],
                evidence: Array.isArray(analysis.evidence) ? analysis.evidence : [],
                risks: Array.isArray(analysis.risks) ? analysis.risks : [],
                success_criteria: Array.isArray(analysis.success_criteria) ? analysis.success_criteria : []
            };

        } catch (error) {
            this.logger.error('LLM decision extraction failed:', error);
            
            // Fallback to basic extraction
            return {
                topic: 'Decision Analysis',
                summary: memory.content.substring(0, 200),
                type: 'general',
                factors: [],
                alternatives: [],
                rationale: '',
                impact: 'medium',
                stakeholders: [],
                evidence: []
            };
        }
    }

    generateDecisionRecommendations(analysis) {
        const recommendations = [];

        // Recommend documentation
        recommendations.push({
            text: 'Document this decision in the architecture decision records (ADR)',
            priority: 'medium',
            type: 'documentation'
        });

        // Based on decision type
        if (analysis.type === 'architectural') {
            recommendations.push({
                text: 'Review this decision in 6 months to assess impact',
                priority: 'medium',
                type: 'review'
            });
        }

        // If high impact
        if (analysis.impact === 'high') {
            recommendations.push({
                text: 'Communicate this decision to all stakeholders',
                priority: 'high',
                type: 'communication'
            });
        }

        // If alternatives exist
        if (analysis.alternatives.length > 0) {
            recommendations.push({
                text: 'Keep documentation of alternatives for future reference',
                priority: 'low',
                type: 'documentation'
            });
        }

        return recommendations;
    }

    // Helper methods for fallback extraction
    extractFromText(text) {
        const result = {
            topic: 'Decision Analysis',
            summary: '',
            type: 'general',
            factors: [],
            alternatives: [],
            rationale: '',
            impact: 'medium',
            stakeholders: [],
            evidence: [],
            risks: [],
            success_criteria: []
        };

        // Try to extract key information using simple patterns
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.includes('decision') || line.includes('decided')) {
                result.summary = line.trim();
            }
            if (line.includes('because') || line.includes('reason')) {
                result.rationale = line.trim();
            }
            if (line.includes('factor') || line.includes('consideration')) {
                result.factors.push(line.trim());
            }
        }

        return result;
    }

    extractTopic(content) {
        // Extract first meaningful phrase as topic
        const firstLine = content.split('\n')[0];
        if (firstLine.length > 5 && firstLine.length < 100) {
            return firstLine.replace(/^#\s*/, '').trim();
        }
        return 'Decision Analysis';
    }

    extractRationale(content) {
        // Look for rationale indicators
        const rationaleMatch = content.match(/(?:because|reason|rationale|why)[\s:]+(.*?)(?:\n|$)/i);
        if (rationaleMatch) {
            return rationaleMatch[1].trim();
        }
        return '';
    }
}

export default DecisionAnalyzerProcessor;