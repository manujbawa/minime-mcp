/**
 * Sequential Thinking Service for MiniMe-MCP
 * Handles complex reasoning processes with branching and revision capabilities
 */

import { v4 as uuidv4 } from 'uuid';

export class SequentialThinkingService {
    constructor(logger, databaseService, embeddingService) {
        this.logger = logger;
        this.db = databaseService;
        this.embeddingService = embeddingService;
        
        // Configuration for thinking processes
        this.config = {
            maxThoughts: 50,          // Maximum thoughts per sequence
            confidenceThreshold: 0.7,  // Threshold for high-confidence thoughts
            branchingEnabled: true,    // Allow branching in reasoning
            autoSummarize: true,       // Auto-generate summaries
            thoughtTypes: [
                'reasoning', 'conclusion', 'question', 'hypothesis', 
                'observation', 'assumption'
            ]
        };
    }

    /**
     * Start a new thinking sequence
     */
    async startThinkingSequence(projectId, sessionId, sequenceName, options = {}) {
        try {
            const {
                description = null,
                goal = null,
                initialThought = null,
                estimatedThoughts = 10,
                metadata = {}
            } = options;

            // Create the thinking sequence
            const sequence = await this.db.createThinkingSequence(
                projectId, 
                sessionId, 
                sequenceName, 
                { description, goal, metadata }
            );

            this.logger.info(`Started thinking sequence: ${sequenceName}`, {
                sequenceId: sequence.id,
                projectId: projectId,
                goal: goal
            });

            // Add initial thought if provided
            if (initialThought) {
                await this.addThought(sequence.id, initialThought, {
                    thoughtType: 'reasoning',
                    thoughtNumber: 1,
                    totalThoughts: estimatedThoughts
                });
            }

            return sequence;
        } catch (error) {
            this.logger.error('Failed to start thinking sequence:', error);
            throw error;
        }
    }

    /**
     * Add a thought to an existing sequence
     */
    async addThought(sequenceId, content, options = {}) {
        try {
            const {
                thoughtType = 'reasoning',
                thoughtNumber = null,
                totalThoughts = null,
                confidenceLevel = 0.5,
                nextThoughtNeeded = true,
                branchFromThoughtId = null,
                branchId = null,
                metadata = {}
            } = options;

            // Get current sequence state
            const sequence = await this.db.getThinkingSequence(sequenceId);
            if (!sequence) {
                throw new Error(`Thinking sequence ${sequenceId} not found`);
            }

            if (sequence.is_complete) {
                throw new Error('Cannot add thoughts to completed sequence');
            }

            // Determine thought number if not provided
            let actualThoughtNumber = thoughtNumber;
            let actualTotalThoughts = totalThoughts;

            if (!actualThoughtNumber) {
                const maxThought = Math.max(0, ...sequence.thoughts.map(t => t.thought_number));
                actualThoughtNumber = maxThought + 1;
            }

            if (!actualTotalThoughts) {
                actualTotalThoughts = Math.max(
                    actualThoughtNumber + 5, // At least 5 more thoughts
                    ...sequence.thoughts.map(t => t.total_thoughts)
                );
            }

            // Check if we're exceeding maximum thoughts
            if (actualThoughtNumber > this.config.maxThoughts) {
                throw new Error(`Exceeded maximum thoughts limit (${this.config.maxThoughts})`);
            }

            // Create the thought
            const thought = await this.db.addThought(
                sequenceId,
                content,
                actualThoughtNumber,
                actualTotalThoughts,
                {
                    thoughtType,
                    confidenceLevel,
                    nextThoughtNeeded,
                    branchFromThoughtId,
                    branchId,
                    metadata
                }
            );

            this.logger.debug(`Added thought ${actualThoughtNumber}/${actualTotalThoughts}`, {
                sequenceId: sequenceId,
                thoughtId: thought.id,
                thoughtType: thoughtType
            });

            // Auto-complete sequence if no more thoughts needed or reached total
            if (!nextThoughtNeeded || actualThoughtNumber >= actualTotalThoughts) {
                await this.autoCompleteSequence(sequenceId);
            }

            return thought;
        } catch (error) {
            this.logger.error('Failed to add thought:', error);
            throw error;
        }
    }

