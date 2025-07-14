/**
 * Bug Analyzer Processor
 * Analyzes bug reports and identifies patterns
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, DetectionMethods } from '../constants/insight-constants.js';

export class BugAnalyzerProcessor extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'BugAnalyzerProcessor';
    }

    getDetectionMethod() {
        return DetectionMethods.BUG_ANALYSIS;
    }

    async process(memory, options = {}) {
        if (memory.memory_type !== 'bug') {
            return [];
        }

        const insights = [];
        
        try {
            // Analyze bug severity and impact
            const bugAnalysis = await this.analyzeBug(memory);
            if (bugAnalysis) insights.push(bugAnalysis);

            // Check for bug patterns
            const patterns = await this.checkBugPatterns(memory);
            insights.push(...patterns);

            return insights;

        } catch (error) {
            this.logger.error('Bug analysis failed:', error);
            return insights;
        }
    }

    async analyzeBug(memory) {
        const analysis = this.extractBugInfo(memory.content);
        
        return {
            insight_type: InsightTypes.BUG,
            insight_category: 'debugging',
            insight_subcategory: analysis.category,
            title: `Bug Analysis: ${analysis.title}`,
            summary: analysis.summary,
            detailed_content: {
                severity: analysis.severity,
                impact: analysis.impact,
                symptoms: analysis.symptoms,
                potential_causes: analysis.potentialCauses
            },
            source_type: 'memory',
            source_ids: [memory.id],
            detection_method: this.getDetectionMethod(),
            confidence_score: 0.8,
            recommendations: this.generateBugRecommendations(analysis),
            action_items: this.generateActionItems(analysis),
            tags: ['bug', `severity:${analysis.severity}`, `category:${analysis.category}`]
        };
    }

    async checkBugPatterns(memory) {
        const insights = [];
        
        // Check against known bug patterns
        const patterns = await this.getKnownBugPatterns();
        
        for (const pattern of patterns) {
            if (this.matchesBugPattern(memory.content, pattern)) {
                insights.push({
                    insight_type: InsightTypes.BUG_PATTERN,
                    insight_category: 'debugging',
                    insight_subcategory: 'recurring_issue',
                    title: `Recurring Bug Pattern: ${pattern.name}`,
                    summary: `This bug matches a known pattern: ${pattern.description}`,
                    detailed_content: {
                        pattern: pattern,
                        previous_occurrences: pattern.occurrences
                    },
                    source_type: 'memory',
                    source_ids: [memory.id],
                    detection_method: this.getDetectionMethod(),
                    confidence_score: 0.7,
                    recommendations: [{
                        text: pattern.solution,
                        priority: 'high',
                        type: 'bug_fix'
                    }],
                    tags: ['bug-pattern', pattern.name]
                });
            }
        }

        return insights;
    }

    extractBugInfo(content) {
        const info = {
            title: 'Unknown Bug',
            summary: content.substring(0, 200),
            severity: 'medium',
            category: 'general',
            impact: 'unknown',
            symptoms: [],
            potentialCauses: []
        };

        // Extract severity
        if (/critical|severe|blocking/i.test(content)) {
            info.severity = 'critical';
        } else if (/high|major/i.test(content)) {
            info.severity = 'high';
        } else if (/low|minor/i.test(content)) {
            info.severity = 'low';
        }

        // Extract category
        if (/performance|slow|lag/i.test(content)) {
            info.category = 'performance';
        } else if (/security|vulnerability|exploit/i.test(content)) {
            info.category = 'security';
        } else if (/ui|display|visual/i.test(content)) {
            info.category = 'ui';
        } else if (/data|database|corruption/i.test(content)) {
            info.category = 'data';
        }

        // Extract symptoms
        const symptomPatterns = [
            /crash(?:es|ing|ed)?/gi,
            /error\s+(?:message|code)?\s*:?\s*([^.\n]+)/gi,
            /fail(?:s|ing|ed|ure)?/gi,
            /not\s+work(?:ing)?/gi
        ];

        for (const pattern of symptomPatterns) {
            const matches = content.match(pattern) || [];
            info.symptoms.push(...matches);
        }

        return info;
    }

    async getKnownBugPatterns() {
        // In production, this would query a database of known patterns
        return [
            {
                name: 'null_reference',
                description: 'Null reference exception',
                pattern: /null\s*(?:reference|pointer)|cannot\s+read\s+property.*of\s+(?:null|undefined)/i,
                occurrences: 5,
                solution: 'Add null checks before accessing properties'
            },
            {
                name: 'memory_leak',
                description: 'Memory leak pattern',
                pattern: /memory\s+leak|out\s+of\s+memory|heap\s+size/i,
                occurrences: 3,
                solution: 'Check for unreleased resources and circular references'
            }
        ];
    }

    matchesBugPattern(content, pattern) {
        return pattern.pattern.test(content);
    }

    generateBugRecommendations(analysis) {
        const recommendations = [];

        if (analysis.severity === 'critical') {
            recommendations.push({
                text: 'Prioritize fixing this bug immediately',
                priority: 'critical',
                type: 'process'
            });
        }

        if (analysis.category === 'security') {
            recommendations.push({
                text: 'Conduct security audit and patch immediately',
                priority: 'critical',
                type: 'security'
            });
        }

        if (analysis.symptoms.length > 3) {
            recommendations.push({
                text: 'Consider root cause analysis - multiple symptoms suggest deeper issue',
                priority: 'high',
                type: 'investigation'
            });
        }

        return recommendations;
    }

    generateActionItems(analysis) {
        return [
            {
                text: `Investigate ${analysis.category} bug: ${analysis.title}`,
                priority: analysis.severity,
                type: 'investigation'
            },
            {
                text: 'Document reproduction steps',
                priority: 'medium',
                type: 'documentation'
            }
        ];
    }
}

export default BugAnalyzerProcessor;