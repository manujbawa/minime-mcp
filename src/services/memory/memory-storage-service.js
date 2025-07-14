/**
 * Memory Storage Service
 * Core orchestrator for memory storage operations
 * Coordinates tag generation, validation, storage, and formatting
 */

import { MEMORY_TYPES } from '../../constants/memory-types.js';
import crypto from 'crypto';

export class MemoryStorageService {
    constructor(logger, dependencies = {}, options = {}) {
        this.logger = logger;
        
        // Inject dependencies instead of creating them
        this.db = dependencies.database;
        this.tagGenerator = dependencies.tagGenerator;
        this.formatter = dependencies.formatter;
        this.eventEmitter = dependencies.eventEmitter; // For background processing
        this.embedding = dependencies.embedding; // For similarity checks
        
        // Configuration
        this.config = {
            enableTagGeneration: options.enableTagGeneration !== false,
            enableDuplicateDetection: options.enableDuplicateDetection !== false,
            enableBackgroundProcessing: options.enableBackgroundProcessing !== false,
            maxTagsPerMemory: options.maxTagsPerMemory || 5,
            duplicateThreshold: options.duplicateThreshold || 0.95,
            importanceScoreDefault: options.importanceScoreDefault || 0.5,
            enableProjectStats: options.enableProjectStats !== false,
            enableRelatedSuggestions: options.enableRelatedSuggestions !== false
        };
        
        // State
        this.initialized = false;
    }

    /**
     * Initialize the service - now much simpler
     */
    async initialize() {
        if (this.initialized) return;
        
        try {
            this.logger.info('Initializing MemoryStorageService...');
            
            // Validate required dependencies
            if (!this.db) {
                throw new Error('Database service is required');
            }
            if (!this.formatter) {
                throw new Error('Memory formatter is required');
            }
            
            // Ensure database is initialized
            if (this.db.initialize) {
                await this.db.initialize();
            }
            
            this.initialized = true;
            this.logger.info('MemoryStorageService initialized successfully');
            
        } catch (error) {
            this.logger.error('Failed to initialize MemoryStorageService:', error);
            throw error;
        }
    }

    /**
     * Alias for store() method to match MCP tools expectations
     * Returns simplified response for VSCode compatibility
     */
    async createMemory(options) {
        const result = await this.store(options.content, {
            memoryType: options.memoryType,
            projectName: options.projectName,
            sessionName: options.sessionName,
            tags: options.tags,
            importanceScore: options.importanceScore,
            status: options.status,
            thinkingSequenceId: options.thinkingSequenceId,
            format: 'raw' // Get raw result to extract ID
        });
        
        // Check if there was an error
        if (result?.error) {
            this.logger.error('Memory storage failed:', result.error);
            throw new Error(result.error);
        }
        
        // The raw result should have the memory ID
        const memoryId = result?.id;
        
        if (!memoryId) {
            this.logger.error('Memory stored but no ID returned', { result });
            throw new Error('Memory storage succeeded but no ID was returned');
        }
        
        // Return simple response for VSCode compatibility
        return {
            id: memoryId,
            message: `Memory stored successfully with ID: ${memoryId}`
        };
    }

