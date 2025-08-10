import { Router } from 'express';
import { z } from 'zod';
import {
  validateSchema,
  validationChain,
  commonSchemas,
} from '../middleware/enhanced-validation.middleware';

import {
  insertWorkOrderSchema,
  insertEquipmentSchema,
  insertPartSchema,
} from '@shared/schema';
import { storage } from '../storage';

const router = Router();

// Helper functions for analytics
function calculateAverageResolutionTime(workOrders: unknown[]): number {
  const completedOrders = workOrders.filter(
    wo => ['completed', 'verified', 'closed'].includes(wo.status) && wo.completedAt
  );

  if (completedOrders.length === 0) return 0;

  const totalResolutionTime = completedOrders.reduce((sum, wo) => {
    const created = new Date(wo.createdAt);
    const completed = new Date(wo.completedAt);
    return sum + (completed.getTime() - created.getTime());
  }, 0);

  return Math.round(totalResolutionTime / completedOrders.length / (1000 * 60 * 60)); // in hours
}

function calculateMTTR(workOrders: unknown[]): number {
  // Mean Time To Repair - similar to average resolution time but specific to corrective maintenance
  const correctiveOrders = workOrders.filter(
    wo =>
      wo.type === 'corrective' &&
      ['completed', 'verified', 'closed'].includes(wo.status) &&
      wo.completedAt
  );

  if (correctiveOrders.length === 0) return 0;

  const totalRepairTime = correctiveOrders.reduce((sum, wo) => {
    const created = new Date(wo.createdAt);
    const completed = new Date(wo.completedAt);
    return sum + (completed.getTime() - created.getTime());
  }, 0);

  return Math.round(totalRepairTime / correctiveOrders.length / (1000 * 60 * 60)); // in hours
}

function generateTrendData(workOrders: unknown[], period: string, metric: string): unknown[] {
  // Simplified trend generation - in a real implementation, this would be more sophisticated
  const now = new Date();
  const periodData: unknown[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);

    switch (period) {
      case 'week':
        date.setDate(date.getDate() - i * 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - i);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - i * 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - i);
        break;
    }

    const periodWorkOrders = workOrders.filter(wo => {
      const woDate = new Date(wo.createdAt);
      const nextPeriod = new Date(date);

      switch (period) {
        case 'week':
          nextPeriod.setDate(nextPeriod.getDate() + 7);
          break;
        case 'month':
          nextPeriod.setMonth(nextPeriod.getMonth() + 1);
          break;
        case 'quarter':
          nextPeriod.setMonth(nextPeriod.getMonth() + 3);
          break;
        case 'year':
          nextPeriod.setFullYear(nextPeriod.getFullYear() + 1);
          break;
      }

      return woDate >= date && woDate < nextPeriod;
    });

    let value = 0;
    switch (metric) {
      case 'count':
        value = periodWorkOrders.length;
        break;
      case 'completion_time':
        value = calculateAverageResolutionTime(periodWorkOrders);
        break;
      case 'priority_distribution':
        value = periodWorkOrders.filter(wo => ['high', 'critical'].includes(wo.priority)).length;
        break;
    }

    periodData.push({
      period: date.toISOString().split('T')[0],
      value,
    });
  }

  return periodData;
}

/**
 * Enhanced Work Orders API with comprehensive validation
 */

