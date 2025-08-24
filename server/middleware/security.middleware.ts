import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db';
import { eq } from 'drizzle-orm';

/**
 * Enhanced Security Middleware Suite
 * Production-hardened security layer for CMMS application
 */

/**
 * Rate limiting configuration for different API endpoints
 */
export const createRateLimit = (
  windowMs: number,
  max: number,
  message?: string
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Use default key generator to handle IPv6 properly
    skip: req => {
      // Skip rate limiting for health checks in development
      if (process.env.NODE_ENV === 'development' && req.path === '/api/health') {
        return true;
      }
      return false;
    },
  });
};

// Enhanced rate limiters for different endpoint types
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 auth attempts per windowMs (more restrictive)
  'Too many authentication attempts from this IP, please try again after 15 minutes.'
);

export const apiRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  1000, // limit each IP to 1000 requests per minute (increased for production)
  'API rate limit exceeded, please slow down.'
);

export const uploadRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  50, // limit each IP to 50 uploads per 15 minutes (increased)
  'Upload rate limit exceeded, please try again later.'
);

export const passwordResetRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // limit each IP to 3 password reset attempts per hour
  'Too many password reset attempts, please try again later.'
);

export const exportRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // limit each IP to 10 exports per hour
  'Too many export requests, please try again later.'
);

// Input validation schemas
export const requestValidationSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),

  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort: z.string().max(50).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
};

/**
 * Enhanced security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Generate nonce for CSP
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;

  // Enhanced security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store',
    'X-API-Version': '1.0.0',
    'X-Powered-By': 'MaintAInPro-CMMS',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  });

  // Enhanced CORS headers for API endpoints
  if (req.path.startsWith('/api')) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5173',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL,
    ].filter(Boolean);

    const origin = req.get('Origin');
    if (origin && allowedOrigins.includes(origin)) {
      res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Requested-With, X-API-Key, X-Client-Version',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Expose-Headers': 'X-Total-Count, X-Page-Count',
      });
    }
  }

  next();
}

/**
 * PWA and static file MIME type middleware
 */
export function pwaHeaders(req: Request, res: Response, next: NextFunction): void {
  const url = req.url;

  // Service Worker - ensure proper MIME type
  if (url === '/sw.js' || url.endsWith('sw.js')) {
    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    });
  }

  // Web App Manifest - ensure proper MIME type
  if (url === '/manifest.json' || url.endsWith('manifest.json')) {
    res.set({
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    });
  }

  // PWA icons and other static assets
  if (url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    res.set({
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    });
  }

  next();
}

/**
 * Service Worker specific handler that overrides static file handling
 */
export function serviceWorkerHandler(req: Request, res: Response, next: NextFunction): void {
  const url = req.url;

  if (url === '/sw.js') {
    // Set proper headers before serving the file
    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });
  } else if (url === '/manifest.json') {
    // Set proper headers before serving the file
    res.set({
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
  }

  next();
}

/**
 * Enhanced input sanitization middleware
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  // Comprehensive sanitization function
  const sanitize = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous patterns
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/['"`;]/g, '') // Remove SQL injection characters
        .replace(/\0/g, '') // Remove null bytes
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize keys as well
        const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
        sanitized[cleanKey] = sanitize(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize all input types
  if (req.body) {
    req.body = sanitize(req.body) as any;
  }
  if (req.query) {
    req.query = sanitize(req.query) as any;
  }
  if (req.params) {
    req.params = sanitize(req.params) as any;
  }

  next();
}

/**
 * SQL injection protection middleware
 */
export function sqlInjectionProtection(req: Request, res: Response, next: NextFunction): void {
  const checkForSqlInjection = (value: string): boolean => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|#|\/\*|\*\/)/,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /('|(\\')|(;)|(\s(or|and)\s))/i,
      /(\bunion\s+select)/i,
      /(\bdrop\s+table)/i,
      /(\bexec\s*\()/i,
      /(script\s*>)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj: unknown): boolean => {
    if (typeof obj === 'string') {
      return checkForSqlInjection(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (checkObject(value)) return true;
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    console.warn(`SQL injection attempt detected from IP: ${req.ip}`);
    res.status(400).json({
      error: 'Invalid input detected',
      code: 'INVALID_INPUT',
    });
    return;
  }

  next();
}

/**
 * Enhanced authentication middleware with session validation
 */
export async function enhancedAuth(req: Request & { user?: { id: string; sessionId?: string } }, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_TOKEN',
      });
      return;
    }

    // Validate session in database
    if (db) {
      const session = await db.execute(
        'SELECT * FROM user_sessions WHERE session_token = ? AND is_active = true AND expires_at > NOW()',
        [token]
      );

      if (!session || session.length === 0) {
        res.status(401).json({
          error: 'Invalid or expired session',
          code: 'INVALID_SESSION',
        });
        return;
      }

      // Update last activity
      await db.execute('UPDATE user_sessions SET last_activity = NOW() WHERE session_token = ?', [
        token,
      ]);

      // Attach user info to request
      req.user = {
        id: session[0].user_id,
        email: session[0].email || '',
        role: session[0].role || '',
        organizationId: session[0].organization_id || '',
        sessionId: session[0].id,
        warehouseId: session[0].warehouse_id || '',
      };
    }

    next();
  } catch (_error) {
    console.error('Authentication _error:', _error);
    res.status(500).json({
      _error: 'Authentication system _error',
      code: 'AUTH_ERROR',
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string[]) {
  return async (req: Request & { user?: { id: string; sessionId?: string; role?: string } }, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED',
        });
        return;
      }

      if (db) {
        const user = await db.execute('SELECT role FROM profiles WHERE id = ? AND active = true', [
          req.user.id,
        ]);

        if (!user || user.length === 0) {
          res.status(403).json({
            error: 'User not found or inactive',
            code: 'USER_NOT_FOUND',
          });
          return;
        }

        const userRole = user[0].role;
        if (!allowedRoles.includes(userRole)) {
          res.status(403).json({
            error: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS',
            required: allowedRoles,
            current: userRole,
          });
          return;
        }

        req.user.role = userRole;
      }

      next();
    } catch (_error) {
      console.error('Authorization _error:', _error);
      res.status(500).json({
        _error: 'Authorization system _error',
        code: 'AUTH_ERROR',
      });
    }
  };
}

