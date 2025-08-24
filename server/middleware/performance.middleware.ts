import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { monitoringService } from '../services/monitoring.service';

export interface PerformanceRequest extends Request {
  startTime?: number;
}

/**
 * Performance monitoring middleware
 * Tracks request response times and counts
 */
export function performanceMiddleware(
  req: PerformanceRequest,
  res: Response,
  next: NextFunction
): void {
  // Record start time
  req.startTime = performance.now();

  // Increment request count
  monitoringService.incrementRequestCount();

  // Override res.json to capture response time
  const originalJson = res.json;
  res.json = function (body?: unknown) {
    if (req.startTime) {
      const responseTime = Math.round(performance.now() - req.startTime);
      monitoringService.recordResponseTime(responseTime);

      // Add performance headers
      res.set('X-Response-Time', `${responseTime}ms`);
    }

    return originalJson.call(this, body);
  };

  // Override res.send to capture response time for non-JSON responses
  const originalSend = res.send;
  res.send = function (body?: unknown) {
    if (req.startTime) {
      const responseTime = Math.round(performance.now() - req.startTime);
      monitoringService.recordResponseTime(responseTime);

      // Add performance headers
      res.set('X-Response-Time', `${responseTime}ms`);
    }

    return originalSend.call(this, body);
  };

  next();
}

/**
 * Error tracking middleware
 * Records error occurrences for monitoring
 */
export function errorTrackingMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Increment error count
  monitoringService.incrementErrorCount();

  // Log error details
  let errorMessage = 'Unknown error';
  let errorStack = undefined;
  let status = 500;
  type ErrorLike = { message?: string; stack?: string; status?: number; statusCode?: number };
  if (typeof err === 'object' && err !== null) {
    const e = err as ErrorLike;
    if (typeof e.message === 'string') {
      errorMessage = e.message;
    }
    if (typeof e.stack === 'string') {
      errorStack = e.stack;
    }
    if (typeof e.status === 'number') {
      status = e.status;
    } else if (typeof e.statusCode === 'number') {
      status = e.statusCode;
    }
  }

  console.error(`Error on ${req.method} ${req.path}:`, {
    error: errorMessage,
    stack: errorStack,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : errorMessage;

  res.status(status).json({
    error: true,
    message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && errorStack ? { stack: errorStack } : {}),
  });
}