// Get work orders with advanced filtering and pagination
router.get(
  '/work-orders',
  validateSchema(
    z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      status: z
        .enum(['new', 'assigned', 'in_progress', 'completed', 'verified', 'closed'])
        .optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      type: z.enum(['corrective', 'preventive', 'emergency']).optional(),
      equipmentId: z.string().uuid().optional(),
      assignedTo: z.string().uuid().optional(),
      dateRange: z
        .object({
          start: z.coerce.date().optional(),
          end: z.coerce.date().optional(),
        })
        .optional(),
      search: z.string().min(1).max(255).optional(),
      sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'status']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
    { source: 'query' }
  ),
  async (req: any, res) => {
    try {
      const filters = req.validated;

      // Build filter object for storage layer
      const storageFilters: any = {
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit,
        orderBy: { [filters.sortBy]: filters.sortOrder },
      };

      // Add status filter
      if (filters.status) {
        storageFilters.where = { status: filters.status };
      }

      // Add priority filter
      if (filters.priority) {
        storageFilters.where = { ...storageFilters.where, priority: filters.priority };
      }

      // Add type filter
      if (filters.type) {
        storageFilters.where = { ...storageFilters.where, type: filters.type };
      }

      // Add equipment filter
      if (filters.equipmentId) {
        storageFilters.where = { ...storageFilters.where, equipment_id: filters.equipmentId };
      }

      // Add assigned user filter
      if (filters.assignedTo) {
        storageFilters.where = { ...storageFilters.where, assigned_to: filters.assignedTo };
      }

      // Add date range filter
      if (filters.dateRange?.start || filters.dateRange?.end) {
        const dateFilter: any = {};
        if (filters.dateRange.start) {
          dateFilter.gte = filters.dateRange.start;
        }
        if (filters.dateRange.end) {
          dateFilter.lte = filters.dateRange.end;
        }
        storageFilters.where = { ...storageFilters.where, created_at: dateFilter };
      }

      // Perform search if provided
      if (filters.search) {
        storageFilters.search = {
          query: filters.search,
          fields: ['description', 'fo_number', 'area'],
        };
      }

      // Get work orders from storage
      const warehouseId = req.user?.warehouseId || 'default';
      const result = await storage.getWorkOrders(warehouseId, {
        status: filters.status ? [filters.status] : undefined,
        priority: filters.priority ? [filters.priority] : undefined,
        assignedTo: filters.assignedTo,
      });

      // Apply additional client-side filtering
      let filteredWorkOrders = result;

      if (filters.type) {
        filteredWorkOrders = filteredWorkOrders.filter(wo => wo.type === filters.type);
      }

      if (filters.equipmentId) {
        filteredWorkOrders = filteredWorkOrders.filter(
          wo => wo.equipmentId === filters.equipmentId
        );
      }

      if (filters.dateRange?.start || filters.dateRange?.end) {
        filteredWorkOrders = filteredWorkOrders.filter(wo => {
          const createdAt = new Date(wo.createdAt);
          if (filters.dateRange?.start && createdAt < filters.dateRange.start) return false;
          if (filters.dateRange?.end && createdAt > filters.dateRange.end) return false;
          return true;
        });
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredWorkOrders = filteredWorkOrders.filter(
          wo =>
            wo.description?.toLowerCase().includes(searchLower) ||
            wo.foNumber?.toLowerCase().includes(searchLower) ||
            wo.area?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredWorkOrders.sort((a, b) => {
        const aVal = a[filters.sortBy as keyof typeof a];
        const bVal = b[filters.sortBy as keyof typeof b];

        if (filters.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });

      // Apply pagination
      const offset = (filters.page - 1) * filters.limit;
      const paginatedWorkOrders = filteredWorkOrders.slice(offset, offset + filters.limit);

      res.json({
        success: true,
        data: paginatedWorkOrders,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: filteredWorkOrders.length,
          totalPages: Math.ceil(filteredWorkOrders.length / filters.limit),
        },
        filters: filters,
      });
    } catch (_error) {
      console._error('Get work orders _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch work orders',
      });
    }
  }
);

// Get single work order by ID
router.get(
  '/work-orders/:id',
  validateSchema(commonSchemas.uuidParam, { source: 'params' }),
  async (req: any, res) => {
    try {
      const { id } = req.validated;
      const workOrder = await storage.getWorkOrder(id);

      if (!workOrder) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Work order not found',
        });
      }

      res.json({
        success: true,
        data: workOrder,
      });
    } catch (_error) {
      console._error('Get work order _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch work order',
      });
    }
  }
);

