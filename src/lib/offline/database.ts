// Database configuration for offline storage
import Dexie from 'dexie';
import { WorkOrder } from '../../modules/work-orders/types/workOrder';

// Define the offline database schema
export interface OfflineWorkOrder
  extends Omit<WorkOrder, 'created_at' | 'updated_at'> {
  // Use timestamp numbers for IndexedDB compatibility
  created_at: number;
  updated_at: number;
  // Add offline-specific fields
  local_changes?: Partial<WorkOrder>;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
  last_sync?: number;
  version: number; // For conflict resolution
}

export interface SyncOperation {
  id?: number;
  operation_type: 'create' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  data: any;
  timestamp: number;
  retry_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface OfflineEquipment {
  id: string;
  name: string;
  location: string;
  qr_code?: string;
  status: string;
  model?: string;
  manufacturer?: string;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
  last_sync?: number;
  version: number;
}

export interface OfflineSettings {
  id: string;
  key: string;
  value: any;
  sync_status: 'synced' | 'pending';
}

// Main offline database
export class OfflineDatabase extends Dexie {
  workOrders!: Dexie.Table<OfflineWorkOrder, string>;
  equipment!: Dexie.Table<OfflineEquipment, string>;
  syncQueue!: Dexie.Table<SyncOperation, number>;
  settings!: Dexie.Table<OfflineSettings, string>;

  constructor() {
    super('MaintAInProOffline');

    this.version(1).stores({
      workOrders:
        'id, work_order_number, status, priority, assigned_to, equipment_id, sync_status, created_at, updated_at',
      equipment: 'id, name, location, qr_code, sync_status',
      syncQueue:
        '++id, operation_type, table_name, record_id, timestamp, status',
      settings: 'id, key',
    });

    // Add hooks for automatic versioning and sync tracking
    this.workOrders.hook('creating', (_primKey, obj, _trans) => {
      const now = Date.now();
      obj.created_at = now;
      obj.updated_at = now;
      obj.version = 1;
      obj.sync_status = 'pending';
    });

    this.workOrders.hook('updating', (modifications, _primKey, obj, _trans) => {
      const mods = modifications as Partial<OfflineWorkOrder>;
      mods.updated_at = Date.now();
      mods.version = (obj.version || 0) + 1;
      if (mods.sync_status !== 'conflict') {
        mods.sync_status = 'pending';
      }
    });

    this.equipment.hook('creating', (_primKey, obj, _trans) => {
      obj.version = 1;
      obj.sync_status = 'pending';
    });

    this.equipment.hook('updating', (modifications, _primKey, obj, _trans) => {
      const mods = modifications as Partial<OfflineEquipment>;
      mods.version = (obj.version || 0) + 1;
      if (mods.sync_status !== 'conflict') {
        mods.sync_status = 'pending';
      }
    });
  }
}

// Singleton instance
export const offlineDB = new OfflineDatabase();

// Initialize database and handle upgrades
export const initializeOfflineDB = async (): Promise<void> => {
  try {
    await offlineDB.open();
    console.log('Offline database initialized successfully');

    // Set default settings if they don't exist
    const syncSettings = await offlineDB.settings.get('sync_enabled');
    if (!syncSettings) {
      await offlineDB.settings.put({
        id: 'sync_enabled',
        key: 'sync_enabled',
        value: true,
        sync_status: 'synced',
      });
    }

    const autoSyncInterval = await offlineDB.settings.get('auto_sync_interval');
    if (!autoSyncInterval) {
      await offlineDB.settings.put({
        id: 'auto_sync_interval',
        key: 'auto_sync_interval',
        value: 30000, // 30 seconds
        sync_status: 'synced',
      });
    }
  } catch (error) {
    console.error('Failed to initialize offline database:', error);
    throw error;
  }
};

// Utility functions for data conversion
export const convertWorkOrderToOffline = (
  workOrder: WorkOrder
): OfflineWorkOrder => {
  return {
    ...workOrder,
    created_at: new Date(workOrder.created_at).getTime(),
    updated_at: new Date(workOrder.updated_at).getTime(),
    sync_status: 'synced',
    version: 1,
  };
};

export const convertWorkOrderFromOffline = (
  offlineWorkOrder: OfflineWorkOrder
): WorkOrder => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { sync_status, version, local_changes, last_sync, ...workOrder } =
    offlineWorkOrder;
  return {
    ...workOrder,
    created_at: new Date(offlineWorkOrder.created_at).toISOString(),
    updated_at: new Date(offlineWorkOrder.updated_at).toISOString(),
  };
};

// Database health check
export const checkDatabaseHealth = async (): Promise<{
  isHealthy: boolean;
  pendingOperations: number;
  conflictCount: number;
  lastSync?: Date;
}> => {
  try {
    const pendingSync = await offlineDB.syncQueue
      .where('status')
      .equals('pending')
      .count();
    const conflicts = await offlineDB.workOrders
      .where('sync_status')
      .equals('conflict')
      .count();

    const lastSyncSetting = await offlineDB.settings.get('last_sync');
    const lastSync = lastSyncSetting
      ? new Date(lastSyncSetting.value)
      : undefined;

    return {
      isHealthy: true,
      pendingOperations: pendingSync,
      conflictCount: conflicts,
      ...(lastSync && { lastSync }),
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      isHealthy: false,
      pendingOperations: 0,
      conflictCount: 0,
    };
  }
};
