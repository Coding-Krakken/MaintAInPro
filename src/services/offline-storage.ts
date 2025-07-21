import Dexie, { Table } from 'dexie';
import {
  WorkOrder,
  WorkOrderChecklistItem,
  WorkOrderAttachment,
} from '../modules/work-orders/types/workOrder';

// Offline versions of types with sync metadata
export interface OfflineWorkOrder extends WorkOrder {
  sync_status: 'pending' | 'synced' | 'conflict';
  last_modified_offline: string;
  offline_changes: string[]; // Array of field names that were changed offline
}

export interface OfflineChecklistItem extends WorkOrderChecklistItem {
  sync_status: 'pending' | 'synced' | 'conflict';
  last_modified_offline: string;
}

export interface OfflineAttachment extends WorkOrderAttachment {
  sync_status: 'pending' | 'synced' | 'conflict';
  last_modified_offline: string;
  offline_blob?: Blob; // Store file data offline
}

export interface SyncQueueItem {
  id?: number;
  table: string;
  record_id: string;
  action: 'create' | 'update' | 'delete';
  data:
    | Record<string, unknown>
    | OfflineWorkOrder
    | OfflineChecklistItem
    | OfflineAttachment;
  timestamp: string;
  retry_count: number;
  last_error?: string;
}

export interface OfflineMetadata {
  id?: number;
  key: string;
  value: Record<string, unknown> | string | number | boolean;
  updated_at: string;
}

class OfflineDatabase extends Dexie {
  // Work Order related tables
  work_orders!: Table<OfflineWorkOrder>;
  checklist_items!: Table<OfflineChecklistItem>;
  attachments!: Table<OfflineAttachment>;

  // Sync management
  sync_queue!: Table<SyncQueueItem>;
  metadata!: Table<OfflineMetadata>;

  constructor() {
    super('MaintAInPro_Offline');

    this.version(1).stores({
      work_orders:
        '++id, organization_id, equipment_id, work_order_number, status, priority, type, assigned_to, sync_status, last_modified_offline',
      checklist_items:
        '++id, work_order_id, order_index, is_completed, sync_status, last_modified_offline',
      attachments:
        '++id, work_order_id, file_name, sync_status, last_modified_offline',
      sync_queue: '++id, table, record_id, action, timestamp, retry_count',
      metadata: '++id, &key, updated_at',
    });
  }
}

export const offlineDB = new OfflineDatabase();

export class OfflineStorageService {
  private static readonly MAX_RETRY_COUNT = 3;
  private static readonly BATCH_SIZE = 10;

  /**
   * Store work order offline
   */
  static async storeWorkOrder(workOrder: WorkOrder): Promise<void> {
    const offlineWorkOrder: OfflineWorkOrder = {
      ...workOrder,
      sync_status: 'synced',
      last_modified_offline: new Date().toISOString(),
      offline_changes: [],
    };

    await offlineDB.work_orders.put(offlineWorkOrder);
  }

  /**
   * Get work order from offline storage
   */
  static async getWorkOrder(id: string): Promise<OfflineWorkOrder | undefined> {
    return await offlineDB.work_orders.where('id').equals(id).first();
  }

  /**
   * Get all work orders from offline storage
   */
  static async getAllWorkOrders(): Promise<OfflineWorkOrder[]> {
    return await offlineDB.work_orders
      .orderBy('created_at')
      .reverse()
      .toArray();
  }

  /**
   * Update work order offline
   */
  static async updateWorkOrder(
    id: string,
    updates: Partial<WorkOrder>,
    changedFields: string[]
  ): Promise<void> {
    const existing = await this.getWorkOrder(id);
    if (!existing) {
      throw new Error('Work order not found in offline storage');
    }

    const updated: OfflineWorkOrder = {
      ...existing,
      ...updates,
      sync_status: 'pending',
      last_modified_offline: new Date().toISOString(),
      offline_changes: [
        ...new Set([...existing.offline_changes, ...changedFields]),
      ],
    };

    await offlineDB.work_orders.put(updated);

    // Add to sync queue
    await this.addToSyncQueue('work_orders', id, 'update', updated);
  }

  /**
   * Delete work order offline
   */
  static async deleteWorkOrder(id: string): Promise<void> {
    await offlineDB.work_orders.delete(id);
    await this.addToSyncQueue('work_orders', id, 'delete', { id });
  }

  /**
   * Store checklist items offline
   */
  static async storeChecklistItems(
    items: WorkOrderChecklistItem[]
  ): Promise<void> {
    const offlineItems: OfflineChecklistItem[] = items.map(item => ({
      ...item,
      sync_status: 'synced',
      last_modified_offline: new Date().toISOString(),
    }));

    await offlineDB.checklist_items.bulkPut(offlineItems);
  }

  /**
   * Update checklist item offline
   */
  static async updateChecklistItem(
    id: string,
    updates: Partial<WorkOrderChecklistItem>
  ): Promise<void> {
    const existing = await offlineDB.checklist_items
      .where('id')
      .equals(id)
      .first();
    if (!existing) {
      throw new Error('Checklist item not found in offline storage');
    }

    const updated: OfflineChecklistItem = {
      ...existing,
      ...updates,
      sync_status: 'pending',
      last_modified_offline: new Date().toISOString(),
    };

    await offlineDB.checklist_items.put(updated);
    await this.addToSyncQueue('checklist_items', id, 'update', updated);
  }

