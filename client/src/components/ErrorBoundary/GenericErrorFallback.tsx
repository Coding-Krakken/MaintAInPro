import React from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorFallbackProps } from './ErrorBoundary';

export interface GenericErrorFallbackProps extends ErrorFallbackProps {
  title?: string;
  description?: string;
  showDetails?: boolean;
  showHomeButton?: boolean;
  showReportButton?: boolean;
}

/**
 * Generic error fallback component for displaying JavaScript errors
 * with user-friendly UI and recovery options
 */
export function GenericErrorFallback({
  error,
  errorInfo,
  resetError,
  eventId,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  showDetails = false,
  showHomeButton = true,
  showReportButton = true,
}: GenericErrorFallbackProps) {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  const handleReportIssue = () => {
    // In a real application, this would open a support ticket or feedback form
    const subject = encodeURIComponent(`Error Report: ${error?.name || 'Unknown Error'}`);
    const body = encodeURIComponent(
      `
Error Details:
- Error: ${error?.message || 'Unknown error'}
- Event ID: ${eventId || 'N/A'}
- Timestamp: ${new Date().toISOString()}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}

${error?.stack ? `Stack Trace:\n${error.stack}` : ''}
    `.trim()
    );

    window.open(`mailto:support@maintainpro.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className='min-h-[400px] flex items-center justify-center p-6'>
      <Card className='w-full max-w-md'>
        <CardContent className='pt-6'>
          <div className='text-center'>
            {/* Error Icon */}
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-50 mb-6'>
              <AlertCircle className='h-8 w-8 text-error-600' />
            </div>

            {/* Title and Description */}
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>{title}</h3>
            <p className='text-sm text-gray-600 mb-6'>{description}</p>

            {/* Event ID */}
            {eventId && (
              <div className='mb-4 p-2 bg-gray-50 rounded-md'>
                <p className='text-xs text-gray-500'>
                  <span className='font-medium'>Error ID:</span> {eventId}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className='space-y-3'>
              {/* Primary Actions */}
              <div className='flex flex-col sm:flex-row gap-2'>
                <Button
                  onClick={resetError}
                  className='flex-1 inline-flex items-center justify-center gap-2'
                  variant='default'
                >
                  <RefreshCw className='h-4 w-4' />
                  Try Again
                </Button>

                {showHomeButton && (
                  <Button
                    onClick={handleGoHome}
                    variant='outline'
                    className='flex-1 inline-flex items-center justify-center gap-2'
                  >
                    <Home className='h-4 w-4' />
                    Go Home
                  </Button>
                )}
              </div>

              {/* Secondary Actions */}
              <div className='flex flex-col sm:flex-row gap-2'>
                <Button
                  onClick={() => window.location.reload()}
                  variant='ghost'
                  size='sm'
                  className='flex-1 text-gray-600'
                >
                  Refresh Page
                </Button>

                {showReportButton && (
                  <Button
                    onClick={handleReportIssue}
                    variant='ghost'
                    size='sm'
                    className='flex-1 inline-flex items-center justify-center gap-1 text-gray-600'
                  >
                    <Bug className='h-3 w-3' />
                    Report Issue
                  </Button>
                )}
              </div>

              {/* Error Details Toggle */}
              {showDetails && error && (
                <Button
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                  variant='ghost'
                  size='sm'
                  className='text-xs text-gray-500'
                >
                  {showErrorDetails ? 'Hide' : 'Show'} Error Details
                </Button>
              )}
            </div>

            {/* Error Details */}
            {showErrorDetails && error && (
              <div className='mt-4 p-3 bg-gray-50 rounded-md text-left'>
                <div className='text-xs space-y-2'>
                  <div>
                    <span className='font-medium text-gray-700'>Error:</span>
                    <div className='text-red-600 font-mono break-words'>
                      {error.name}: {error.message}
                    </div>
                  </div>

                  {error.stack && (
                    <div>
                      <span className='font-medium text-gray-700'>Stack Trace:</span>
                      <pre className='text-gray-600 font-mono text-xs whitespace-pre-wrap break-words max-h-32 overflow-y-auto'>
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {errorInfo?.componentStack && (
                    <div>
                      <span className='font-medium text-gray-700'>Component Stack:</span>
                      <pre className='text-gray-600 font-mono text-xs whitespace-pre-wrap break-words max-h-32 overflow-y-auto'>
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GenericErrorFallback;
