/**
 * Response Utilities
 * Standardized response formatting
 */

export const ResponseUtil = {
  /**
   * Success response
   */
  success(data, message = 'Success') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Error response
   */
  error(message, details = null, code = null) {
    return {
      success: false,
      error: message,
      ...(details && { details }),
      ...(code && { code }),
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Paginated response
   */
  paginated(data, pagination, message = 'Success') {
    return {
      success: true,
      message,
      data,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        total: pagination.total,
        hasMore: data.length === pagination.limit,
        page: Math.floor(pagination.offset / pagination.limit) + 1,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      },
      timestamp: new Date().toISOString()
    };
  },

  /**
   * No content response
   */
  noContent() {
    return null; // 204 responses should have no body
  },

  /**
   * Created response
   */
  created(data, message = 'Resource created successfully') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Updated response
   */
  updated(data, message = 'Resource updated successfully') {
    return {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Deleted response
   */
  deleted(message = 'Resource deleted successfully') {
    return {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * HTTP Status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};