// Create new work order
router.post('/work-orders', validateSchema(insertWorkOrderSchema), async (req: any, res) => {
  try {
    const workOrderData = req.validated;

    // Add audit fields
    workOrderData.createdBy = req.user?.id;
    workOrderData.warehouseId = req.user?.warehouseId || workOrderData.warehouseId;

    // Generate FO number if not provided
    if (!workOrderData.foNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      // Get next sequence number (simplified for demo)
      const existingWorkOrders = await storage.getWorkOrders(
        req.user?.warehouseId || workOrderData.warehouseId
      );
      const existingCount = existingWorkOrders.length;
      const sequence = String(existingCount + 1).padStart(4, '0');

      workOrderData.foNumber = `WO-${year}${month}${day}-${sequence}`;
    }

    const newWorkOrder = await storage.createWorkOrder(workOrderData);

    // Send notification for new work order
    if (workOrderData.assignedTo) {
      try {
        const { notificationService } = await import('../services/notification.service');
        await notificationService.sendNotification({
          userId: workOrderData.assignedTo,
          type: 'wo_assigned',
          title: 'New Work Order Assigned',
          message: `Work order ${workOrderData.foNumber} has been assigned to you`,
          workOrderId: newWorkOrder.id,
        });
      } catch (notifError) {
        console.warn('Failed to send notification:', notifError);
      }
    }

    // Trigger webhook for work order creation
    try {
      const { webhookService } = await import('../services/webhook.service');
      await webhookService.emitEvent({
        id: `wo_created_${newWorkOrder.id}`,
        event: 'created',
        entity: 'work_order',
        entityId: newWorkOrder.id,
        data: {
          workOrder: newWorkOrder,
          createdBy: req.user,
        },
        timestamp: new Date(),
        warehouseId: newWorkOrder.warehouseId,
      });
    } catch (webhookError) {
      console.warn('Failed to trigger webhook:', webhookError);
    }

    res.status(201).json({
      success: true,
      data: newWorkOrder,
      message: 'Work order created successfully',
    });
  } catch (_error) {
    console._error('Create work order _error:', _error);
    res.status(500).json({
      success: false,
      _error: 'CREATE_ERROR',
      message: 'Failed to create work order',
    });
  }
});

// Update work order
router.put(
  '/work-orders/:id',
  ...validationChain({
    params: commonSchemas.uuidParam,
    body: z.object({
      foNumber: z.string().optional(),
      type: z.enum(['corrective', 'preventive', 'emergency']).optional(),
      description: z.string().optional(),
      area: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      status: z
        .enum(['new', 'assigned', 'in_progress', 'completed', 'verified', 'closed'])
        .optional(),
      assignedTo: z.string().uuid().optional(),
      equipmentId: z.string().uuid().optional(),
      dueDate: z.coerce.date().optional(),
      estimatedHours: z.number().optional(),
      notes: z.string().optional(),
    }),
  }),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.validated;

      // Add audit fields
      updateData.updatedBy = req.user?.id;
      updateData.updatedAt = new Date();

      // Check if work order exists
      const existingWorkOrder = await storage.getWorkOrder(id);
      if (!existingWorkOrder) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Work order not found',
        });
      }

      const updatedWorkOrder = await storage.updateWorkOrder(id, updateData);

      // Handle status change notifications
      if (updateData.status && updateData.status !== existingWorkOrder.status) {
        try {
          const { notificationService } = await import('../services/notification.service');

          // Notify assigned user of status change
          if (existingWorkOrder.assignedTo) {
            await notificationService.sendNotification({
              userId: existingWorkOrder.assignedTo,
              type: 'wo_status_change',
              title: 'Work Order Status Updated',
              message: `Work order ${existingWorkOrder.foNumber} status changed to ${updateData.status}`,
              workOrderId: id,
            });
          }
        } catch (notifError) {
          console.warn('Failed to send status change notification:', notifError);
        }
      }
      res.json({
        success: true,
        data: updatedWorkOrder,
        message: 'Work order updated successfully',
      });
    } catch (_error) {
      console._error('Update work order _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'UPDATE_ERROR',
        message: 'Failed to update work order',
      });
    }
  }
);

// Delete work order (soft delete)
router.delete(
  '/work-orders/:id',
  validateSchema(commonSchemas.uuidParam, { source: 'params' }),
  async (req: any, res) => {
    try {
      const { id } = req.validated;

      // Check if work order exists
      const existingWorkOrder = await storage.getWorkOrder(id);
      if (!existingWorkOrder) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Work order not found',
        });
      }

      // Perform soft delete
      await storage.deleteWorkOrder(id);

      res.json({
        success: true,
        message: 'Work order deleted successfully',
      });
    } catch (_error) {
      console._error('Delete work order _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'DELETE_ERROR',
        message: 'Failed to delete work order',
      });
    }
  }
);

/**
 * Equipment API Routes
 */