    /**
     * Create a branch in the thinking process
     */
    async createBranch(sequenceId, branchFromThoughtId, branchName, options = {}) {
        try {
            const {
                description = null,
                rationale = null,
                initialThought = null
            } = options;

            const branchId = uuidv4();

            // Create the branch record
            const branch = await this.db.query(`
                INSERT INTO thinking_branches 
                (sequence_id, branch_id, branch_name, branch_from_thought_id, description, rationale)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, sequence_id, branch_id, branch_name, branch_from_thought_id, 
                          description, rationale, is_active, is_merged, created_at
            `, [sequenceId, branchId, branchName, branchFromThoughtId, description, rationale]);

            this.logger.info(`Created thinking branch: ${branchName}`, {
                sequenceId: sequenceId,
                branchId: branchId,
                branchFromThoughtId: branchFromThoughtId
            });

            // Add initial thought to the branch if provided
            if (initialThought) {
                await this.addThought(sequenceId, initialThought, {
                    branchFromThoughtId: branchFromThoughtId,
                    branchId: branchId,
                    thoughtNumber: 1,
                    thoughtType: 'reasoning'
                });
            }

            return branch.rows[0];
        } catch (error) {
            this.logger.error('Failed to create branch:', error);
            throw error;
        }
    }

    /**
     * Revise an existing thought
     */
    async reviseThought(originalThoughtId, newContent, options = {}) {
        try {
            const {
                revisionReason = null,
                confidenceLevel = 0.5,
                metadata = {}
            } = options;

            // Get the original thought
            const originalResult = await this.db.query(`
                SELECT * FROM thoughts WHERE id = $1
            `, [originalThoughtId]);

            if (originalResult.rows.length === 0) {
                throw new Error(`Original thought ${originalThoughtId} not found`);
            }

            const originalThought = originalResult.rows[0];

            // Create revision metadata
            const revisionMetadata = {
                ...metadata,
                revision_reason: revisionReason,
                original_thought_id: originalThoughtId,
                original_content: originalThought.content,
                revised_at: new Date().toISOString()
            };

            // Add the revised thought
            const revisedThought = await this.db.addThought(
                originalThought.sequence_id,
                newContent,
                originalThought.thought_number, // Same number as original
                originalThought.total_thoughts,
                {
                    thoughtType: originalThought.thought_type,
                    confidenceLevel,
                    nextThoughtNeeded: originalThought.next_thought_needed,
                    isRevision: true,
                    revisesThoughtId: originalThoughtId,
                    branchId: originalThought.branch_id,
                    metadata: revisionMetadata
                }
            );

            this.logger.info(`Revised thought ${originalThoughtId}`, {
                sequenceId: originalThought.sequence_id,
                newThoughtId: revisedThought.id,
                reason: revisionReason
            });

            return revisedThought;
        } catch (error) {
            this.logger.error('Failed to revise thought:', error);
            throw error;
        }
    }

    /**
     * Get the complete thinking sequence with all thoughts and branches
     */
    async getThinkingSequence(sequenceId, options = {}) {
        try {
            const {
                includeBranches = true,
                includeRevisions = true,
                format = 'detailed' // 'detailed', 'summary', 'linear'
            } = options;

            const sequence = await this.db.getThinkingSequence(sequenceId, includeBranches);
            
            if (!sequence) {
                return null;
            }

            // Process thoughts based on format
            if (format === 'linear') {
                // Return only main branch thoughts in order
                sequence.thoughts = sequence.thoughts
                    .filter(t => !t.branch_id || t.branch_id === 'main')
                    .filter(t => includeRevisions || !t.is_revision)
                    .sort((a, b) => a.thought_number - b.thought_number);
            } else if (format === 'summary') {
                // Return just the key thoughts and conclusion
                sequence.thoughts = sequence.thoughts
                    .filter(t => t.thought_type === 'conclusion' || t.confidence_level >= this.config.confidenceThreshold)
                    .sort((a, b) => a.thought_number - b.thought_number);
            }

            // Add thinking progress metadata
            sequence.progress = this.calculateProgress(sequence);

            return sequence;
        } catch (error) {
            this.logger.error('Failed to get thinking sequence:', error);
            throw error;
        }
    }

