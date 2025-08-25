import type { ErrorInfo } from '../components/ErrorBoundary/ErrorBoundary';

export interface ErrorReportData {
  error: Error;
  errorInfo?: ErrorInfo;
  context?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: Date;
  eventId?: string;
}

export interface ErrorReportOptions {
  context?: string;
  userId?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

/**
 * Error reporting service for logging and tracking errors
 */
export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = true;
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Report an error with context information
   */
  async reportError(
    error: Error,
    errorInfo?: ErrorInfo,
    options?: ErrorReportOptions
  ): Promise<string> {
    if (!this.isEnabled) {
      return '';
    }

    const eventId = this.generateEventId();

    const errorData: ErrorReportData = {
      error,
      errorInfo,
      context: options?.context,
      userId: options?.userId,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      eventId,
    };

    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Error Report [${eventId}]`);
        console.error('Error:', error.name, '-', error.message);
        console.error('Stack:', error.stack);
        if (errorInfo?.componentStack) {
          console.error('Component Stack:', errorInfo.componentStack);
        }
        console.error('Context:', options?.context || 'No context provided');
        console.error('URL:', errorData.url);
        console.error('Timestamp:', errorData.timestamp.toISOString());
        if (options?.extra) {
          console.error('Extra Data:', options.extra);
        }
        console.groupEnd();
      }

      // Store locally for debugging
      this.storeErrorLocally(errorData);

      // In production, you would send to error reporting service like Sentry
      // await this.sendToErrorService(errorData);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }

    return eventId;
  }

  /**
   * Store error locally for debugging purposes
   */
  private storeErrorLocally(errorData: ErrorReportData): void {
    try {
      const storedErrors = this.getStoredErrors();
      storedErrors.push({
        ...errorData,
        error: {
          name: errorData.error.name,
          message: errorData.error.message,
          stack: errorData.error.stack,
        },
      });

      // Keep only last 50 errors to prevent storage overflow
      const recentErrors = storedErrors.slice(-50);

      localStorage.setItem('maintainpro_error_log', JSON.stringify(recentErrors));
    } catch (storageError) {
      console.warn('Failed to store error locally:', storageError);
    }
  }

  /**
   * Get stored errors from local storage
   */
  getStoredErrors(): unknown[] {
    try {
      const stored = localStorage.getItem('maintainpro_error_log');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored errors
   */
  clearStoredErrors(): void {
    try {
      localStorage.removeItem('maintainpro_error_log');
    } catch (error) {
      console.warn('Failed to clear stored errors:', error);
    }
  }

  /**
   * Report a network error
   */
  async reportNetworkError(
    url: string,
    status?: number,
    statusText?: string,
    options?: ErrorReportOptions
  ): Promise<string> {
    const error = new Error(`Network error: ${status || 'Unknown'} ${statusText || ''} at ${url}`);
    error.name = 'NetworkError';

    return this.reportError(error, undefined, {
      ...options,
      context: 'network_request',
      tags: {
        url,
        status: status?.toString() || 'unknown',
        statusText: statusText || 'unknown',
        ...options?.tags,
      },
    });
  }

  /**
   * Report a chunk loading error (common with code splitting)
   */
  async reportChunkError(chunkName?: string, options?: ErrorReportOptions): Promise<string> {
    const error = new Error(`Failed to load chunk: ${chunkName || 'unknown'}`);
    error.name = 'ChunkLoadError';

    return this.reportError(error, undefined, {
      ...options,
      context: 'chunk_loading',
      tags: {
        chunkName: chunkName || 'unknown',
        ...options?.tags,
      },
    });
  }

  /**
   * Enable or disable error reporting
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Create singleton instance
export const errorReportingService = ErrorReportingService.getInstance();

/**
 * Convenience function to report errors
 */
export const reportError = async (
  error: Error,
  errorInfo?: ErrorInfo,
  options?: ErrorReportOptions
): Promise<string> => {
  return errorReportingService.reportError(error, errorInfo, options);
};

/**
 * Convenience function to report network errors
 */
export const reportNetworkError = async (
  url: string,
  status?: number,
  statusText?: string,
  options?: ErrorReportOptions
): Promise<string> => {
  return errorReportingService.reportNetworkError(url, status, statusText, options);
};

/**
 * Convenience function to report chunk loading errors
 */
export const reportChunkError = async (
  chunkName?: string,
  options?: ErrorReportOptions
): Promise<string> => {
  return errorReportingService.reportChunkError(chunkName, options);
};

export default errorReportingService;
