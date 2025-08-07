// Offline status indicator component
import React from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  WifiIcon,
  WifiOffIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from 'lucide-react';
import { useOffline } from '../../hooks/useOffline';

interface OfflineStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  showDetails = false,
  className = '',
}) => {
  const [status, actions] = useOffline();

  const getStatusIcon = () => {
    if (!status.isInitialized) {
      return <RefreshCwIcon className='h-4 w-4 animate-spin' />;
    }

    if (status.isOnline) {
      return <WifiIcon className='h-4 w-4 text-green-600' />;
    } else {
      return <WifiOffIcon className='h-4 w-4 text-red-600' />;
    }
  };

  const getStatusText = () => {
    if (!status.isInitialized) {
      return 'Initializing...';
    }

    if (status.isOnline) {
      return status.lastSync ? 'Online - Synced' : 'Online';
    } else {
      return 'Offline Mode';
    }
  };

  const getStatusColor = () => {
    if (!status.isInitialized) {
      return 'bg-gray-100 text-gray-800';
    }

    if (status.isOnline) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-orange-100 text-orange-800';
    }
  };

  const handleSync = async () => {
    if (status.isOnline && !status.isLoading) {
      try {
        await actions.sync();
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {getStatusIcon()}
        <Badge className={getStatusColor()}>{getStatusText()}</Badge>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center space-x-2'>
          {getStatusIcon()}
          <span className='font-medium text-gray-900'>Connection Status</span>
        </div>
        <Badge className={getStatusColor()}>{getStatusText()}</Badge>
      </div>

      {/* Status Details */}
      {status.isInitialized && (
        <div className='space-y-2 text-sm text-gray-600'>
          {/* Last Sync */}
          {status.lastSync && (
            <div className='flex items-center space-x-2'>
              <CheckCircleIcon className='h-4 w-4 text-green-500' />
              <span>Last sync: {status.lastSync.toLocaleString()}</span>
            </div>
          )}

          {/* Pending Operations */}
          {status.pendingOperations > 0 && (
            <div className='flex items-center space-x-2'>
              <ClockIcon className='h-4 w-4 text-yellow-500' />
              <span>{status.pendingOperations} pending operation(s)</span>
            </div>
          )}

          {/* Conflicts */}
          {status.conflicts > 0 && (
            <div className='flex items-center space-x-2'>
              <AlertTriangleIcon className='h-4 w-4 text-red-500' />
              <span>{status.conflicts} conflict(s) need resolution</span>
            </div>
          )}

          {/* Error */}
          {status.error && (
            <div className='flex items-center space-x-2'>
              <AlertTriangleIcon className='h-4 w-4 text-red-500' />
              <span className='text-red-600'>{status.error}</span>
            </div>
          )}

          {/* Sync Button */}
          {status.isOnline && (
            <div className='pt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleSync}
                disabled={status.isLoading}
                className='w-full'
              >
                {status.isLoading ? (
                  <>
                    <RefreshCwIcon className='h-4 w-4 mr-2 animate-spin' />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className='h-4 w-4 mr-2' />
                    Sync Now
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Offline Status Message */}
          {!status.isOnline && (
            <div className='pt-2 text-orange-600 text-xs'>
              Changes will be synced when connection is restored
            </div>
          )}
        </div>
      )}
    </div>
  );
};
