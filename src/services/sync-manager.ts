import { OfflineStorageService, SyncQueueItem } from './offline-storage';
import { supabase } from '../lib/supabase';
import {
  WorkOrder,
  WorkOrderChecklistItem,
  WorkOrderAttachment,
} from '../modules/work-orders/types/workOrder';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingItems: number;
  syncErrors: SyncError[];
}

export interface SyncError {
  id: string;
  table: string;
  action: string;
  error: string;
  timestamp: string;
  retry_count: number;
}

export interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge';
  localData?: Record<string, unknown>;
  remoteData?: Record<string, unknown>;
  mergedData?: Record<string, unknown>;
}

export class SyncManager {
  private static syncInProgress = false;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

  private static listeners: Array<(status: SyncStatus) => void> = [];

  /**
   * Initialize sync manager
   */
  static init(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Start automatic sync if online
    if (navigator.onLine) {
      this.startAutoSync();
    }
  }

  /**
   * Handle coming online
   */
  private static handleOnline(): void {
    console.log('Device is now online, starting sync...');
    OfflineStorageService.updateLastOnlineTimestamp();
    this.startAutoSync();
    this.sync();
  }

  /**
   * Handle going offline
   */
  private static handleOffline(): void {
    console.log('Device is now offline, stopping auto sync...');
    this.stopAutoSync();
  }