    /**
     * Store memory with full processing pipeline
     */
    async store(content, options = {}) {
        await this.initialize();
        
        const {
            memoryType = null,
            projectName = null,
            sessionName = null,
            importanceScore = null,
            tags = [],
            metadata = {},
            format = 'mcp',
            enableEnhancements = true,
            skipDuplicateCheck = false,
            status = null,  // New field for memory_status
            thinkingSequenceId = null  // Link to thinking sequence
        } = options;
        
        try {
            this.logger.debug('Starting memory storage process', {
                contentLength: content?.length,
                memoryType,
                projectName,
                format,
                status,
                hasContent: !!content,
                options: Object.keys(options)
            });
            
            // 1. Validate input
            const validationResult = this._validateInput(content, options);
            if (!validationResult.valid) {
                throw new Error(`Invalid input: ${validationResult.error}`);
            }
            
            // 2. Get or create project
            const project = await this._getOrCreateProject(projectName);
            const projectId = project.id;
            
            // 3. Get or create session
            const session = await this._getOrCreateSession(sessionName, projectId);
            const sessionId = session.id;
            
            // 4. Check for duplicates (if enabled)
            if (this.config.enableDuplicateDetection && !skipDuplicateCheck) {
                const duplicate = await this._checkForDuplicate(content, projectId);
                if (duplicate) {
                    return this.formatter.format(duplicate, {
                        format,
                        isDuplicate: true,
                        project: projectName
                    });
                }
            }
            
            // 5. Memory type determination - SIMPLE AND CLEAN
            const finalMemoryType = memoryType || 'general'; // Agent provides type, otherwise default to 'general'
            
            if (memoryType) {
                this.logger.debug('Using agent-provided memory type', { type: memoryType });
            } else {
                this.logger.debug('No type specified by agent, using default: general');
            }
            
            // 6. Tag generation (always helpful)
            let generatedTags = [...tags]; // Start with provided tags
            
            if (this.config.enableTagGeneration && this.tagGenerator) {
                const additionalTags = await this.tagGenerator.generate(content, finalMemoryType, {
                    projectContext: project.description,
                    maxTags: this.config.maxTagsPerMemory,
                    useAI: false // Keep simple for now, AI enhancement via events
                });
                
                // Merge and deduplicate tags
                generatedTags = this._mergeTags(tags, additionalTags);
            }
            
            // 7. Calculate importance score
            const finalImportanceScore = importanceScore || 
                this._calculateImportanceScore(content, finalMemoryType, generatedTags);
            
            // 8. Store memory in database
            const memoryData = {
                project_id: projectId,
                session_id: sessionId,
                content: content.trim(),
                memory_type: finalMemoryType,
                importance_score: finalImportanceScore,
                tags: generatedTags,
                metadata: {
                    ...metadata,
                    agent_provided_type: !!memoryType // Track if agent provided type
                },
                processing_status: this.config.enableBackgroundProcessing ? 'pending' : 'ready',
                memory_status: status || 'active', // Default to 'active' if not specified
                thinking_sequence_id: thinkingSequenceId
            };
            
            const storedMemory = await this.db.storeMemory(memoryData);
            
            this.logger.debug('Stored memory result:', {
                id: storedMemory?.id,
                hasMemory: !!storedMemory,
                keys: storedMemory ? Object.keys(storedMemory) : []
            });
            
            // 9. Background processing (embeddings, enhanced tags) - event-driven
            if (this.config.enableBackgroundProcessing && this.eventEmitter) {
                this.eventEmitter.emit('memory:created', {
                    memoryId: storedMemory.id,
                    content,
                    memoryType: finalMemoryType,
                    projectId
                });
            }
            
            // 10. Gather enhancements for formatting
            const enhancements = enableEnhancements ? await this._gatherEnhancements(storedMemory, project) : {};
            
            // 11. Format response
            return this.formatter.format(storedMemory, {
                format,
                enhancements,
                project: projectName
            });
            
        } catch (error) {
            this.logger.error('Memory storage failed:', error);
            
            return this.formatter.format(null, {
                format,
                error
            });
        }
    }

    /**
     * Store multiple memories in batch
     */
    async storeBatch(memories, options = {}) {
        await this.initialize();
        
        const {
            projectName = null,
            sessionName = null,
            format = 'api',
            enableEnhancements = false,
            continueOnError = true
        } = options;
        
        const results = [];
        const errors = [];
        
        for (let i = 0; i < memories.length; i++) {
            const memory = memories[i];
            
            try {
                const result = await this.store(memory.content, {
                    ...memory,
                    projectName: memory.projectName || projectName,
                    sessionName: memory.sessionName || sessionName,
                    format,
                    enableEnhancements
                });
                
                results.push({
                    index: i,
                    success: true,
                    result
                });
                
            } catch (error) {
                const errorResult = {
                    index: i,
                    success: false,
                    error: error.message,
                    content_preview: memory.content?.substring(0, 100) + '...'
                };
                
                errors.push(errorResult);
                results.push(errorResult);
                
                if (!continueOnError) {
                    break;
                }
            }
        }
        
        return {
            total: memories.length,
            successful: results.filter(r => r.success).length,
            failed: errors.length,
            results,
            errors
        };
    }

