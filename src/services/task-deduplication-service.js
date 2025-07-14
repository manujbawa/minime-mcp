/**
 * Memory Deduplication Service
 * Uses vector embeddings and LLM to identify and mark duplicate memories
 */

export class MemoryDeduplicationService {
    constructor(logger, databaseService, embeddingService, llmService) {
        this.logger = logger;
        this.db = databaseService;
        this.embeddingService = embeddingService;
        this.llmService = llmService;
    }

    /**
     * Analyze memories of any type and mark duplicates
     * Uses embeddings for similarity and LLM for semantic verification
     * Can work on specific memory types or all types
     */
    async analyzeDuplicateMemories(projectId = null, memoryType = 'task') {
        this.logger.info('Starting memory deduplication analysis', { projectId, memoryType });
        
        try {
            // Get configuration values
            const similarityThreshold = await this.getSimilarityThreshold();
            const llmConfidenceThreshold = await this.getLLMConfidenceThreshold();
            
            this.logger.info(`Using similarity threshold: ${similarityThreshold}, LLM confidence threshold: ${llmConfidenceThreshold}`);
            
            // Build query based on memory type
            let whereClause = `m.memory_type = '${memoryType}'`;
            
            // For tasks, only process pending/in_progress
            if (memoryType === 'task') {
                whereClause += ` AND ((m.content ~ '^{.*}$' AND m.content::jsonb->>'status' IN ('pending', 'in_progress'))
                                     OR m.metadata->>'status' IN ('pending', 'in_progress'))`;
            }
            
            const memoriesQuery = projectId ? 
                `SELECT m.*, p.name as project_name 
                 FROM memories m 
                 JOIN projects p ON m.project_id = p.id
                 WHERE ${whereClause}
                 AND m.project_id = $1
                 ORDER BY m.created_at DESC` :
                `SELECT m.*, p.name as project_name 
                 FROM memories m 
                 JOIN projects p ON m.project_id = p.id
                 WHERE ${whereClause}
                 ORDER BY m.created_at DESC`;
            
            const params = projectId ? [projectId] : [];
            const memoriesResult = await this.db.query(memoriesQuery, params);
            const memories = memoriesResult.rows;
            
            this.logger.info(`Found ${memories.length} ${memoryType} memories to analyze`);
            
            if (memories.length < 2) {
                return { duplicatesFound: 0, memoriesAnalyzed: memories.length };
            }

            // Get embeddings for all memories if not already present
            const memoriesWithEmbeddings = await this.ensureMemoryEmbeddings(memories);
            
            // Find potential duplicates using vector similarity
            const duplicateCandidates = await this.findDuplicateCandidates(memoriesWithEmbeddings, similarityThreshold);
            
            // Verify duplicates using LLM
            const verifiedDuplicates = await this.verifyDuplicatesWithLLM(duplicateCandidates, llmConfidenceThreshold, memoryType);
            
            // Mark duplicates in database
            await this.markDuplicateMemories(verifiedDuplicates);
            
            return {
                duplicatesFound: verifiedDuplicates.length,
                memoriesAnalyzed: memories.length,
                memoryType: memoryType,
                duplicateGroups: verifiedDuplicates
            };
            
        } catch (error) {
            this.logger.error('Error in memory deduplication analysis:', error);
            throw error;
        }
    }

    /**
     * Backwards compatibility method for tasks
     */
    async analyzeDuplicateTasks(projectId = null) {
        return await this.analyzeDuplicateMemories(projectId, 'task');
    }