    /**
     * Complete a thinking sequence
     */
    async completeThinkingSequence(sequenceId, options = {}) {
        try {
            const {
                completionSummary = null,
                autoGenerate = true
            } = options;

            const sequence = await this.db.getThinkingSequence(sequenceId, true);
            if (!sequence) {
                throw new Error(`Thinking sequence ${sequenceId} not found`);
            }

            let summary = completionSummary;

            // Auto-generate summary if requested and not provided
            if (autoGenerate && !summary) {
                summary = await this.generateSequenceSummary(sequence);
            }

            // Complete the sequence
            const completedSequence = await this.db.completeThinkingSequence(sequenceId, summary);

            this.logger.info(`Completed thinking sequence: ${sequence.sequence_name}`, {
                sequenceId: sequenceId,
                totalThoughts: sequence.thoughts.length,
                summary: summary?.substring(0, 100)
            });

            return completedSequence;
        } catch (error) {
            this.logger.error('Failed to complete thinking sequence:', error);
            throw error;
        }
    }

    /**
     * Auto-complete sequence when criteria are met
     */
    async autoCompleteSequence(sequenceId) {
        try {
            const sequence = await this.db.getThinkingSequence(sequenceId);
            if (!sequence || sequence.is_complete) {
                return;
            }

            const mainThoughts = sequence.thoughts.filter(t => !t.branch_id || t.branch_id === 'main');
            const latestThought = mainThoughts[mainThoughts.length - 1];

            // Auto-complete if latest thought indicates completion or reached thought limit
            if (latestThought && 
                (!latestThought.next_thought_needed || 
                 latestThought.thought_number >= latestThought.total_thoughts ||
                 latestThought.thought_type === 'conclusion')) {
                
                await this.completeThinkingSequence(sequenceId, {
                    completionSummary: `Auto-completed after ${latestThought.thought_number} thoughts`,
                    autoGenerate: true
                });
            }
        } catch (error) {
            this.logger.error('Auto-completion failed:', error);
        }
    }

    /**
     * Generate a summary of the thinking sequence
     */
    async generateSequenceSummary(sequence) {
        try {
            const mainThoughts = sequence.thoughts
                .filter(t => !t.branch_id || t.branch_id === 'main')
                .sort((a, b) => a.thought_number - b.thought_number);

            if (mainThoughts.length === 0) {
                return 'Empty thinking sequence';
            }

            // Extract key elements
            const goal = sequence.goal || 'General reasoning';
            const thoughtCount = mainThoughts.length;
            const conclusions = mainThoughts.filter(t => t.thought_type === 'conclusion');
            const highConfidenceThoughts = mainThoughts.filter(t => t.confidence_level >= 0.7);

            // Build summary
            let summary = `Thinking sequence "${sequence.sequence_name}" completed with ${thoughtCount} thoughts.\n\n`;
            
            if (goal) {
                summary += `Goal: ${goal}\n\n`;
            }

            if (conclusions.length > 0) {
                summary += `Key Conclusions:\n`;
                conclusions.forEach((thought, i) => {
                    summary += `${i + 1}. ${thought.content.substring(0, 200)}${thought.content.length > 200 ? '...' : ''}\n`;
                });
                summary += '\n';
            }

            if (highConfidenceThoughts.length > 0) {
                summary += `High-Confidence Insights (${highConfidenceThoughts.length}):\n`;
                highConfidenceThoughts.slice(0, 3).forEach((thought, i) => {
                    summary += `${i + 1}. ${thought.content.substring(0, 150)}${thought.content.length > 150 ? '...' : ''}\n`;
                });
            }

            return summary;
        } catch (error) {
            this.logger.error('Failed to generate sequence summary:', error);
            return `Thinking sequence completed with ${sequence.thoughts.length} thoughts`;
        }
    }

