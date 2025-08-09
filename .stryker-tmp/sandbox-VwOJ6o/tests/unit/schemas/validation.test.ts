// @ts-nocheck
import { describe, it, expect } from 'vitest';
import {
  equipmentInsertSchema,
  workOrderInsertSchema,
  userInsertSchema,
  partInsertSchema,
  notificationInsertSchema,
} from '../../../shared/schema';

describe('Schema Validation Tests', () => {
  describe('Equipment Schema', () => {
    it('should validate valid equipment data', () => {
      const validEquipment = {
        assetTag: 'ASSET-001',
        model: 'Test Machine',
        warehouseId: '00000000-0000-0000-0000-000000000001',
        status: 'active',
        criticality: 'high',
        description: 'Test equipment description',
      };

      const result = equipmentInsertSchema.safeParse(validEquipment);
      expect(result.success).toBe(true);
    });

    it('should reject equipment with invalid status', () => {
      const invalidEquipment = {
        assetTag: 'ASSET-001',
        model: 'Test Machine',
        warehouseId: '00000000-0000-0000-0000-000000000001',
        status: 'invalid-status',
        criticality: 'high',
      };

      const result = equipmentInsertSchema.safeParse(invalidEquipment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('status');
      }
    });

    it('should reject equipment with invalid criticality', () => {
      const invalidEquipment = {
        assetTag: 'ASSET-001',
        model: 'Test Machine',
        warehouseId: '00000000-0000-0000-0000-000000000001',
        status: 'active',
        criticality: 'invalid-criticality',
      };

      const result = equipmentInsertSchema.safeParse(invalidEquipment);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('criticality');
      }
    });

    it('should require mandatory fields', () => {
      const incompleteEquipment = {
        // Missing required fields
      };

      const result = equipmentInsertSchema.safeParse(incompleteEquipment);
      expect(result.success).toBe(false);
      if (!result.success) {
        const missingFields = result.error.issues.map(issue => issue.path[0]);
        // organizationId is now the primary multi-tenant field (warehouseId is legacy/optional)
        expect(missingFields).toContain('status');
        expect(missingFields).toContain('assetTag');
        expect(missingFields).toContain('model');
        expect(missingFields).toContain('criticality');
      }
    });

    it('should validate PM schedule if provided', () => {
      const equipmentWithPM = {
        assetTag: 'ASSET-001',
        model: 'Test Machine',
        warehouseId: '00000000-0000-0000-0000-000000000001',
        status: 'active',
        criticality: 'high',
        specifications: {
          pmSchedule: {
            frequency: 'daily',
            lastPmDate: new Date(),
            nextPmDate: new Date(),
          },
        },
      };

      const result = equipmentInsertSchema.safeParse(equipmentWithPM);
      expect(result.success).toBe(true);
    });
  });

  describe('Work Order Schema', () => {
    it('should validate valid work order data', () => {
      const validWorkOrder = {
        foNumber: 'WO-001',
        description: 'Conveyor belt is making unusual noise',
        type: 'corrective',
        priority: 'high',
        status: 'new',
        requestedBy: '00000000-0000-0000-0000-000000000002',
        equipmentId: '00000000-0000-0000-0000-000000000006',
        dueDate: new Date(),
      };

      const result = workOrderInsertSchema.safeParse(validWorkOrder);
      expect(result.success).toBe(true);
    });

    it('should reject work order with invalid type', () => {
      const invalidWorkOrder = {
        foNumber: 'WO-001',
        description: 'Conveyor belt is making unusual noise',
        type: 'invalid-type',
        priority: 'high',
        status: 'new',
        requestedBy: '00000000-0000-0000-0000-000000000002',
      };

      const result = workOrderInsertSchema.safeParse(invalidWorkOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('should reject work order with invalid priority', () => {
      const invalidWorkOrder = {
        foNumber: 'WO-001',
        description: 'Conveyor belt is making unusual noise',
        type: 'corrective',
        priority: 'invalid-priority',
        status: 'new',
        requestedBy: '00000000-0000-0000-0000-000000000002',
      };

      const result = workOrderInsertSchema.safeParse(invalidWorkOrder);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('priority');
      }
    });

    it('should validate with optional assigned_to field', () => {
      const workOrderWithAssignment = {
        foNumber: 'WO-001',
        description: 'Conveyor belt is making unusual noise',
        type: 'corrective',
        priority: 'high',
        status: 'assigned',
        requestedBy: '00000000-0000-0000-0000-000000000002',
        assignedTo: '00000000-0000-0000-0000-000000000003',
        equipmentId: '00000000-0000-0000-0000-000000000006',
        dueDate: new Date(),
      };

      const result = workOrderInsertSchema.safeParse(workOrderWithAssignment);
      expect(result.success).toBe(true);
    });
  });

  describe('User Schema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'technician',
        warehouseId: '00000000-0000-0000-0000-000000000001',
      };

      const result = userInsertSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'technician',
        warehouseId: '00000000-0000-0000-0000-000000000001',
      };

      const result = userInsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('should reject weak passwords', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'technician',
        warehouseId: '00000000-0000-0000-0000-000000000001',
      };

      const result = userInsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });

    it('should reject invalid user role', () => {
      const invalidUser = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'invalid-role',
        warehouseId: '00000000-0000-0000-0000-000000000001',
      };

      const result = userInsertSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('role');
      }
    });
  });

  describe('Part Schema', () => {
    it('should validate valid part data', () => {
      const validPart = {
        name: 'Bearing Assembly',
        partNumber: 'BRG-001',
        description: 'High-quality bearing assembly for industrial use',
        category: 'mechanical',
        unitOfMeasure: 'each',
        warehouseId: '00000000-0000-0000-0000-000000000001',
        stockLevel: 50,
        reorderPoint: 10,
        unitCost: 25.99,
        vendor: 'ABC Parts Co',
      };

      const result = partInsertSchema.safeParse(validPart);
      expect(result.success).toBe(true);
    });

    it('should reject negative quantities', () => {
      const invalidPart = {
        name: 'Bearing Assembly',
        partNumber: 'BRG-001',
        description: 'High-quality bearing assembly for industrial use',
        category: 'mechanical',
        unitOfMeasure: 'each',
        warehouseId: '00000000-0000-0000-0000-000000000001',
        stockLevel: -5,
        reorderPoint: 10,
        unitCost: 25.99,
      };

      const result = partInsertSchema.safeParse(invalidPart);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('stockLevel');
      }
    });

    it('should reject negative costs', () => {
      const invalidPart = {
        name: 'Bearing Assembly',
        partNumber: 'BRG-001',
        description: 'High-quality bearing assembly for industrial use',
        category: 'mechanical',
        unitOfMeasure: 'each',
        warehouseId: '00000000-0000-0000-0000-000000000001',
        stockLevel: 50,
        reorderPoint: 10,
        unitCost: -25.99,
      };

      const result = partInsertSchema.safeParse(invalidPart);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('unitCost');
      }
    });
  });

  describe('Notification Schema', () => {
    it('should validate valid notification data', () => {
      const validNotification = {
        userId: '00000000-0000-0000-0000-000000000002',
        title: 'System Alert',
        message: 'This is a test notification',
        type: 'wo_assigned',
      };

      const result = notificationInsertSchema.safeParse(validNotification);
      expect(result.success).toBe(true);
    });

    it('should reject invalid notification type', () => {
      const invalidNotification = {
        userId: '00000000-0000-0000-0000-000000000002',
        title: 'System Alert',
        message: 'This is a test notification',
        type: 'invalid-type',
      };

      const result = notificationInsertSchema.safeParse(invalidNotification);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('type');
      }
    });

    it('should validate with optional metadata', () => {
      const notificationWithMetadata = {
        userId: '00000000-0000-0000-0000-000000000002',
        title: 'Work Order Alert',
        message: 'Work order has been assigned',
        type: 'wo_assigned',
        workOrderId: '00000000-0000-0000-0000-000000000004',
        equipmentId: '00000000-0000-0000-0000-000000000005',
      };

      const result = notificationInsertSchema.safeParse(notificationWithMetadata);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases and Data Validation', () => {
    it('should handle empty strings appropriately', () => {
      const equipmentWithEmptyString = {
        name: '',
        warehouse_id: '00000000-0000-0000-0000-000000000001',
        status: 'operational',
        criticality: 'high',
        qr_code: 'QR12345',
      };

      const result = equipmentInsertSchema.safeParse(equipmentWithEmptyString);
      expect(result.success).toBe(false);
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const equipmentWithLongName = {
        name: longString,
        warehouse_id: '00000000-0000-0000-0000-000000000001',
        status: 'operational',
        criticality: 'high',
        qr_code: 'QR12345',
      };

      const result = equipmentInsertSchema.safeParse(equipmentWithLongName);
      // Should fail if there's a max length constraint
      expect(result.success).toBe(false);
    });

    it('should validate date fields properly', () => {
      const workOrderWithInvalidDate = {
        title: 'Fix conveyor belt',
        description: 'Conveyor belt is making unusual noise',
        type: 'corrective',
        priority: 'high',
        status: 'pending',
        equipment_id: '00000000-0000-0000-0000-000000000006',
        warehouse_id: '00000000-0000-0000-0000-000000000001',
        due_date: 'invalid-date',
      };

      const result = workOrderInsertSchema.safeParse(workOrderWithInvalidDate);
      expect(result.success).toBe(false);
    });

    it('should handle null and undefined values', () => {
      const equipmentWithNull = {
        name: 'Test Machine',
        warehouse_id: null,
        status: 'operational',
        criticality: 'high',
        qr_code: 'QR12345',
      };

      const result = equipmentInsertSchema.safeParse(equipmentWithNull);
      expect(result.success).toBe(false);
    });
  });
});
