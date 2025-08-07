// Offline sync service for work orders
import { supabase } from '../supabase';
import {
  offlineDB,
  OfflineWorkOrder,
  SyncOperation,
  convertWorkOrderToOffline,
  convertWorkOrderFromOffline,
} from './database';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  conflictCount: number;
  errorCount: number;
  errors: string[];
}

export interface NetworkStatus {
  isOnline: boolean;
  lastCheck: Date;
}

export class OfflineSyncService {
  private syncInterval?: NodeJS.Timeout | null = null;
  private networkStatus: NetworkStatus = {
    isOnline: navigator.onLine,
    lastCheck: new Date(),
  };

  constructor() {
    // Listen for network status changes
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  private handleOnline = async () => {
    this.networkStatus = { isOnline: true, lastCheck: new Date() };
    console.log('Network connection restored, starting sync...');
    await this.syncAll();
  };

  private handleOffline = () => {
    this.networkStatus = { isOnline: false, lastCheck: new Date() };
    console.log('Network connection lost, switching to offline mode');
    this.stopAutoSync();
  };

  // Start automatic sync at specified interval
  public startAutoSync(intervalMs: number = 30000): void {
    this.stopAutoSync();
    if (this.networkStatus.isOnline) {
      this.syncInterval = setInterval(async () => {
        if (this.networkStatus.isOnline) {
          await this.syncAll();
        }
      }, intervalMs);
      console.log(`Auto-sync started with ${intervalMs}ms interval`);
    }
  }

  public stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sync stopped');
    }
  }

  // Get current network status
  public getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus };
  }

  // Manual sync trigger
  public async syncAll(): Promise<SyncResult> {
    if (!this.networkStatus.isOnline) {
      return {
        success: false,
        syncedCount: 0,
        conflictCount: 0,
        errorCount: 1,
        errors: ['No network connection'],
      };
    }

    console.log('Starting full sync...');
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      // Sync work orders from server
      const downloadResult = await this.downloadWorkOrders();
      result.syncedCount += downloadResult.syncedCount;
      result.conflictCount += downloadResult.conflictCount;
      result.errorCount += downloadResult.errorCount;
      result.errors.push(...downloadResult.errors);

      // Sync pending local changes to server
      const uploadResult = await this.uploadPendingChanges();
      result.syncedCount += uploadResult.syncedCount;
      result.conflictCount += uploadResult.conflictCount;
      result.errorCount += uploadResult.errorCount;
      result.errors.push(...uploadResult.errors);

      // Update last sync timestamp
      await offlineDB.settings.put({
        id: 'last_sync',
        key: 'last_sync',
        value: Date.now(),
        sync_status: 'synced',
      });

      result.success = result.errorCount === 0;
      console.log('Sync completed:', result);
    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errorCount++;
      result.errors.push(
        error instanceof Error ? error.message : String(error)
      );
    }

    return result;
  }

  // Download work orders from server and merge with local data
  private async downloadWorkOrders(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      // Get last sync timestamp to only fetch changed records
      const lastSyncSetting = await offlineDB.settings.get('last_sync');
      const lastSync = lastSyncSetting
        ? new Date(lastSyncSetting.value)
        : new Date(0);

      // Fetch work orders from server
      const { data: serverWorkOrders, error } = await supabase
        .from('work_orders')
        .select('*')
        .gte('updated_at', lastSync.toISOString())
        .order('updated_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch work orders: ${error.message}`);
      }

      if (!serverWorkOrders || serverWorkOrders.length === 0) {
        return result;
      }

      // Process each work order
      for (const serverWO of serverWorkOrders) {
        try {
          const existingWO = await offlineDB.workOrders.get(serverWO.id);

          if (!existingWO) {
            // New work order from server - store locally
            const offlineWO = convertWorkOrderToOffline(serverWO);
            offlineWO.sync_status = 'synced';
            await offlineDB.workOrders.put(offlineWO);
            result.syncedCount++;
          } else {
            // Check for conflicts
            const serverTimestamp = new Date(serverWO.updated_at).getTime();
            const localTimestamp = existingWO.updated_at;

            if (
              existingWO.sync_status === 'pending' &&
              serverTimestamp > localTimestamp
            ) {
              // Conflict: both local and server have changes
              existingWO.sync_status = 'conflict';
              // Store a reference to the local version for conflict resolution

              // Store server version as base
              const serverOfflineWO = convertWorkOrderToOffline(serverWO);
              Object.assign(existingWO, serverOfflineWO);
              existingWO.sync_status = 'conflict';

              await offlineDB.workOrders.put(existingWO);
              result.conflictCount++;
            } else if (
              existingWO.sync_status === 'synced' &&
              serverTimestamp > localTimestamp
            ) {
              // Server has newer version, update local
              const serverOfflineWO = convertWorkOrderToOffline(serverWO);
              serverOfflineWO.sync_status = 'synced';
              await offlineDB.workOrders.put(serverOfflineWO);
              result.syncedCount++;
            }
          }
        } catch (itemError) {
          console.error(
            `Failed to process work order ${serverWO.id}:`,
            itemError
          );
          result.errorCount++;
          result.errors.push(`Work order ${serverWO.id}: ${itemError}`);
        }
      }
    } catch (error) {
      console.error('Failed to download work orders:', error);
      result.errorCount++;
      result.errors.push(
        error instanceof Error ? error.message : String(error)
      );
    }

    return result;
  }

  // Upload pending local changes to server
  private async uploadPendingChanges(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      conflictCount: 0,
      errorCount: 0,
      errors: [],
    };

    try {
      // Get all pending sync operations
      const pendingOps = await offlineDB.syncQueue
        .where('status')
        .anyOf(['pending', 'failed'])
        .sortBy('timestamp');

      for (const op of pendingOps) {
        try {
          await this.processSyncOperation(op);
          result.syncedCount++;
        } catch (error) {
          console.error(`Failed to process sync operation ${op.id}:`, error);
          result.errorCount++;
          result.errors.push(`Operation ${op.id}: ${error}`);

          // Update retry count
          if (op.id) {
            await offlineDB.syncQueue.update(op.id, {
              retry_count: op.retry_count + 1,
              status: op.retry_count >= 3 ? 'failed' : 'pending',
            });
          }
        }
      }

      // Also upload work orders with pending status
      const pendingWorkOrders = await offlineDB.workOrders
        .where('sync_status')
        .equals('pending')
        .toArray();

      for (const offlineWO of pendingWorkOrders) {
        try {
          const workOrder = convertWorkOrderFromOffline(offlineWO);

          // Check if this is a new work order or update
          const { data: existingWO } = await supabase
            .from('work_orders')
            .select('id, updated_at')
            .eq('id', workOrder.id)
            .single();

          if (!existingWO) {
            // Create new work order
            const { error } = await supabase
              .from('work_orders')
              .insert(workOrder);

            if (error) {
              throw new Error(`Failed to create work order: ${error.message}`);
            }
          } else {
            // Update existing work order
            const { error } = await supabase
              .from('work_orders')
              .update(workOrder)
              .eq('id', workOrder.id);

            if (error) {
              throw new Error(`Failed to update work order: ${error.message}`);
            }
          }

          // Mark as synced
          offlineWO.sync_status = 'synced';
          offlineWO.last_sync = Date.now();
          await offlineDB.workOrders.put(offlineWO);
          result.syncedCount++;
        } catch (error) {
          console.error(`Failed to sync work order ${offlineWO.id}:`, error);
          result.errorCount++;
          result.errors.push(`Work order ${offlineWO.id}: ${error}`);
        }
      }
    } catch (error) {
      console.error('Failed to upload pending changes:', error);
      result.errorCount++;
      result.errors.push(
        error instanceof Error ? error.message : String(error)
      );
    }

    return result;
  }

  private async processSyncOperation(op: SyncOperation): Promise<void> {
    if (!op.id) return;

    // Mark as processing
    await offlineDB.syncQueue.update(op.id, { status: 'processing' });

    try {
      switch (op.operation_type) {
        case 'create':
          await this.syncCreate(op);
          break;
        case 'update':
          await this.syncUpdate(op);
          break;
        case 'delete':
          await this.syncDelete(op);
          break;
        default:
          throw new Error(`Unknown operation type: ${op.operation_type}`);
      }

      // Mark as completed
      await offlineDB.syncQueue.update(op.id, { status: 'completed' });
    } catch (error) {
      // Mark as failed
      await offlineDB.syncQueue.update(op.id, { status: 'failed' });
      throw error;
    }
  }

  private async syncCreate(op: SyncOperation): Promise<void> {
    const { error } = await supabase.from(op.table_name).insert(op.data);

    if (error) {
      throw new Error(`Create failed: ${error.message}`);
    }
  }

  private async syncUpdate(op: SyncOperation): Promise<void> {
    const { error } = await supabase
      .from(op.table_name)
      .update(op.data)
      .eq('id', op.record_id);

    if (error) {
      throw new Error(`Update failed: ${error.message}`);
    }
  }

  private async syncDelete(op: SyncOperation): Promise<void> {
    const { error } = await supabase
      .from(op.table_name)
      .delete()
      .eq('id', op.record_id);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Queue a sync operation for later execution
  public async queueSyncOperation(
    operation: 'create' | 'update' | 'delete',
    tableName: string,
    recordId: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    await offlineDB.syncQueue.add({
      operation_type: operation,
      table_name: tableName,
      record_id: recordId,
      data: data || null,
      timestamp: Date.now(),
      retry_count: 0,
      status: 'pending',
    });
  }

  // Force resolve a conflict by choosing local or server version
  public async resolveConflict(
    workOrderId: string,
    resolution: 'local' | 'server'
  ): Promise<void> {
    const conflictWO = await offlineDB.workOrders.get(workOrderId);
    if (!conflictWO || conflictWO.sync_status !== 'conflict') {
      throw new Error('No conflict found for this work order');
    }

    if (resolution === 'local') {
      // Keep local changes, mark for upload
      if (conflictWO.local_changes) {
        Object.assign(conflictWO, conflictWO.local_changes);
        delete conflictWO.local_changes;
      }
      conflictWO.sync_status = 'pending';
    } else {
      // Keep server version, discard local changes
      delete conflictWO.local_changes;
      conflictWO.sync_status = 'synced';
    }

    await offlineDB.workOrders.put(conflictWO);
  }

  // Get list of conflicts that need manual resolution
  public async getConflicts(): Promise<OfflineWorkOrder[]> {
    return offlineDB.workOrders
      .where('sync_status')
      .equals('conflict')
      .toArray();
  }

  // Clean up completed sync operations and old data
  public async cleanup(): Promise<void> {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Remove completed sync operations older than 1 week
    await offlineDB.syncQueue
      .where('status')
      .equals('completed')
      .and(op => op.timestamp < oneWeekAgo)
      .delete();

    console.log('Offline data cleanup completed');
  }
}

// Singleton instance
export const offlineSyncService = new OfflineSyncService();
