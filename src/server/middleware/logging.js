/**
 * Logging Middleware
 * Request/Response logging
 */

export function loggingMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();
    const reqId = Math.random().toString(36).substring(7);
    
    // Attach request ID
    req.id = reqId;
    
    // Log request
    logger.debug(`[${reqId}] ${req.method} ${req.path}`, {
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Capture response
    const originalSend = res.send;
    res.send = function(data) {
      res.send = originalSend;
      
      // Log response
      const duration = Date.now() - start;
      logger.info(`[${reqId}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      
      return res.send(data);
    };
    
    next();
  };
}