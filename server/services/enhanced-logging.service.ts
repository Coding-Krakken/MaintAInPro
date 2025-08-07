import { Request, Response } from 'express';

/**
 * Enhanced Structured Logging Service for MaintAInPro CMMS
 * 
 * Provides comprehensive logging with:
 * - Structured format (JSON)
 * - Request tracing
 * - Performance metrics
 * - Error context
 * - Audit trails
 * - Multi-level logging
 */

export interface LogContext {
  // Request context
  requestId?: string;
  userId?: string;
  organizationId?: string;
  sessionId?: string;
  
  // Operation context
  operation?: string;
  resource?: string;
  resourceId?: string;
  service?: string;
  
  // Performance context
  duration?: number;
  timestamp?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
  [key: string]: any; // Allow additional properties
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memory: number;
    cpu?: number;
  };
  audit?: {
    action: string;
    entity: string;
    entityId?: string;
    changes?: Record<string, any>;
  };
}

// Extend Request interface for request ID tracking
export interface RequestWithId extends Request {
  requestId?: string;
  user?: any;
}

class EnhancedLoggingService {
  private readonly serviceName = 'MaintAInPro-CMMS';
  private readonly version = process.env.APP_VERSION || '1.0.0';
  private readonly environment = process.env.NODE_ENV || 'development';
  