// Get equipment list with filtering
router.get(
  '/equipment',
  validateSchema(
    z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      status: z.enum(['active', 'inactive', 'maintenance', 'retired']).optional(),
      criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      warehouseId: z.string().uuid().optional(),
      search: z.string().min(1).max(255).optional(),
      sortBy: z.enum(['assetTag', 'model', 'createdAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
    { source: 'query' }
  ),
  async (req: any, res) => {
    try {
      const filters = req.validated;

      // Get all equipment for the warehouse first
      const warehouseId = filters.warehouseId || req.user?.warehouseId || 'default';
      const allEquipment = await storage.getEquipment(warehouseId);

      // Apply client-side filtering since storage doesn't support complex filters
      let filteredEquipment = allEquipment;

      if (filters.status) {
        filteredEquipment = filteredEquipment.filter(eq => eq.status === filters.status);
      }

      if (filters.criticality) {
        filteredEquipment = filteredEquipment.filter(eq => eq.criticality === filters.criticality);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredEquipment = filteredEquipment.filter(
          eq =>
            eq.assetTag?.toLowerCase().includes(searchLower) ||
            eq.model?.toLowerCase().includes(searchLower) ||
            eq.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredEquipment.sort((a, b) => {
        const field = filters.sortBy === 'assetTag' ? 'assetTag' : filters.sortBy;
        const aVal = a[field as keyof typeof a];
        const bVal = b[field as keyof typeof b];

        if (filters.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });

      // Apply pagination
      const offset = (filters.page - 1) * filters.limit;
      const paginatedEquipment = filteredEquipment.slice(offset, offset + filters.limit);

      res.json({
        success: true,
        data: paginatedEquipment,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: filteredEquipment.length,
          totalPages: Math.ceil(filteredEquipment.length / filters.limit),
        },
      });
    } catch (_error) {
      console._error('Get equipment _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch equipment',
      });
    }
  }
);

// Create equipment
router.post('/equipment', validateSchema(insertEquipmentSchema), async (req: any, res) => {
  try {
    const equipmentData = req.validated;
    equipmentData.createdBy = req.user?.id;
    equipmentData.warehouseId = req.user?.warehouseId || equipmentData.warehouseId;

    const newEquipment = await storage.createEquipment(equipmentData);

    // Trigger webhook for equipment creation
    try {
      const { webhookService } = await import('../services/webhook.service');
      await webhookService.emitEvent({
        id: `equipment_created_${newEquipment.id}`,
        event: 'created',
        entity: 'equipment',
        entityId: newEquipment.id,
        data: {
          equipment: newEquipment,
          createdBy: req.user,
        },
        timestamp: new Date(),
        warehouseId: newEquipment.warehouseId,
      });
    } catch (webhookError) {
      console.warn('Failed to trigger equipment creation webhook:', webhookError);
    }

    res.status(201).json({
      success: true,
      data: newEquipment,
      message: 'Equipment created successfully',
    });
  } catch (_error) {
    console._error('Create equipment _error:', _error);
    res.status(500).json({
      success: false,
      _error: 'CREATE_ERROR',
      message: 'Failed to create equipment',
    });
  }
});

// Get single equipment by ID
router.get(
  '/equipment/:id',
  validateSchema(commonSchemas.uuidParam, { source: 'params' }),
  async (req: any, res) => {
    try {
      const { id } = req.validated;
      const equipment = await storage.getEquipmentById(id);

      if (!equipment) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Equipment not found',
        });
      }

      res.json({
        success: true,
        data: equipment,
      });
    } catch (_error) {
      console._error('Get equipment _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch equipment',
      });
    }
  }
);

// Update equipment
router.put(
  '/equipment/:id',
  ...validationChain({
    params: commonSchemas.uuidParam,
    body: z.object({
      assetTag: z.string().optional(),
      model: z.string().optional(),
      description: z.string().optional(),
      area: z.string().optional(),
      status: z.enum(['active', 'inactive', 'maintenance', 'retired']).optional(),
      criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      manufacturer: z.string().optional(),
      serialNumber: z.string().optional(),
      installDate: z.coerce.date().optional(),
      warrantyExpiry: z.coerce.date().optional(),
      specifications: z.any().optional(),
    }),
  }),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.validated;

      // Add audit fields
      updateData.updatedBy = req.user?.id;
      updateData.updatedAt = new Date();

      // Check if equipment exists
      const existingEquipment = await storage.getEquipmentById(id);
      if (!existingEquipment) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Equipment not found',
        });
      }

      const updatedEquipment = await storage.updateEquipment(id, updateData);

      res.json({
        success: true,
        data: updatedEquipment,
        message: 'Equipment updated successfully',
      });
    } catch (_error) {
      console._error('Update equipment _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'UPDATE_ERROR',
        message: 'Failed to update equipment',
      });
    }
  }
);

