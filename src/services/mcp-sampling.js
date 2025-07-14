/**
 * MCP Sampling Service for MiniMe-MCP
 * Allows the MCP server to request LLM completions through connected clients
 * Enables sophisticated agentic workflows and server-initiated AI interactions
 */

import { MCPErrors } from './mcp-errors.js';

export class MCPSamplingService {
    constructor(logger, databaseService) {
        this.logger = logger;
        this.db = databaseService;
        
        // Track active sampling requests
        this.pendingSamples = new Map();
        this.sampleTimeout = 30000; // 30 seconds timeout
        
        // Counter for request IDs
        this.requestCounter = 0;
        
        this.logger.info('MCP Sampling Service initialized');
    }

    /**
     * Request a completion from the client's LLM
     * This is the core sampling functionality
     */
    async createMessage(messages, options = {}) {
        const requestId = `sample_${++this.requestCounter}_${Date.now()}`;
        
        this.logger.info(`[SAMPLING-${requestId}] Requesting LLM completion`, {
            messageCount: messages.length,
            options: Object.keys(options)
        });

        // Validate messages format
        this.validateMessages(messages);

        // Build sampling request according to MCP spec
        const samplingRequest = {
            messages: messages.map(msg => this.formatMessage(msg)),
            modelPreferences: options.modelPreferences || {},
            systemPrompt: options.systemPrompt,
            includeContext: options.includeContext || 'none',
            temperature: options.temperature,
            maxTokens: options.maxTokens || 1000,
            stopSequences: options.stopSequences,
            metadata: {
                requestId,
                timestamp: new Date().toISOString(),
                purpose: options.purpose || 'general_completion'
            }
        };

        // Store request for tracking
        this.pendingSamples.set(requestId, {
            request: samplingRequest,
            startTime: Date.now(),
            resolved: false
        });

        try {
            // In a real implementation, this would send the request to the client
            // For now, we'll simulate the sampling process
            const completion = await this.simulateCompletion(samplingRequest);
            
            // Mark as resolved
            const pendingRequest = this.pendingSamples.get(requestId);
            if (pendingRequest) {
                pendingRequest.resolved = true;
                pendingRequest.completion = completion;
            }

            this.logger.info(`[SAMPLING-${requestId}] Completion received`, {
                duration: Date.now() - this.pendingSamples.get(requestId).startTime,
                responseLength: completion.content?.length || 0
            });

            return completion;

        } catch (error) {
            this.logger.error(`[SAMPLING-${requestId}] Sampling failed:`, error);
            this.pendingSamples.delete(requestId);
            throw MCPErrors.samplingError({
                requestId,
                error: error.message,
                originalRequest: samplingRequest
            });
        } finally {
            // Cleanup after timeout
            setTimeout(() => {
                this.pendingSamples.delete(requestId);
            }, this.sampleTimeout);
        }
    }

    /**
     * Validate message format according to MCP spec
     */
    validateMessages(messages) {
        if (!Array.isArray(messages) || messages.length === 0) {
            throw MCPErrors.invalidParams('Messages must be a non-empty array');
        }

        for (const [index, message] of messages.entries()) {
            if (!message.role || !['user', 'assistant', 'system'].includes(message.role)) {
                throw MCPErrors.validationError(`messages[${index}].role`, message.role, 
                    'Role must be one of: user, assistant, system');
            }

            if (!message.content) {
                throw MCPErrors.validationError(`messages[${index}].content`, message.content,
                    'Content is required');
            }

            // Validate content based on type
            if (typeof message.content === 'string') {
                // Simple text content
                continue;
            } else if (message.content.type === 'text') {
                if (!message.content.text || typeof message.content.text !== 'string') {
                    throw MCPErrors.validationError(`messages[${index}].content.text`, 
                        message.content.text, 'Text content must be a string');
                }
            } else if (message.content.type === 'image') {
                if (!message.content.data && !message.content.url) {
                    throw MCPErrors.validationError(`messages[${index}].content`, 
                        message.content, 'Image content must have data or url');
                }
            }
        }
    }

    /**
     * Format message for MCP sampling request
     */
    formatMessage(message) {
        return {
            role: message.role,
            content: this.formatContent(message.content)
        };
    }

    /**
     * Format content for MCP sampling
     */
    formatContent(content) {
        // Handle string content
        if (typeof content === 'string') {
            return {
                type: 'text',
                text: content
            };
        }

        // Handle structured content
        if (content.type === 'text') {
            return {
                type: 'text',
                text: content.text
            };
        }

        if (content.type === 'image') {
            const imageContent = {
                type: 'image'
            };

            if (content.data) {
                imageContent.data = content.data;
                imageContent.mimeType = content.mimeType || 'image/png';
            } else if (content.url) {
                imageContent.url = content.url;
            }

            return imageContent;
        }

        return content;
    }

