import React from 'react';
import { Download, RefreshCw, AlertTriangle, HardDrive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorFallbackProps } from './ErrorBoundary';

export interface ChunkErrorFallbackProps extends ErrorFallbackProps {
  chunkName?: string;
  showClearCache?: boolean;
  onClearCache?: () => void;
}

/**
 * Chunk error fallback component for handling code splitting and module loading errors
 * Common scenarios: outdated cached assets, network issues during chunk loading
 */
export function ChunkErrorFallback({
  error,
  resetError,
  eventId,
  chunkName,
  showClearCache = true,
  onClearCache,
}: ChunkErrorFallbackProps) {
  const [clearing, setClearing] = React.useState(false);

  const handleClearCache = async () => {
    setClearing(true);

    try {
      // Clear browser cache if possible
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
      }

      // Clear localStorage (optional - be careful with user data)
      const keysToRemove = Object.keys(localStorage).filter(
        key => key.startsWith('maintainpro_cache_') || key.startsWith('vite_')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Call custom clear cache handler
      if (onClearCache) {
        await onClearCache();
      }

      // Small delay to show feedback
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force reload to get fresh assets
      window.location.reload();
    } catch (cacheError) {
      console.error('Failed to clear cache:', cacheError);
      // Fallback to just reloading
      window.location.reload();
    } finally {
      setClearing(false);
    }
  };

  const handleHardRefresh = () => {
    // Force reload bypassing cache
    window.location.reload();
  };

  return (
    <div className='min-h-[400px] flex items-center justify-center p-6'>
      <Card className='w-full max-w-md'>
        <CardContent className='pt-6'>
          <div className='text-center'>
            {/* Chunk Error Icon */}
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-50 mb-6'>
              <Download className='h-8 w-8 text-warning-600' />
            </div>

            {/* Title and Description */}
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Failed to load application</h3>
            <p className='text-sm text-gray-600 mb-6'>
              There was a problem loading part of the application. This usually happens when the app
              has been updated.
            </p>

            {/* Chunk Information */}
            {chunkName && (
              <div className='mb-4 p-3 bg-gray-50 rounded-md'>
                <p className='text-sm text-gray-700'>
                  <span className='font-medium'>Failed to load:</span> {chunkName}
                </p>
              </div>
            )}

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
                  onClick={handleHardRefresh}
                  className='flex-1 inline-flex items-center justify-center gap-2'
                  variant='default'
                >
                  <RefreshCw className='h-4 w-4' />
                  Refresh App
                </Button>

                <Button onClick={resetError} variant='outline' className='flex-1'>
                  Try Again
                </Button>
              </div>

              {/* Cache Clear Option */}
              {showClearCache && (
                <Button
                  onClick={handleClearCache}
                  disabled={clearing}
                  variant='outline'
                  size='sm'
                  className='w-full inline-flex items-center justify-center gap-2 text-gray-600'
                >
                  <HardDrive className={`h-4 w-4 ${clearing ? 'animate-pulse' : ''}`} />
                  {clearing ? 'Clearing Cache...' : 'Clear Cache & Reload'}
                </Button>
              )}
            </div>

            {/* Information Box */}
            <div className='mt-6 p-3 bg-blue-50 rounded-md text-left'>
              <div className='flex items-start gap-2'>
                <AlertTriangle className='h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0' />
                <div>
                  <h4 className='text-sm font-medium text-blue-900 mb-1'>Why did this happen?</h4>
                  <p className='text-xs text-blue-800'>
                    This usually occurs when the application has been updated and your browser is
                    trying to load outdated code. Refreshing will download the latest version.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Troubleshooting */}
            <div className='mt-4 text-xs text-gray-500'>
              <details className='cursor-pointer'>
                <summary className='font-medium hover:text-gray-700'>
                  Advanced troubleshooting
                </summary>
                <div className='mt-2 p-2 bg-gray-50 rounded text-left space-y-2'>
                  <p>If the problem persists:</p>
                  <ul className='list-disc list-inside space-y-1 ml-2'>
                    <li>Try opening the app in an incognito/private window</li>
                    <li>Check if you're using the latest browser version</li>
                    <li>Temporarily disable browser extensions</li>
                    <li>Check your internet connection stability</li>
                  </ul>
                </div>
              </details>
            </div>

            {/* Error Details */}
            {error && (
              <div className='mt-4 text-xs text-gray-500'>
                <details className='cursor-pointer'>
                  <summary className='font-medium hover:text-gray-700'>Technical details</summary>
                  <div className='mt-2 p-2 bg-gray-50 rounded text-left'>
                    <div className='font-mono break-words'>
                      <div>
                        <span className='font-medium'>Error:</span> {error.name}
                      </div>
                      <div>
                        <span className='font-medium'>Message:</span> {error.message}
                      </div>
                      {error.stack && (
                        <details className='mt-2'>
                          <summary className='cursor-pointer text-gray-600'>Stack trace</summary>
                          <pre className='text-xs mt-1 whitespace-pre-wrap break-words max-h-32 overflow-y-auto'>
                            {error.stack}
                          </pre>
                        </details>
                      )}
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

export default ChunkErrorFallback;