  /**
   * Generate unique request ID for tracing
   */
  generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create base log context from request
   */
  createContextFromRequest(req: RequestWithId): LogContext {
    return {
      requestId: req.requestId || this.generateRequestId(),
      userId: req.user?.id,
      organizationId: req.user?.organizationId || req.user?.warehouseId,
      sessionId: req.user?.sessionId,
      operation: `${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
      metadata: {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer
      }
    };
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const logData = {
      timestamp: entry.context.timestamp || new Date().toISOString(),
      level: entry.level.toUpperCase(),
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
      message: entry.message,
      ...entry.context,
      ...(entry.error && { error: entry.error }),
      ...(entry.performance && { performance: entry.performance }),
      ...(entry.audit && { audit: entry.audit })
    };

    return JSON.stringify(logData);
  }

  /**
   * Output log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatLogEntry(entry);
    
    // In development, use pretty printing
    if (this.environment === 'development') {
      const colors = {
        debug: '\x1b[36m',    // Cyan
        info: '\x1b[32m',     // Green
        warn: '\x1b[33m',     // Yellow
        error: '\x1b[31m',    // Red
        fatal: '\x1b[35m'     // Magenta
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level] || reset;
      
      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`);
      
      if (entry.context.requestId) {
        console.log(`  Request ID: ${entry.context.requestId}`);
      }
      
      if (entry.context.userId) {
        console.log(`  User ID: ${entry.context.userId}`);
      }
      
      if (entry.context.operation) {
        console.log(`  Operation: ${entry.context.operation}`);
      }
      
      if (entry.context.duration) {
        console.log(`  Duration: ${entry.context.duration}ms`);
      }
      
      if (entry.error) {
        console.log(`  Error: ${entry.error.name} - ${entry.error.message}`);
        if (entry.error.stack) {
          console.log(`  Stack: ${entry.error.stack}`);
        }
      }
    } else {
      // In production, use structured JSON logging
      console.log(formatted);
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context: LogContext = {}): void {
    this.output({
      level: 'debug',
      message,
      context: {
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }

  /**
   * Info level logging
   */
  info(message: string, context: LogContext = {}): void {
    this.output({
      level: 'info',
      message,
      context: {
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }

  /**
   * Warning level logging
   */
  warn(message: string, context: LogContext = {}): void {
    this.output({
      level: 'warn',
      message,
      context: {
        timestamp: new Date().toISOString(),
        ...context
      }
    });
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error | any, context: LogContext = {}): void {
    const errorContext: any = {};
    
    if (error) {
      errorContext.error = {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack,
        code: error.code
      };
    }

    this.output({
      level: 'error',
      message,
      context: {
        timestamp: new Date().toISOString(),
        ...context
      },
      ...errorContext
    });
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, error?: Error | any, context: LogContext = {}): void {
    const errorContext: any = {};
    
    if (error) {
      errorContext.error = {
        name: error.name || 'FatalError',
        message: error.message || String(error),
        stack: error.stack,
        code: error.code
      };
    }

    this.output({
      level: 'fatal',
      message,
      context: {
        timestamp: new Date().toISOString(),
        ...context
      },
      ...errorContext
    });
  }

  /**
   * Log API request/response cycle
   */
  logApiRequest(req: RequestWithId, res: Response, duration: number): void {
    const context = this.createContextFromRequest(req);
    
    this.info('API Request', {
      ...context,
      duration,
      metadata: {
        ...context.metadata,
        statusCode: res.statusCode,
        method: req.method,
        url: req.originalUrl || req.url,
        body: req.method !== 'GET' ? this.sanitizeRequestBody(req.body) : undefined
      }
    });
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(operation: string, table: string, duration: number, context: LogContext = {}): void {
    this.debug('Database Operation', {
      ...context,
      operation: `DB_${operation.toUpperCase()}`,
      resource: table,
      duration,
      metadata: {
        type: 'database'
      }
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(event: string, details: any, context: LogContext = {}): void {
    this.warn('Security Event', {
      ...context,
      operation: `SECURITY_${event.toUpperCase()}`,
      metadata: {
        type: 'security',
        details: this.sanitizeSecurityDetails(details)
      }
    });
  }

  /**
   * Log audit events for compliance
   */
  logAuditEvent(action: string, entity: string, entityId: string | undefined, changes: any, context: LogContext = {}): void {
    const auditInfo = {
      action,
      entity,
      entityId,
      changes: this.sanitizeAuditChanges(changes)
    };

    this.info('Audit Event', {
      ...context,
      metadata: {
        type: 'audit',
        audit: auditInfo
      }
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(metric: string, value: number, unit: string, context: LogContext = {}): void {
    const performanceInfo = {
      duration: value,
      memory: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    };

    this.info('Performance Metric', {
      ...context,
      metadata: {
        type: 'performance',
        metric,
        value,
        unit,
        performance: performanceInfo
      }
    });
  }

  /**
   * Sanitize request body for logging (remove sensitive data)
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize security details
   */
  private sanitizeSecurityDetails(details: any): any {
    if (!details || typeof details !== 'object') return details;
    
    const sensitiveFields = ['password', 'token', 'hash', 'secret'];
    const sanitized = { ...details };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize audit changes
   */
  private sanitizeAuditChanges(changes: any): any {
    if (!changes || typeof changes !== 'object') return changes;
    
    const sensitiveFields = ['password', 'password_hash', 'secret', 'token'];
    const sanitized = { ...changes };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Create a child logger with inherited context
   */
  child(baseContext: LogContext) {
    return {
      debug: (message: string, context: LogContext = {}) => 
        this.debug(message, { ...baseContext, ...context }),
      info: (message: string, context: LogContext = {}) => 
        this.info(message, { ...baseContext, ...context }),
      warn: (message: string, context: LogContext = {}) => 
        this.warn(message, { ...baseContext, ...context }),
      error: (message: string, error?: Error, context: LogContext = {}) => 
        this.error(message, error, { ...baseContext, ...context }),
      fatal: (message: string, error?: Error, context: LogContext = {}) => 
        this.fatal(message, error, { ...baseContext, ...context })
    };
  }
}

// Create singleton instance
export const logger = new EnhancedLoggingService();

/**
 * Express middleware for request logging
 */
export function requestLoggingMiddleware(req: RequestWithId, res: Response, next: any): void {
  const startTime = Date.now();
  
  // Generate request ID if not present
  if (!req.requestId) {
    req.requestId = logger.generateRequestId();
  }

  // Add request ID to response headers for tracing
  res.setHeader('X-Request-ID', req.requestId);

  // Log request start
  const context = logger.createContextFromRequest(req);
  logger.debug('Request started', context);

  // Store original end method
  const originalEnd = res.end.bind(res);
  
  // Override res.end to log when request completes
  res.end = function(chunk?: any, encoding?: any, cb?: () => void): Response {
    const duration = Date.now() - startTime;
    logger.logApiRequest(req, res, duration);
    
    // Call original end method with proper arguments
    if (typeof chunk === 'function') {
      return originalEnd(chunk);
    } else if (typeof encoding === 'function') {
      return originalEnd(chunk, encoding);
    } else {
      return originalEnd(chunk, encoding, cb);
    }
  };

  next();
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(error: Error, req: RequestWithId, res: Response, next: any): void {
  const context = logger.createContextFromRequest(req);
  
  logger.error('Request error', error, {
    ...context,
    metadata: {
      ...context.metadata,
      statusCode: res.statusCode || 500
    }
  });

  next(error);
}

export default logger;
