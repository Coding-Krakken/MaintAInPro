import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateAndTransform, snakeToCamel, camelToSnake } from '../../shared/validation-utils';

/**
 * Enhanced validation middleware with field transformation
 */
export const createValidationMiddleware = <T extends z.ZodSchema>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Transform request body to handle both camelCase and snake_case
      const transformedBody = req.body ? snakeToCamel(req.body) : {};
      
      // Validate and transform the data
      const validatedData = validateAndTransform(schema)(transformedBody);
      
      // Replace request body with validated data
      req.body = validatedData;
      
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      let errorResponse;
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.type === 'VALIDATION_ERROR') {
          errorResponse = {
            success: false,
            message: parsedError.message,
            errors: parsedError.errors,
            statusCode: 400
          };
        }
      } catch {
        // Fall back to generic error
        errorResponse = {
          success: false,
          message: 'Invalid request data',
          error: error.message,
          statusCode: 400
        };
      }
      
      return res.status(400).json(errorResponse);
    }
  };
};

/**
 * Response transformation middleware to ensure consistent camelCase output
 */
export const transformResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Transform response to camelCase for frontend consistency
    if (body && typeof body === 'object') {
      if (Array.isArray(body)) {
        body = body.map(item => 
          typeof item === 'object' && item !== null ? snakeToCamel(item) : item
        );
      } else {
        body = snakeToCamel(body);
      }
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Enhanced request sanitization
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      // Basic XSS prevention
      return value
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (value && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitizeValue(val);
      }
      return sanitized;
    }
    
    return value;
  };
  
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  
  next();
};

/**
 * Enhanced error handling middleware
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userId: (req as any).user?.id,
    requestId: req.headers['x-request-id']
  });
  
  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    });
  }
  
  // Handle known application errors
  if (error.type === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      message: error.message,
      errors: error.errors
    });
  }
  
  if (error.type === 'NOT_FOUND') {
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
  
  if (error.type === 'UNAUTHORIZED') {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
  
  if (error.type === 'FORBIDDEN') {
    return res.status(403).json({
      success: false,
      message: error.message
    });
  }
  
  // Database constraint errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'Duplicate entry'
    });
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference',
      error: 'Referenced resource does not exist'
    });
  }
  
  // Generic server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);
  
  // Log request
  console.log(`[${requestId}] ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    userId: (req as any).user?.id,
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });
  
  // Log response
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = Date.now() - start;
    
    console.log(`[${requestId}] Response ${res.statusCode}`, {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: JSON.stringify(body).length
    });
    
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Pagination middleware
 */
export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 100); // Max 100 items per page
  const offset = (page - 1) * limit;
  
  // Add pagination info to request
  (req as any).pagination = {
    page,
    limit,
    offset
  };
  
  next();
};

/**
 * Field selection middleware for optimized queries
 */
export const fieldSelectionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const fields = req.query.fields as string;
  
  if (fields) {
    const selectedFields = fields.split(',').map(field => field.trim());
    (req as any).selectedFields = selectedFields;
  }
  
  next();
};