  /**
   * Get checklist items for work order
   */
  static async getChecklistItems(
    workOrderId: string
  ): Promise<OfflineChecklistItem[]> {
    return await offlineDB.checklist_items
      .where('work_order_id')
      .equals(workOrderId)
      .toArray()
      .then(items => items.sort((a, b) => a.order_index - b.order_index));
  }

  /**
   * Store attachment offline
   */
  static async storeAttachment(
    attachment: WorkOrderAttachment,
    blob?: Blob
  ): Promise<void> {
    const offlineAttachment: OfflineAttachment = {
      ...attachment,
      sync_status: blob ? 'pending' : 'synced',
      last_modified_offline: new Date().toISOString(),
      ...(blob && { offline_blob: blob }),
    };

    await offlineDB.attachments.put(offlineAttachment);

    if (blob) {
      await this.addToSyncQueue(
        'attachments',
        attachment.id,
        'create',
        offlineAttachment
      );
    }
  }

  /**
   * Get attachments for work order
   */
  static async getAttachments(
    workOrderId: string
  ): Promise<OfflineAttachment[]> {
    return await offlineDB.attachments
      .where('work_order_id')
      .equals(workOrderId)
      .toArray();
  }

  /**
   * Add item to sync queue
   */
  static async addToSyncQueue(
    table: string,
    recordId: string,
    action: 'create' | 'update' | 'delete',
    data:
      | Record<string, unknown>
      | OfflineWorkOrder
      | OfflineChecklistItem
      | OfflineAttachment
  ): Promise<void> {
    const syncItem: SyncQueueItem = {
      table,
      record_id: recordId,
      action,
      data,
      timestamp: new Date().toISOString(),
      retry_count: 0,
    };

    await offlineDB.sync_queue.add(syncItem);
  }

  /**
   * Get pending sync items
   */
  static async getPendingSyncItems(
    limit = this.BATCH_SIZE
  ): Promise<SyncQueueItem[]> {
    return await offlineDB.sync_queue
      .where('retry_count')
      .below(this.MAX_RETRY_COUNT)
      .limit(limit)
      .toArray();
  }

  /**
   * Mark sync item as completed
   */
  static async completeSyncItem(id: number): Promise<void> {
    await offlineDB.sync_queue.delete(id);
  }

  /**
   * Mark sync item as failed
   */
  static async failSyncItem(id: number, error: string): Promise<void> {
    const item = await offlineDB.sync_queue.get(id);
    if (item) {
      item.retry_count += 1;
      item.last_error = error;
      await offlineDB.sync_queue.put(item);
    }
  }

  /**
   * Clear all offline data
   */
  static async clearAllData(): Promise<void> {
    await offlineDB.transaction('rw', offlineDB.tables, async () => {
      for (const table of offlineDB.tables) {
        await table.clear();
      }
    });
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    workOrders: number;
    checklistItems: number;
    attachments: number;
    pendingSync: number;
    totalSize: number;
  }> {
    const [workOrders, checklistItems, attachments, pendingSync] =
      await Promise.all([
        offlineDB.work_orders.count(),
        offlineDB.checklist_items.count(),
        offlineDB.attachments.count(),
        offlineDB.sync_queue.count(),
      ]);

    // Estimate storage size (rough calculation)
    const totalSize = await this.estimateStorageSize();

    return {
      workOrders,
      checklistItems,
      attachments,
      pendingSync,
      totalSize,
    };
  }

  /**
   * Estimate storage size in bytes
   */
  private static async estimateStorageSize(): Promise<number> {
    try {
      // Use Storage API if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return estimate.usage || 0;
      }

      // Fallback: rough estimation based on record counts
      const stats = await Promise.all([
        offlineDB.work_orders.count(),
        offlineDB.checklist_items.count(),
        offlineDB.attachments.count(),
      ]);

      // Rough estimates: WO=2KB, Checklist=0.5KB, Attachment=1MB
      return stats[0] * 2048 + stats[1] * 512 + stats[2] * 1048576;
    } catch {
      return 0;
    }
  }

  /**
   * Store metadata
   */
  static async setMetadata(
    key: string,
    value: Record<string, unknown> | string | number | boolean
  ): Promise<void> {
    const metadata: OfflineMetadata = {
      key,
      value,
      updated_at: new Date().toISOString(),
    };

    await offlineDB.metadata.put(metadata);
  }

  /**
   * Get metadata
   */
  static async getMetadata(
    key: string
  ): Promise<Record<string, unknown> | string | number | boolean | undefined> {
    const metadata = await offlineDB.metadata.where('key').equals(key).first();
    return metadata?.value;
  }

  /**
   * Check if device is offline
   */
  static isOffline(): boolean {
    return !navigator.onLine;
  }

  /**
   * Get offline status with additional indicators
   */
  static getOfflineStatus(): {
    isOffline: boolean;
    lastOnline: string | null;
    hasPendingChanges: boolean;
  } {
    const isOffline = this.isOffline();
    const lastOnline = localStorage.getItem('maintainpro_last_online');

    return {
      isOffline,
      lastOnline,
      hasPendingChanges: false, // Will be updated by sync service
    };
  }

  /**
   * Update last online timestamp
   */
  static updateLastOnlineTimestamp(): void {
    localStorage.setItem('maintainpro_last_online', new Date().toISOString());
  }
}

export default OfflineStorageService;