    /**
     * Simulate LLM completion (placeholder for real client interaction)
     * In production, this would be handled by the MCP client
     */
    async simulateCompletion(request) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        const lastMessage = request.messages[request.messages.length - 1];
        const purpose = request.metadata?.purpose || 'general';

        // Generate contextual response based on purpose
        let responseText;

        switch (purpose) {
            case 'code_review':
                responseText = this.generateCodeReviewResponse(lastMessage.content.text);
                break;
            case 'debug_analysis':
                responseText = this.generateDebugResponse(lastMessage.content.text);
                break;
            case 'architecture_planning':
                responseText = this.generateArchitectureResponse(lastMessage.content.text);
                break;
            case 'learning_insights':
                responseText = await this.generateLearningResponse(lastMessage.content.text);
                break;
            default:
                responseText = this.generateGeneralResponse(lastMessage.content.text);
        }

        return {
            role: 'assistant',
            content: {
                type: 'text',
                text: responseText
            },
            model: 'simulated-llm',
            stopReason: 'stop',
            usage: {
                inputTokens: this.estimateTokens(request.messages),
                outputTokens: this.estimateTokens([{ content: { text: responseText } }])
            }
        };
    }

    /**
     * Generate code review response
     */
    generateCodeReviewResponse(code) {
        return `## Code Review Analysis

I've analyzed the provided code and here are my findings:

### Strengths:
- Code structure appears organized
- Function/variable naming follows conventions

### Areas for Improvement:
- Consider adding error handling for edge cases
- Documentation could be enhanced with JSDoc comments
- Type safety could be improved with TypeScript

### Security Considerations:
- Input validation should be implemented
- Consider sanitizing user inputs

### Performance Notes:
- Algorithm complexity appears reasonable
- Consider caching for repeated operations

### Recommendations:
1. Add comprehensive unit tests
2. Implement proper error boundaries
3. Consider code splitting for larger modules

This analysis was generated through MCP sampling.`;
    }

    /**
     * Generate debug analysis response
     */
    generateDebugResponse(errorDescription) {
        return `## Debug Analysis

Based on the error description, here's my analysis:

### Potential Root Causes:
1. **Null/Undefined Values**: Check for uninitialized variables
2. **Timing Issues**: Async operations may not be properly awaited
3. **Type Mismatches**: Verify data types match expected values

### Debugging Steps:
1. Add console.log statements at key points
2. Use browser/Node.js debugger with breakpoints
3. Check network requests in DevTools
4. Verify environment variables and configuration

### Common Solutions:
- Add null checks and default values
- Implement proper error boundaries
- Use try-catch blocks for async operations
- Validate inputs before processing

### Preventive Measures:
- Implement comprehensive logging
- Add unit tests for edge cases
- Use TypeScript for better type safety

This analysis was generated through MCP sampling to help debug the issue.`;
    }

    /**
     * Generate architecture planning response
     */
    generateArchitectureResponse(requirements) {
        return `## System Architecture Recommendation

Based on the requirements, here's a proposed architecture:

### High-Level Architecture:
\`\`\`
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │────│   API Gateway│────│  Services   │
│  (React/Vue)│    │  (Express)  │    │ (Microservices)│
└─────────────┘    └─────────────┘    └─────────────┘
                           │                    │
                   ┌─────────────┐    ┌─────────────┐
                   │  Database   │    │   Cache     │
                   │ (PostgreSQL)│    │   (Redis)   │
                   └─────────────┘    └─────────────┘
\`\`\`

### Technology Stack:
- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with pgvector
- **Cache**: Redis for session management
- **Container**: Docker with Kubernetes

### Key Design Principles:
1. **Scalability**: Microservices for independent scaling
2. **Security**: JWT authentication + RBAC
3. **Performance**: Caching and database optimization
4. **Maintainability**: Clear separation of concerns

### Implementation Phases:
1. Core API development
2. Database schema and migrations
3. Frontend integration
4. Performance optimization
5. Security hardening

This architecture plan was generated through MCP sampling.`;
    }

    /**
     * Generate learning insights response
     */
    async generateLearningResponse(query) {
        // Try to get actual learning data
        try {
            const insights = await this.db.query(`
                SELECT insight_category as category, title, summary as description, confidence_score as confidence 
                FROM unified_insights_v2 
                WHERE confidence_score > 0.7 
                ORDER BY created_at DESC 
                LIMIT 5
            `);

            if (insights.rows.length > 0) {
                let response = `## Learning Insights\n\nBased on your development history:\n\n`;
                
                insights.rows.forEach((insight, index) => {
                    response += `### ${index + 1}. ${insight.title}\n`;
                    response += `**Category**: ${insight.category}\n`;
                    response += `**Confidence**: ${(insight.confidence * 100).toFixed(1)}%\n`;
                    response += `${insight.description}\n\n`;
                });

                response += `\nThis analysis was generated through MCP sampling with real project data.`;
                return response;
            }
        } catch (error) {
            this.logger.debug('Could not fetch learning data:', error.message);
        }

        // Fallback to simulated response
        return `## Learning Insights

Based on analysis of development patterns:

### Key Findings:
1. **Code Quality**: Strong adherence to established patterns
2. **Technology Preferences**: Favors modern JavaScript/TypeScript
3. **Architecture Style**: Tends toward modular, component-based design

### Recommendations:
- Continue focusing on testing and documentation
- Explore advanced TypeScript features
- Consider performance optimization techniques

### Growth Areas:
- Database optimization and indexing
- Advanced monitoring and observability
- Security best practices implementation

This analysis was generated through MCP sampling.`;
    }

    /**
     * Generate general response
     */
    generateGeneralResponse(prompt) {
        return `I understand you're asking about: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"\n\nThis is a simulated response generated through the MCP Sampling API. In a production environment, this would be handled by a real LLM through the MCP client.\n\nThe sampling system allows the MCP server to request completions for various purposes like code analysis, debugging assistance, and architectural planning.`;
    }

    /**
     * Estimate token count (rough approximation)
     */
    estimateTokens(messages) {
        let totalText = '';
        for (const message of messages) {
            if (typeof message.content === 'string') {
                totalText += message.content;
            } else if (message.content?.text) {
                totalText += message.content.text;
            }
        }
        // Rough estimation: ~4 characters per token
        return Math.ceil(totalText.length / 4);
    }

    /**
     * Get status of sampling service
     */
    getStatus() {
        const now = Date.now();
        const activeSamples = Array.from(this.pendingSamples.values())
            .filter(sample => !sample.resolved && (now - sample.startTime) < this.sampleTimeout);

        return {
            active_requests: activeSamples.length,
            total_requests: this.requestCounter,
            timeout_ms: this.sampleTimeout,
            supported_features: [
                'text_completion',
                'code_analysis', 
                'debug_assistance',
                'architecture_planning',
                'learning_insights'
            ],
            simulated: true // This indicates we're using simulated responses
        };
    }

    /**
     * High-level sampling methods for common use cases
     */
    async analyzeCode(code, language = 'javascript', focus = 'general') {
        const messages = [{
            role: 'user',
            content: `Please analyze this ${language} code with focus on ${focus}:\n\n\`\`\`${language}\n${code}\n\`\`\``
        }];

        return await this.createMessage(messages, {
            purpose: 'code_review',
            modelPreferences: { 
                type: 'code_analysis',
                temperature: 0.1 
            },
            maxTokens: 1500
        });
    }

    async debugError(errorMessage, codeContext = null, logs = null) {
        let prompt = `Help me debug this error: ${errorMessage}`;
        
        if (codeContext) {
            prompt += `\n\nRelevant code:\n\`\`\`\n${codeContext}\n\`\`\``;
        }
        
        if (logs) {
            prompt += `\n\nLogs:\n\`\`\`\n${logs}\n\`\`\``;
        }

        const messages = [{ role: 'user', content: prompt }];

        return await this.createMessage(messages, {
            purpose: 'debug_analysis',
            modelPreferences: { 
                type: 'debugging',
                temperature: 0.1 
            },
            maxTokens: 2000
        });
    }

    async planArchitecture(requirements, constraints = null) {
        let prompt = `Design a system architecture for these requirements:\n${requirements}`;
        
        if (constraints) {
            prompt += `\n\nConstraints:\n${constraints}`;
        }

        const messages = [{ role: 'user', content: prompt }];

        return await this.createMessage(messages, {
            purpose: 'architecture_planning',
            modelPreferences: { 
                type: 'architecture',
                temperature: 0.1 
            },
            maxTokens: 2500
        });
    }

    async generateLearningInsights(projectName = null, focusArea = null) {
        let prompt = 'Analyze my development patterns and provide learning insights';
        
        if (projectName) {
            prompt += ` for the ${projectName} project`;
        }
        
        if (focusArea) {
            prompt += ` with focus on ${focusArea}`;
        }

        const messages = [{ role: 'user', content: prompt }];

        return await this.createMessage(messages, {
            purpose: 'learning_insights',
            modelPreferences: { 
                type: 'analysis',
                temperature: 0.1 
            },
            maxTokens: 2000
        });
    }
}