    /**
     * Analyze duplicates per memory type within each project separately
     * This avoids cross-project and cross-memory-type deduplication
     */
    async analyzeDuplicatesPerProjectAndType() {
        this.logger.info('Starting comprehensive deduplication per project and memory type');
        
        // Get all projects with memories
        const projectsResult = await this.db.query(`
            SELECT DISTINCT p.id, p.name, m.memory_type, COUNT(*) as memory_count
            FROM projects p
            JOIN memories m ON p.id = m.project_id
            GROUP BY p.id, p.name, m.memory_type
            HAVING COUNT(*) > 1
            ORDER BY p.name, m.memory_type
        `);
        
        const projectMemoryTypes = projectsResult.rows;
        this.logger.info(`Found ${projectMemoryTypes.length} project-memory-type combinations with potential duplicates`);
        
        const results = {};
        let totalDuplicatesFound = 0;
        
        for (const { id: projectId, name: projectName, memory_type: memoryType, memory_count } of projectMemoryTypes) {
            try {
                this.logger.info(`Processing project "${projectName}" (${projectId}) - ${memoryType} (${memory_count} memories)`);
                
                const result = await this.analyzeDuplicateMemories(projectId, memoryType);
                
                const key = `${projectName}_${memoryType}`;
                results[key] = {
                    projectId,
                    projectName,
                    memoryType,
                    totalMemories: memory_count,
                    ...result
                };
                
                totalDuplicatesFound += result.duplicatesFound;
                this.logger.info(`${projectName}/${memoryType}: ${result.duplicatesFound} duplicates found from ${result.memoriesAnalyzed} memories`);
                
            } catch (error) {
                this.logger.error(`Error processing ${projectName}/${memoryType}:`, error);
                const key = `${projectName}_${memoryType}`;
                results[key] = { 
                    projectId,
                    projectName,
                    memoryType,
                    error: error.message 
                };
            }
        }
        
        this.logger.info(`Comprehensive deduplication complete: ${totalDuplicatesFound} total duplicates found`);
        
        return {
            totalDuplicatesFound,
            projectMemoryTypesProcessed: projectMemoryTypes.length,
            results
        };
    }

    /**
     * Ensure all memories have embeddings
     */
    async ensureMemoryEmbeddings(memories) {
        const memoriesNeedingEmbeddings = memories.filter(memory => !memory.embedding);
        
        if (memoriesNeedingEmbeddings.length > 0) {
            this.logger.info(`Generating embeddings for ${memoriesNeedingEmbeddings.length} memories`);
            
            for (const memory of memoriesNeedingEmbeddings) {
                try {
                    // Create text representation of memory for embedding
                    const memoryText = this.createMemoryTextForEmbedding(memory);
                    const embedding = await this.embeddingService.generateEmbedding(memoryText);
                    
                    // Update memory with embedding - PostgreSQL vector type expects array format
                    const vectorString = Array.isArray(embedding) ? 
                        `[${embedding.join(',')}]` : 
                        `[${JSON.parse(embedding).join(',')}]`;
                    
                    await this.db.query(
                        'UPDATE memories SET embedding = $1 WHERE id = $2',
                        [vectorString, memory.id]
                    );
                    
                    // Set memory embedding to the formatted vector string, not the raw array
                    memory.embedding = vectorString;
                } catch (error) {
                    this.logger.error(`Failed to generate embedding for memory ${memory.id}:`, error);
                }
            }
        }
        
        return memories;
    }

    /**
     * Create text representation of memory for embedding
     */
    createMemoryTextForEmbedding(memory) {
        const metadata = memory.metadata || {};
        
        // Try to extract structured data if content is JSON
        let title = '', description = memory.content;
        if (memory.content && memory.content.startsWith('{')) {
            try {
                const contentObj = JSON.parse(memory.content);
                title = contentObj.title || '';
                description = contentObj.description || memory.content;
            } catch (e) {
                // If not valid JSON, use content as-is
            }
        }
        
        // Fallback to metadata
        title = title || metadata.title || memory.content.substring(0, 100);
        const category = metadata.category || '';
        const tags = (metadata.tags || memory.tags || []).join(' ');
        
        return `${title} ${description} ${category} ${tags}`.trim();
    }


