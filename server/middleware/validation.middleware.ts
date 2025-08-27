import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { Request, Response, NextFunction } from 'express';
import { AuthenticatedUser } from '../../shared/types/auth';
/**
 * Production-Grade API Validation Middleware
 *
 * Comprehensive validation system implementing:
 * - Zod schema validation with enhanced error reporting
 * - Field mapping between camelCase and snake_case
 * - Request/response transformation
 * - Performance monitoring and caching
 * - Security validation and sanitization
 * - Multi-tenant context validation
 */
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { snakeToCamel, fieldValidators, createFlexibleSchema } from '../../shared/validation-utils';

// =============================================================================
// TYPE EXTENSIONS
// =============================================================================

declare global {
  namespace Express {
    interface Request {
  validatedBody?: Record<string, unknown>;
  originalBody?: Record<string, unknown>;
  validatedQuery?: Record<string, unknown>;
  validatedParams?: Record<string, unknown>;
      user?: AuthenticatedUser;
      organizationId?: string;
    }
  }
}

// =============================================================================
// ENHANCED REQUEST VALIDATION MIDDLEWARE
// =============================================================================

export class ValidationMiddleware {
  /**
   * Create validation middleware for request body with enhanced error handling
   */
  public static validateBody<T extends z.ZodSchema>(schema: T, context?: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Normalize field names for validation
        const normalizedBody = req.body ? snakeToCamel(req.body) : {};

        // Validate against schema
        const result = schema.safeParse(normalizedBody);

        if (!result.success) {
          const errorDetails = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.path.reduce((obj: unknown, key) => (typeof obj === 'object' && obj !== null ? (obj as Record<string, unknown>)[key] : undefined), req.body),
          }));

          return res.status(400).json({
            type: 'VALIDATION_ERROR',
            message: `Request validation failed${context ? ` for ${context}` : ''}`,
            errors: errorDetails,
            statusCode: 400,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }

        // Attach validated and transformed data to request
        req.validatedBody = result.data;
        req.originalBody = req.body;
        req.body = result.data; // Keep backward compatibility

        next();
      } catch (_error) {
        console.error('❌ Validation middleware _error:', _error);
        return res.status(500).json({
          type: 'INTERNAL_ERROR',
          message: 'Validation processing failed',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }
    };
  }

  /**
   * Create validation middleware for query parameters
   */
  public static validateQuery<T extends z.ZodSchema>(schema: T, context?: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.safeParse(req.query);

        if (!result.success) {
          const errorDetails = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.path.reduce((obj: unknown, key) => (typeof obj === 'object' && obj !== null ? (obj as Record<string, unknown>)[key] : undefined), req.query),
          }));

          return res.status(400).json({
            type: 'VALIDATION_ERROR',
            message: `Query parameter validation failed${context ? ` for ${context}` : ''}`,
            errors: errorDetails,
            statusCode: 400,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }

        req.validatedQuery = result.data;
        next();
      } catch (_error) {
        console.error('❌ Query validation _error:', _error);
        return res.status(500).json({
          type: 'INTERNAL_ERROR',
          message: 'Query validation failed',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }
    };
  }

  /**
   * Create validation middleware for URL parameters
   */
  public static validateParams<T extends z.ZodSchema>(schema: T, context?: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.safeParse(req.params);

        if (!result.success) {
          const errorDetails = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.path.reduce((obj: unknown, key) => (typeof obj === 'object' && obj !== null ? (obj as Record<string, unknown>)[key] : undefined), req.params),
          }));

          return res.status(400).json({
            type: 'VALIDATION_ERROR',
            message: `URL parameter validation failed${context ? ` for ${context}` : ''}`,
            errors: errorDetails,
            statusCode: 400,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }

        req.validatedParams = result.data;
        next();
      } catch (_error) {
        console.error('❌ Parameter validation _error:', _error);
        return res.status(500).json({
          type: 'INTERNAL_ERROR',
          message: 'Parameter validation failed',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }
    };
  }

  /**
   * Multi-tenant organization validation middleware
   */
  public static validateOrganizationAccess() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const organizationId = req.headers['x-organization-id'] as string;
        const userOrganizationId = req.user?.organizationId;

        if (!organizationId) {
          return res.status(400).json({
            type: 'VALIDATION_ERROR',
            message: 'Organization ID header is required',
            statusCode: 400,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(organizationId)) {
          return res.status(400).json({
            type: 'VALIDATION_ERROR',
            message: 'Invalid organization ID format',
            statusCode: 400,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }

        // Check if user has access to this organization
        if (userOrganizationId && userOrganizationId !== organizationId) {
          return res.status(403).json({
            type: 'AUTHORIZATION_ERROR',
            message: 'Access denied to this organization',
            statusCode: 403,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }

        req.organizationId = organizationId;
        next();
      } catch (_error) {
        console.error('❌ Organization validation _error:', _error);
        return res.status(500).json({
          type: 'INTERNAL_ERROR',
          message: 'Organization validation failed',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        });
      }
    };
  }

  /**
   * Response transformation middleware
   */
  public static transformResponse() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalJson = res.json.bind(res);

  res.json = function (data: unknown) {
        try {
          // Transform database field names to API field names for successful responses
          if (data && typeof data === 'object') {
            const d = data as Record<string, unknown>;
            if (!('type' in d) && !('message' in d)) {
              if (Array.isArray(data)) {
                data = (data as Array<Record<string, unknown>>).map(item => snakeToCamel(item));
              } else if ('data' in d && Array.isArray(d.data)) {
                d.data = (d.data as Array<Record<string, unknown>>).map(item => snakeToCamel(item));
              } else {
                data = snakeToCamel(d);
              }
            }
          }

          // Add metadata to successful responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            let responseData: Record<string, unknown>;
            if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
              responseData = {
                ...(data as Record<string, unknown>),
                _metadata: {
                  timestamp: new Date().toISOString(),
                  requestId: req.headers['x-request-id'] || 'unknown',
                  statusCode: res.statusCode,
                  organizationId: req.organizationId,
                },
              };
            } else {
              responseData = {
                _metadata: {
                  timestamp: new Date().toISOString(),
                  requestId: req.headers['x-request-id'] || 'unknown',
                  statusCode: res.statusCode,
                  organizationId: req.organizationId,
                },
              };
            }
            return originalJson(responseData);
          }

          return originalJson(data);
        } catch (_error) {
          console.error('❌ Response transformation _error:', _error);
          return originalJson({
            type: 'TRANSFORMATION_ERROR',
            message: 'Response transformation failed',
            statusCode: 500,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          });
        }
      };

      next();
    };
  }
}

