import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Advanced Input Sanitization and XSS Prevention
 * Comprehensive protection against injection attacks
 */

/**
 * Advanced XSS sanitization patterns
 * Based on OWASP XSS Prevention guidelines
 */
const XSS_PATTERNS = [
  // Script tags
  /<script[^>]*>.*?<\/script>/gis,
  /<script[^>]*\/>/gi,
  
  // Event handlers
  /\s*on\w+\s*=\s*["'][^"']*["']/gi,
  /\s*on\w+\s*=\s*[^>\s]+/gi,
  
  // JavaScript protocols
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:.*base64/gi,
  
  // Meta and link tags
  /<meta[^>]*>/gi,
  /<link[^>]*>/gi,
  
  // Iframe and embed tags
  /<iframe[^>]*>.*?<\/iframe>/gis,
  /<embed[^>]*>/gi,
  /<object[^>]*>.*?<\/object>/gis,
  
  // Form elements
  /<form[^>]*>.*?<\/form>/gis,
  /<input[^>]*>/gi,
  /<textarea[^>]*>.*?<\/textarea>/gis,
  /<button[^>]*>.*?<\/button>/gis,
  
  // Style tags
  /<style[^>]*>.*?<\/style>/gis,
  /style\s*=\s*["'][^"']*["']/gi,
  
  // HTML entities that could be dangerous
  /&#x[0-9a-fA-F]+;?/g,
  /&#[0-9]+;?/g,
];

/**
 * SQL injection patterns
 * Comprehensive detection for various SQL injection techniques
 */
