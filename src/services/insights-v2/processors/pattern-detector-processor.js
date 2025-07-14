/**
 * Pattern Detector Processor
 * Detects patterns in code and architecture
 */

import { BaseProcessor } from './base-processor.js';
import { InsightTypes, DetectionMethods } from '../constants/insight-constants.js';

export class PatternDetectorProcessor extends BaseProcessor {
    constructor(dependencies) {
        super(dependencies);
        this.name = 'PatternDetectorProcessor';
    }

    getDetectionMethod() {
        return DetectionMethods.PATTERN_MATCHING;
    }

    async process(memory, options = {}) {
        // Skip if not code-related
        if (!['code', 'architecture', 'refactor'].includes(memory.memory_type)) {
            return [];
        }

        const insights = [];
        
        try {
            // Detect patterns in memory content
            const patterns = await this.detectPatterns(memory);
            
            // Create insights for detected patterns
            for (const pattern of patterns) {
                insights.push({
                    insight_type: InsightTypes.PATTERN,
                    insight_category: 'architectural',
                    insight_subcategory: pattern.category,
                    title: `${pattern.name} Pattern Detected`,
                    summary: `Detected ${pattern.name} pattern in ${memory.memory_type}`,
                    detailed_content: {
                        pattern: pattern,
                        evidence: pattern.evidence
                    },
                    source_type: 'memory',
                    source_ids: [memory.id],
                    detection_method: this.getDetectionMethod(),
                    confidence_score: pattern.confidence || 0.7,
                    patterns: [pattern],
                    tags: [`pattern:${pattern.name}`, `category:${pattern.category}`]
                });
            }

            return insights;

        } catch (error) {
            this.logger.error('Pattern detection failed:', error);
            return insights;
        }
    }

    async detectPatterns(memory) {
        const patterns = [];
        const content = memory.content.toLowerCase();

        // Simple pattern detection (would be more sophisticated in production)
        const patternMatchers = [
            {
                name: 'Singleton',
                category: 'creational',
                regex: /getInstance|singleton|private\s+constructor/i,
                confidence: 0.8
            },
            {
                name: 'Factory',
                category: 'creational',
                regex: /factory|create[A-Z]\w+|build[A-Z]\w+/i,
                confidence: 0.7
            },
            {
                name: 'Observer',
                category: 'behavioral',
                regex: /subscribe|unsubscribe|notify|observer|listener/i,
                confidence: 0.7
            },
            {
                name: 'Repository',
                category: 'architectural',
                regex: /repository|findBy|save|delete|update.*entity/i,
                confidence: 0.8
            }
        ];

        for (const matcher of patternMatchers) {
            if (matcher.regex.test(content)) {
                patterns.push({
                    name: matcher.name,
                    category: matcher.category,
                    signature: `${matcher.category}_${matcher.name.toLowerCase()}`,
                    confidence: matcher.confidence,
                    evidence: [`Detected keywords matching ${matcher.name} pattern`]
                });
            }
        }

        return patterns;
    }
}

export default PatternDetectorProcessor;