/**
 * Parts Inventory API Routes
 */

// Get parts with filtering and pagination
router.get(
  '/parts',
  validateSchema(
    z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      category: z.string().optional(),
      warehouseId: z.string().uuid().optional(),
      lowStock: z.coerce.boolean().default(false),
      search: z.string().min(1).max(255).optional(),
      sortBy: z.enum(['name', 'partNumber', 'stockLevel', 'createdAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
    { source: 'query' }
  ),
  async (req: any, res) => {
    try {
      const filters = req.validated;

      // Get all parts for the warehouse first
      const warehouseId = filters.warehouseId || req.user?.warehouseId || 'default';
      const allParts = await storage.getParts(warehouseId);

      // Apply client-side filtering
      let filteredParts = allParts;

      if (filters.category) {
        filteredParts = filteredParts.filter(part => part.category === filters.category);
      }

      if (filters.lowStock) {
        filteredParts = filteredParts.filter(part => part.stockLevel <= part.reorderPoint);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredParts = filteredParts.filter(
          part =>
            part.name?.toLowerCase().includes(searchLower) ||
            part.partNumber?.toLowerCase().includes(searchLower) ||
            part.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      filteredParts.sort((a, b) => {
        const aVal = a[filters.sortBy as keyof typeof a];
        const bVal = b[filters.sortBy as keyof typeof b];

        if (filters.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });

      // Apply pagination
      const offset = (filters.page - 1) * filters.limit;
      const paginatedParts = filteredParts.slice(offset, offset + filters.limit);

      res.json({
        success: true,
        data: paginatedParts,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: filteredParts.length,
          totalPages: Math.ceil(filteredParts.length / filters.limit),
        },
      });
    } catch (_error) {
      console._error('Get parts _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch parts',
      });
    }
  }
);

// Create new part
router.post('/parts', validateSchema(insertPartSchema), async (req: any, res) => {
  try {
    const partData = req.validated;
    partData.createdBy = req.user?.id;
    partData.warehouseId = req.user?.warehouseId || partData.warehouseId;

    const newPart = await storage.createPart(partData);

    res.status(201).json({
      success: true,
      data: newPart,
      message: 'Part created successfully',
    });
  } catch (_error) {
    console._error('Create part _error:', _error);
    res.status(500).json({
      success: false,
      _error: 'CREATE_ERROR',
      message: 'Failed to create part',
    });
  }
});

// Get single part by ID
router.get(
  '/parts/:id',
  validateSchema(commonSchemas.uuidParam, { source: 'params' }),
  async (req: any, res) => {
    try {
      const { id } = req.validated;
      const part = await storage.getPart(id);

      if (!part) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Part not found',
        });
      }

      res.json({
        success: true,
        data: part,
      });
    } catch (_error) {
      console._error('Get part _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch part',
      });
    }
  }
);

// Update part inventory
router.put(
  '/parts/:id',
  ...validationChain({
    params: commonSchemas.uuidParam,
    body: z.object({
      name: z.string().optional(),
      partNumber: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      unitOfMeasure: z.string().optional(),
      unitCost: z.string().optional(),
      stockLevel: z.number().optional(),
      reorderPoint: z.number().optional(),
      maxStock: z.number().optional(),
      location: z.string().optional(),
      vendor: z.string().optional(),
    }),
  }),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.validated;

      // Check if part exists
      const existingPart = await storage.getPart(id);
      if (!existingPart) {
        return res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Part not found',
        });
      }

      const updatedPart = await storage.updatePart(id, updateData);

      // Check for low stock notifications
      if (
        updateData.stockLevel !== undefined &&
        updateData.stockLevel <= (existingPart.reorderPoint || 0)
      ) {
        try {
          const { notificationService } = await import('../services/notification.service');

          // Get warehouse managers/supervisors for low stock alerts
          const profiles = await storage.getProfiles();
          const managers = profiles.filter(
            p =>
              ['manager', 'supervisor', 'inventory_clerk'].includes(p.role) &&
              p.active &&
              p.warehouseId === existingPart.warehouseId
          );

          for (const manager of managers) {
            await notificationService.sendNotification({
              userId: manager.id,
              type: 'low_stock',
              title: 'Low Stock Alert',
              message: `Part ${existingPart.name} (${existingPart.partNumber}) is below reorder point`,
              metadata: {
                partId: id,
                currentStock: updateData.stockLevel,
                reorderPoint: existingPart.reorderPoint,
              },
            });
          }
        } catch (notifError) {
          console.warn('Failed to send low stock notification:', notifError);
        }
      }

      res.json({
        success: true,
        data: updatedPart,
        message: 'Part updated successfully',
      });
    } catch (_error) {
      console._error('Update part _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'UPDATE_ERROR',
        message: 'Failed to update part',
      });
    }
  }
);

