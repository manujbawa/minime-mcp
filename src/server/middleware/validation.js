/**
 * Validation Middleware
 * Request validation utilities
 */

export function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];
      
      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      // Skip further validation if not required and not provided
      if (!rules.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Type check
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
      }
      
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
      
      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must not exceed ${rules.maxLength} characters`);
      }
      
      // Pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${field} has invalid format`);
      }
      
      // Custom validator
      if (rules.validator) {
        const error = rules.validator(value);
        if (error) {
          errors.push(error);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.query[field];
      
      // Required check
      if (rules.required && !value) {
        errors.push(`${field} is required`);
        continue;
      }
      
      // Skip if not provided and not required
      if (!value) continue;
      
      // Type conversion and validation
      if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
        } else {
          req.query[field] = num;
        }
      }
      
      if (rules.type === 'boolean') {
        req.query[field] = value === 'true';
      }
      
      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}

// Common validation schemas
export const schemas = {
  projectName: {
    name: {
      required: true,
      type: 'string',
      minLength: 1,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9-_]+$/
    }
  },
  
  pagination: {
    limit: {
      type: 'number',
      validator: (value) => value < 1 || value > 1000 ? 'limit must be between 1 and 1000' : null
    },
    offset: {
      type: 'number',
      validator: (value) => value < 0 ? 'offset must be non-negative' : null
    }
  },
  
  dateRange: {
    startDate: {
      type: 'string',
      validator: (value) => isNaN(Date.parse(value)) ? 'Invalid start date' : null
    },
    endDate: {
      type: 'string',
      validator: (value) => isNaN(Date.parse(value)) ? 'Invalid end date' : null
    }
  }
};