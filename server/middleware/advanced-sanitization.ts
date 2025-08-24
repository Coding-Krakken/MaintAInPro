import { Request, Response, NextFunction } from 'express';
import { ParsedQs } from 'qs';
import { ParamsDictionary } from 'express-serve-static-core';
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
  /(\bunion\s+(all\s+)?select\b)/i,
  /(\bselect\b.*\bfrom\b.*\bwhere\b.*(\bor\b|\band\b).*=)/i,
  
  // Boolean-based injections
  /(\b(or|and)\s+\d+\s*[=<>!]+\s*\d+)/i,
  /(\b(or|and)\s+['"]\w*['"]?\s*[=<>!]+\s*['"]\w*['"]?)/i,
  /(('.*')|(".*"))\s*=\s*(('.*')|(".*"))/i,
  
  // Time-based injections
  /(\bwaitfor\s+delay\b|\bbenchmark\s*\(|\bpg_sleep\s*\()/i,
  
  // Error-based injections
  /(\bcast\s*\(.*\bas\s+(int|varchar)\b)/i,
  /(\bconvert\s*\(.*\bas\s+(int|varchar)\b)/i,
  
  // Stacked queries
  /;\s*(drop|delete|insert|update|create|alter)\s+/i,
  
  // Comment injections
  /(--[^\r\n]*|\/\*[\s\S]*?\*\/|#[^\r\n]*)/,
  
  // Information schema queries
  /\binformation_schema\b/i,
  
  // Database-specific functions
  /\b(version|user|database|schema|current_user|system_user)\s*\(\s*\)/i,
  /\b(load_file|into\s+outfile|dumpfile)\b/i,
  
  // Common injection patterns
  /\b(exec|execute)\s*\(/i,
  /('\s*(or|and)\s*')/i,
  /(--\s*$|#\s*$)/,
];

/**
 * NoSQL injection patterns
 */
const NOSQL_INJECTION_PATTERNS = [
  /\$where/i,
  /\$ne/i,
  /\$gt/i,
  /\$gte/i,
  /\$lt/i,
  /\$lte/i,
  /\$regex/i,
  /\$in/i,
  /\$nin/i,
  /\$exists/i,
  /\$eval/i,
  /this\.\w+/i,
  /function\s*\(/i,
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
    
    // Remove dangerous patterns first
    XSS_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    // Remove dangerous words/content that might remain
    sanitized = sanitized
      .replace(/alert\s*\(/gi, 'removed(')
      .replace(/document\./gi, 'removed.')
      .replace(/window\./gi, 'removed.')
      .replace(/eval\s*\(/gi, 'removed(')
      .replace(/setTimeout\s*\(/gi, 'removed(')
      .replace(/setInterval\s*\(/gi, 'removed(');
    
    // Encode remaining HTML entities
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
        // Remove null bytes and control characters using char codes to avoid regex lint error
        sanitized = sanitized.split('').filter(c => {
          const code = c.charCodeAt(0);
          return code > 31 && code !== 127;
        }).join('');
    
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
  detectNoSQLInjection(input: unknown): boolean {
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
  sanitizeInput(input: unknown): unknown {
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
      
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
        // Sanitize keys
        const cleanKey = this.sanitizeXSS(key);
        sanitized[cleanKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Sanitize query parameters (ParsedQs type-safe)
   */
  sanitizeQueryParams(query: ParsedQs): ParsedQs {
    const sanitized: ParsedQs = {};
    
    for (const [key, value] of Object.entries(query)) {
      const cleanKey = this.sanitizeXSS(key);
      
      if (typeof value === 'string') {
        // Check for injection patterns
        if (this.detectSQLInjection(value) || this.detectNoSQLInjection(value) || this.detectPathTraversal(value)) {
          throw new Error('Malicious pattern detected in query parameter');
        }
        sanitized[cleanKey] = this.sanitizeXSS(value);
      } else if (Array.isArray(value)) {
        sanitized[cleanKey] = value.map(item => {
          if (typeof item === 'string') {
            if (this.detectSQLInjection(item) || this.detectNoSQLInjection(item) || this.detectPathTraversal(item)) {
              throw new Error('Malicious pattern detected in query parameter array');
            }
            return this.sanitizeXSS(item);
          }
          return item;
        });
      } else if (value && typeof value === 'object') {
        sanitized[cleanKey] = this.sanitizeQueryParams(value as ParsedQs);
      } else {
        sanitized[cleanKey] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize URL parameters (ParamsDictionary type-safe)
   */
  sanitizeUrlParams(params: ParamsDictionary): ParamsDictionary {
    const sanitized: ParamsDictionary = {};
    
    for (const [key, value] of Object.entries(params)) {
      const cleanKey = this.sanitizeXSS(key);
      
      if (typeof value === 'string') {
        // Check for injection patterns
        if (this.detectSQLInjection(value) || this.detectNoSQLInjection(value) || this.detectPathTraversal(value)) {
          throw new Error('Malicious pattern detected in URL parameter');
        }
        sanitized[cleanKey] = this.sanitizeXSS(value);
      } else {
        sanitized[cleanKey] = value;
      }
    }
    
    return sanitized;
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
      req.query = advancedSanitizer.sanitizeQueryParams(req.query);
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = advancedSanitizer.sanitizeUrlParams(req.params);
    }
    
    // Check for suspicious file upload patterns
    if (req.files || req.file) {
      const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
      
      for (const file of files) {
        if (file && typeof file === 'object' && 'originalname' in file) {
          // Validate file name
          if (advancedSanitizer.detectPathTraversal(file.originalname as string)) {
            res.status(400).json({
              error: 'INVALID_FILE_NAME',
              message: 'Invalid file name detected',
              timestamp: new Date().toISOString(),
            });
            return;
          }
          
          // Sanitize file name
          (file as { originalname: string }).originalname = advancedSanitizer.sanitizeFileName(file.originalname as string);
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
  detectNoSQLInjection: (input: string | object) => advancedSanitizer.detectNoSQLInjection(input),
  detectPathTraversal: (input: string) => advancedSanitizer.detectPathTraversal(input),
  sanitizeFileName: (fileName: string) => advancedSanitizer.sanitizeFileName(fileName),
} as const;