/**
 * Schema-based request validation middleware factory
 */
export function validateRequestSchema(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!result.success) {
        res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }

      // Replace request data with validated data
      req.body = result.data.body || req.body;
      req.query = result.data.query || req.query;
      req.params = result.data.params || req.params;

      next();
    } catch (_error) {
      console.error('Validation _error:', _error);
      res.status(500).json({
        _error: 'Validation system _error',
        code: 'VALIDATION_SYSTEM_ERROR',
      });
    }
  };
}

/**
 * Audit logging middleware
 */
export function auditLogger(req: Request & { user?: { id: string; sessionId?: string } }, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Capture original res.json to log responses
  const originalJson = res.json;
  res.json = function (body) {
    const duration = Date.now() - startTime;

    // Log audit trail
    const auditData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || null,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
      body: req.method !== 'GET' ? req.body : undefined,
    };

    // Log to system_logs table if available
    if (db && req.user?.id) {
      (async () => {
        try {
          const { systemLogs } = await import('../../shared/schema');
          const { randomUUID } = await import('crypto');

          // Check if the user exists first to avoid foreign key constraint violations
          const { profiles } = await import('../../shared/schema');
          const userExists = await db
            .select({ id: profiles.id })
            .from(profiles)
            .where(eq(profiles.id, req.user.id))
            .limit(1);

          if (userExists.length > 0) {
            await db.insert(systemLogs).values({
              id: randomUUID(),
              userId: req.user.id,
              action: `${req.method} ${req.url}`,
              tableName: 'api_request',
              recordId: null,
              oldValues: null,
              newValues: auditData,
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
            });
          } else {
            console.warn('Skipping audit log - user not found in profiles table:', req.user.id);
          }
        } catch (err) {
          console.error('Audit logging error:', err);
        }
      })();
    }

    console.log('API Request:', JSON.stringify(auditData));

    return originalJson.call(this, body);
  };

  next();
}
export function validateRequest(req: Request, res: Response, next: NextFunction) {
  // Check for suspiciously large payloads
  const contentLength = req.get('Content-Length');
  if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
    // 50MB limit
    res.status(413).json({
      error: 'Payload too large',
      message: 'Request payload exceeds maximum allowed size',
    });
    return;
  }

  // Check for suspicious user agents
  const userAgent = req.get('User-Agent');
  if (userAgent) {
    const suspiciousPatterns = [/sqlmap/i, /nikto/i, /nmap/i, /masscan/i, /nessus/i];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      console.warn(`Suspicious user agent detected: ${userAgent} from IP: ${req.ip}`);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
      });
      return;
    }
  }

  // Check for SQL injection patterns in query parameters
  const queryString = JSON.stringify(req.query);
  const sqlInjectionPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /exec\s*\(/i,
    /script\s*>/i,
    /1\s*=\s*1/,
    /1\s*'\s*or\s*'1'\s*=\s*'1/i,
  ];

  if (sqlInjectionPatterns.some(pattern => pattern.test(queryString))) {
    console.warn(`Potential SQL injection attempt from IP: ${req.ip}, Query: ${queryString}`);
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid query parameters',
    });
    return;
  }

  next();
}

/**
 * IP whitelist middleware (for admin endpoints)
 */
export function createIPWhitelist(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    // Always allow localhost in development
    if (process.env.NODE_ENV === 'development') {
      const localhostIPs = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
      if (localhostIPs.includes(clientIP)) {
        return next();
      }
    }

    if (!allowedIPs.includes(clientIP)) {
      console.warn(`Access denied for IP: ${clientIP}`);
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied from this IP address',
      });
      return;
    }

    next();
  };
}

/**
 * Session validation middleware
 */
export async function validateSession(req: Request & { user?: { id: string; sessionId?: string } }, res: Response, next: NextFunction): Promise<void> {
  try {
    // Skip session validation for health checks and public endpoints
    const publicPaths = ['/api/health', '/api/monitoring', '/login', '/register'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    let sessionId: string | undefined;
    const headerSessionId = req.headers['x-session-id'];
    if (typeof headerSessionId === 'string') {
      sessionId = headerSessionId;
    } else if (Array.isArray(headerSessionId)) {
      sessionId = headerSessionId[0];
    } else if (req.user?.sessionId) {
      sessionId = req.user.sessionId;
    }
    if (!sessionId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Session ID required',
      });
      return;
    }

    // Import AuthService dynamically to avoid circular dependencies
    const { AuthService } = await import('../services/auth');
    const authService = new AuthService();

    const isValid = await authService.validateSession(sessionId);
    if (!isValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session',
      });
      return;
    }

    next();
  } catch (_error) {
    console.error('Session validation _error:', _error);
    res.status(500).json({
      _error: 'Internal Server Error',
      message: 'Session validation failed',
    });
  }
}

/**
 * Complete security middleware stack
 * Apply all security measures in the correct order
 */
export const securityStack = [
  securityHeaders,
  pwaHeaders,
  sanitizeInput,
  sqlInjectionProtection,
  auditLogger,
];