// Legacy support - keeping the original function for backward compatibility
export const createValidationMiddleware = <T extends z.ZodSchema>(schema: T) => {
  return ValidationMiddleware.validateBody(schema);
};

// =============================================================================
// ENHANCED SCHEMA DEFINITIONS FOR API ENDPOINTS
// =============================================================================

export const apiSchemas = {
  // Work Order Schemas
  createWorkOrder: createFlexibleSchema({
    foNumber: z
      .string()
      .min(1, 'FO Number is required')
      .regex(/^WO-[A-Z0-9-]+$/, 'FO Number must follow format: WO-XXX-XXX'),
    type: fieldValidators.workOrderType,
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description cannot exceed 2000 characters'),
    area: z.string().optional(),
    assetModel: z.string().optional(),
    status: fieldValidators.workOrderStatus,
    priority: fieldValidators.priority,
    requestedBy: fieldValidators.requiredUuid('Requested by'),
    assignedTo: fieldValidators.optionalUuid('Assigned to'),
    equipmentId: fieldValidators.optionalUuid('Equipment ID'),
    warehouseId: fieldValidators.optionalUuid('Warehouse ID'),
    dueDate: fieldValidators.optionalDate,
    estimatedHours: z
      .union([z.string(), z.number()])
      .optional()
      .transform(val => (typeof val === 'string' ? parseFloat(val) : val))
      .pipe(z.number().min(0, 'Estimated hours cannot be negative').optional()),
    notes: z.string().optional(),
    followUp: z.boolean().default(false),
    escalated: z.boolean().default(false),
    escalationLevel: z.number().min(0).max(10).default(0),
  }),

  updateWorkOrder: createFlexibleSchema({
    type: fieldValidators.workOrderType.optional(),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional(),
    area: z.string().optional(),
    assetModel: z.string().optional(),
    status: fieldValidators.workOrderStatus.optional(),
    priority: fieldValidators.priority.optional(),
    assignedTo: fieldValidators.optionalUuid('Assigned to'),
    equipmentId: fieldValidators.optionalUuid('Equipment ID'),
    dueDate: fieldValidators.optionalDate,
    completedAt: fieldValidators.optionalDate,
    verifiedBy: fieldValidators.optionalUuid('Verified by'),
    estimatedHours: z
      .union([z.string(), z.number()])
      .optional()
      .transform(val => (typeof val === 'string' ? parseFloat(val) : val))
      .pipe(z.number().min(0, 'Estimated hours cannot be negative').optional()),
    actualHours: z
      .union([z.string(), z.number()])
      .optional()
      .transform(val => (typeof val === 'string' ? parseFloat(val) : val))
      .pipe(z.number().min(0, 'Actual hours cannot be negative').optional()),
    notes: z.string().optional(),
    followUp: z.boolean().optional(),
    escalated: z.boolean().optional(),
    escalationLevel: z.number().min(0).max(10).optional(),
  }),

  workOrderQuery: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    query: z.string().optional(),
    status: z
      .enum(['new', 'assigned', 'in_progress', 'completed', 'verified', 'closed'])
      .optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    assignedTo: z.string().uuid().optional(),
    equipmentId: z.string().uuid().optional(),
    sortBy: z
      .enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status'])
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Equipment Schemas
  createEquipment: createFlexibleSchema({
    assetTag: z
      .string()
      .min(1, 'Asset tag is required')
      .regex(/^[A-Z0-9-]+$/, 'Asset tag must contain only uppercase letters, numbers, and hyphens'),
    model: fieldValidators.nonEmptyString('Model'),
    description: z.string().optional(),
    area: z.string().optional(),
    status: fieldValidators.status,
    criticality: fieldValidators.priority,
    installDate: fieldValidators.optionalDate,
    warrantyExpiry: fieldValidators.optionalDate,
    manufacturer: z.string().optional(),
    serialNumber: z.string().optional(),
    specifications: fieldValidators.optionalJsonObject,
    warehouseId: fieldValidators.optionalUuid('Warehouse ID'),
    qrCode: z.string().optional(),
  }),

  updateEquipment: createFlexibleSchema({
    model: fieldValidators.nonEmptyString('Model').optional(),
    description: z.string().optional(),
    area: z.string().optional(),
    status: fieldValidators.status.optional(),
    criticality: fieldValidators.priority.optional(),
    installDate: fieldValidators.optionalDate,
    warrantyExpiry: fieldValidators.optionalDate,
    manufacturer: z.string().optional(),
    serialNumber: z.string().optional(),
    specifications: fieldValidators.optionalJsonObject,
    qrCode: z.string().optional(),
  }),

  equipmentQuery: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    query: z.string().optional(),
    status: z.enum(['active', 'inactive', 'maintenance', 'retired']).optional(),
    criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    area: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt', 'assetTag', 'model']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // URL Parameter Schemas
  uuidParam: z.object({
    id: z.string().uuid('Invalid UUID format'),
  }),

  // Common Query Schemas
  paginationQuery: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),

  searchQuery: z.object({
    query: z.string().min(1, 'Search query cannot be empty').optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
};

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

/**
 * Enhanced security middleware with comprehensive protection
 */
export const securityMiddleware = [
  // Helmet for security headers
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),

  // Rate limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      type: 'RATE_LIMIT_ERROR',
      message: 'Too many requests from this IP, please try again later',
      statusCode: 429,
      timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests from this IP, please try again later',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    },
  }),

  // Request sanitization
  (req: Request, res: Response, next: NextFunction) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
  req.query = sanitizeObject(req.query) as ParsedQs;
    }

    next();
  },
];

