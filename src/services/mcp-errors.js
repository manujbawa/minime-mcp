/**
 * MCP Error Codes and Error Handling
 * Implements official MCP error codes and standardized error responses
 * Based on JSON-RPC 2.0 and MCP specification
 */

// Official MCP Error Codes (based on JSON-RPC 2.0 and MCP extensions)
export const MCPErrorCodes = {
  // Standard JSON-RPC errors
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  
  // MCP-specific errors (starting from -32000)
  RESOURCE_NOT_FOUND: -32001,
  RESOURCE_ACCESS_DENIED: -32002,
  TOOL_NOT_FOUND: -32003,
  TOOL_EXECUTION_ERROR: -32004,
  PROMPT_NOT_FOUND: -32005,
  PROMPT_GENERATION_ERROR: -32006,
  SAMPLING_ERROR: -32007,
  ROOT_ACCESS_DENIED: -32008,
  CAPABILITY_NOT_SUPPORTED: -32009,
  SESSION_ERROR: -32010,
  TIMEOUT_ERROR: -32011,
  RATE_LIMITED: -32012,
  INSUFFICIENT_PERMISSIONS: -32013,
  VALIDATION_ERROR: -32014,
  DEPENDENCY_ERROR: -32015
};

// Error message templates
export const MCPErrorMessages = {
  [MCPErrorCodes.PARSE_ERROR]: 'Parse error',
  [MCPErrorCodes.INVALID_REQUEST]: 'Invalid Request',
  [MCPErrorCodes.METHOD_NOT_FOUND]: 'Method not found',
  [MCPErrorCodes.INVALID_PARAMS]: 'Invalid params',
  [MCPErrorCodes.INTERNAL_ERROR]: 'Internal error',
  [MCPErrorCodes.RESOURCE_NOT_FOUND]: 'Resource not found',
  [MCPErrorCodes.RESOURCE_ACCESS_DENIED]: 'Resource access denied',
  [MCPErrorCodes.TOOL_NOT_FOUND]: 'Tool not found',
  [MCPErrorCodes.TOOL_EXECUTION_ERROR]: 'Tool execution failed',
  [MCPErrorCodes.PROMPT_NOT_FOUND]: 'Prompt not found',
  [MCPErrorCodes.PROMPT_GENERATION_ERROR]: 'Prompt generation failed',
  [MCPErrorCodes.SAMPLING_ERROR]: 'Sampling request failed',
  [MCPErrorCodes.ROOT_ACCESS_DENIED]: 'Root access denied',
  [MCPErrorCodes.CAPABILITY_NOT_SUPPORTED]: 'Capability not supported',
  [MCPErrorCodes.SESSION_ERROR]: 'Session error',
  [MCPErrorCodes.TIMEOUT_ERROR]: 'Request timeout',
  [MCPErrorCodes.RATE_LIMITED]: 'Rate limit exceeded',
  [MCPErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [MCPErrorCodes.VALIDATION_ERROR]: 'Validation error',
  [MCPErrorCodes.DEPENDENCY_ERROR]: 'Dependency error'
};

/**
 * MCP Error class for standardized error handling
 */
export class MCPError extends Error {
  constructor(code, message, data = null) {
    super(message || MCPErrorMessages[code] || 'Unknown error');
    this.name = 'MCPError';
    this.code = code;
    this.data = data;
  }

  /**
   * Convert to JSON-RPC error response format
   */
  toJSONRPC(id = null) {
    return {
      jsonrpc: '2.0',
      error: {
        code: this.code,
        message: this.message,
        ...(this.data && { data: this.data })
      },
      id
    };
  }

  /**
   * Convert to MCP tool error format
   */
  toToolError() {
    return {
      content: [{
        type: 'text',
        text: `Error ${this.code}: ${this.message}${this.data ? `\nDetails: ${JSON.stringify(this.data)}` : ''}`
      }],
      isError: true
    };
  }
}

/**
 * Factory functions for common MCP errors
 */
export const MCPErrors = {
  resourceNotFound: (uri, details = null) => 
    new MCPError(MCPErrorCodes.RESOURCE_NOT_FOUND, `Resource not found: ${uri}`, details),

  resourceAccessDenied: (uri, reason = null) =>
    new MCPError(MCPErrorCodes.RESOURCE_ACCESS_DENIED, `Access denied to resource: ${uri}`, { reason }),

  toolNotFound: (toolName) =>
    new MCPError(MCPErrorCodes.TOOL_NOT_FOUND, `Tool not found: ${toolName}`),

  toolExecutionError: (toolName, error) =>
    new MCPError(MCPErrorCodes.TOOL_EXECUTION_ERROR, `Tool execution failed: ${toolName}`, { 
      originalError: error.message,
      stack: error.stack 
    }),

  promptNotFound: (promptName) =>
    new MCPError(MCPErrorCodes.PROMPT_NOT_FOUND, `Prompt not found: ${promptName}`),

  promptGenerationError: (promptName, error) =>
    new MCPError(MCPErrorCodes.PROMPT_GENERATION_ERROR, `Prompt generation failed: ${promptName}`, {
      originalError: error.message
    }),

  samplingError: (details) =>
    new MCPError(MCPErrorCodes.SAMPLING_ERROR, 'Sampling request failed', details),

  invalidParams: (message, details = null) =>
    new MCPError(MCPErrorCodes.INVALID_PARAMS, message, details),

  validationError: (field, value, reason) =>
    new MCPError(MCPErrorCodes.VALIDATION_ERROR, `Validation failed for ${field}`, {
      field,
      value,
      reason
    }),

  timeoutError: (operation, timeoutMs) =>
    new MCPError(MCPErrorCodes.TIMEOUT_ERROR, `Operation timed out: ${operation}`, {
      timeout: timeoutMs
    }),

  capabilityNotSupported: (capability) =>
    new MCPError(MCPErrorCodes.CAPABILITY_NOT_SUPPORTED, `Capability not supported: ${capability}`),

  sessionError: (message, details = null) =>
    new MCPError(MCPErrorCodes.SESSION_ERROR, message, details),

  internalError: (message, error = null) =>
    new MCPError(MCPErrorCodes.INTERNAL_ERROR, message, error ? {
      originalError: error.message,
      stack: error.stack
    } : null)
};

/**
 * Error handler middleware for MCP requests
 */
export function handleMCPError(error, logger, requestId = null) {
  if (error instanceof MCPError) {
    logger.error(`[MCP-${requestId}] MCP Error ${error.code}: ${error.message}`, error.data);
    return error;
  }

  // Convert common JavaScript errors to MCP errors
  if (error.name === 'ValidationError') {
    return MCPErrors.validationError(error.field || 'unknown', error.value, error.message);
  }

  if (error.name === 'TimeoutError' || error.code === 'TIMEOUT') {
    return MCPErrors.timeoutError(error.operation || 'unknown', error.timeout);
  }

  if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
    return MCPErrors.resourceNotFound(error.path || 'unknown file');
  }

  if (error.code === 'EACCES' || error.code === 'EPERM') {
    return MCPErrors.resourceAccessDenied(error.path || 'unknown file', error.code);
  }

  // Default to internal error
  logger.error(`[MCP-${requestId}] Unhandled error:`, error);
  return MCPErrors.internalError('An unexpected error occurred', error);
}

