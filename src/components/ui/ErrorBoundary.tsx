import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      // Default error UI
      return (
        <div className='min-h-screen bg-secondary-50 flex items-center justify-center p-4'>
          <div className='max-w-md w-full bg-white rounded-lg shadow-medium border border-secondary-200 p-6'>
            <div className='flex items-center mb-4'>
              <ExclamationTriangleIcon className='w-6 h-6 text-error-500 mr-2' />
              <h2 className='text-lg font-semibold text-secondary-900'>
                Something went wrong
              </h2>
            </div>

            <p className='text-secondary-600 mb-6'>
              An unexpected error has occurred. Please try refreshing the page
              or contact support if the problem persists.
            </p>

            {process.env['NODE_ENV'] === 'development' && this.state.error && (
              <div className='mb-6 p-4 bg-error-50 border border-error-200 rounded-lg'>
                <h3 className='text-sm font-medium text-error-800 mb-2'>
                  Error Details (Development)
                </h3>
                <pre className='text-xs text-error-700 whitespace-pre-wrap'>
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className='text-xs text-error-700 whitespace-pre-wrap mt-2'>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className='flex space-x-3'>
              <Button
                variant='outline'
                onClick={() => window.location.reload()}
                className='flex-1'
              >
                Refresh Page
              </Button>
              <Button
                variant='default'
                onClick={this.resetError}
                className='flex-1'
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { setError, resetError };
};

export default ErrorBoundary;
