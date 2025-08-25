import { eq, and, or } from 'drizzle-orm';
import { db } from './db';
import { IStorage } from './storage';
import {
  profiles,
  warehouses,
  equipment,
  workOrders,
  workOrderChecklistItems,
  parts,
  partsUsage,
  laborTime,
  vendors,
  pmTemplates,
  notifications,
  notificationPreferences,
  pushSubscriptions,
  attachments,
  systemLogs,
  Profile,
  InsertProfile,
  Warehouse,
  InsertWarehouse,
  Equipment,
  InsertEquipment,
  WorkOrder,
  InsertWorkOrder,
  WorkOrderChecklistItem,
  Part,
  InsertPart,
  PartsUsage,
  LaborTime,
  InsertLaborTime,
  Vendor,
  InsertVendor,
  PmTemplate,
  InsertPmTemplate,
  Notification,
  InsertNotification,
  NotificationPreference,
  InsertNotificationPreference,
  PushSubscription,
  InsertPushSubscription,
  Attachment,
  InsertAttachment,
  SystemLog,
} from '../shared/schema';

export class DatabaseStorage implements IStorage {
  private generateId(): string {
    return crypto.randomUUID();
  }

  // Initialize the database with sample data
  async initializeData(): Promise<void> {
    // Check if data already exists
    const existingWarehouses = await db.select().from(warehouses).limit(1);
    if (existingWarehouses.length > 0) {
      return; // Data already exists
    }

    // Create sample warehouse
    const [warehouse] = await db
      .insert(warehouses)
      .values({
        id: this.generateId(),
        name: 'Main Warehouse',
        address: '123 Industrial Way, Manufacturing City, MC 12345',
        timezone: 'America/New_York',
        operatingHoursStart: '07:00',
        operatingHoursEnd: '19:00',
        emergencyContact: '+1-555-0199',
        active: true,
      })
      .returning();

    // Create sample users
    const users = [
      {
        id: this.generateId(),
        email: 'supervisor@maintainpro.com',
        firstName: 'John',
        lastName: 'Smith',
        role: 'supervisor' as const,
        warehouseId: warehouse.id,
        active: true,
      },
      {
        id: this.generateId(),
        email: 'technician@maintainpro.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'technician' as const,
        warehouseId: warehouse.id,
        active: true,
      },
      {
        id: this.generateId(),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'technician' as const,
        warehouseId: warehouse.id,
        active: true,
      },
      {
        id: this.generateId(),
        email: 'manager@example.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'manager' as const,
        warehouseId: warehouse.id,
        active: true,
      },
    ];

    const insertedUsers = await db.insert(profiles).values(users).returning();

    // Seed user credentials with password hashes
    {
      const passwordServiceImport = await import('./services/auth/password.service');
      const schemaImport = await import('../shared/schema');
      const PasswordService = passwordServiceImport.PasswordService;
      const userCredentials = schemaImport.userCredentials;
      const defaultPassword = 'PlaywrightTest123!';
      const credentialsList = [];
      for (const user of insertedUsers) {
        const { hash, salt } = await PasswordService.hashPassword(defaultPassword);
        credentialsList.push({
          id: this.generateId(),
          userId: user.id,
          passwordHash: hash,
          passwordSalt: salt,
          mustChangePassword: false,
          passwordExpiresAt: null,
          previousPasswords: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await db.insert(userCredentials).values(credentialsList).returning();
    }
    // Create sample equipment
    const equipmentList = [
      {
        id: this.generateId(),
        assetTag: 'PUMP-001',
        description: 'Centrifugal Water Pump',
        area: 'Production Floor A',
        model: 'WP-500',
        status: 'active' as const,
        criticality: 'high' as const,
        warehouseId: warehouse.id,
        specifications: {},
        installationDate: new Date('2020-01-15'),
        lastMaintenanceDate: new Date('2024-11-15'),
        nextMaintenanceDate: new Date('2025-02-15'),
        warrantyExpiration: new Date('2025-01-15'),
      },
      {
        id: this.generateId(),
        assetTag: 'CONV-002',
        description: 'Conveyor Belt System',
        area: 'Packaging Line 1',
        model: 'CB-1200',
        status: 'active' as const,
        criticality: 'medium' as const,
        warehouseId: warehouse.id,
        specifications: {},
        installationDate: new Date('2021-03-10'),
        lastMaintenanceDate: new Date('2024-12-01'),
        nextMaintenanceDate: new Date('2025-03-01'),
        warrantyExpiration: new Date('2026-03-10'),
      },
    ];

    const insertedEquipment = await db.insert(equipment).values(equipmentList).returning();

    // Create sample parts
    const partsList = [
      {
        id: this.generateId(),
        partNumber: 'SEAL-001',
        name: 'Pump Seal Kit',
        description: 'Pump Seal Kit',
        category: 'Seals & Gaskets',
        location: 'Aisle A, Shelf 3',
        unitOfMeasure: 'EA',
        unitCost: '45.99',
        stockLevel: 12,
        reorderPoint: 5,
        maxStock: 25,
        vendor: 'Industrial Supply Co',
        warehouseId: warehouse.id,
        active: true,
      },
      {
        id: this.generateId(),
        partNumber: 'BELT-002',
        name: 'Conveyor Belt',
        description: 'Conveyor Belt',
        category: 'Belts',
        location: 'Aisle B, Shelf 1',
        unitOfMeasure: 'FT',
        unitCost: '12.50',
        stockLevel: 3,
        reorderPoint: 10,
        maxStock: 50,
        vendor: 'Belt Solutions Inc',
        warehouseId: warehouse.id,
        active: true,
      },
    ];

    await db.insert(parts).values(partsList).returning();

    // Create sample notifications
    const notificationsList = [
      {
        id: this.generateId(),
        userId: insertedUsers[0].id,
        type: 'wo_assigned' as const,
        title: 'New Work Order Assigned',
        message: 'Work order WO-001 has been assigned to you',
        read: false,
        workOrderId: null,
        equipmentId: null,
        partId: null,
      },
      {
        id: this.generateId(),
        userId: insertedUsers[1].id,
        type: 'part_low_stock' as const,
        title: 'Low Stock Alert',
        message: 'Conveyor Belt stock is below reorder point',
        read: false,
        workOrderId: null,
        equipmentId: null,
        partId: null,
      },
    ];

    await db.insert(notifications).values(notificationsList).returning();

    // Create sample work orders
    const workOrdersList = [
      {
        id: this.generateId(),
        foNumber: 'WO-001',
        type: 'preventive' as const,
        description: 'Monthly maintenance check on centrifugal water pump',
        area: 'Production Floor A',
        assetModel: 'WP-500',
        status: 'new' as const,
        priority: 'medium' as const,
        equipmentId: insertedEquipment[0].id,
        assignedTo: insertedUsers[1].id, // technician
        requestedBy: insertedUsers[0].id, // supervisor
        dueDate: new Date('2025-02-15'),
        completedAt: null,
        verifiedBy: null,
        estimatedHours: '4.00',
        actualHours: null,
        notes: 'Check seals and lubrication',
        followUp: false,
        escalated: false,
        escalationLevel: 0,
        warehouseId: warehouse.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.generateId(),
        foNumber: 'WO-002',
        type: 'preventive' as const,
        description: 'Weekly inspection of conveyor belt system',
        area: 'Packaging Line 1',
        assetModel: 'CB-1200',
        status: 'in_progress' as const,
        priority: 'high' as const,
        equipmentId: insertedEquipment[1].id,
        assignedTo: insertedUsers[1].id, // technician
        requestedBy: insertedUsers[0].id, // supervisor
        dueDate: new Date('2025-01-20'),
        completedAt: null,
        verifiedBy: null,
        estimatedHours: '2.00',
        actualHours: '1.50',
        notes: 'Check belt tension and alignment',
        followUp: false,
        escalated: false,
        escalationLevel: 0,
        warehouseId: warehouse.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: this.generateId(),
        foNumber: 'WO-003',
        type: 'emergency' as const,
        description: 'Urgent repair needed on water pump seal',
        area: 'Production Floor A',
        assetModel: 'WP-500',
        status: 'assigned' as const,
        priority: 'critical' as const,
        equipmentId: insertedEquipment[0].id,
        assignedTo: insertedUsers[1].id, // technician
        requestedBy: insertedUsers[2].id, // manager
        dueDate: new Date('2025-01-18'),
        completedAt: null,
        verifiedBy: null,
        estimatedHours: '6.00',
        actualHours: null,
        notes: 'Pump seal is leaking, affecting production',
        followUp: true,
        escalated: false,
        escalationLevel: 0,
        warehouseId: warehouse.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db
      .insert(workOrders)
      .values(workOrdersList as unknown)
      .returning();

    console.log('Database initialized with sample data');
  }

  // Profiles
  async getProfile(id: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
    return result[0];
  }

  async getProfileByEmail(email: string): Promise<Profile | undefined> {
    const result = await db.select().from(profiles).where(eq(profiles.email, email)).limit(1);
    return result[0];
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const newProfile = {
      id: this.generateId(),
      ...(profile as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(profiles).values(newProfile).returning();
    return created;
  }

  async updateProfile(id: string, profile: Partial<InsertProfile>): Promise<Profile> {
    const [updated] = await db.update(profiles).set(profile).where(eq(profiles.id, id)).returning();
    return updated;
  }

  async getProfiles(): Promise<Profile[]> {
    return await db.select().from(profiles);
  }

  // Warehouses
  async getWarehouses(): Promise<Warehouse[]> {
    return await db.select().from(warehouses);
  }

  async getWarehouse(id: string): Promise<Warehouse | undefined> {
    const result = await db.select().from(warehouses).where(eq(warehouses.id, id)).limit(1);
    return result[0];
  }

  async createWarehouse(warehouse: InsertWarehouse): Promise<Warehouse> {
    const newWarehouse = {
      id: this.generateId(),
      ...(warehouse as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(warehouses).values(newWarehouse).returning();
    return created;
  }

  // Equipment
  async getEquipment(warehouseId: string): Promise<Equipment[]> {
    return await db.select().from(equipment).where(eq(equipment.warehouseId, warehouseId));
  }

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    const result = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);
    return result[0];
  }

  async getEquipmentByAssetTag(assetTag: string): Promise<Equipment | undefined> {
    const result = await db
      .select()
      .from(equipment)
      .where(eq(equipment.assetTag, assetTag))
      .limit(1);
    return result[0];
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const newEquipment = {
      id: this.generateId(),
      ...(equipmentData as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(equipment).values(newEquipment).returning();
    return created;
  }

  async updateEquipment(id: string, equipmentData: Partial<InsertEquipment>): Promise<Equipment> {
    const [updated] = await db
      .update(equipment)
      .set(equipmentData)
      .where(eq(equipment.id, id))
      .returning();
    return updated;
  }

  // Work Orders
  async getWorkOrders(
    warehouseId: string,
    _filters?: Record<string, unknown>
  ): Promise<WorkOrder[]> {
    return await db.select().from(workOrders).where(eq(workOrders.warehouseId, warehouseId));
  }
  async getWorkOrder(id: string): Promise<WorkOrder | undefined> {
    const result = await db.select().from(workOrders).where(eq(workOrders.id, id)).limit(1);
    return result[0];
  }

  async createWorkOrder(workOrder: InsertWorkOrder): Promise<WorkOrder> {
    const newWorkOrder = {
      id: this.generateId(),
      ...(workOrder as Record<string, unknown>),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [created] = await db.insert(workOrders).values(newWorkOrder).returning();
    return created;
  }

  async updateWorkOrder(id: string, workOrder: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const updateData = {
      ...(workOrder as Record<string, unknown>),
      updatedAt: new Date(),
    };
    const [updated] = await db
      .update(workOrders)
      .set(updateData)
      .where(eq(workOrders.id, id))
      .returning();
    return updated;
  }

  async deleteWorkOrder(id: string): Promise<void> {
    await db.delete(workOrders).where(eq(workOrders.id, id));
  }

  async getWorkOrdersByAssignee(userId: string): Promise<WorkOrder[]> {
    return await db.select().from(workOrders).where(eq(workOrders.assignedTo, userId));
  }

  // Work Order Checklist Items
  async getChecklistItems(workOrderId: string): Promise<WorkOrderChecklistItem[]> {
    return await db
      .select()
      .from(workOrderChecklistItems)
      .where(eq(workOrderChecklistItems.workOrderId, workOrderId));
  }

  async createChecklistItem(
    item: Omit<WorkOrderChecklistItem, 'id' | 'createdAt'>
  ): Promise<WorkOrderChecklistItem> {
    const newItem = {
      ...item,
      id: this.generateId(),
      createdAt: new Date(),
    };
    const [created] = await db.insert(workOrderChecklistItems).values(newItem).returning();
    return created;
  }

  async updateChecklistItem(
    id: string,
    item: Partial<WorkOrderChecklistItem>
  ): Promise<WorkOrderChecklistItem> {
    const [updated] = await db
      .update(workOrderChecklistItems)
      .set(item)
      .where(eq(workOrderChecklistItems.id, id))
      .returning();
    return updated;
  }

  async createWorkOrderChecklistItem(
    item: Omit<WorkOrderChecklistItem, 'id' | 'createdAt'>
  ): Promise<WorkOrderChecklistItem> {
    return this.createChecklistItem(item);
  }

  // Parts
  async getParts(warehouseId: string): Promise<Part[]> {
    return await db.select().from(parts).where(eq(parts.warehouseId, warehouseId));
  }

  async getPart(id: string): Promise<Part | undefined> {
    const result = await db.select().from(parts).where(eq(parts.id, id)).limit(1);
    return result[0];
  }

  async getPartByNumber(partNumber: string): Promise<Part | undefined> {
    const result = await db.select().from(parts).where(eq(parts.partNumber, partNumber)).limit(1);
    return result[0];
  }

  async createPart(part: InsertPart): Promise<Part> {
    const newPart = {
      id: this.generateId(),
      ...(part as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(parts).values(newPart).returning();
    return created;
  }

  async updatePart(id: string, part: Partial<InsertPart>): Promise<Part> {
    const [updated] = await db.update(parts).set(part).where(eq(parts.id, id)).returning();
    return updated;
  }

  async getPartsUsage(workOrderId: string): Promise<PartsUsage[]> {
    return await db.select().from(partsUsage).where(eq(partsUsage.workOrderId, workOrderId));
  }

  async createPartsUsage(usage: Omit<PartsUsage, 'id' | 'createdAt'>): Promise<PartsUsage> {
    const newUsage = {
      ...usage,
      id: this.generateId(),
      createdAt: new Date(),
    };
    const [created] = await db.insert(partsUsage).values(newUsage).returning();
    return created;
  }

  async getPartsUsageById(id: string): Promise<PartsUsage | undefined> {
    const result = await db.select().from(partsUsage).where(eq(partsUsage.id, id)).limit(1);
    return result[0];
  }

  async getPartsUsageByWorkOrder(workOrderId: string): Promise<PartsUsage[]> {
    return await db.select().from(partsUsage).where(eq(partsUsage.workOrderId, workOrderId));
  }

  async updatePartsUsage(id: string, usage: Partial<PartsUsage>): Promise<PartsUsage> {
    const [updated] = await db
      .update(partsUsage)
      .set(usage as unknown)
      .where(eq(partsUsage.id, id))
      .returning();
    return updated;
  }

  async getPartsUsageAnalytics(filters: {
    startDate?: Date;
    equipmentId?: string;
  }): Promise<(PartsUsage & { part?: Part })[]> {
    let query = db
      .select({
        id: partsUsage.id,
        workOrderId: partsUsage.workOrderId,
        partId: partsUsage.partId,
        quantityUsed: partsUsage.quantityUsed,
        notes: partsUsage.notes,
        createdAt: partsUsage.createdAt,
        partName: parts.name,
        partNumber: parts.partNumber,
      })
      .from(partsUsage)
      .leftJoin(parts, eq(partsUsage.partId, parts.id));

    const conditions = [];
    if (filters.startDate) {
      conditions.push(eq(partsUsage.createdAt, filters.startDate));
    }
    if (filters.equipmentId) {
      // Join with workOrders to filter by equipment
      query = query.leftJoin(workOrders, eq(partsUsage.workOrderId, workOrders.id)) as unknown;
      conditions.push(eq(workOrders.equipmentId, filters.equipmentId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as unknown;
    }

    const results = await query;
    return results.map(row => ({
      id: row.id,
      workOrderId: row.workOrderId,
      partId: row.partId,
      quantityUsed: row.quantityUsed,
      notes: row.notes,
      createdAt: row.createdAt,
      part: row.partName
        ? ({
            id: row.partId,
            name: row.partName,
            partNumber: row.partNumber,
          } as Partial<Part>)
        : undefined,
    })) as (PartsUsage & { part?: Part })[];
  }

  // Vendors
  async getVendors(warehouseId: string): Promise<Vendor[]> {
    return await db.select().from(vendors).where(eq(vendors.warehouseId, warehouseId));
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const result = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
    return result[0];
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const newVendor = {
      id: this.generateId(),
      ...(vendor as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(vendors).values(newVendor).returning();
    return created;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const [updated] = await db
      .update(vendors)
      .set(vendor as unknown)
      .where(eq(vendors.id, id))
      .returning();
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // PM Templates
  async getPmTemplates(warehouseId: string): Promise<PmTemplate[]> {
    return await db.select().from(pmTemplates).where(eq(pmTemplates.warehouseId, warehouseId));
  }

  async getPmTemplate(id: string): Promise<PmTemplate | null> {
    const result = await db.select().from(pmTemplates).where(eq(pmTemplates.id, id)).limit(1);
    return result[0] || null;
  }

  async createPmTemplate(template: InsertPmTemplate): Promise<PmTemplate> {
    const newTemplate = {
      id: this.generateId(),
      ...(template as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(pmTemplates).values(newTemplate).returning();
    return created;
  }

  async updatePmTemplate(
    id: string,
    updates: Partial<InsertPmTemplate>
  ): Promise<PmTemplate | null> {
    const [updated] = await db
      .update(pmTemplates)
      .set(updates)
      .where(eq(pmTemplates.id, id))
      .returning();
    return updated || null;
  }

  async deletePmTemplate(id: string): Promise<void> {
    await db.delete(pmTemplates).where(eq(pmTemplates.id, id));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification = {
      id: this.generateId(),
      ...(notification as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(notifications).values(newNotification).returning();
    return created;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true } as unknown)
      .where(eq(notifications.id, id));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Notification Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreference[]> {
    return await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));
  }

  async createNotificationPreference(
    insertPreference: InsertNotificationPreference
  ): Promise<NotificationPreference> {
    const [preference] = await db
      .insert(notificationPreferences)
      .values({
        id: this.generateId(),
        ...insertPreference,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as InsertNotificationPreference)
      .returning();
    return preference;
  }

  async updateNotificationPreference(
    userId: string,
    notificationType: string,
    updates: Partial<InsertNotificationPreference>
  ): Promise<NotificationPreference | null> {
    const [preference] = await db
      .update(notificationPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      } as Partial<InsertNotificationPreference>)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(
            notificationPreferences.notificationType,
            notificationType as
              | 'wo_assigned'
              | 'wo_overdue'
              | 'part_low_stock'
              | 'pm_due'
              | 'equipment_alert'
              | 'pm_escalation'
              | 'system_alert'
              | 'real_time_update'
          )
        )
      )
      .returning();
    return preference || null;
  }

  async deleteNotificationPreference(userId: string, notificationType: string): Promise<void> {
    await db
      .delete(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(
            notificationPreferences.notificationType,
            notificationType as
              | 'wo_assigned'
              | 'wo_overdue'
              | 'part_low_stock'
              | 'pm_due'
              | 'equipment_alert'
              | 'pm_escalation'
              | 'system_alert'
              | 'real_time_update'
          )
        )
      );
  }

  // Push Subscriptions
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async createPushSubscription(
    insertSubscription: InsertPushSubscription
  ): Promise<PushSubscription> {
    const [subscription] = await db
      .insert(pushSubscriptions)
      .values({
        id: this.generateId(),
        ...insertSubscription,
        createdAt: new Date(),
        lastUsed: new Date(),
      } as InsertPushSubscription)
      .returning();
    return subscription;
  }

  async updatePushSubscription(
    id: string,
    updates: Partial<InsertPushSubscription>
  ): Promise<PushSubscription | null> {
    const [subscription] = await db
      .update(pushSubscriptions)
      .set({
        ...updates,
        lastUsed: new Date(),
      } as Partial<InsertPushSubscription>)
      .where(eq(pushSubscriptions.id, id))
      .returning();
    return subscription || null;
  }

  async deletePushSubscription(id: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  }

  async getActivePushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.active, true)));
  }

  // Attachments
  async getAttachments(
    workOrderId?: string,
    equipmentId?: string,
    pmTemplateId?: string,
    vendorId?: string
  ): Promise<Attachment[]> {
    let query = db.select().from(attachments);

    const conditions = [];
    if (workOrderId) {
      conditions.push(eq(attachments.workOrderId, workOrderId));
    }
    if (equipmentId) {
      conditions.push(eq(attachments.equipmentId, equipmentId));
    }
    if (pmTemplateId) {
      conditions.push(eq(attachments.pmTemplateId, pmTemplateId));
    }
    if (vendorId) {
      conditions.push(eq(attachments.vendorId, vendorId));
    }

    if (conditions.length > 0) {
      query = query.where(or(...conditions)) as unknown;
    }

    return await query;
  }

  async getAttachmentById(id: string): Promise<Attachment | undefined> {
    const result = await db.select().from(attachments).where(eq(attachments.id, id));
    return result[0];
  }

  async deleteAttachment(id: string): Promise<void> {
    await db.delete(attachments).where(eq(attachments.id, id));
  }

  async getFileUploadStatistics(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    fileTypes: Record<string, number>;
  }> {
    const allAttachments = await db
      .select({
        fileSize: attachments.fileSize,
        fileType: attachments.fileType,
      })
      .from(attachments);

    const totalFiles = allAttachments.length;
    const totalSize = allAttachments.reduce((sum, file) => sum + (file.fileSize || 0), 0);
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    const fileTypes: Record<string, number> = {};
    allAttachments.forEach(file => {
      if (file.fileType) {
        fileTypes[file.fileType] = (fileTypes[file.fileType] || 0) + 1;
      }
    });

    return {
      totalFiles,
      totalSize,
      averageSize,
      fileTypes,
    };
  }

  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const newAttachment = {
      id: this.generateId(),
      ...(attachment as Record<string, unknown>),
      createdAt: new Date(),
    };
    const [created] = await db.insert(attachments).values(newAttachment).returning();
    return created;
  }

  // Labor Time methods
  async getLaborTime(workOrderId: string): Promise<LaborTime[]> {
    return await db.select().from(laborTime).where(eq(laborTime.workOrderId, workOrderId));
  }

  async getLaborTimeById(id: string): Promise<LaborTime | undefined> {
    const [result] = await db.select().from(laborTime).where(eq(laborTime.id, id));
    return result;
  }

  async createLaborTime(insertLaborTime: InsertLaborTime): Promise<LaborTime> {
    const [laborTimeEntry] = await db
      .insert(laborTime)
      .values({
        id: this.generateId(),
        ...insertLaborTime,
        createdAt: new Date(),
      } as unknown)
      .returning();
    return laborTimeEntry;
  }

  async updateLaborTime(id: string, updateData: Partial<InsertLaborTime>): Promise<LaborTime> {
    const [updated] = await db
      .update(laborTime)
      .set(updateData as unknown)
      .where(eq(laborTime.id, id))
      .returning();
    return updated;
  }

  async deleteLaborTime(id: string): Promise<void> {
    await db.delete(laborTime).where(eq(laborTime.id, id));
  }

  async getActiveLaborTime(userId: string): Promise<LaborTime | undefined> {
    const [result] = await db
      .select()
      .from(laborTime)
      .where(and(eq(laborTime.userId, userId), eq(laborTime.isActive, true)));
    return result;
  }

  // System Logs
  async createSystemLog(log: Omit<SystemLog, 'id' | 'createdAt'>): Promise<SystemLog> {
    const newLog = {
      ...log,
      id: this.generateId(),
      createdAt: new Date(),
    };
    const [created] = await db.insert(systemLogs).values(newLog).returning();
    return created;
  }
}
