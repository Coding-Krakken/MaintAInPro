import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
import { 
  validateAndTransform, 
  camelToSnake, 
  snakeToCamel,
  fieldValidators 
} from '@shared/validation-utils';

/**
 * Enhanced validation middleware with comprehensive error handling and audit logging
 * Aligned with DatabaseImplementation.md specifications
 */

// Enhanced request interface with audit context
export interface EnhancedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
    sessionId: string;
  };
  auditContext?: {
    requestId: string;
    correlationId: string;
    startTime: number;
    ipAddress: string;
    userAgent: string;
  };
  validatedData?: any;
  validated?: any; // For backwards compatibility
  organizationId?: string;
}

export interface ValidationOptions {
  source?: 'body' | 'query' | 'params' | 'headers';
  transformFields?: boolean;
  stripUnknown?: boolean;
  errorHandler?: (error: any, req: Request, res: Response, next: NextFunction) => void;
  // Enhanced options
  auditValidation?: boolean;
  requireOrganization?: boolean;
  fieldMapping?: 'camelToSnake' | 'snakeToCamel' | 'none';
}

interface AuditOptions {
  action: string;
  entityType: string;
  entityId?: string;
  sensitivity?: 'low' | 'medium' | 'high' | 'critical';
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

/**
 * Enhanced request correlation and tracking middleware
 */
export const requestCorrelationMiddleware = (
  req: EnhancedRequest,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  
  req.auditContext = {
    requestId,
    correlationId,
    startTime: Date.now(),
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };

  // Add correlation headers to response
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);

  // Enhanced logging with structured format
  console.log(`[${requestId}] ${req.method} ${req.url}`, {
    correlationId,
    ip: req.auditContext.ipAddress,
    userAgent: req.auditContext.userAgent,
    contentLength: req.headers['content-length'],
    timestamp: new Date().toISOString(),
  });

  next();
};

/**
 * Multi-tenant organization context middleware
 */
export const organizationContextMiddleware = (
  req: EnhancedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract organization context from user, headers, or subdomain
  let organizationId: string | undefined;

  // Priority 1: From authenticated user
  if (req.user?.organizationId) {
    organizationId = req.user.organizationId;
  }
  // Priority 2: From request headers
  else if (req.headers['x-organization-id']) {
    organizationId = req.headers['x-organization-id'] as string;
  }
  // Priority 3: From subdomain (e.g., tenant.domain.com)
  else if (req.hostname) {
    const subdomain = req.hostname.split('.')[0];
    if (subdomain !== 'www' && subdomain !== 'api') {
      organizationId = subdomain;
    }
  }

  req.organizationId = organizationId;
  
  // Validate organization access if required
  if (req.user && organizationId && req.user.organizationId !== organizationId) {
    return res.status(403).json({
      error: 'ORGANIZATION_ACCESS_DENIED',
      message: 'User does not have access to the specified organization',
      requestId: req.auditContext?.requestId,
    });
  }

  next();
};

/**
 * Create enhanced validation middleware for schema validation with field mapping
 */
