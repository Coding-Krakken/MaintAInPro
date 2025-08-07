import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { camelToSnake, snakeToCamel, validateAndTransform } from '../../shared/validation-utils';

/**
 * Enhanced validation middleware with field mapping and comprehensive error handling
 */

export interface ValidationOptions {
  // Where to validate (body, query, params)
  source?: 'body' | 'query' | 'params' | 'headers';
  // Whether to transform field names (camelCase ↔ snake_case)
  transformFields?: boolean;
  // Whether to strip unknown fields
  stripUnknown?: boolean;
  // Custom error handler
  errorHandler?: (error: any, req: Request, res: Response, next: NextFunction) => void;
}

/**
 * Create validation middleware for schema validation with field mapping
 */
export function validateSchema<T extends z.ZodSchema>(
  schema: T, 
  options: ValidationOptions = {}
) {
  const {
    source = 'body',
    transformFields = true,
    stripUnknown = true,
    errorHandler
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get data from the specified source
      let data = req[source];
      
      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `No ${source} data provided`,
          details: []
        });
      }

      // Transform field names if enabled
      if (transformFields && typeof data === 'object') {
        // Convert snake_case to camelCase for schema validation
        data = snakeToCamel(data);
      }

      // Validate with schema
      const result = schema.safeParse(data);

      if (!result.success) {
        const errorDetails = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: err.code === 'invalid_type' ? typeof (err as any).received : undefined
        }));

        const validationError = {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: errorDetails,
          timestamp: new Date().toISOString()
        };

        if (errorHandler) {
          return errorHandler(validationError, req, res, next);
        }

        return res.status(400).json(validationError);
      }

      // Transform back to snake_case for database operations if needed
      let validatedData = result.data;
      if (transformFields && typeof validatedData === 'object') {
        validatedData = camelToSnake(validatedData);
      }

      // Attach validated data to request
      (req as any).validated = validatedData;
      
      // Log successful validation in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Validation successful for ${req.method} ${req.path}`, {
          source,
          fieldsCount: Object.keys(validatedData).length
        });
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      const serverError = {
        success: false,
        error: 'VALIDATION_SERVER_ERROR',
        message: 'Internal validation error',
        timestamp: new Date().toISOString()
      };

      if (errorHandler) {
        return errorHandler(serverError, req, res, next);
      }

      return res.status(500).json(serverError);
    }
  };
}

/**
 * Validate query parameters with automatic type coercion
 */
export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return validateSchema(schema, { 
    source: 'query',
    transformFields: true
  });
}

/**
 * Validate URL parameters
 */
export function validateParams<T extends z.ZodSchema>(schema: T) {
  return validateSchema(schema, { 
    source: 'params',
    transformFields: false // Params usually don't need field transformation
  });
}

/**
 * Validate request headers
 */
export function validateHeaders<T extends z.ZodSchema>(schema: T) {
  return validateSchema(schema, { 
    source: 'headers',
    transformFields: false
  });
}

/**
 * Create a comprehensive validation chain for complex endpoints
 */
export function validationChain(validations: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  headers?: z.ZodSchema;
}) {
  const middlewares: any[] = [];

  if (validations.params) {
    middlewares.push(validateParams(validations.params));
  }
  
  if (validations.query) {
    middlewares.push(validateQuery(validations.query));
  }
  
  if (validations.headers) {
    middlewares.push(validateHeaders(validations.headers));
  }
  
  if (validations.body) {
    middlewares.push(validateSchema(validations.body, { source: 'body' }));
  }

  return middlewares;
}

/**
 * Sanitize and normalize common field types
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitizeObject = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Trim whitespace and normalize empty strings to null
        sanitized[key] = value.trim() || null;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'string' ? item.trim() : item
        );
      } else if (value && typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  // Sanitize body, query, and params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
}

/**
 * Common validation schemas for reuse across endpoints
 */
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: z.object({
    id: z.string().uuid('Invalid ID format')
  }),
  
  // Pagination query validation
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // Search query validation
  search: z.object({
    query: z.string().min(1).max(255),
    fields: z.array(z.string()).optional()
  }),
  
  // Date range validation
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  }).refine(data => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date'
  })
};

export default {
  validateSchema,
  validateQuery,
  validateParams,
  validateHeaders,
  validationChain,
  sanitizeInput,
  commonSchemas
};