/**
 * Analytics and Reporting API Routes
 */

// Get dashboard analytics
router.get(
  '/analytics/dashboard',
  validateSchema(
    z.object({
      warehouseId: z.string().uuid().optional(),
      dateRange: z
        .object({
          start: z.coerce.date().optional(),
          end: z.coerce.date().optional(),
        })
        .optional(),
    }),
    { source: 'query' }
  ),
  async (req: any, res) => {
    try {
      const filters = req.validated;
      const warehouseId = filters.warehouseId || req.user?.warehouseId || 'default';

      // Get basic analytics data
      const workOrders = await storage.getWorkOrders(warehouseId);
      const equipment = await storage.getEquipment(warehouseId);
      const parts = await storage.getParts(warehouseId);

      // Apply date filtering for work orders if provided
      let filteredWorkOrders = workOrders;
      if (filters.dateRange?.start || filters.dateRange?.end) {
        filteredWorkOrders = workOrders.filter(wo => {
          if (!wo.createdAt) return false;
          const createdAt = new Date(wo.createdAt);
          if (filters.dateRange?.start && createdAt < filters.dateRange.start) return false;
          if (filters.dateRange?.end && createdAt > filters.dateRange.end) return false;
          return true;
        });
      }

      // Calculate analytics
      const analytics = {
        workOrders: {
          total: filteredWorkOrders.length,
          byStatus: {
            new: filteredWorkOrders.filter(wo => wo.status === 'new').length,
            assigned: filteredWorkOrders.filter(wo => wo.status === 'assigned').length,
            in_progress: filteredWorkOrders.filter(wo => wo.status === 'in_progress').length,
            completed: filteredWorkOrders.filter(wo => wo.status === 'completed').length,
            verified: filteredWorkOrders.filter(wo => wo.status === 'verified').length,
            closed: filteredWorkOrders.filter(wo => wo.status === 'closed').length,
          },
          byPriority: {
            low: filteredWorkOrders.filter(wo => wo.priority === 'low').length,
            medium: filteredWorkOrders.filter(wo => wo.priority === 'medium').length,
            high: filteredWorkOrders.filter(wo => wo.priority === 'high').length,
            critical: filteredWorkOrders.filter(wo => wo.priority === 'critical').length,
          },
          byType: {
            corrective: filteredWorkOrders.filter(wo => wo.type === 'corrective').length,
            preventive: filteredWorkOrders.filter(wo => wo.type === 'preventive').length,
            emergency: filteredWorkOrders.filter(wo => wo.type === 'emergency').length,
          },
        },
        equipment: {
          total: equipment.length,
          byStatus: {
            active: equipment.filter(eq => eq.status === 'active').length,
            inactive: equipment.filter(eq => eq.status === 'inactive').length,
            maintenance: equipment.filter(eq => eq.status === 'maintenance').length,
            retired: equipment.filter(eq => eq.status === 'retired').length,
          },
          byCriticality: {
            low: equipment.filter(eq => eq.criticality === 'low').length,
            medium: equipment.filter(eq => eq.criticality === 'medium').length,
            high: equipment.filter(eq => eq.criticality === 'high').length,
            critical: equipment.filter(eq => eq.criticality === 'critical').length,
          },
        },
        parts: {
          total: parts.length,
          lowStock: parts.filter(
            part =>
              part.stockLevel !== null &&
              part.reorderPoint !== null &&
              part.stockLevel <= part.reorderPoint
          ).length,
          outOfStock: parts.filter(part => part.stockLevel === 0).length,
          totalValue: parts.reduce((sum, part) => {
            if (!part.unitCost || part.stockLevel === null) return sum;
            return sum + parseFloat(part.unitCost) * part.stockLevel;
          }, 0),
        },
        performance: {
          averageResolutionTime: calculateAverageResolutionTime(filteredWorkOrders),
          mttr: calculateMTTR(filteredWorkOrders),
          completionRate:
            filteredWorkOrders.length > 0
              ? (filteredWorkOrders.filter(wo =>
                  ['completed', 'verified', 'closed'].includes(wo.status)
                ).length /
                  filteredWorkOrders.length) *
                100
              : 0,
        },
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (_error) {
      console._error('Get analytics _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch analytics data',
      });
    }
  }
);

// Get work order trends
router.get(
  '/analytics/trends',
  validateSchema(
    z.object({
      warehouseId: z.string().uuid().optional(),
      period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
      metric: z.enum(['count', 'completion_time', 'priority_distribution']).default('count'),
    }),
    { source: 'query' }
  ),
  async (req: any, res) => {
    try {
      const filters = req.validated;
      const warehouseId = filters.warehouseId || req.user?.warehouseId || 'default';

      const workOrders = await storage.getWorkOrders(warehouseId);

      // Generate trend data based on period and metric
      const trendData = generateTrendData(workOrders, filters.period, filters.metric);

      res.json({
        success: true,
        data: {
          period: filters.period,
          metric: filters.metric,
          trends: trendData,
        },
      });
    } catch (_error) {
      console._error('Get trends _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'FETCH_ERROR',
        message: 'Failed to fetch trend data',
      });
    }
  }
);

