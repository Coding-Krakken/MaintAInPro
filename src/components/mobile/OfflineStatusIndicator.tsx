import React, { useEffect, useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { SyncManager, SyncStatus } from '../../services/sync-manager';
import { OfflineStorageService } from '../../services/offline-storage';
import {
  WifiOffIcon,
  WifiIcon,
  CloudIcon,
  CloudOffIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  ClockIcon,
} from 'lucide-react';

interface OfflineStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  className = '',
  showDetails = false,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    syncErrors: [],
  });

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [storageStats, setStorageStats] = useState({
    workOrders: 0,
    checklistItems: 0,
    attachments: 0,
    pendingSync: 0,
    totalSize: 0,
  });

  useEffect(() => {
    // Listen for sync status updates
    const handleSyncStatusUpdate = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    SyncManager.addListener(handleSyncStatusUpdate);

    // Initial status check
    SyncManager.getSyncStatus().then(setSyncStatus);

    // Load storage stats
    loadStorageStats();

    return () => {
      SyncManager.removeListener(handleSyncStatusUpdate);
    };
  }, []);

  const loadStorageStats = async () => {
    try {
      const stats = await OfflineStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      await SyncManager.sync();
      await loadStorageStats();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOffIcon className='h-4 w-4 text-red-500' />;
    }

    if (syncStatus.isSyncing) {
      return <RefreshCwIcon className='h-4 w-4 text-blue-500 animate-spin' />;
    }

    if (syncStatus.pendingItems > 0) {
      return <CloudOffIcon className='h-4 w-4 text-orange-500' />;
    }

    return <CloudIcon className='h-4 w-4 text-green-500' />;
  };

  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return 'Offline';
    }

    if (syncStatus.isSyncing) {
      return 'Syncing...';
    }

    if (syncStatus.pendingItems > 0) {
      return `${syncStatus.pendingItems} pending`;
    }

    return 'Synced';
  };

  const getStatusColor = () => {
    if (!syncStatus.isOnline) {
      return 'bg-red-100 text-red-800';
    }

    if (syncStatus.isSyncing) {
      return 'bg-blue-100 text-blue-800';
    }

    if (syncStatus.pendingItems > 0) {
      return 'bg-orange-100 text-orange-800';
    }

    return 'bg-green-100 text-green-800';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';

    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const StatusIndicator = () => (
    <button
      className={`flex items-center space-x-2 cursor-pointer ${className}`}
      onClick={() => showDetails && setShowStatusModal(true)}
      disabled={!showDetails}
    >
      {getStatusIcon()}
      <Badge className={getStatusColor()}>{getStatusText()}</Badge>
    </button>
  );

  if (!showDetails) {
    return <StatusIndicator />;
  }

  return (
    <>
      <StatusIndicator />

      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        size='lg'
      >
        <div className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>
            Sync Status
          </h2>

          {/* Current Status */}
          <Card className='p-4 mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center space-x-3'>
                {getStatusIcon()}
                <div>
                  <h3 className='font-medium text-gray-900'>
                    {getStatusText()}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    {syncStatus.isOnline ? 'Connected' : 'Offline Mode'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleManualSync}
                disabled={syncStatus.isSyncing || !syncStatus.isOnline}
                size='sm'
                variant='outline'
              >
                <RefreshCwIcon
                  className={`h-4 w-4 mr-2 ${syncStatus.isSyncing ? 'animate-spin' : ''}`}
                />
                Sync Now
              </Button>
            </div>

            {syncStatus.lastSync && (
              <div className='text-sm text-gray-600'>
                Last sync: {formatLastSync(syncStatus.lastSync)}
              </div>
            )}
          </Card>

          {/* Storage Stats */}
          <Card className='p-4 mb-6'>
            <h4 className='font-medium text-gray-900 mb-3'>Offline Storage</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-gray-600'>Work Orders:</span>
                <span className='ml-2 font-medium'>
                  {storageStats.workOrders}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Checklist Items:</span>
                <span className='ml-2 font-medium'>
                  {storageStats.checklistItems}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Attachments:</span>
                <span className='ml-2 font-medium'>
                  {storageStats.attachments}
                </span>
              </div>
              <div>
                <span className='text-gray-600'>Storage Used:</span>
                <span className='ml-2 font-medium'>
                  {formatBytes(storageStats.totalSize)}
                </span>
              </div>
            </div>
          </Card>

          {/* Pending Items */}
          {syncStatus.pendingItems > 0 && (
            <Card className='p-4 mb-6'>
              <div className='flex items-center space-x-2 mb-3'>
                <ClockIcon className='h-5 w-5 text-orange-500' />
                <h4 className='font-medium text-gray-900'>
                  Pending Sync ({syncStatus.pendingItems} items)
                </h4>
              </div>
              <p className='text-sm text-gray-600'>
                These changes will be synchronized when you&apos;re back online.
              </p>
            </Card>
          )}

          {/* Sync Errors */}
          {syncStatus.syncErrors.length > 0 && (
            <Card className='p-4 mb-6 border-red-200'>
              <div className='flex items-center space-x-2 mb-3'>
                <AlertCircleIcon className='h-5 w-5 text-red-500' />
                <h4 className='font-medium text-gray-900'>
                  Sync Errors ({syncStatus.syncErrors.length})
                </h4>
              </div>
              <div className='space-y-2'>
                {syncStatus.syncErrors.slice(0, 3).map((error, index) => (
                  <div key={index} className='text-sm bg-red-50 p-2 rounded'>
                    <div className='font-medium text-red-800'>
                      {error.table}: {error.action}
                    </div>
                    <div className='text-red-600'>{error.error}</div>
                    <div className='text-red-500 text-xs'>
                      Retry {error.retry_count}/3
                    </div>
                  </div>
                ))}
                {syncStatus.syncErrors.length > 3 && (
                  <div className='text-sm text-gray-500'>
                    +{syncStatus.syncErrors.length - 3} more errors
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Network Status */}
          <Card className='p-4'>
            <div className='flex items-center space-x-2 mb-2'>
              {syncStatus.isOnline ? (
                <WifiIcon className='h-5 w-5 text-green-500' />
              ) : (
                <WifiOffIcon className='h-5 w-5 text-red-500' />
              )}
              <h4 className='font-medium text-gray-900'>Network Status</h4>
            </div>
            <p className='text-sm text-gray-600'>
              {syncStatus.isOnline
                ? 'Connected to internet. Data will sync automatically.'
                : 'No internet connection. Working in offline mode.'}
            </p>
          </Card>

          <div className='flex justify-end mt-6'>
            <Button onClick={() => setShowStatusModal(false)} variant='outline'>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default OfflineStatusIndicator;
