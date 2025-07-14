/**
 * Error Handling Middleware
 * Centralized error handling for all routes
 */

export function errorHandlerMiddleware(logger) {
  return (err, req, res, next) => {
    // Log error
    logger.error(`[${req.id || 'unknown'}] Error:`, {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.message
      });
    }
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        error: 'Unauthorized',
        details: 'Authentication required'
      });
    }
    
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: 'Conflict',
        details: 'Resource already exists'
      });
    }
    
    // Default error response - always include stack for debugging
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      stack: err.stack
    });
  };
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}