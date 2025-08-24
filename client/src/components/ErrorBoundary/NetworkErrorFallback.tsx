import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorFallbackProps } from './ErrorBoundary';

export interface NetworkErrorFallbackProps extends ErrorFallbackProps {
  isOnline?: boolean;
  retryAction?: () => void;
  showOfflineIndicator?: boolean;
}

/**
 * Network error fallback component for displaying network-related errors
 * with connectivity status and retry mechanisms
 */
export function NetworkErrorFallback({
  error,
  resetError,
  eventId,
  isOnline = navigator.onLine,
  retryAction,
  showOfflineIndicator = true,
}: NetworkErrorFallbackProps) {
  const [currentlyOnline, setCurrentlyOnline] = React.useState(isOnline);
  const [retrying, setRetrying] = React.useState(false);

  // Listen for online/offline events
  React.useEffect(() => {
    const handleOnline = () => setCurrentlyOnline(true);
    const handleOffline = () => setCurrentlyOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    
    try {
      if (retryAction) {
        await retryAction();
      } else {
        // Wait a moment then reset error boundary
        await new Promise(resolve => setTimeout(resolve, 1000));
        resetError();
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // Error boundary will catch this and show error again
    } finally {
      setRetrying(false);
    }
  };

  const getErrorTitle = () => {
    if (!currentlyOnline) {
      return 'No internet connection';
    }
    return 'Network error occurred';
  };

  const getErrorDescription = () => {
    if (!currentlyOnline) {
      return 'Please check your internet connection and try again.';
    }
    return 'Unable to connect to the server. This could be a temporary issue.';
  };

  const getStatusColor = () => {
    if (!currentlyOnline) return 'text-error-600 bg-error-50';
    return 'text-warning-600 bg-warning-50';
  };

  const getStatusIcon = () => {
    if (!currentlyOnline) return <WifiOff className="h-8 w-8" />;
    return <AlertTriangle className="h-8 w-8" />;
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            {/* Network Status Icon */}
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>

            {/* Title and Description */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {getErrorTitle()}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {getErrorDescription()}
            </p>

            {/* Connection Status */}
            {showOfflineIndicator && (
              <div className="mb-4 p-3 rounded-md bg-gray-50">
                <div className="flex items-center justify-center gap-2 text-sm">
                  {currentlyOnline ? (
                    <>
                      <Wifi className="h-4 w-4 text-success-600" />
                      <span className="text-success-600 font-medium">Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-error-600" />
                      <span className="text-error-600 font-medium">Offline</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Event ID */}
            {eventId && (
              <div className="mb-4 p-2 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Error ID:</span> {eventId}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex-1 inline-flex items-center justify-center gap-2"
                  variant="default"
                >
                  <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? 'Retrying...' : 'Retry'}
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="flex-1"
                  disabled={retrying}
                >
                  Refresh Page
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => window.history.back()}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600"
                  disabled={retrying}
                >
                  Go Back
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-600"
                  disabled={retrying}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>

            {/* Troubleshooting Tips */}
            {!currentlyOnline && (
              <div className="mt-6 p-3 bg-blue-50 rounded-md text-left">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Troubleshooting tips:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Check your WiFi or mobile data connection</li>
                  <li>• Try moving to a different location</li>
                  <li>• Restart your router or modem</li>
                  <li>• Contact your network administrator</li>
                </ul>
              </div>
            )}

            {/* Error Details */}
            {error && (
              <div className="mt-4 text-xs text-gray-500">
                <details className="cursor-pointer">
                  <summary className="font-medium hover:text-gray-700">Technical details</summary>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-left">
                    <div className="font-mono break-words">
                      {error.message}
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NetworkErrorFallback;