  /**
   * Start automatic synchronization
   */
  static startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.sync();
      }
    }, this.SYNC_INTERVAL_MS);
  }

  /**
   * Stop automatic synchronization
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Manually trigger sync
   */
  static async sync(): Promise<SyncStatus> {
    if (this.syncInProgress) {
      return this.getSyncStatus();
    }

    if (!navigator.onLine) {
      console.log('Cannot sync: device is offline');
      return this.getSyncStatus();
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      console.log('Starting sync...');
      const pendingItems = await OfflineStorageService.getPendingSyncItems();
      console.log(`Found ${pendingItems.length} items to sync`);

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          await OfflineStorageService.completeSyncItem(item.id!);
          console.log(
            `Synced ${item.table}:${item.record_id} (${item.action})`
          );
        } catch (error) {
          console.error(
            `Failed to sync ${item.table}:${item.record_id}:`,
            error
          );
          await OfflineStorageService.failSyncItem(
            item.id!,
            (error as Error).message
          );
        }
      }

      await OfflineStorageService.setMetadata(
        'last_sync',
        new Date().toISOString()
      );
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }

    return this.getSyncStatus();
  }

  /**
   * Sync individual item
   */
  private static async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.table) {
      case 'work_orders':
        await this.syncWorkOrder(item);
        break;
      case 'checklist_items':
        await this.syncChecklistItem(item);
        break;
      case 'attachments':
        await this.syncAttachment(item);
        break;
      default:
        throw new Error(`Unknown table: ${item.table}`);
    }
  }

  /**
   * Sync work order
   */
  private static async syncWorkOrder(item: SyncQueueItem): Promise<void> {
    const workOrder = item.data as WorkOrder;

    switch (item.action) {
      case 'create': {
        const { data: created, error: createError } = await supabase
          .from('work_orders')
          .insert(workOrder)
          .select()
          .single();

        if (createError) throw createError;

        // Update local storage with server-generated data
        await OfflineStorageService.storeWorkOrder(created);
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from('work_orders')
          .update(workOrder)
          .eq('id', workOrder.id);

        if (updateError) {
          // Check for conflicts
          if (updateError.code === 'PGRST116') {
            // Row not found, might be deleted
            console.warn(
              `Work order ${workOrder.id} not found on server, may have been deleted`
            );
            return;
          }
          throw updateError;
        }
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from('work_orders')
          .delete()
          .eq('id', workOrder.id);

        if (deleteError && deleteError.code !== 'PGRST116') {
          throw deleteError;
        }
        break;
      }
    }
  }

  /**
   * Sync checklist item
   */
  private static async syncChecklistItem(item: SyncQueueItem): Promise<void> {
    const checklistItem = item.data as WorkOrderChecklistItem;

    switch (item.action) {
      case 'create': {
        const { error: createError } = await supabase
          .from('work_order_checklist_items')
          .insert(checklistItem);

        if (createError) throw createError;
        break;
      }

      case 'update': {
        const { error: updateError } = await supabase
          .from('work_order_checklist_items')
          .update(checklistItem)
          .eq('id', checklistItem.id);

        if (updateError) throw updateError;
        break;
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from('work_order_checklist_items')
          .delete()
          .eq('id', checklistItem.id);

        if (deleteError && deleteError.code !== 'PGRST116') {
          throw deleteError;
        }
        break;
      }
    }
  }

  /**
   * Sync attachment
   */
  private static async syncAttachment(item: SyncQueueItem): Promise<void> {
    const attachment = item.data as WorkOrderAttachment;

    switch (item.action) {
      case 'create': {
        // First upload the file if it's stored offline
        const offlineAttachment = await OfflineStorageService.getAttachments(
          attachment.work_order_id
        );
        const fileAttachment = offlineAttachment.find(
          a => a.id === attachment.id
        );

        if (fileAttachment?.offline_blob) {
          // Upload file to Supabase Storage
          const { data: fileData, error: fileError } = await supabase.storage
            .from('work_order_attachments')
            .upload(attachment.file_path, fileAttachment.offline_blob);

          if (fileError) throw fileError;

          // Update file path with actual storage path
          attachment.file_path = fileData.path;
        }

        // Insert attachment record
        const { error: createError } = await supabase
          .from('work_order_attachments')
          .insert(attachment);

        if (createError) throw createError;
        break;
      }

      case 'delete': {
        // Delete file from storage
        const { error: storageError } = await supabase.storage
          .from('work_order_attachments')
          .remove([attachment.file_path]);

        if (storageError)
          console.warn('Failed to delete file from storage:', storageError);

        // Delete attachment record
        const { error: deleteError } = await supabase
          .from('work_order_attachments')
          .delete()
          .eq('id', attachment.id);

        if (deleteError && deleteError.code !== 'PGRST116') {
          throw deleteError;
        }
        break;
      }
    }
  }

  /**
   * Handle sync conflicts
   */
  static async resolveConflict(
    item: SyncQueueItem,
    remoteData: Record<string, unknown>,
    resolution: ConflictResolution
  ): Promise<void> {
    switch (resolution.strategy) {
      case 'local':
        // Keep local changes, overwrite remote
        await this.syncItem(item);
        break;

      case 'remote':
        // Keep remote changes, update local
        switch (item.table) {
          case 'work_orders':
            await OfflineStorageService.storeWorkOrder(
              remoteData as unknown as WorkOrder
            );
            break;
          // Add other table cases as needed
        }
        break;

      case 'merge':
        // Use merged data
        if (resolution.mergedData) {
          const mergedItem: SyncQueueItem = {
            ...item,
            data: resolution.mergedData,
          };
          await this.syncItem(mergedItem);
        }
        break;
    }
  }

  /**
   * Get current sync status
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    const pendingItems = await OfflineStorageService.getPendingSyncItems(1000); // Get all pending
    const lastSync = (await OfflineStorageService.getMetadata('last_sync')) as
      | string
      | null;

    const syncErrors: SyncError[] = pendingItems
      .filter(item => item.retry_count > 0)
      .map(item => ({
        id: item.record_id,
        table: item.table,
        action: item.action,
        error: item.last_error || 'Unknown error',
        timestamp: item.timestamp,
        retry_count: item.retry_count,
      }));

    return {
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
      lastSync,
      pendingItems: pendingItems.length,
      syncErrors,
    };
  }

  /**
   * Add sync status listener
   */
  static addListener(listener: (status: SyncStatus) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove sync status listener
   */
  static removeListener(listener: (status: SyncStatus) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of status change
   */
  private static async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }

  /**
   * Clear all sync data
   */
  static async clearSyncData(): Promise<void> {
    await OfflineStorageService.clearAllData();
    console.log('All sync data cleared');
  }

  /**
   * Force full resync
   */
  static async forceResync(): Promise<void> {
    // This would fetch all data from server and replace local data
    // Implementation depends on specific requirements
    console.log('Force resync not yet implemented');
  }

  /**
   * Cleanup and destroy
   */
  static destroy(): void {
    this.stopAutoSync();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.listeners = [];
  }
}

export default SyncManager;