    /**
     * Calculate progress metrics for a thinking sequence
     */
    calculateProgress(sequence) {
        const mainThoughts = sequence.thoughts.filter(t => !t.branch_id || t.branch_id === 'main');
        
        if (mainThoughts.length === 0) {
            return {
                completed: 0,
                total: 1,
                percentage: 0,
                currentPhase: 'starting'
            };
        }

        const latestThought = Math.max(...mainThoughts.map(t => t.thought_number));
        const estimatedTotal = Math.max(...mainThoughts.map(t => t.total_thoughts));
        const percentage = Math.min(100, Math.round((latestThought / estimatedTotal) * 100));

        let currentPhase = 'reasoning';
        if (percentage >= 90) currentPhase = 'concluding';
        else if (percentage >= 70) currentPhase = 'synthesizing';
        else if (percentage >= 30) currentPhase = 'analyzing';
        else currentPhase = 'exploring';

        return {
            completed: latestThought,
            total: estimatedTotal,
            percentage: percentage,
            currentPhase: currentPhase,
            branchCount: sequence.branches?.length || 0,
            revisionCount: sequence.thoughts.filter(t => t.is_revision).length
        };
    }

    /**
     * Search thinking sequences
     */
    async searchThinkingSequences(query, options = {}) {
        try {
            const {
                projectId = null,
                includeCompleted = true,
                limit = 20
            } = options;

            // Generate query embedding for semantic search
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);

            // Search in sequence descriptions and thoughts
            let searchQuery = `
                SELECT DISTINCT
                    ts.id, ts.sequence_name, ts.description, ts.goal, 
                    ts.is_complete, ts.created_at, ts.updated_at,
                    p.name as project_name,
                    s.session_name,
                    COUNT(t.id) as thought_count,
                    MAX(t.thought_number) as latest_thought
                FROM thinking_sequences ts
                JOIN projects p ON ts.project_id = p.id
                LEFT JOIN sessions s ON ts.session_id = s.id
                LEFT JOIN thoughts t ON ts.id = t.sequence_id
                WHERE (
                    ts.sequence_name ILIKE $1 OR 
                    ts.description ILIKE $1 OR 
                    ts.goal ILIKE $1 OR
                    t.content ILIKE $1
                )
            `;

            const params = [`%${query}%`];
            let paramCount = 1;

            if (projectId) {
                paramCount++;
                searchQuery += ` AND ts.project_id = $${paramCount}`;
                params.push(projectId);
            }

            if (!includeCompleted) {
                searchQuery += ` AND ts.is_complete = false`;
            }

            searchQuery += `
                GROUP BY ts.id, ts.sequence_name, ts.description, ts.goal, 
                         ts.is_complete, ts.created_at, ts.updated_at, p.name, s.session_name
                ORDER BY ts.updated_at DESC
                LIMIT $${paramCount + 1}
            `;
            params.push(limit);

            const result = await this.db.query(searchQuery, params);
            return result.rows;
        } catch (error) {
            this.logger.error('Failed to search thinking sequences:', error);
            throw error;
        }
    }

    /**
     * Get thinking sequence analytics
     */
    async getThinkingAnalytics(projectId = null, timeframe = '30 days') {
        try {
            let query = `
                SELECT 
                    COUNT(DISTINCT ts.id) as total_sequences,
                    COUNT(DISTINCT ts.id) FILTER (WHERE ts.is_complete = true) as completed_sequences,
                    COUNT(t.id) as total_thoughts,
                    AVG(t.confidence_level) as avg_confidence,
                    COUNT(DISTINCT t.branch_id) FILTER (WHERE t.branch_id IS NOT NULL) as total_branches,
                    COUNT(t.id) FILTER (WHERE t.is_revision = true) as total_revisions,
                    AVG(CASE 
                        WHEN ts.is_complete = true 
                        THEN EXTRACT(EPOCH FROM (ts.updated_at - ts.created_at))/3600 
                    END) as avg_completion_hours
                FROM thinking_sequences ts
                LEFT JOIN thoughts t ON ts.id = t.sequence_id
                WHERE ts.created_at > NOW() - INTERVAL '${timeframe}'
            `;

            const params = [];
            let paramCount = 0;

            if (projectId) {
                paramCount++;
                query += ` AND ts.project_id = $${paramCount}`;
                params.push(projectId);
            }

            const result = await this.db.query(query, params);
            const analytics = result.rows[0];

            // Convert string numbers to integers/floats
            analytics.total_sequences = parseInt(analytics.total_sequences) || 0;
            analytics.completed_sequences = parseInt(analytics.completed_sequences) || 0;
            analytics.total_thoughts = parseInt(analytics.total_thoughts) || 0;
            analytics.avg_confidence = parseFloat(analytics.avg_confidence) || 0;
            analytics.total_branches = parseInt(analytics.total_branches) || 0;
            analytics.total_revisions = parseInt(analytics.total_revisions) || 0;
            analytics.avg_completion_hours = parseFloat(analytics.avg_completion_hours) || 0;

            // Calculate completion rate
            analytics.completion_rate = analytics.total_sequences > 0 
                ? (analytics.completed_sequences / analytics.total_sequences) * 100 
                : 0;

            return analytics;
        } catch (error) {
            this.logger.error('Failed to get thinking analytics:', error);
            throw error;
        }
    }

    /**
     * Export thinking sequence to different formats
     */
    async exportThinkingSequence(sequenceId, format = 'markdown') {
        try {
            const sequence = await this.getThinkingSequence(sequenceId, { 
                includeBranches: true, 
                includeRevisions: true,
                format: 'detailed'
            });

            if (!sequence) {
                throw new Error(`Thinking sequence ${sequenceId} not found`);
            }

            switch (format.toLowerCase()) {
                case 'markdown':
                    return this.exportToMarkdown(sequence);
                case 'json':
                    return JSON.stringify(sequence, null, 2);
                case 'text':
                    return this.exportToText(sequence);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            this.logger.error('Failed to export thinking sequence:', error);
            throw error;
        }
    }

    /**
     * Export sequence to Markdown format
     */
    exportToMarkdown(sequence) {
        let markdown = `# ${sequence.sequence_name}\n\n`;
        
        if (sequence.description) {
            markdown += `**Description:** ${sequence.description}\n\n`;
        }
        
        if (sequence.goal) {
            markdown += `**Goal:** ${sequence.goal}\n\n`;
        }

        markdown += `**Status:** ${sequence.is_complete ? 'Completed' : 'In Progress'}\n`;
        markdown += `**Created:** ${new Date(sequence.created_at).toLocaleString()}\n\n`;

        // Main thoughts
        const mainThoughts = sequence.thoughts
            .filter(t => !t.branch_id || t.branch_id === 'main')
            .sort((a, b) => a.thought_number - b.thought_number);

        markdown += `## Thinking Process\n\n`;
        
        mainThoughts.forEach(thought => {
            markdown += `### Thought ${thought.thought_number}\n`;
            markdown += `**Type:** ${thought.thought_type} | **Confidence:** ${(thought.confidence_level * 100).toFixed(0)}%\n\n`;
            markdown += `${thought.content}\n\n`;
            
            if (thought.is_revision) {
                markdown += `*This is a revision of an earlier thought.*\n\n`;
            }
        });

        // Branches
        if (sequence.branches && sequence.branches.length > 0) {
            markdown += `## Alternative Branches\n\n`;
            
            sequence.branches.forEach(branch => {
                markdown += `### ${branch.branch_name}\n`;
                if (branch.description) {
                    markdown += `${branch.description}\n\n`;
                }
                
                const branchThoughts = sequence.thoughts
                    .filter(t => t.branch_id === branch.branch_id)
                    .sort((a, b) => a.thought_number - b.thought_number);
                
                branchThoughts.forEach(thought => {
                    markdown += `- **Thought ${thought.thought_number}:** ${thought.content}\n`;
                });
                markdown += '\n';
            });
        }

        if (sequence.completion_summary) {
            markdown += `## Summary\n\n${sequence.completion_summary}\n`;
        }

        return markdown;
    }

    /**
     * Export sequence to plain text format
     */
    exportToText(sequence) {
        let text = `${sequence.sequence_name}\n${'='.repeat(sequence.sequence_name.length)}\n\n`;
        
        if (sequence.goal) {
            text += `Goal: ${sequence.goal}\n\n`;
        }

        const mainThoughts = sequence.thoughts
            .filter(t => !t.branch_id || t.branch_id === 'main')
            .sort((a, b) => a.thought_number - b.thought_number);

        text += `Thinking Process:\n\n`;
        
        mainThoughts.forEach(thought => {
            text += `${thought.thought_number}. [${thought.thought_type.toUpperCase()}] ${thought.content}\n\n`;
        });

        if (sequence.completion_summary) {
            text += `Summary:\n${sequence.completion_summary}\n`;
        }

        return text;
    }
}

export default SequentialThinkingService;