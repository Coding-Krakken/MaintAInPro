import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { createClient } from 'redis';
import { AuthenticatedUser } from '../../shared/types/auth';

interface _RateLimitRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Advanced Rate Limiting with Redis Backend
 * Production-ready distributed rate limiting for CMMS application
 */

// Redis client for distributed rate limiting
let redisClient: ReturnType<typeof createClient> | null = null;

/**
 * Initialize Redis client for rate limiting
 */
export async function initializeRateLimitRedis(): Promise<void> {
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 5000,
        },
      });
      
      redisClient.on('error', (err) => {
        console.error('Redis rate limiting client error:', err);
        redisClient = null;
      });
      
      await redisClient.connect();
      console.log('Rate limiting Redis client connected');
    } catch (error) {
      console.warn('Failed to connect to Redis for rate limiting, falling back to memory:', error);
      redisClient = null;
    }
  }
}

/**
 * Rate limiting configuration profiles
 */
export const rateLimitProfiles = {
  // Authentication endpoints - very strict
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
    skipSuccessfulRequests: false,
  },
  
  // Password reset - strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per window
    message: 'Too many password reset attempts, please try again later.',
    skipSuccessfulRequests: true,
  },
  
  // API endpoints - moderate
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'API rate limit exceeded, please slow down.',
    skipSuccessfulRequests: false,
  },
  
  // Upload endpoints - restrictive
  upload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 uploads per window
    message: 'Upload rate limit exceeded, please try again later.',
    skipSuccessfulRequests: true,
  },
  
  // Export endpoints - very restrictive
  export: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 exports per hour
    message: 'Export rate limit exceeded, please try again later.',
    skipSuccessfulRequests: true,
  },
  
  // Admin endpoints - moderate but tracked
  admin: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Higher limit for admin operations
    message: 'Admin rate limit exceeded, please slow down.',
    skipSuccessfulRequests: false,
  },
} as const;

/**
 * Enhanced rate limiter factory with Redis backend and advanced features
 */
export function createAdvancedRateLimit(
  profile: keyof typeof rateLimitProfiles,
  options: {
    skipAdmins?: boolean;
    customMax?: number;
    customWindow?: number;
  } = {}
): RateLimitRequestHandler {
  const config = rateLimitProfiles[profile];
  
  return rateLimit({
    windowMs: options.customWindow || config.windowMs,
    max: options.customMax || config.max,
    message: config.message,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    
    // Skip rate limiting for authenticated admins if specified
    skip: (req: Request) => {
      // Skip health checks in development
      if (process.env.NODE_ENV === 'development' && req.path === '/api/health') {
        return true;
      }
      
      // Skip for admins if configured
      if (options.skipAdmins && req.user?.role === 'admin') {
        return true;
      }
      
      return false;
    },
    
    // Enhanced error handler
    handler: (req: Request, res: Response) => {
      const userInfo = req.user;
      
      // Log suspicious activity
      if (profile === 'auth' || profile === 'passwordReset') {
        console.warn(`Rate limit exceeded for ${profile} from IP: ${req.ip}`, {
          userAgent: req.get('User-Agent'),
          userId: userInfo?.id,
          organizationId: userInfo?.organizationId,
          timestamp: new Date().toISOString(),
        });
      }
      
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        type: profile.toUpperCase() + '_RATE_LIMIT',
        retryAfter: Math.round(config.windowMs / 1000),
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      });
    },
    
    // Use Redis store if available
    ...(redisClient && {
      store: new (require('express-rate-limit-redis'))({
        client: redisClient,
        prefix: 'rl:',
      }),
    }),
  });
}

/**
 * IP-based suspicious activity detection and blocking
 */
class SuspiciousActivityDetector {
  private suspiciousIPs = new Map<string, { count: number; firstSeen: Date; lastSeen: Date }>();
  private blockedIPs = new Set<string>();
  
  // Patterns that indicate suspicious activity
  private suspiciousPatterns = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /nessus/i,
    /burpsuite/i,
    /owasp/i,
    /hackbar/i,
  ];
  
  private suspiciousEndpoints = [
    '/api/admin',
    '/api/users',
    '/api/auth/register',
    '/wp-admin',
    '/phpmyadmin',
    '/.env',
    '/config',
  ];
  
  /**
   * Check if request appears suspicious
   */
  isSuspicious(req: Request): boolean {
    const userAgent = req.get('User-Agent') || '';
    const path = req.path;
    
    // Check user agent patterns
    if (this.suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return true;
    }
    
    // Check for suspicious endpoint access
    if (this.suspiciousEndpoints.some(endpoint => path.includes(endpoint))) {
      return true;
    }
    
    // Check for unusual query patterns
    const queryString = JSON.stringify(req.query);
    if (queryString.includes('union select') || queryString.includes('drop table')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Track suspicious activity for an IP
   */
  trackSuspiciousActivity(ip: string): void {
    const now = new Date();
    const existing = this.suspiciousIPs.get(ip);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = now;
      
      // Block IP if too many suspicious activities
      if (existing.count > 10) {
        this.blockedIPs.add(ip);
        console.warn(`IP ${ip} blocked for suspicious activity. Count: ${existing.count}`);
      }
    } else {
      this.suspiciousIPs.set(ip, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
    }
    
    // Clean up old entries (older than 1 hour)
    for (const [suspiciousIP, data] of this.suspiciousIPs.entries()) {
      if (now.getTime() - data.lastSeen.getTime() > 60 * 60 * 1000) {
        this.suspiciousIPs.delete(suspiciousIP);
      }
    }
  }
  
  /**
   * Check if IP is blocked
   */
  isBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }
  
  /**
   * Unblock an IP (for admin management)
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
  }
  
  /**
   * Get statistics
   */
  getStats() {
    return {
      suspiciousIPs: Array.from(this.suspiciousIPs.entries()),
      blockedIPs: Array.from(this.blockedIPs),
      totalSuspicious: this.suspiciousIPs.size,
      totalBlocked: this.blockedIPs.size,
    };
  }
}

// Global instance
export const suspiciousActivityDetector = new SuspiciousActivityDetector();

/**
 * Suspicious activity detection middleware
 */
export function suspiciousActivityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const clientIP = req.ip;
  
  // Check if IP is already blocked
  if (suspiciousActivityDetector.isBlocked(clientIP)) {
    console.warn(`Blocked IP attempted access: ${clientIP}`);
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Access denied due to suspicious activity',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // Check for suspicious patterns
  if (suspiciousActivityDetector.isSuspicious(req)) {
    suspiciousActivityDetector.trackSuspiciousActivity(clientIP);
    
    console.warn(`Suspicious activity detected from IP: ${clientIP}`, {
      userAgent: req.get('User-Agent'),
      path: req.path,
      query: req.query,
      timestamp: new Date().toISOString(),
    });
    
    // If now blocked after tracking, deny request
    if (suspiciousActivityDetector.isBlocked(clientIP)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied due to suspicious activity',
        timestamp: new Date().toISOString(),
      });
      return;
    }
  }
  
  next();
}

/**
 * Pre-configured rate limiters for different endpoint types
 */
export const rateLimiters = {
  auth: createAdvancedRateLimit('auth'),
  passwordReset: createAdvancedRateLimit('passwordReset'),
  api: createAdvancedRateLimit('api', { skipAdmins: true }),
  upload: createAdvancedRateLimit('upload'),
  export: createAdvancedRateLimit('export'),
  admin: createAdvancedRateLimit('admin'),
} as const;