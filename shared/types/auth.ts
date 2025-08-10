import { Request } from 'express';

/**
 * Shared user interface for consistent authentication across middleware
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  sessionId?: string;
  warehouseId?: string;
}

/**
 * Enhanced request interface with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Audit request interface extending authenticated request
 */
export interface AuditRequest extends Request {
  user?: AuthenticatedUser;
  startTime?: number;
  auditContext?: {
    requestId: string;
    correlationId: string;
    startTime: number;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * Enhanced request interface for validation middleware
 */
export interface EnhancedRequest extends Request {
  user?: AuthenticatedUser & { sessionId: string };
  validatedBody?: Record<string, unknown>;
  validatedQuery?: Record<string, unknown>;
  validatedParams?: Record<string, unknown>;
  validatedData?: Record<string, unknown>;
  validated?: Record<string, unknown>; // For backwards compatibility
  organizationId?: string;
  startTime?: number;
  auditContext?: {
    requestId: string;
    correlationId: string;
    startTime: number;
    ipAddress: string;
    userAgent: string;
  };
}

/**
 * Type guard to check if request has authenticated user
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return !!req.user && typeof req.user === 'object' && 'id' in req.user;
}

/**
 * Type guard to check if user has required fields
 */
export function hasCompleteUser(user: unknown): user is AuthenticatedUser {
  return (
    user &&
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.role === 'string' &&
    typeof user.organizationId === 'string'
  );
}
