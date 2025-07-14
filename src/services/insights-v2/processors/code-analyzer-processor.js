/**
 * Code Analyzer Processor
 * Analyzes code-related memories for quality and patterns
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, DetectionMethods } from '../constants/insight-constants.js';

export class CodeAnalyzerProcessor extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'CodeAnalyzerProcessor';
    }

    getDetectionMethod() {
        return DetectionMethods.CODE_ANALYSIS;
    }

    async process(memory, options = {}) {
        if (memory.memory_type !== 'code') {
            return [];
        }

        const insights = [];
        
        try {
            // Analyze code quality
            const qualityInsight = await this.analyzeCodeQuality(memory);
            if (qualityInsight) insights.push(qualityInsight);

            // Detect code smells
            const smells = await this.detectCodeSmells(memory);
            insights.push(...smells);

            return insights;

        } catch (error) {
            this.logger.error('Code analysis failed:', error);
            return insights;
        }
    }

    async analyzeCodeQuality(memory) {
        const metrics = this.calculateCodeMetrics(memory.content);
        
        if (metrics.issues.length === 0) {
            return null; // No quality issues
        }

        return {
            insight_type: InsightTypes.CODE_QUALITY,
            insight_category: 'quality',
            insight_subcategory: 'code_metrics',
            title: 'Code Quality Analysis',
            summary: `Found ${metrics.issues.length} potential quality issues`,
            detailed_content: {
                metrics,
                issues: metrics.issues
            },
            source_type: 'memory',
            source_ids: [memory.id],
            detection_method: this.getDetectionMethod(),
            confidence_score: 0.7,
            recommendations: metrics.issues.map(issue => ({
                text: issue.recommendation,
                priority: issue.severity === 'high' ? 'high' : 'medium',
                type: 'code_quality'
            })),
            tags: ['code-quality', ...metrics.issues.map(i => `issue:${i.type}`)]
        };
    }

    async detectCodeSmells(memory) {
        const insights = [];
        const content = memory.content;

        // Simple code smell detection
        const smells = [
            {
                pattern: /function\s+\w+\s*\([^)]{50,}\)/g,
                type: 'long_parameter_list',
                message: 'Function with too many parameters',
                recommendation: 'Consider using an options object'
            },
            {
                pattern: /{\s*(?:[^{}]*{[^{}]*}[^{}]*)*[^{}]{500,}}/g,
                type: 'long_method',
                message: 'Method is too long',
                recommendation: 'Consider breaking into smaller functions'
            },
            {
                pattern: /if\s*\([^)]+\)\s*{\s*if\s*\([^)]+\)\s*{\s*if/g,
                type: 'nested_conditionals',
                message: 'Deeply nested conditionals',
                recommendation: 'Consider early returns or extracting logic'
            }
        ];

        for (const smell of smells) {
            if (smell.pattern.test(content)) {
                insights.push({
                    insight_type: InsightTypes.CODE_SMELL,
                    insight_category: 'quality',
                    insight_subcategory: smell.type,
                    title: smell.message,
                    summary: smell.message,
                    detailed_content: {
                        type: smell.type,
                        pattern: smell.pattern.toString()
                    },
                    source_type: 'memory',
                    source_ids: [memory.id],
                    detection_method: this.getDetectionMethod(),
                    confidence_score: 0.6,
                    recommendations: [{
                        text: smell.recommendation,
                        priority: 'medium',
                        type: 'refactoring'
                    }],
                    tags: ['code-smell', smell.type]
                });
            }
        }

        return insights;
    }

    calculateCodeMetrics(content) {
        const lines = content.split('\n');
        const issues = [];

        // Line count
        if (lines.length > 300) {
            issues.push({
                type: 'file_too_long',
                severity: 'medium',
                recommendation: 'Consider splitting this file'
            });
        }

        // Complexity indicators
        const complexityIndicators = {
            conditionals: (content.match(/if\s*\(|switch\s*\(|\?.*:/g) || []).length,
            loops: (content.match(/for\s*\(|while\s*\(|\.forEach|\.map/g) || []).length,
            functions: (content.match(/function\s+\w+|=>\s*{|async\s+\w+/g) || []).length
        };

        if (complexityIndicators.conditionals > 10) {
            issues.push({
                type: 'high_cyclomatic_complexity',
                severity: 'high',
                recommendation: 'Reduce conditional complexity'
            });
        }

        return {
            lineCount: lines.length,
            complexity: complexityIndicators,
            issues
        };
    }
}

export default CodeAnalyzerProcessor;