const SQL_INJECTION_PATTERNS = [
  // Union-based injections
  /(\b(UNION|union)\s+(ALL\s+)?(SELECT|select))/i,
  /(\b(SELECT|select)\b.*\b(FROM|from)\b.*\b(WHERE|where)\b.*(\bOR\b|\bAND\b).*=)/i,
  
  // Boolean-based injections
  /(\b(OR|or|AND|and)\s+(\d+\s*[=<>!]+\s*\d+|\w+\s*[=<>!]+\s*\w+))/i,
  /('.*'.*=.*'.*'|".*".*=.*".*")/i,
  
  // Time-based injections
  /(\b(WAITFOR|waitfor)\s+(DELAY|delay)|BENCHMARK\s*\(|pg_sleep\s*\()/i,
  
  // Error-based injections
  /(\b(CAST|cast|CONVERT|convert)\s*\(.*\b(AS|as)\s+(INT|int|VARCHAR|varchar))/i,
  
  // Stacked queries
  /;\s*(DROP|drop|DELETE|delete|INSERT|insert|UPDATE|update|CREATE|create|ALTER|alter)\s+/i,
  
  // Comment injections
  /(--|#|\/\*|\*\/)/,
  
  // Information schema queries
  /\b(information_schema|INFORMATION_SCHEMA)\./i,
  
  // Database-specific functions
  /\b(version|user|database|schema)\s*\(\s*\)/i,
  /\b(load_file|into\s+outfile|dumpfile)\b/i,
];

/**
 * NoSQL injection patterns
 */
const NOSQL_INJECTION_PATTERNS = [
  /\$where\s*:/i,
  /\$ne\s*:/i,
  /\$gt\s*:/i,
  /\$gte\s*:/i,
  /\$lt\s*:/i,
  /\$lte\s*:/i,
  /\$regex\s*:/i,
  /\$in\s*:/i,
  /\$nin\s*:/i,
  /\$exists\s*:/i,
  /\$eval\s*:/i,
  /this\.\w+/i,
];

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\/+/g,
  /\.\.\\+/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\x2e\x2e\x2f/g,
  /\x2e\x2e\x5c/g,
];

/**
 * Advanced sanitization class
 */
class AdvancedSanitizer {
  /**
   * Sanitize string input for XSS prevention
   */
  sanitizeXSS(input: string): string {
    let sanitized = input;
    
    // Remove dangerous patterns
    XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // Encode remaining HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    return sanitized.trim();
  }
  
  /**
   * Check for SQL injection patterns
   */
  detectSQLInjection(input: string): boolean {
    return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }
  
  /**
   * Check for NoSQL injection patterns
   */
  detectNoSQLInjection(input: any): boolean {
    if (typeof input === 'string') {
      return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
    }
    
    if (typeof input === 'object' && input !== null) {
      const stringified = JSON.stringify(input);
      return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(stringified));
    }
    
    return false;
  }
  
  /**
   * Check for path traversal attempts
   */
  detectPathTraversal(input: string): boolean {
    return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
  }
  
  /**
   * Sanitize file names and paths
   */
  sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .substring(0, 255);
  }
  
  /**
   * Comprehensive input sanitization
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Check for various injection patterns
      if (this.detectSQLInjection(input)) {
        throw new Error('SQL injection pattern detected');
      }
      
      if (this.detectNoSQLInjection(input)) {
        throw new Error('NoSQL injection pattern detected');
      }
      
      if (this.detectPathTraversal(input)) {
        throw new Error('Path traversal attempt detected');
      }
      
      // Sanitize for XSS
      return this.sanitizeXSS(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      // Check for NoSQL injection in objects
      if (this.detectNoSQLInjection(input)) {
        throw new Error('NoSQL injection pattern detected in object');
      }
      
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        // Sanitize keys
        const cleanKey = this.sanitizeXSS(key);
        sanitized[cleanKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}

// Global sanitizer instance
export const advancedSanitizer = new AdvancedSanitizer();

/**
 * Enhanced input sanitization middleware
 */
export function advancedSanitizationMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = advancedSanitizer.sanitizeInput(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = advancedSanitizer.sanitizeInput(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = advancedSanitizer.sanitizeInput(req.params);
    }
    
    // Check for suspicious file upload patterns
    if (req.files || req.file) {
      const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
      
      for (const file of files) {
        if (file && typeof file === 'object' && 'originalname' in file) {
          // Validate file name
          if (advancedSanitizer.detectPathTraversal(file.originalname)) {
            res.status(400).json({
              error: 'INVALID_FILE_NAME',
              message: 'Invalid file name detected',
              timestamp: new Date().toISOString(),
            });
            return;
          }
          
          // Sanitize file name
          (file as any).originalname = advancedSanitizer.sanitizeFileName(file.originalname);
        }
      }
    }
    
    next();
  } catch (error) {
    console.warn(`Input sanitization blocked request from ${req.ip}:`, error.message);
    
    res.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Request blocked due to security policy violation',
      code: 'SANITIZATION_FAILED',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Content-Type validation middleware
 */
export function contentTypeValidationMiddleware(allowedTypes: string[] = ['application/json', 'multipart/form-data', 'application/x-www-form-urlencoded']) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const contentType = req.get('Content-Type') || '';
      const isAllowed = allowedTypes.some(type => contentType.includes(type));
      
      if (!isAllowed) {
        res.status(415).json({
          error: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Content-Type not allowed',
          allowed: allowedTypes,
          received: contentType,
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }
    
    next();
  };
}

/**
 * Request size validation middleware
 */
export function requestSizeValidationMiddleware(maxSize: number = 50 * 1024 * 1024) { // 50MB default
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      res.status(413).json({
        error: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds maximum allowed size',
        maxSize: maxSize,
        received: parseInt(contentLength),
        timestamp: new Date().toISOString(),
      });
      return;
    }
    
    next();
  };
}

/**
 * Schema-based advanced validation middleware
 */
export function advancedSchemaValidation(schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validationErrors: Array<{ field: string; message: string; code: string }> = [];
      
      // Validate body
      if (schemas.body && req.body) {
        const bodyResult = schemas.body.safeParse(req.body);
        if (!bodyResult.success) {
          bodyResult.error.errors.forEach(err => {
            validationErrors.push({
              field: `body.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            });
          });
        } else {
          req.body = bodyResult.data;
        }
      }
      
      // Validate query
      if (schemas.query && req.query) {
        const queryResult = schemas.query.safeParse(req.query);
        if (!queryResult.success) {
          queryResult.error.errors.forEach(err => {
            validationErrors.push({
              field: `query.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            });
          });
        } else {
          req.query = queryResult.data;
        }
      }
      
      // Validate params
      if (schemas.params && req.params) {
        const paramsResult = schemas.params.safeParse(req.params);
        if (!paramsResult.success) {
          paramsResult.error.errors.forEach(err => {
            validationErrors.push({
              field: `params.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            });
          });
        } else {
          req.params = paramsResult.data;
        }
      }
      
      // Validate headers
      if (schemas.headers) {
        const headersResult = schemas.headers.safeParse(req.headers);
        if (!headersResult.success) {
          headersResult.error.errors.forEach(err => {
            validationErrors.push({
              field: `headers.${err.path.join('.')}`,
              message: err.message,
              code: err.code,
            });
          });
        }
      }
      
      if (validationErrors.length > 0) {
        res.status(400).json({
          error: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          details: validationErrors,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      next();
    } catch (error) {
      console.error('Schema validation error:', error);
      res.status(500).json({
        error: 'VALIDATION_SYSTEM_ERROR',
        message: 'Validation system encountered an error',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Export utility functions
 */
export const inputSanitizationUtils = {
  sanitizeXSS: (input: string) => advancedSanitizer.sanitizeXSS(input),
  detectSQLInjection: (input: string) => advancedSanitizer.detectSQLInjection(input),
  detectNoSQLInjection: (input: any) => advancedSanitizer.detectNoSQLInjection(input),
  detectPathTraversal: (input: string) => advancedSanitizer.detectPathTraversal(input),
  sanitizeFileName: (fileName: string) => advancedSanitizer.sanitizeFileName(fileName),
} as const;