    /**
     * Find duplicate candidates using pgvector similarity search (much faster than O(n²))
     */
    async findDuplicateCandidates(tasks, similarityThreshold = 0.85) {
        const duplicateCandidates = [];
        const processedPairs = new Set();
        
        // Use pgvector for efficient similarity search instead of brute force
        this.logger.info(`Finding duplicates for ${tasks.length} memories using pgvector similarity search`);
        
        for (const memory of tasks) {
            if (!memory.embedding) continue;
            
            // Use PostgreSQL's cosine distance operator for efficient similarity search
            // Find all memories similar to this one (excluding itself)
            const memoryType = tasks[0]?.memory_type || 'task';
            let whereClause = `m.memory_type = '${memoryType}' AND m.id != $2`;
            
            // Filter by vector dimensions to avoid dimension mismatch errors
            const memoryDims = memory.embedding.length;
            whereClause += ` AND vector_dims(m.embedding) = ${memoryDims}`;
            
            // For tasks, only process pending/in_progress
            if (memoryType === 'task') {
                whereClause += ` AND ((m.content ~ '^{.*}$' AND m.content::jsonb->>'status' IN ('pending', 'in_progress'))
                                     OR m.metadata->>'status' IN ('pending', 'in_progress'))`;
            }
            
            const similarMemories = await this.db.query(`
                SELECT 
                    m.id,
                    m.content,
                    m.metadata,
                    m.created_at,
                    p.name as project_name,
                    (1 - (m.embedding <=> $1::vector)) as similarity
                FROM memories m
                JOIN projects p ON m.project_id = p.id
                WHERE ${whereClause}
                AND m.project_id = $4
                AND (1 - (m.embedding <=> $1::vector)) >= $3
                ORDER BY m.embedding <=> $1::vector ASC
                LIMIT 20
            `, [this.formatVectorForQuery(memory.embedding), memory.id, similarityThreshold, memory.project_id]);
            
            // Create candidate pairs
            for (const similarMemory of similarMemories.rows) {
                const pairKey = [memory.id, similarMemory.id].sort().join('-');
                if (processedPairs.has(pairKey)) continue;
                processedPairs.add(pairKey);
                
                duplicateCandidates.push({
                    task1: memory,
                    task2: similarMemory,
                    similarity: similarMemory.similarity,
                    pairKey
                });
            }
        }
        
        this.logger.info(`Found ${duplicateCandidates.length} potential duplicate pairs using vector similarity`);
        return duplicateCandidates;
    }


