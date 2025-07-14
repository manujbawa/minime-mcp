/**
 * Memory Type Detector Service
 * Detects memory type based on content analysis
 * Follows single responsibility principle
 */

export class MemoryTypeDetector {
    constructor(logger) {
        this.logger = logger;
        
        // Type detection patterns
        this.patterns = {
            code: {
                patterns: [
                    /function\s+\w+|const\s+\w+\s*=|class\s+\w+|import\s+.+from/,
                    /```[\w]*\n[\s\S]*?\n```/,
                    /def\s+\w+|return\s+|if\s*\(|for\s*\(/
                ],
                weight: 1.0
            },
            bug: {
                patterns: [
                    /\b(bug|error|exception|crash|failure|broken|issue)\b/i,
                    /\b(fix|fixed|fixing|resolved|solve|patch)\b/i,
                    /stack\s*trace|error\s*message|exception.*thrown/i
                ],
                weight: 0.9
            },
            decision: {
                patterns: [
                    /\b(decided|chose|selected|picked|went with)\b/i,
                    /\b(architecture|strategy|approach|solution|design)\b/i,
                    /\b(because|reasoning|rationale|pros.*cons)\b/i
                ],
                weight: 0.8
            },
            rule: {
                patterns: [
                    /\b(always|never|must|should|shall)\b/i,
                    /\b(policy|standard|guideline|constraint|requirement)\b/i,
                    /\b(enforce|ensure|guarantee|maintain)\b/i
                ],
                weight: 0.8
            },
            progress: {
                patterns: [
                    /\b(completed|finished|done|achieved|milestone)\b/i,
                    /\b(progress|version|release|sprint)\b/i,
                    /\b(delivered|shipped|deployed|launched)\b/i
                ],
                weight: 0.7
            },
            project_brief: {
                patterns: [
                    /\b(project|overview|summary|description)\b/i,
                    /\b(requirements|specifications|scope|objectives)\b/i,
                    /\b(architecture|system|design|plan)\b/i
                ],
                weight: 0.6,
                minLength: 500
            },
            tech_reference: {
                patterns: [
                    /\b(documentation|guide|tutorial|reference)\b/i,
                    /\b(how\s+to|manual|instructions|setup)\b/i,
                    /\b(api|sdk|library|framework)\s+\w+/i
                ],
                weight: 0.7
            },
            task: {
                patterns: [
                    /\b(todo|task|need to|should|must do)\b/i,
                    /\b(implement|create|add|update|refactor)\b/i,
                    /\[[\s\-x]\]|•\s*\w+|\d+\.\s*\w+/
                ],
                weight: 0.6
            }
        };
    }

    /**
     * Detect memory type from content
     */
    detectType(content, explicitType = null) {
        // If explicit type is provided and valid, use it
        if (explicitType && this.isValidType(explicitType)) {
            return explicitType;
        }

        const contentLower = content.toLowerCase();
        const scores = {};

        // Calculate scores for each type
        for (const [type, config] of Object.entries(this.patterns)) {
            scores[type] = this.calculateTypeScore(content, contentLower, config);
        }

        // Special handling for project briefs
        if (content.length > 500 && scores.project_brief > 0) {
            scores.project_brief += 0.2;
        }

        // Find the type with highest score
        let bestType = 'note';
        let bestScore = 0;

        for (const [type, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestType = type;
            }
        }

        // Default threshold
        if (bestScore < 0.3) {
            bestType = 'note';
        }

        this.logger.debug('Memory type detected', { 
            bestType, 
            bestScore, 
            contentLength: content.length 
        });

        return bestType;
    }

    /**
     * Calculate score for a specific type
     */
    calculateTypeScore(content, contentLower, config) {
        let matchCount = 0;
        
        for (const pattern of config.patterns) {
            if (pattern.test(content)) {
                matchCount++;
            }
        }

        // Normalize by number of patterns
        const normalizedScore = matchCount / config.patterns.length;
        
        // Apply weight
        return normalizedScore * config.weight;
    }

    /**
     * Check if a type is valid
     */
    isValidType(type) {
        const validTypes = [
            'code', 'bug', 'decision', 'rule', 'progress',
            'project_brief', 'tech_reference', 'task', 'note', 'general'
        ];
        return validTypes.includes(type);
    }

    /**
     * Get type description for display
     */
    getTypeDescription(type) {
        const descriptions = {
            code: 'Code snippet or implementation',
            bug: 'Bug report or fix',
            decision: 'Architectural or design decision',
            rule: 'Coding standard or constraint',
            progress: 'Progress update or milestone',
            project_brief: 'Project overview or requirements',
            tech_reference: 'Technical documentation or guide',
            task: 'Task or todo item',
            note: 'General note or observation',
            general: 'General memory'
        };
        
        return descriptions[type] || 'Unknown type';
    }

    /**
     * Get type emoji for display
     */
    getTypeEmoji(type) {
        const emojis = {
            code: '💻',
            bug: '🐛',
            decision: '🎯',
            rule: '📋',
            progress: '📈',
            project_brief: '📄',
            tech_reference: '📚',
            task: '✅',
            note: '📝',
            general: '💭'
        };
        
        return emojis[type] || '📌';
    }
}

export default MemoryTypeDetector;