/**
 * Sanitize object by removing potentially dangerous properties
 */
function sanitizeObject(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...(obj as Record<string, unknown>) };

  // Remove potentially dangerous properties
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  dangerousKeys.forEach(key => {
    delete sanitized[key];
  });

  // Recursively sanitize nested objects
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  });

  return sanitized;
}

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Enhanced error handling middleware with detailed error responses
 */
export const handleValidationError = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof z.ZodError) {
    const parsedError = {
      success: false,
      message: 'Validation failed',
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
      statusCode: 400,
    };

    return res.status(400).json(parsedError);
  }

  // Handle other validation errors
  if ((error as Error).name === 'ValidationError') {
    return res.status(400).json({
      success: false,
  message: (error as Error).message,
      statusCode: 400,
    });
  }

  // Pass through to default error handler
  next(error);
};

/**
 * Response transformation middleware to ensure consistent camelCase output
 */
export const transformResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;

  res.json = function (body: unknown) {
    // Transform response to camelCase for frontend consistency
    if (body && typeof body === 'object') {
      if (Array.isArray(body)) {
        body = body.map(item =>
          typeof item === 'object' && item !== null ? snakeToCamel(item) : item
        );
      } else {
        if (typeof body === 'object' && body !== null) {
          body = snakeToCamel(body as Record<string, unknown>);
        }
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
  const sanitizeValue = (value: unknown): unknown => {
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
  const sanitized: Record<string, unknown> = {};
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
  req.query = sanitizeValue(req.query) as ParsedQs;
  }

  if (req.params) {
  req.params = sanitizeValue(req.params) as ParamsDictionary;
  }

  next();
};

/**
 * Enhanced error handling middleware
 */
export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
  const errObj = error as { message?: string; stack?: string; type?: string; errors?: unknown[]; code?: string };
  console.error('API Error:', {
    path: req.path,
    method: req.method,
    error: errObj.message,
    stack: errObj.stack,
    timestamp: new Date().toISOString(),
    userId: ((req as unknown) as Record<string, unknown>).user && typeof ((req as unknown) as Record<string, unknown>).user === 'object' ? (((req as unknown) as Record<string, unknown>).user as { id?: string }).id : undefined,
    requestId: req.headers['x-request-id'],
  });

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((err: unknown) => {
        if (typeof err === 'object' && err !== null) {
          const e = err as { path: string[]; message: string; code: string };
          return {
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          };
        }
        return err;
      }),
    });
  }

  // Handle known application errors
  if (errObj.type === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      message: errObj.message || 'Validation error',
      errors: errObj.errors || [],
    });
  }
  if (errObj.type === 'NOT_FOUND') {
    return res.status(404).json({
      success: false,
      message: errObj.message,
    });
  }
  if (errObj.type === 'UNAUTHORIZED') {
    return res.status(401).json({
      success: false,
      message: errObj.message,
    });
  }
// ...existing code...

  // Generic server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : errObj.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: errObj.stack }),
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId =
    req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add request ID to response headers
  res.setHeader('x-request-id', requestId);

  // Log request
  console.log(`[${requestId}] ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  userId: ((req as unknown) as Record<string, unknown>).user && typeof ((req as unknown) as Record<string, unknown>).user === 'object' ? (((req as unknown) as Record<string, unknown>).user as { id?: string }).id : undefined,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Log response
  const originalJson = res.json;
  res.json = function (body: unknown) {
    const duration = Date.now() - start;

    console.log(`[${requestId}] Response ${res.statusCode}`, {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: JSON.stringify(body).length,
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
  ((req as unknown) as Record<string, unknown>).pagination = {
    page,
    limit,
    offset,
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
  ((req as unknown) as Record<string, unknown>).selectedFields = selectedFields;
  }

  next();
};