/**
 * Validation helper functions
 */
export const MCPValidators = {
  validateURI: (uri) => {
    try {
      new URL(uri);
      return true;
    } catch {
      throw MCPErrors.validationError('uri', uri, 'Invalid URI format');
    }
  },

  validateToolName: (name) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw MCPErrors.validationError('tool_name', name, 'Tool name must be a non-empty string');
    }
    return true;
  },

  validatePromptName: (name) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw MCPErrors.validationError('prompt_name', name, 'Prompt name must be a non-empty string');
    }
    return true;
  },

  validateRequiredParam: (value, paramName, type = null) => {
    if (value === undefined || value === null) {
      throw MCPErrors.invalidParams(`Missing required parameter: ${paramName}`);
    }
    
    if (type && typeof value !== type) {
      throw MCPErrors.invalidParams(`Parameter ${paramName} must be of type ${type}`, {
        expected: type,
        actual: typeof value
      });
    }
    
    return true;
  },

  validateFileExtension: (filePath, allowedExtensions) => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw MCPErrors.resourceAccessDenied(filePath, `File extension .${ext} not allowed`);
    }
    return true;
  }
};

/**
 * Async error wrapper for MCP handlers
 */
export function withMCPErrorHandling(handler, logger) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      const mcpError = handleMCPError(error, logger);
      throw mcpError;
    }
  };
}

/**
 * Response formatter for MCP success responses
 */
export function createMCPResponse(result, id = null) {
  return {
    jsonrpc: '2.0',
    result,
    id
  };
}

/**
 * Response formatter for MCP error responses
 */
export function createMCPErrorResponse(error, id = null) {
  if (error instanceof MCPError) {
    return error.toJSONRPC(id);
  }
  
  return {
    jsonrpc: '2.0',
    error: {
      code: MCPErrorCodes.INTERNAL_ERROR,
      message: error.message || 'Internal error'
    },
    id
  };
}