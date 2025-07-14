/**
 * Logger Service
 * Centralized logging service following modular architecture patterns
 * Provides consistent logging across all modules
 */

import winston from 'winston';
import path from 'path';

export class LoggerService {
  constructor(config = {}) {
    this.config = {
      level: config.level || process.env.LOG_LEVEL || 'info',
      format: config.format || 'json',
      serviceName: config.serviceName || 'minime-mcp',
      ...config
    };

    this.logger = this.createLogger();
  }

  /**
   * Create Winston logger instance with consistent configuration
   */
  createLogger() {
    const formats = [];

    // Add timestamp
    formats.push(winston.format.timestamp({ 
      format: 'YYYY-MM-DD HH:mm:ss' 
    }));

    // Add errors with stack traces
    formats.push(winston.format.errors({ stack: true }));

    // Add service metadata
    formats.push(winston.format.metadata({ 
      key: 'meta',
      fillExcept: ['timestamp', 'level', 'message'] 
    }));

    // Consistent console format
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, meta }) => {
        let msg = `${timestamp} [${level}] ${message}`;
        
        // Add metadata if present
        if (meta && Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        
        return msg;
      })
    );

    // JSON format for structured logging
    const jsonFormat = winston.format.combine(
      ...formats,
      winston.format.json()
    );

    // Create logger
    const logger = winston.createLogger({
      level: this.config.level,
      defaultMeta: { 
        service: this.config.serviceName
      },
      format: jsonFormat,
      transports: []
    });

    // Console transport - always enabled except for tests
    if (process.env.NODE_ENV !== 'test') {
      logger.add(new winston.transports.Console({
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      }));
    }

    // File transport - enabled when not in stdio mode
    if (!process.env.MCP_STDIO) {
      const logDir = process.env.LOG_DIR || './logs';
      
      logger.add(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: jsonFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5
      }));
      
      logger.add(new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: jsonFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 10
      }));
    }

    // Special handling for MCP stdio mode
    if (process.env.MCP_STDIO === '1') {
      // In stdio mode, redirect console to stderr
      logger.transports.forEach(transport => {
        if (transport.name === 'console') {
          transport.stream = process.stderr;
        }
      });
    }

    return logger;
  }

  /**
   * Create a child logger with additional context
   */
  child(metadata) {
    return this.logger.child(metadata);
  }

  /**
   * Log methods
   */
  error(message, ...args) {
    this.logger.error(message, ...args);
  }

  warn(message, ...args) {
    this.logger.warn(message, ...args);
  }

  info(message, ...args) {
    this.logger.info(message, ...args);
  }

  http(message, ...args) {
    this.logger.http(message, ...args);
  }

  verbose(message, ...args) {
    this.logger.verbose(message, ...args);
  }

  debug(message, ...args) {
    this.logger.debug(message, ...args);
  }

  silly(message, ...args) {
    this.logger.silly(message, ...args);
  }

  /**
   * Create a logger for a specific module
   */
  createModuleLogger(moduleName) {
    return this.child({ module: moduleName });
  }

  /**
   * Create a logger for HTTP requests
   */
  createRequestLogger(requestId) {
    return this.child({ requestId });
  }

  /**
   * Set log level dynamically
   */
  setLevel(level) {
    this.logger.level = level;
    this.config.level = level;
  }

  /**
   * Get current log level
   */
  getLevel() {
    return this.logger.level;
  }
}

// Singleton instance for backward compatibility
let defaultLogger = null;

/**
 * Get default logger instance (for backward compatibility)
 */
export function getDefaultLogger() {
  if (!defaultLogger) {
    defaultLogger = new LoggerService();
  }
  return defaultLogger;
}

// Export default logger for simple imports
export default getDefaultLogger();