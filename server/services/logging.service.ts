import { Request, Response } from 'express';
import type { AuthenticatedUser } from '../../shared/types/auth';

interface LoggingRequest extends Request {
  user?: AuthenticatedUser;
  startTime?: number;
}
import { db } from '../db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Unified Structured Logging Service
 * Production-hardened logging system for CMMS application
 */

// Log levels
export const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  DEBUG: 4,
} as const;

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  version: string;
  meta?: Record<string, unknown>;
}

/**
 * Enhanced Logging Service Class
 */
export class LoggingService {
  private static instance: LoggingService;
  private logLevel: number;
  private logDir: string;

  private constructor() {
    const env = process.env.NODE_ENV || 'development';
    this.logLevel = env === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
    this.logDir = path.join(process.cwd(), 'logs');

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (error) {
        console.warn('Could not create logs directory:', error);
      }
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(level: string, message: string, meta?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: 'MaintAInPro-CMMS',
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      meta,
    };
  }

  /**
   * Write log to file
   */
  private async writeToFile(filename: string, logEntry: LogEntry): Promise<void> {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      const filePath = path.join(this.logDir, filename);
      await fs.promises.appendFile(filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Log with level check
   */
  private log(
    level: number,
    levelName: string,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    if (level > this.logLevel) return;

    const logEntry = this.createLogEntry(levelName, message, meta);

    // Console output with color coding
    const colorMap: Record<string, string> = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m', // Yellow
      INFO: '\x1b[36m', // Cyan
      HTTP: '\x1b[35m', // Magenta
      DEBUG: '\x1b[37m', // White
    };

    const color = colorMap[levelName] || '\x1b[37m';
    const reset = '\x1b[0m';

    console.log(`${color}[${logEntry.timestamp}] ${levelName}: ${message}${reset}`, meta || '');

    // Write to file in production
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('combined.log', logEntry);

      if (level <= LogLevel.ERROR) {
        this.writeToFile('error.log', logEntry);
      }
    }
  }

  /**
   * Log information message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, 'INFO', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, 'WARN', message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    const errorMeta = {
      ...meta,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
    };
    this.log(LogLevel.ERROR, 'ERROR', message, errorMeta);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, meta);
  }

  /**
   * Log HTTP request
   */
  http(message: string, meta?: Record<string, unknown>): void {
    this.log(LogLevel.HTTP, 'HTTP', message, meta);
  }

  /**
   * Log user activity
   */
  async logUserActivity(
    userId: string,
    action: string,
    details: Record<string, unknown>,
    req?: Request
  ): Promise<void> {
    const activityData = {
      userId,
      action,
      details,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    // Log to console/file
    this.info('User Activity', activityData);

    // Log to database if available
    if (db) {
      try {
        await db.execute(
          `
          INSERT INTO system_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            userId,
            action,
            'user_activity',
            null,
            null,
            JSON.stringify(details),
            req?.ip || null,
            req?.get('User-Agent') || null,
          ]
        );
      } catch (error) {
        this.error('Failed to log user activity to database', error);
      }
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    type:
      | 'login_attempt'
      | 'login_success'
      | 'login_failure'
      | 'permission_denied'
      | 'suspicious_activity',
    details: Record<string, unknown>,
    req?: Request
  ): Promise<void> {
    const securityData = {
      type,
      details,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
      timestamp: new Date().toISOString(),
      severity: this.getSecuritySeverity(type),
    };

    // Log with appropriate level
    if (securityData.severity === 'high') {
      this.error(`Security Event: ${type}`, securityData);
    } else if (securityData.severity === 'medium') {
      this.warn(`Security Event: ${type}`, securityData);
    } else {
      this.info(`Security Event: ${type}`, securityData);
    }

    // Log to database if available
    if (db) {
      try {
        await db.execute(
          `
          INSERT INTO system_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            details.userId || null,
            `security_event_${type}`,
            'security_log',
            null,
            null,
            JSON.stringify(securityData),
            req?.ip || null,
            req?.get('User-Agent') || null,
          ]
        );
      } catch (error) {
        this.error('Failed to log security event to database', error);
      }
    }
  }

  /**
   * Log database operation
   */
  async logDatabaseOperation(
    operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT',
    tableName: string,
    recordId?: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>,
    userId?: string
  ): Promise<void> {
    const dbData = {
      operation,
      tableName,
      recordId,
      oldValues,
      newValues,
      userId,
      timestamp: new Date().toISOString(),
    };

    // Log to console/file
    this.debug(`Database Operation: ${operation} on ${tableName}`, dbData);

    // Log to database if available and not a SELECT operation
    if (db && operation !== 'SELECT') {
      try {
        await db.execute(
          `
          INSERT INTO system_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            userId || null,
            operation.toLowerCase(),
            tableName,
            recordId || null,
            oldValues ? JSON.stringify(oldValues) : null,
            newValues ? JSON.stringify(newValues) : null,
            null,
            null,
          ]
        );
      } catch (error) {
        this.error('Failed to log database operation', error);
      }
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    const perfData = {
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    };

    if (duration > 1000) {
      // Log slow operations as warnings
      this.warn(`Slow Operation: ${operation} took ${duration}ms`, perfData);
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, perfData);
    }
  }

  /**
   * Log API request/response
   */
  logApiRequest(req: Request, res: Response, duration: number, error?: Error): void {
    const apiData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as LoggingRequest).user?.id,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    };

    if (error || res.statusCode >= 400) {
      this.error(`API Request Failed: ${req.method} ${req.url}`, apiData);
    } else if (duration > 2000) {
      this.warn(`Slow API Request: ${req.method} ${req.url}`, apiData);
    } else {
      this.http(`API Request: ${req.method} ${req.url}`, apiData);
    }
  }

  /**
   * Get security event severity
   */
  private getSecuritySeverity(type: string): 'low' | 'medium' | 'high' {
    const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
      login_attempt: 'low',
      login_success: 'low',
      login_failure: 'medium',
      permission_denied: 'medium',
      suspicious_activity: 'high',
    };
    return severityMap[type] || 'medium';
  }

  /**
   * Get log statistics
   */
  getLogStats(): { level: string; count: number }[] {
    // In a production environment, this would read from log files
    // For now, return basic info
    return [
      { level: 'ERROR', count: 0 },
      { level: 'WARN', count: 0 },
      { level: 'INFO', count: 0 },
      { level: 'DEBUG', count: 0 },
    ];
  }
}

/**
 * HTTP request logging middleware
 */
export function httpLoggingMiddleware(req: Request, res: Response, next: Function): void {
  const startTime = Date.now();
  const loggingService = LoggingService.getInstance();

  // Store start time on request
  (req as LoggingRequest).startTime = startTime;

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function (...args: unknown[]) {
    const duration = Date.now() - startTime;
    loggingService.logApiRequest(req, res, duration);
    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * Error logging middleware
 */
export function errorLoggingMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: Function
): void {
  const loggingService = LoggingService.getInstance();
  const duration = Date.now() - ((req as LoggingRequest).startTime || 0);

  loggingService.logApiRequest(req, res, duration, error);

  // Continue with error handling
  next(error);
}

// Export singleton instance
export const loggingService = LoggingService.getInstance();
