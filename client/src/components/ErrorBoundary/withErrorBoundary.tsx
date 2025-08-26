import React from 'react';
import { ErrorBoundary, ErrorBoundaryProps, ErrorFallbackProps } from './ErrorBoundary';
import { GenericErrorFallback } from './GenericErrorFallback';
import { NetworkErrorFallback } from './NetworkErrorFallback';
import { ChunkErrorFallback } from './ChunkErrorFallback';
import { reportError } from '../../utils/error-reporting';

export type ErrorBoundaryType = 'generic' | 'network' | 'chunk' | 'custom';

export interface WithErrorBoundaryOptions extends Omit<ErrorBoundaryProps, 'children'> {
  type?: ErrorBoundaryType;
  fallbackProps?: Record<string, unknown>;
  context?: string;
  isolate?: boolean;
}

/**
 * Higher-order component that wraps a component with an Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: WithErrorBoundaryOptions
) {
  const WrappedComponent = React.forwardRef<unknown, P>((props, ref) => {
    const {
      type = 'generic',
      fallback,
      fallbackProps,
      context,
      isolate = false,
      onError,
      ...errorBoundaryProps
    } = options || {};

    // Select fallback component based on type
    const getFallbackComponent = (): React.ComponentType<ErrorFallbackProps> => {
      if (fallback) {
        return fallback;
      }

      switch (type) {
        case 'network':
          return NetworkErrorFallback;
        case 'chunk':
          return ChunkErrorFallback;
        case 'generic':
        default:
          return GenericErrorFallback;
      }
    };

    const handleError = async (error: Error, errorInfo: React.ErrorInfo) => {
      // Convert React.ErrorInfo to our ErrorInfo type
      const convertedErrorInfo = {
        componentStack: errorInfo.componentStack || '',
        errorBoundary: '',
        errorBoundaryStack: errorInfo.componentStack || '',
      };

      // Report the error
      await reportError(error, convertedErrorInfo, {
        context: context || `${Component.displayName || Component.name || 'Component'}`,
      });

      // Call the custom error handler if provided
      if (onError) {
        onError(error, convertedErrorInfo);
      }
    };

    return (
      <ErrorBoundary
        fallback={getFallbackComponent()}
        onError={handleError}
        fallbackProps={fallbackProps}
        isolate={isolate}
        {...errorBoundaryProps}
      >
        <Component {...(props as P)} ref={ref} />
      </ErrorBoundary>
    );
  });

  // Set display name for debugging
  const componentName = Component.displayName || Component.name || 'Component';
  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

  return WrappedComponent;
}

/**
 * Convenience HOCs for specific error types
 */

/**
 * HOC specifically for network-related components
 */
export function withNetworkErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<WithErrorBoundaryOptions, 'type'>
) {
  return withErrorBoundary(Component, { ...options, type: 'network' });
}

/**
 * HOC specifically for chunk/lazy-loaded components
 */
export function withChunkErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<WithErrorBoundaryOptions, 'type'>
) {
  return withErrorBoundary(Component, { ...options, type: 'chunk' });
}

/**
 * React Hook that creates a wrapped component with error boundary
 */
export function useErrorBoundaryWrapper<P extends object>(
  Component: React.ComponentType<P>,
  options?: WithErrorBoundaryOptions
) {
  return React.useMemo(() => withErrorBoundary(Component, options), [Component, options]);
}

/**
 * Utility function to create isolated error boundaries for specific sections
 */
export function createErrorBoundary(
  options?: WithErrorBoundaryOptions
): React.ComponentType<{ children: React.ReactNode }> {
  const BoundaryComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
      type = 'generic',
      fallback,
      fallbackProps,
      context = 'Isolated Boundary',
      isolate = true,
      onError,
      ...errorBoundaryProps
    } = options || {};

    const getFallbackComponent = (): React.ComponentType<ErrorFallbackProps> => {
      if (fallback) {
        return fallback;
      }

      switch (type) {
        case 'network':
          return NetworkErrorFallback;
        case 'chunk':
          return ChunkErrorFallback;
        case 'generic':
        default:
          return GenericErrorFallback;
      }
    };

    const handleError = async (error: Error, errorInfo: React.ErrorInfo) => {
      // Convert React.ErrorInfo to our ErrorInfo type
      const convertedErrorInfo = {
        componentStack: errorInfo.componentStack || '',
        errorBoundary: '',
        errorBoundaryStack: errorInfo.componentStack || '',
      };

      await reportError(error, convertedErrorInfo, { context });

      if (onError) {
        onError(error, convertedErrorInfo);
      }
    };

    return (
      <ErrorBoundary
        fallback={getFallbackComponent()}
        onError={handleError}
        fallbackProps={fallbackProps}
        isolate={isolate}
        {...errorBoundaryProps}
      >
        {children}
      </ErrorBoundary>
    );
  };

  BoundaryComponent.displayName = 'IsolatedErrorBoundary';

  return BoundaryComponent;
}

export default withErrorBoundary;