/**
 * Bulk Operations API Routes
 */

// Bulk update work order status
router.patch(
  '/work-orders/bulk/status',
  validateSchema(
    z.object({
      workOrderIds: z.array(z.string().uuid()).min(1).max(50),
      status: z.enum(['new', 'assigned', 'in_progress', 'completed', 'verified', 'closed']),
      reason: z.string().optional(),
    })
  ),
  async (req: any, res) => {
    try {
      const { workOrderIds, status, reason } = req.validated;

      const results = {
        updated: [] as Array<{ id: any; status: string }>,
        failed: [] as Array<{ id: any; error: string }>,
        total: workOrderIds.length,
      };

      for (const workOrderId of workOrderIds) {
        try {
          const updatedWorkOrder = await storage.updateWorkOrder(workOrderId, {
            status,
            ...(reason && { notes: reason }),
          });

          results.updated.push({
            id: workOrderId,
            status: updatedWorkOrder.status,
          });
        } catch (_error) {
          results.failed.push({
            id: workOrderId,
            error: _error instanceof Error ? _error.message : 'Unknown _error',
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Bulk update completed. ${results.updated.length} updated, ${results.failed.length} failed.`,
      });
    } catch (_error) {
      console._error('Bulk update _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'BULK_UPDATE_ERROR',
        message: 'Failed to perform bulk update',
      });
    }
  }
);

// Bulk assign work orders
router.patch(
  '/work-orders/bulk/assign',
  validateSchema(
    z.object({
      workOrderIds: z.array(z.string().uuid()).min(1).max(50),
      assignedTo: z.string().uuid(),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    })
  ),
  async (req: any, res) => {
    try {
      const { workOrderIds, assignedTo, priority } = req.validated;

      const results = {
        assigned: [] as Array<{ id: any; assignedTo: string | null }>,
        failed: [] as Array<{ id: any; error: string }>,
        total: workOrderIds.length,
      };

      for (const workOrderId of workOrderIds) {
        try {
          const updateData: any = {
            assignedTo,
            status: 'assigned',
          };

          if (priority) {
            updateData.priority = priority;
          }

          const updatedWorkOrder = await storage.updateWorkOrder(workOrderId, updateData);

          results.assigned.push({
            id: workOrderId,
            assignedTo: updatedWorkOrder.assignedTo,
          });

          // Send notification to assigned user
          try {
            const { notificationService } = await import('../services/notification.service');
            await notificationService.sendNotification({
              userId: assignedTo,
              type: 'wo_assigned',
              title: 'Work Orders Assigned',
              message: `You have been assigned to work order ${updatedWorkOrder.foNumber}`,
              workOrderId: workOrderId,
            });
          } catch (notifError) {
            console.warn('Failed to send assignment notification:', notifError);
          }
        } catch (_error) {
          results.failed.push({
            id: workOrderId,
            error: _error instanceof Error ? _error.message : 'Unknown _error',
          });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Bulk assignment completed. ${results.assigned.length} assigned, ${results.failed.length} failed.`,
      });
    } catch (_error) {
      console._error('Bulk assign _error:', _error);
      res.status(500).json({
        success: false,
        _error: 'BULK_ASSIGN_ERROR',
        message: 'Failed to perform bulk assignment',
      });
    }
  }
);

export default router;
