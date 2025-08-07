// React hook for offline functionality
import { useState, useEffect, useCallback } from 'react';
import { offlineSyncService, SyncResult } from '../lib/offline/syncService';
import {
  offlineDB,
  initializeOfflineDB,
  checkDatabaseHealth,
  OfflineWorkOrder,
} from '../lib/offline/database';

export interface OfflineStatus {
  isOnline: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  lastSync?: Date;
  pendingOperations: number;
  conflicts: number;
  error?: string;
}

export interface OfflineActions {
  sync: () => Promise<SyncResult>;
  resolveConflict: (
    workOrderId: string,
    resolution: 'local' | 'server'
  ) => Promise<void>;
  getConflicts: () => Promise<OfflineWorkOrder[]>;
  startAutoSync: (intervalMs?: number) => void;
  stopAutoSync: () => void;
}

export const useOffline = (): [OfflineStatus, OfflineActions] => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: navigator.onLine,
    isInitialized: false,
    isLoading: true,
    pendingOperations: 0,
    conflicts: 0,
  });

  // Initialize offline database on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true }));

        await initializeOfflineDB();

        // Check database health
        const health = await checkDatabaseHealth();

        setStatus(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
          pendingOperations: health.pendingOperations,
          conflicts: health.conflictCount,
          ...(health.lastSync && { lastSync: health.lastSync }),
        }));

        // Start auto-sync if online
        if (navigator.onLine) {
          offlineSyncService.startAutoSync();
        }
      } catch (error) {
        console.error('Failed to initialize offline functionality:', error);
        setStatus(prev => ({
          ...prev,
          isInitialized: false,
          isLoading: false,
          error: error instanceof Error ? error.message : String(error),
        }));
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      offlineSyncService.stopAutoSync();
    };
  }, []);

  // Update network status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      updateHealthStatus();
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic health status updates
  const updateHealthStatus = useCallback(async () => {
    try {
      const health = await checkDatabaseHealth();
      setStatus(prev => ({
        ...prev,
        pendingOperations: health.pendingOperations,
        conflicts: health.conflictCount,
        ...(health.lastSync && { lastSync: health.lastSync }),
      }));
    } catch (error) {
      console.error('Failed to update health status:', error);
    }
  }, []);

  // Update health status periodically
  useEffect(() => {
    const interval = setInterval(updateHealthStatus, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [updateHealthStatus]);

  // Actions
  const sync = useCallback(async (): Promise<SyncResult> => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true }));
      const result = await offlineSyncService.syncAll();
      await updateHealthStatus();
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        syncedCount: 0,
        conflictCount: 0,
        errorCount: 1,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateHealthStatus]);

  const resolveConflict = useCallback(
    async (
      workOrderId: string,
      resolution: 'local' | 'server'
    ): Promise<void> => {
      try {
        await offlineSyncService.resolveConflict(workOrderId, resolution);
        await updateHealthStatus();
      } catch (error) {
        console.error('Failed to resolve conflict:', error);
        throw error;
      }
    },
    [updateHealthStatus]
  );

  const getConflicts = useCallback(async (): Promise<OfflineWorkOrder[]> => {
    return await offlineSyncService.getConflicts();
  }, []);

  const startAutoSync = useCallback((intervalMs: number = 30000): void => {
    offlineSyncService.startAutoSync(intervalMs);
  }, []);

  const stopAutoSync = useCallback((): void => {
    offlineSyncService.stopAutoSync();
  }, []);

  const actions: OfflineActions = {
    sync,
    resolveConflict,
    getConflicts,
    startAutoSync,
    stopAutoSync,
  };

  return [status, actions];
};

// Hook for work order offline operations
export const useOfflineWorkOrders = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const getAllWorkOrders = useCallback(async (): Promise<
    OfflineWorkOrder[]
  > => {
    try {
      setIsLoading(true);
      setError(undefined);
      return await offlineDB.workOrders
        .orderBy('updated_at')
        .reverse()
        .toArray();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Failed to get offline work orders:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getWorkOrderById = useCallback(
    async (id: string): Promise<OfflineWorkOrder | undefined> => {
      try {
        setError(undefined);
        return await offlineDB.workOrders.get(id);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Failed to get work order by ID:', err);
        return undefined;
      }
    },
    []
  );

  const createWorkOrderOffline = useCallback(
    async (
      workOrder: Omit<
        OfflineWorkOrder,
        'version' | 'sync_status' | 'created_at' | 'updated_at'
      >
    ): Promise<string> => {
      try {
        setIsLoading(true);
        setError(undefined);

        const offlineWO: OfflineWorkOrder = {
          ...workOrder,
          created_at: Date.now(),
          updated_at: Date.now(),
          version: 1,
          sync_status: 'pending',
        };

        await offlineDB.workOrders.put(offlineWO);

        // Queue for sync when online
        await offlineSyncService.queueSyncOperation(
          'create',
          'work_orders',
          workOrder.id,
          workOrder
        );

        return workOrder.id;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Failed to create work order offline:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateWorkOrderOffline = useCallback(
    async (id: string, updates: Partial<OfflineWorkOrder>): Promise<void> => {
      try {
        setIsLoading(true);
        setError(undefined);

        const existing = await offlineDB.workOrders.get(id);
        if (!existing) {
          throw new Error('Work order not found');
        }

        const updated = {
          ...existing,
          ...updates,
          updated_at: Date.now(),
          version: existing.version + 1,
          sync_status: 'pending' as const,
        };

        await offlineDB.workOrders.put(updated);

        // Queue for sync when online
        await offlineSyncService.queueSyncOperation(
          'update',
          'work_orders',
          id,
          updates
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Failed to update work order offline:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteWorkOrderOffline = useCallback(
    async (id: string): Promise<void> => {
      try {
        setIsLoading(true);
        setError(undefined);

        await offlineDB.workOrders.delete(id);

        // Queue for sync when online
        await offlineSyncService.queueSyncOperation(
          'delete',
          'work_orders',
          id
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Failed to delete work order offline:', err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const searchWorkOrders = useCallback(
    async (query: string): Promise<OfflineWorkOrder[]> => {
      try {
        setError(undefined);

        if (!query.trim()) {
          return await getAllWorkOrders();
        }

        const searchTerms = query.toLowerCase().split(' ');

        return await offlineDB.workOrders
          .filter(wo => {
            const searchableText = [
              wo.title?.toLowerCase() || '',
              wo.description?.toLowerCase() || '',
              wo.work_order_number?.toLowerCase() || '',
            ].join(' ');

            return searchTerms.every(term => searchableText.includes(term));
          })
          .toArray();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('Failed to search work orders offline:', err);
        return [];
      }
    },
    [getAllWorkOrders]
  );

  return {
    isLoading,
    error,
    getAllWorkOrders,
    getWorkOrderById,
    createWorkOrderOffline,
    updateWorkOrderOffline,
    deleteWorkOrderOffline,
    searchWorkOrders,
  };
};