export function validateSchema<T extends z.ZodSchema>(
  schema: T, 
  options: ValidationOptions = {}
) {
  const {
    source = 'body',
    transformFields = true,
    stripUnknown = true,
    errorHandler,
    auditValidation = false,
    requireOrganization = false,
    fieldMapping = 'snakeToCamel'
  } = options;

  return async (req: EnhancedRequest, res: Response, next: NextFunction) => {
    try {
      // Check organization requirement
      if (requireOrganization && !req.organizationId) {
        return res.status(400).json({
          success: false,
          error: 'ORGANIZATION_REQUIRED',
          message: 'Organization context is required for this operation',
          requestId: req.auditContext?.requestId,
        });
      }

      // Get data from the specified source
      let data = req[source];
      
      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `No ${source} data provided`,
          details: [],
          requestId: req.auditContext?.requestId,
        });
      }

      // Apply field transformation based on mapping
      if (transformFields && typeof data === 'object') {
        if (fieldMapping === 'snakeToCamel') {
          data = snakeToCamel(data);
        } else if (fieldMapping === 'camelToSnake') {
          data = camelToSnake(data);
        }
      }

      // Enhanced validation using validateAndTransform utility
      let validatedData;
      try {
        validatedData = validateAndTransform(schema)(data);
      } catch (validationError) {
        let errorDetails;
        
        try {
          errorDetails = JSON.parse(validationError.message);
        } catch {
          errorDetails = {
            type: 'VALIDATION_ERROR',
            message: validationError.message,
            errors: [{ field: 'unknown', message: validationError.message, code: 'invalid' }]
          };
        }

        // Log validation failure for security monitoring
        if (auditValidation && req.user && req.auditContext) {
          console.warn(`[${req.auditContext.requestId}] Validation failed`, {
            userId: req.user.id,
            organizationId: req.organizationId,
            method: req.method,
            url: req.url,
            errors: errorDetails.errors,
            source,
          });
        }

        const response = {
          success: false,
          error: errorDetails.type || 'VALIDATION_ERROR',
          message: errorDetails.message || 'Request validation failed',
          errors: errorDetails.errors || [],
          requestId: req.auditContext?.requestId,
          timestamp: new Date().toISOString(),
        };

        if (errorHandler) {
          return errorHandler(response, req, res, next);
        }

        return res.status(400).json(response);
      }

      // Transform back for database operations if needed
      if (transformFields && typeof validatedData === 'object' && fieldMapping === 'snakeToCamel') {
        // Keep both formats for flexibility
        req.validatedData = validatedData; // camelCase for API
        req.validated = camelToSnake(validatedData); // snake_case for DB
      } else {
        req.validatedData = validatedData;
        req.validated = validatedData;
      }

      // Log successful validation in development or if audit is enabled
      if (process.env.NODE_ENV === 'development' || auditValidation) {
        console.log(`✅ Validation successful for ${req.method} ${req.path}`, {
          requestId: req.auditContext?.requestId,
          source,
          fieldsCount: Object.keys(validatedData || {}).length,
          organizationId: req.organizationId,
        });
      }

      next();
    } catch (error) {
      console.error(`[${req.auditContext?.requestId}] Validation middleware error:`, error);
      
      const serverError = {
        success: false,
        error: 'VALIDATION_SERVER_ERROR',
        message: 'Internal validation error',
        requestId: req.auditContext?.requestId,
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
 * Enhanced error handling middleware with correlation tracking
 */
export const enhancedErrorHandler = (
  error: Error,
  req: EnhancedRequest,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.auditContext?.requestId || 'unknown';
  const correlationId = req.auditContext?.correlationId || 'unknown';
  
  // Log error with full context
  console.error(`[${requestId}] Unhandled error:`, {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    organizationId: req.organizationId,
    correlationId,
    timestamp: new Date().toISOString(),
  });

  // Send structured error response
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' 
      ? 'An internal server error occurred' 
      : error.message,
    requestId,
    correlationId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Enhanced rate limiting with organization-based limits
 */
export const createEnhancedRateLimit = (config: {
  windowMs: number;
  maxRequests: number;
  perOrganization?: boolean;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.maxRequests,
    keyGenerator: (req: EnhancedRequest) => {
      if (config.perOrganization && req.organizationId) {
        return `${req.organizationId}:${req.ip}`;
      }
      return req.ip;
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests || false,
    handler: (req: EnhancedRequest, res: Response) => {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        requestId: req.auditContext?.requestId,
        retryAfter: Math.round(config.windowMs / 1000),
      });
    },
  });
};

/**
 * Security headers middleware
 */
export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * Performance monitoring middleware
 */
export const performanceMonitoringMiddleware = (
  req: EnhancedRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.url} took ${duration.toFixed(2)}ms`, {
        requestId: req.auditContext?.requestId,
        userId: req.user?.id,
        organizationId: req.organizationId,
        statusCode: res.statusCode,
      });
    }
  });

  next();
};

/**
 * Validate query parameters with automatic type coercion
 */
export function validateQuery<T extends z.ZodSchema>(schema: T, options?: Omit<ValidationOptions, 'source'>) {
  return validateSchema(schema, { 
    source: 'query',
    fieldMapping: 'snakeToCamel',
    ...options
  });
}

/**
 * Validate URL parameters
 */
export function validateParams<T extends z.ZodSchema>(schema: T, options?: Omit<ValidationOptions, 'source'>) {
  return validateSchema(schema, { 
    source: 'params',
    fieldMapping: 'none',
    ...options
  });
}

/**
 * Validate request headers
 */
export function validateHeaders<T extends z.ZodSchema>(schema: T, options?: Omit<ValidationOptions, 'source'>) {
  return validateSchema(schema, { 
    source: 'headers',
    fieldMapping: 'none',
    ...options
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
}, options?: ValidationOptions) {
  const middlewares: any[] = [];

  if (validations.params) {
    middlewares.push(validateParams(validations.params, options));
  }
  
  if (validations.query) {
    middlewares.push(validateQuery(validations.query, options));
  }
  
  if (validations.headers) {
    middlewares.push(validateHeaders(validations.headers, options));
  }
  
  if (validations.body) {
    middlewares.push(validateSchema(validations.body, { source: 'body', ...options }));
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
 * Enhanced common validation schemas with comprehensive field validation
 */
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: z.object({
    id: fieldValidators.requiredUuid('ID')
  }),
  
  // Enhanced pagination query validation
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // Enhanced search query validation
  search: z.object({
    q: z.string().optional(),
    filters: z.string().optional().transform(val => {
      try {
        return val ? JSON.parse(val) : {};
      } catch {
        return {};
      }
    }),
    tags: z.string().optional().transform(val => {
      try {
        return val ? val.split(',') : [];
      } catch {
        return [];
      }
    }),
  }),
  
  // Date range validation
  dateRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date()
  }).refine(data => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date'
  }),

  // Organization context validation
  organizationContext: z.object({
    organizationId: fieldValidators.requiredUuid('Organization ID')
  }),
};

export default {
  validateSchema,
  validateQuery,
  validateParams,
  validateHeaders,
  validationChain,
  sanitizeInput,
  commonSchemas,
  requestCorrelationMiddleware,
  organizationContextMiddleware,
  enhancedErrorHandler,
  createEnhancedRateLimit,
  securityHeadersMiddleware,
  performanceMonitoringMiddleware,
};
