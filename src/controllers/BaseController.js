/**
 * Base Controller Class
 * Provides common functionality for all controllers
 */

export class BaseController {
  constructor(services) {
    this.services = services;
    this.logger = services.logger;
    this.databaseService = services.database;
    this.configService = services.config;
  }

  /**
   * Handle errors consistently across all controllers
   */
  handleError(res, error, message = 'Operation failed') {
    this.logger.error(message, error);
    
    // Check for common SQLite errors
    if (error.message?.includes('UNIQUE constraint')) {
      return res.status(409).json({ 
        error: 'Duplicate entry', 
        details: error.message 
      });
    }
    
    if (error.message?.includes('NOT NULL constraint')) {
      return res.status(400).json({ 
        error: 'Missing required field', 
        details: error.message 
      });
    }
    
    if (error.message?.includes('no such table')) {
      return res.status(500).json({ 
        error: 'Database error', 
        details: 'Database schema not initialized' 
      });
    }
    
    // Default error response
    res.status(500).json({ 
      error: message, 
      details: error.message 
    });
  }

  /**
   * Send success response
   */
  success(res, data, message) {
    res.json({ 
      success: true, 
      message, 
      data 
    });
  }

  /**
   * Send paginated response
   */
  paginated(res, data, pagination, message) {
    res.json({ 
      success: true, 
      message,
      data,
      pagination: {
        ...pagination,
        hasMore: data.length === pagination.limit
      }
    });
  }

  /**
   * Parse pagination parameters
   */
  parsePagination(req) {
    // If no limit is specified, don't apply any limit (allow unlimited records)
    // If limit is specified, cap it at 1000 for safety
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit), 1000) : null;
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);
    const page = limit ? Math.floor(offset / limit) + 1 : 1;
    
    return { limit, offset, page };
  }

  /**
   * Parse date range parameters
   */
  parseDateRange(req) {
    const { startDate, endDate } = req.query;
    return {
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    };
  }

  /**
   * Parse filter parameters
   */
  parseFilters(req, allowedFilters = []) {
    const filters = {};
    
    for (const filter of allowedFilters) {
      if (req.query[filter] !== undefined) {
        filters[filter] = req.query[filter];
      }
    }
    
    return filters;
  }

  /**
   * Validate required fields
   */
  validateRequired(data, fields) {
    const missing = fields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Log controller action
   */
  logAction(action, details = {}) {
    this.logger.info(`[${this.constructor.name}] ${action}`, details);
  }

  /**
   * Check if service is available
   */
  requireService(serviceName) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Required service '${serviceName}' is not available`);
    }
    return service;
  }
}