    /**
     * Verify duplicates using LLM for semantic analysis
     */
    async verifyDuplicatesWithLLM(candidates, llmConfidenceThreshold = 0.7, memoryType = 'task') {
        const verifiedDuplicates = [];
        
        for (const candidate of candidates) {
            try {
                // Extract memory metadata from content JSON if available
                const memory1Meta = this.extractMemoryMetadata(candidate.task1);
                const memory2Meta = this.extractMemoryMetadata(candidate.task2);
                
                const prompt = `Analyze these two ${memoryType} memories and determine if they are duplicates or closely related enough to be consolidated:

Memory 1 (ID: ${candidate.task1.id}):
Title: ${memory1Meta.title || 'N/A'}
Description: ${memory1Meta.description || candidate.task1.content}
Category: ${memory1Meta.category || 'N/A'}
Priority: ${JSON.stringify(memory1Meta.priority || {})}
Created: ${candidate.task1.created_at}

Memory 2 (ID: ${candidate.task2.id}):
Title: ${memory2Meta.title || 'N/A'}
Description: ${memory2Meta.description || candidate.task2.content}
Category: ${memory2Meta.category || 'N/A'}
Priority: ${JSON.stringify(memory2Meta.priority || {})}
Created: ${candidate.task2.created_at}

Vector Similarity: ${(candidate.similarity * 100).toFixed(1)}%

Respond with a JSON object:
{
  "isDuplicate": true/false,
  "confidence": 0-1,
  "reason": "Brief explanation",
  "recommendation": "keep_newest" | "keep_oldest" | "merge" | "keep_both",
  "mergedTitle": "Suggested title if merging",
  "mergedDescription": "Suggested description if merging"
}`;

                const response = await this.llmService.generateAnalysis(prompt, {}, 'task_deduplication');
                const responseText = typeof response === 'object' ? response.content : response;
                
                // Extract JSON from LLM response, handling <think> tags and other wrapper text
                let jsonText = responseText;
                
                // Remove <think>...</think> blocks
                jsonText = jsonText.replace(/<think>[\s\S]*?<\/think>/gi, '');
                
                // Try to find JSON object in the response
                const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonText = jsonMatch[0];
                }
                
                // Clean up common JSON issues
                jsonText = jsonText.trim()
                    .replace(/\n/g, '\\n')           // Escape newlines
                    .replace(/\r/g, '\\r')           // Escape carriage returns  
                    .replace(/\t/g, '\\t')           // Escape tabs
                    .replace(/\"/g, '"')             // Replace smart quotes
                    .replace(/\"/g, '"')             // Replace smart quotes
                    .replace(/'/g, "'");             // Replace smart quotes
                
                const analysis = JSON.parse(jsonText);
                
                if (analysis.isDuplicate && analysis.confidence >= llmConfidenceThreshold) {
                    verifiedDuplicates.push({
                        ...candidate,
                        llmAnalysis: analysis
                    });
                }
                
            } catch (error) {
                this.logger.error(`Error verifying duplicate pair ${candidate.pairKey}:`, error.message);
                if (error instanceof SyntaxError) {
                    this.logger.debug(`Raw LLM response: ${responseText}`);
                    this.logger.debug(`Extracted JSON attempt: ${jsonText}`);
                }
            }
        }
        
        this.logger.info(`Verified ${verifiedDuplicates.length} duplicate pairs`);
        return verifiedDuplicates;
    }

    /**
     * Mark duplicate memories in database
     */
    async markDuplicateMemories(verifiedDuplicates) {
        for (const duplicate of verifiedDuplicates) {
            try {
                const { task1, task2, llmAnalysis } = duplicate;
                
                // Determine which task to mark as duplicate based on recommendation
                let taskToMark, primaryTask;
                
                switch (llmAnalysis.recommendation) {
                    case 'keep_newest':
                        taskToMark = task1.created_at < task2.created_at ? task1 : task2;
                        primaryTask = task1.created_at < task2.created_at ? task2 : task1;
                        break;
                    case 'keep_oldest':
                        taskToMark = task1.created_at > task2.created_at ? task1 : task2;
                        primaryTask = task1.created_at > task2.created_at ? task2 : task1;
                        break;
                    case 'merge':
                        // For merge, mark the newer one as duplicate and update the older one
                        taskToMark = task1.created_at > task2.created_at ? task1 : task2;
                        primaryTask = task1.created_at > task2.created_at ? task2 : task1;
                        
                        // Update primary task with merged content
                        const mergedMetadata = {
                            ...primaryTask.metadata,
                            title: llmAnalysis.mergedTitle || primaryTask.metadata.title,
                            description: llmAnalysis.mergedDescription || primaryTask.metadata.description,
                            merged_from: taskToMark.id,
                            merge_reason: llmAnalysis.reason
                        };
                        
                        await this.db.query(
                            `UPDATE memories 
                             SET metadata = $1, 
                                 content = $2,
                                 updated_at = NOW()
                             WHERE id = $3`,
                            [
                                JSON.stringify(mergedMetadata),
                                llmAnalysis.mergedDescription || primaryTask.content,
                                primaryTask.id
                            ]
                        );
                        break;
                    default:
                        // keep_both - just mark relationship but don't change status
                        continue;
                }
                
                // Mark task as duplicate
                const updatedMetadata = {
                    ...taskToMark.metadata,
                    status: 'duplicate',
                    duplicate_of: primaryTask.id,
                    duplicate_reason: llmAnalysis.reason,
                    duplicate_confidence: llmAnalysis.confidence,
                    marked_duplicate_at: new Date().toISOString()
                };
                
                await this.db.query(
                    `UPDATE memories 
                     SET metadata = $1, 
                         updated_at = NOW()
                     WHERE id = $2`,
                    [JSON.stringify(updatedMetadata), taskToMark.id]
                );
                
                this.logger.info(`Marked memory ${taskToMark.id} as duplicate of ${primaryTask.id}`);
                
            } catch (error) {
                this.logger.error(`Error marking duplicate memory:`, error);
            }
        }
    }

    /**
     * Format vector for PostgreSQL query
     */
    formatVectorForQuery(embedding) {
        if (!embedding) return null;
        
        // If it's already a vector string in correct format [1,2,3], return as-is
        if (typeof embedding === 'string' && embedding.startsWith('[') && embedding.endsWith(']') && !embedding.includes('"')) {
            return embedding;
        }
        
        // If it's an array, format it
        if (Array.isArray(embedding)) {
            return `[${embedding.join(',')}]`;
        }
        
        // If it's a JSON string (with quotes), parse and format
        if (typeof embedding === 'string') {
            try {
                const parsed = JSON.parse(embedding);
                if (Array.isArray(parsed)) {
                    return `[${parsed.join(',')}]`;
                }
            } catch (e) {
                // If parsing fails, return null
            }
        }
        
        return null;
    }

    /**
     * Extract memory metadata from content JSON or fallback to metadata field
     */
    extractMemoryMetadata(memory) {
        let taskMeta = {};
        
        // Try to parse content as JSON first
        if (memory.content && typeof memory.content === 'string' && memory.content.startsWith('{')) {
            try {
                taskMeta = JSON.parse(memory.content);
            } catch (e) {
                // If content isn't valid JSON, fall back to metadata
                taskMeta = memory.metadata || {};
            }
        } else {
            // If content isn't JSON, use metadata
            taskMeta = memory.metadata || {};
        }
        
        // Merge with metadata if both exist
        if (memory.metadata) {
            taskMeta = { ...taskMeta, ...memory.metadata };
        }
        
        return taskMeta;
    }

    /**
     * Get similarity threshold from configuration
     */
    async getSimilarityThreshold() {
        try {
            const result = await this.db.query(
                'SELECT value FROM system_config WHERE key = $1',
                ['task_deduplication_similarity_threshold']
            );
            return result.rows.length > 0 ? parseFloat(result.rows[0].value) : 0.85;
        } catch (error) {
            this.logger.warn('Failed to get similarity threshold, using default:', error);
            return 0.85;
        }
    }

    /**
     * Get LLM confidence threshold from configuration  
     */
    async getLLMConfidenceThreshold() {
        try {
            const result = await this.db.query(
                'SELECT value FROM system_config WHERE key = $1',
                ['task_deduplication_llm_confidence_threshold']
            );
            return result.rows.length > 0 ? parseFloat(result.rows[0].value) : 0.7;
        } catch (error) {
            this.logger.warn('Failed to get LLM confidence threshold, using default:', error);
            return 0.7;
        }
    }

    /**
     * Schedule periodic deduplication runs
     */
    scheduleDeduplication(intervalMinutes = 30) {
        // Run immediately with comprehensive deduplication
        this.analyzeDuplicatesPerProjectAndType().catch(error => {
            this.logger.error('Error in scheduled deduplication:', error);
        });
        
        // Schedule periodic runs using comprehensive method
        setInterval(async () => {
            try {
                const result = await this.analyzeDuplicatesPerProjectAndType();
                this.logger.info('Scheduled comprehensive deduplication completed', result);
            } catch (error) {
                this.logger.error('Error in scheduled deduplication:', error);
            }
        }, intervalMinutes * 60 * 1000);
        
        this.logger.info(`Memory deduplication scheduled to run every ${intervalMinutes} minutes (all memory types per project)`);
    }
}