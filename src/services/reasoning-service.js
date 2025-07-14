/**
 * Reasoning Service
 * Handles sequential thinking/reasoning processes using thinking_sequences and thoughts tables
 */

class ReasoningService {
    constructor(logger, db, memoryService) {
        this.logger = logger;
        this.db = db;
        this.memoryService = memoryService;
    }

    /**
     * Start a new reasoning sequence
     */
    async startReasoning({ goal, projectName }) {
        // Get or create project
        let project = await this.db.getProjectByName(projectName);
        if (!project) {
            project = await this.db.createProject({
                name: projectName,
                description: `Auto-created project: ${projectName}`
            });
        }

        // Get or create session
        const sessionName = `reasoning-${new Date().toISOString().split('T')[0]}`;
        let session = await this.db.getSessionByName(project.id, sessionName);
        if (!session) {
            session = await this.db.createSession({
                project_id: project.id,
                session_name: sessionName,
                sessionType: 'thinking'
            });
        }

        // Create thinking sequence
        const sequence = await this.db.createThinkingSequence(
            project.id, 
            session.id, 
            `Reasoning: ${goal}`,
            {
                description: goal,
                goal: goal
            }
        );

        return {
            sequenceId: String(sequence.id),
            goal: goal
        };
    }

    /**
     * Add a thought to an existing sequence
     */
    async addThought({ sequenceId, thought, thoughtType = 'observation', branchName = null }) {
        // Check if this is a branch-related thought type
        const branchTypes = ['alternative', 'branch', 'option', 'variant', 'fork'];
        const isBranchThought = branchTypes.includes(thoughtType.toLowerCase());
        
        // Validate thought type - now includes 'general' as a fallback
        const validTypes = ['reasoning', 'conclusion', 'question', 'hypothesis', 'observation', 'assumption', 'general'];
        if (!validTypes.includes(thoughtType)) {
            // Map common mistakes to valid types
            if (thoughtType === 'answer') {
                thoughtType = 'reasoning';
                this.logger.info(`Mapped invalid thought type 'answer' to 'reasoning'`);
            } else if (isBranchThought) {
                // For branch-related types, use 'hypothesis' as the thought type
                // but mark it as a branch thought for special handling
                thoughtType = 'hypothesis';
                this.logger.info(`Detected branch thought type - will create a new branch`);
            } else {
                // Default to 'general' for any unrecognized type
                this.logger.info(`Unknown thought type '${thoughtType}' - defaulting to 'general'`);
                thoughtType = 'general';
            }
        }
        // Get the existing sequence with thought count
        const sequenceQuery = `
            SELECT s.id, s.project_id, s.session_id, s.sequence_name, 
                   s.description, s.goal, s.is_complete, s.completion_summary,
                   s.metadata, s.created_at, s.updated_at,
                   COUNT(t.id) as thought_count 
            FROM thinking_sequences s
            LEFT JOIN thoughts t ON t.sequence_id = s.id
            WHERE s.id = $1
            GROUP BY s.id, s.project_id, s.session_id, s.sequence_name, 
                     s.description, s.goal, s.is_complete, s.completion_summary,
                     s.metadata, s.created_at, s.updated_at`;
        
        const result = await this.db.query(sequenceQuery, [sequenceId]);

        if (result.rows.length === 0) {
            throw new Error('Reasoning sequence not found');
        }

        const sequence = result.rows[0];

        if (sequence.is_complete) {
            throw new Error(`SEQUENCE_COMPLETED: Reasoning sequence #${sequenceId} is already completed and cannot accept new thoughts. Please start a new sequence with start_thinking() if you need to continue reasoning.`);
        }

        // Calculate thought number
        const thoughtNumber = parseInt(sequence.thought_count) + 1;

        // Check if this is a conclusion
        const isConclusion = thoughtType === 'conclusion' || 
                           thought.toLowerCase().includes('therefore') ||
                           thought.toLowerCase().includes('decision:');

        // Handle branch creation if this is a branch thought
        let branchId = null;
        let branchFromThoughtId = null;
        
        if (isBranchThought) {
            // Get the last thought in the sequence to branch from
            const lastThoughtQuery = `
                SELECT id FROM thoughts 
                WHERE sequence_id = $1 
                ORDER BY thought_number DESC 
                LIMIT 1`;
            const lastThoughtResult = await this.db.query(lastThoughtQuery, [sequenceId]);
            
            if (lastThoughtResult.rows.length > 0) {
                branchFromThoughtId = lastThoughtResult.rows[0].id;
                
                // Generate a branch ID
                branchId = `branch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const branchNameFinal = branchName || `Alternative ${thoughtNumber}`;
                
                // Create the branch in thinking_branches table
                await this.db.query(`
                    INSERT INTO thinking_branches 
                    (sequence_id, branch_id, branch_name, branch_from_thought_id, description, rationale)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                    sequenceId, 
                    branchId, 
                    branchNameFinal,
                    branchFromThoughtId,
                    `Alternative approach: ${thought.substring(0, 100)}...`,
                    thought
                ]);
                
                this.logger.info(`Created new thinking branch: ${branchId}`);
            }
        }

        // Add the thought with branch information if applicable
        await this.db.addThought(
            sequenceId,
            thought,
            thoughtNumber,
            thoughtNumber, // totalThoughts will be updated as we go
            {
                thoughtType: thoughtType,
                confidenceLevel: isConclusion ? 0.9 : 0.7,
                nextThoughtNeeded: !isConclusion,
                branchFromThoughtId: branchFromThoughtId,
                branchId: branchId
            }
        );

        // If concluded, mark sequence as complete
        if (isConclusion) {
            await this.db.query(`
                UPDATE thinking_sequences 
                SET is_complete = true,
                    completion_summary = $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [thought, sequenceId]);

            // Also store as a decision memory
            const projectQuery = 'SELECT p.name FROM projects p JOIN thinking_sequences ts ON ts.project_id = p.id WHERE ts.id = $1';
            const projectResult = await this.db.query(projectQuery, [sequenceId]);
            const projectName = projectResult.rows[0]?.name;
            
            this.logger.info(`Looking up project for sequence ${sequenceId}, found: ${projectName || 'none'}`);
            if (!projectName) {
                this.logger.error(`Failed to find project name for thinking sequence ${sequenceId} - SQL result:`, projectResult.rows);
            }

            if (projectName) {
                this.logger.info(`Storing conclusion as decision memory for project: ${projectName}`);
            } else {
                this.logger.error(`Failed to find project name for thinking sequence ${sequenceId} - decision memory will not be created`);
            }

            if (projectName) {
                // Get all thoughts for the complete reasoning chain
                const allThoughts = await this.db.query(`
                    SELECT t.thought_number, t.thought_type, t.content, t.branch_id,
                           tb.branch_name 
                    FROM thoughts t
                    LEFT JOIN thinking_branches tb ON t.branch_id = tb.branch_id
                    WHERE t.sequence_id = $1 
                    ORDER BY t.thought_number
                `, [sequenceId]);
                
                // Build comprehensive decision content
                let decisionContent = `# Decision: ${thought}\n\n`;
                decisionContent += `## Goal\n${sequence.goal}\n\n`;
                decisionContent += `## Reasoning Process\n`;
                
                // Include all thoughts with their types and branches
                for (const t of allThoughts.rows) {
                    const branchInfo = t.branch_name ? ` [Branch: ${t.branch_name}]` : '';
                    decisionContent += `${t.thought_number}. [${t.thought_type}]${branchInfo} ${t.content}\n`;
                }
                
                // Store the full reasoning chain - let existing enrichment handle summary
                const memoryResult = await this.memoryService.createMemory({
                    content: decisionContent,
                    projectName: projectName,
                    memoryType: 'decision',
                    sessionName: 'decisions',
                    thinkingSequenceId: parseInt(sequenceId),
                    importanceScore: 0.8, // Decisions from reasoning are important
                    metadata: {
                        goal: sequence.goal,
                        thoughtCount: allThoughts.rows.length,
                        sequenceId: sequenceId
                    }
                });
                
                this.logger.info(`Successfully created decision memory ${memoryResult.id} for thinking sequence ${sequenceId}`);
                
                // Queue thinking sequence for async insight processing (non-blocking)
                this.queueThinkingSequenceForInsights(sequenceId, projectName).catch(error => {
                    this.logger.error('Failed to queue thinking sequence for insights:', error);
                });
            }
        }

        // Get all thoughts for the sequence to return full content
        const thoughtsQuery = `
            SELECT t.thought_number, t.thought_type, t.content, t.branch_id,
                   tb.branch_name 
            FROM thoughts t
            LEFT JOIN thinking_branches tb ON t.branch_id = tb.branch_id
            WHERE t.sequence_id = $1 
            ORDER BY t.thought_number`;
        
        const thoughtsResult = await this.db.query(thoughtsQuery, [sequenceId]);
        
        // Build the full content
        let fullContent = `# ${sequence.sequence_name}\n\n## Goal\n${sequence.goal}\n\n## Thoughts\n`;
        for (const t of thoughtsResult.rows) {
            const branchIndicator = t.branch_id ? ` 🌿 [Branch: ${t.branch_name}]` : '';
            fullContent += `\n${t.thought_number}. [${t.thought_type}]${branchIndicator} ${t.content}`;
        }

        return {
            sequenceId,
            content: fullContent,
            isComplete: isConclusion,
            branchCreated: isBranchThought
        };
    }

    /**
     * Queue thinking sequence for async insight processing
     * This is non-blocking to avoid delaying API responses
     */
    async queueThinkingSequenceForInsights(sequenceId, projectName) {
        try {
            // Get all thoughts for the sequence
            const thoughtsQuery = `
                SELECT t.*, ts.goal, ts.sequence_name, ts.completion_summary
                FROM thoughts t
                JOIN thinking_sequences ts ON t.sequence_id = ts.id
                WHERE t.sequence_id = $1
                ORDER BY t.thought_number`;
            
            const result = await this.db.query(thoughtsQuery, [sequenceId]);
            
            if (result.rows.length === 0) {
                return;
            }
            
            const sequence = {
                id: sequenceId,
                goal: result.rows[0].goal,
                name: result.rows[0].sequence_name,
                summary: result.rows[0].completion_summary,
                thoughts: result.rows
            };
            
            // Queue for processing using the unified insights queue
            if (this.db.query) {
                await this.db.query(`
                    INSERT INTO insight_processing_queue_v2 
                    (task_type, source_type, source_ids, task_priority, task_payload, project_id)
                    VALUES ('thinking_sequence_insights', 'thinking_sequence', $1, 5, $2, 
                        (SELECT id FROM projects WHERE name = $3))
                `, [
                    [parseInt(sequenceId)],
                    JSON.stringify({
                        sequence: sequence,
                        projectName: projectName,
                        thoughtCount: result.rows.length,
                        processingType: 'thinking_summary'
                    }),
                    projectName
                ]);
                
                this.logger.info(`Queued thinking sequence ${sequenceId} for insight processing`);
            }
        } catch (error) {
            // Log but don't throw - this is best effort
            this.logger.error('Error queueing thinking sequence:', error);
        }
    }
}

export default ReasoningService;