    /**
     * Update existing memory
     */
    async update(memoryId, updates, options = {}) {
        await this.initialize();
        
        const { format = 'api' } = options;
        
        try {
            // Get existing memory
            const existingMemory = await this.db.getMemoryById(memoryId);
            if (!existingMemory) {
                throw new Error(`Memory with ID ${memoryId} not found`);
            }
            
            // Process updates
            let detectionResult = null;
            let updatedTags = updates.tags || existingMemory.tags;
            
            // Re-detect type if content changed
            if (updates.content && updates.content !== existingMemory.content) {
                if (this.config.enableTypeDetection) {
                    detectionResult = await this.typeDetector.detect(updates.content, {
                        existingType: updates.memoryType,
                        useAI: this.llm.isAvailable()
                    });
                    updates.memory_type = detectionResult.type;
                }
                
                // Re-generate tags if content changed
                if (this.config.enableTagGeneration) {
                    const newTags = await this.tagGenerator.generate(updates.content, updates.memory_type || existingMemory.memory_type, {
                        maxTags: this.config.maxTagsPerMemory,
                        useAI: this.embedding.isAvailable()
                    });
                    updatedTags = this._mergeTags(updatedTags, newTags);
                }
            }
            
            // Update memory
            const updatedMemory = await this.db.updateMemory(memoryId, {
                ...updates,
                tags: updatedTags,
                updated_at: new Date().toISOString()
            });
            
            // Re-schedule background processing if content changed
            if (updates.content && this.config.enableBackgroundProcessing) {
                this._scheduleBackgroundProcessing(memoryId, updates.content, updatedMemory.memory_type);
            }
            
            return this.formatter.format(updatedMemory, {
                format,
                detectionResult
            });
            
        } catch (error) {
            this.logger.error('Memory update failed:', error);
            return this.formatter.format(null, { format, error });
        }
    }

    /**
     * Delete memory
     */
    async delete(memoryId, options = {}) {
        await this.initialize();
        
        const { format = 'api' } = options;
        
        try {
            const deleted = await this.db.deleteMemory(memoryId);
            
            if (format === 'mcp') {
                return {
                    content: [{
                        type: "text",
                        text: `✅ Memory ${memoryId} deleted successfully`
                    }]
                };
            }
            
            return { success: true, deleted_id: memoryId };
            
        } catch (error) {
            this.logger.error('Memory deletion failed:', error);
            return this.formatter.format(null, { format, error });
        }
    }

    /**
     * Get memory statistics
     */
    async getStats(projectName = null, options = {}) {
        await this.initialize();
        
        try {
            const stats = await this.db.getMemoryStats(projectName);
            return stats;
            
        } catch (error) {
            this.logger.error('Failed to get memory stats:', error);
            throw error;
        }
    }

    /**
     * Validate input parameters
     */
    _validateInput(content, options) {
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return { valid: false, error: 'Content is required and must be non-empty string' };
        }
        
        if (content.length > 100000) { // 100KB limit
            return { valid: false, error: 'Content exceeds maximum length of 100,000 characters' };
        }
        
        if (options.memoryType && !MEMORY_TYPES.includes(options.memoryType)) {
            return { valid: false, error: `Invalid memory type. Must be one of: ${MEMORY_TYPES.join(', ')}` };
        }
        
        if (options.importanceScore !== null && options.importanceScore !== undefined) {
            if (typeof options.importanceScore !== 'number' || options.importanceScore < 0 || options.importanceScore > 1) {
                return { valid: false, error: 'Importance score must be a number between 0 and 1' };
            }
        }
        
