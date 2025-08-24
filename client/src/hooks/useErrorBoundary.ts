import { useCallback } from 'react';
import { errorReportingService } from '../utils/error-reporting';
import type { ErrorInfo } from '../components/ErrorBoundary/ErrorBoundary';

export interface UseErrorBoundaryOptions {
  context?: string;
  onError?: (_error: Error) => void;
}

/**
 * Hook for programmatically triggering error boundaries and reporting errors
 */
export function useErrorBoundary(options?: UseErrorBoundaryOptions) {
  /**
   * Capture and report an error, then trigger error boundary
   */
  const captureError = useCallback(async (error: Error | string, errorInfo?: ErrorInfo) => {
    // Convert string errors to Error objects
    const errorObject = typeof error === 'string' ? new Error(error) : error;
    
    try {
      // Report the error
      await errorReportingService.reportError(errorObject, errorInfo, {
        context: options?.context,
      });

      // Call the onError callback if provided
      if (options?.onError) {
        options.onError(errorObject);
      }

      // Trigger error boundary by throwing the error
      throw errorObject;
    } catch (_err) {
      // If error reporting fails, still throw to trigger boundary
      throw errorObject;
    }
  }, [options]);

  /**
   * Report an error without triggering error boundary
   */
  const reportError = useCallback(async (error: Error | string, errorInfo?: ErrorInfo) => {
    const errorObject = typeof error === 'string' ? new Error(error) : error;
    
    try {
      const eventId = await errorReportingService.reportError(errorObject, errorInfo, {
        context: options?.context,
      });

      if (options?.onError) {
        options.onError(errorObject);
      }

      return eventId;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      return '';
    }
  }, [options]);

  /**
   * Capture network error
   */
  const captureNetworkError = useCallback(async (url: string, status?: number, statusText?: string) => {
    try {
      await errorReportingService.reportNetworkError(url, status, statusText, {
        context: options?.context,
      });
    } catch (reportingError) {
      console.error('Failed to report network error:', reportingError);
    }
  }, [options]);

  /**
   * Capture chunk loading error and trigger boundary
   */
  const captureChunkError = useCallback(async (chunkName?: string) => {
    const error = new Error(`Failed to load chunk: ${chunkName || 'unknown'}`);
    error.name = 'ChunkLoadError';
    
    try {
      await errorReportingService.reportChunkError(chunkName, {
        context: options?.context,
      });

      if (options?.onError) {
        options.onError(error);
      }

      // Trigger error boundary
      throw error;
    } catch (_err) {
      throw error;
    }
  }, [options]);

  return {
    captureError,
    reportError,
    captureNetworkError,
    captureChunkError,
  };
}

export default useErrorBoundary;