        return { valid: true };
    }

    /**
     * Get or create project
     */
    async _getOrCreateProject(projectName) {
        if (!projectName) {
            projectName = 'default';
        }
        
        let project = await this.db.getProjectByName(projectName);
        
        if (!project) {
            try {
                project = await this.db.createProject({
                    name: projectName,
                    description: `Auto-created project: ${projectName}`,
                    created_at: new Date().toISOString()
                });
            } catch (error) {
                // Handle race condition - if another process created it simultaneously
                if (error.message?.includes('duplicate key')) {
                    this.logger.info('Project was created by another process, fetching it');
                    project = await this.db.getProjectByName(projectName);
                    if (!project) {
                        throw new Error(`Failed to create or retrieve project: ${projectName}`);
                    }
                } else {
                    throw error;
                }
            }
        }
        
        return project;
    }

    /**
     * Get or create session
     */
    async _getOrCreateSession(sessionName, projectId) {
        if (!sessionName) {
            sessionName = `session-${new Date().toISOString().split('T')[0]}`;
        }
        
        let session = await this.db.getSessionByName(projectId, sessionName);
        
        if (!session) {
            session = await this.db.createSession({
                project_id: projectId,
                name: sessionName,
                created_at: new Date().toISOString()
            });
        }
        
        return session;
    }

    /**
     * Check for duplicate memories
     */
    async _checkForDuplicate(content, projectId) {
        try {
            const contentHash = this._generateContentHash(content);
            const existing = await this.db.findMemoryByHash(contentHash, projectId);
            
            if (existing) {
                return existing;
            }
            
            // Semantic similarity check (if embedding service available)
            if (this.embedding && this.embedding.isAvailable && this.embedding.isAvailable()) {
                const similar = await this.embedding.findSimilarMemories(content, {
                    projectId,
                    threshold: this.config.duplicateThreshold,
                    limit: 1
                });
                
                if (similar.length > 0 && similar[0].similarity >= this.config.duplicateThreshold) {
                    return similar[0];
                }
            }
            
            return null;
            
        } catch (error) {
            this.logger.error('Duplicate check failed:', error);
            return null; // Continue with storage on error
        }
    }

    /**
     * Generate content hash for duplicate detection
     */
    _generateContentHash(content) {
        return crypto.createHash('sha256').update(content.trim().toLowerCase()).digest('hex');
    }

    /**
     * Merge and deduplicate tags
     */
    _mergeTags(existingTags, newTags) {
        const allTags = [...existingTags, ...newTags];
        const uniqueTags = [...new Set(allTags.map(tag => tag.toLowerCase()))];
        return uniqueTags.slice(0, this.config.maxTagsPerMemory);
    }

    /**
     * Calculate importance score based on content analysis
     */
    _calculateImportanceScore(content, memoryType, tags) {
        let score = this.config.importanceScoreDefault;
        
        // Type-based scoring
        const typeScores = {
            'project_brief': 0.9,
            'decision': 0.8,
            'rule': 0.8,
            'code': 0.7,
            'tech_reference': 0.6,
            'progress': 0.6,
            'note': 0.5,
            'general': 0.4
        };
        
        score = typeScores[memoryType] || score;
        
        // Content length bonus (longer content often more important)
        if (content.length > 1000) {
            score += 0.1;
        } else if (content.length > 500) {
            score += 0.05;
        }
        
        // Tag-based bonus
        const importantTags = ['critical', 'important', 'urgent', 'security', 'architecture', 'decision'];
        const hasImportantTags = tags.some(tag => 
            importantTags.some(important => tag.toLowerCase().includes(important))
        );
        
        if (hasImportantTags) {
            score += 0.1;
        }
        
        return Math.min(score, 1.0);
    }

    // Background processing is now handled via event-driven pattern
    // Events are emitted in store() method and handled by dedicated background services

    /**
     * Gather enhancements for response formatting
     */
    async _gatherEnhancements(memory, project) {
        const enhancements = {};
        
        try {
            // Project statistics
            if (this.config.enableProjectStats) {
                enhancements.stats = await this.db.getMemoryStats(project.name);
            }
            
            // Related memory suggestions
            if (this.config.enableRelatedSuggestions && this.embedding && this.embedding.isAvailable && this.embedding.isAvailable()) {
                enhancements.suggestions = await this.embedding.findSimilarMemories(memory.content, {
                    projectId: memory.project_id,
                    excludeId: memory.id,
                    limit: 3,
                    threshold: 0.7
                });
            }
            
        } catch (error) {
            this.logger.error('Failed to gather enhancements:', error);
            // Continue without enhancements
        }
        
        return enhancements;
    }

    /**
     * Test the service with sample data
     */
    async test() {
        const testCases = [
            {
                content: 'function calculateTotal(items) { return items.reduce((sum, item) => sum + item.price, 0); }',
                options: { projectName: 'test-project', format: 'mcp' }
            },
            {
                content: 'We decided to use React for the frontend because it provides better component reusability and has excellent TypeScript support.',
                options: { memoryType: 'decision', projectName: 'test-project', format: 'api' }
            },
            {
                content: 'Always use TypeScript for new projects. Never commit code without tests. Follow the established coding standards.',
                options: { projectName: 'test-project', format: 'ui' }
            }
        ];
        
        const results = [];
        
        for (const testCase of testCases) {
            try {
                const result = await this.store(testCase.content, testCase.options);
                results.push({
                    content: testCase.content.substring(0, 50) + '...',
                    options: testCase.options,
                    success: true,
                    result
                });
            } catch (error) {
                results.push({
                    content: testCase.content.substring(0, 50) + '...',
                    options: testCase.options,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return {
            total_tests: testCases.length,
            successful: results.filter(r => r.success).length,
            results
        };
    }
} 