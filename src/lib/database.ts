import { supabase } from './supabase';
import type {
  User,
  Equipment,
  WorkOrder,
  Part,
  Inventory,
  Vendor,
  PMSchedule,
  Warehouse,
} from '../types';

// User operations
export const userService = {
  async getProfile(userId: string) {
    try {
      console.log('🔍 Getting profile for user:', userId);

      // Try to get from sessionStorage first
      const cacheKey = `userProfile_${userId}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id === userId) {
            console.log('⚡ Using cached user profile');
            return parsed;
          }
        } catch (e) {
          // Failed to parse cached user profile, ignore and fetch from DB
        }
      }

      // Only fetch minimal fields needed for login
      const profilePromise = supabase
        .from('users')
        .select(
          'id, email, first_name, last_name, role, organization_id, avatar_url, is_active'
        )
        .eq('id', userId)
        .single();

      // Increase timeout to 20s for dev
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile query timeout')), 20000)
      );

      let data, error;
      try {
        ({ data, error } = (await Promise.race([
          profilePromise,
          timeoutPromise,
        ])) as any);
      } catch (timeoutError) {
        console.error('❌ Profile query timed out:', timeoutError);
        return { id: userId, error: 'timeout' };
      }

      if (error) {
        console.warn('Failed to get user:', error.message);
        return { id: userId, error: error.message };
      }

      // Optionally fetch organization if needed (not for login screen)
      // ...

      // Cache the profile for this session
      sessionStorage.setItem(cacheKey, JSON.stringify(data));

      console.log('✅ Successfully got user profile');
      return {
        ...data,
        organizationId: data.organization_id,
      };
    } catch (error) {
      console.error('❌ Error in getProfile:', error);
      return {
        id: userId,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    // Transform camelCase to snake_case for database
    const dbUpdates: any = {};

    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'firstName':
          dbUpdates.first_name = value;
          break;
        case 'lastName':
          dbUpdates.last_name = value;
          break;
        case 'lastLoginAt':
          dbUpdates.last_login =
            value instanceof Date ? value.toISOString() : value;
          break;
        case 'organizationId':
          dbUpdates.organization_id = value;
          break;
        case 'isActive':
          dbUpdates.is_active = value;
          break;
        case 'avatarUrl':
          dbUpdates.avatar_url = value;
          break;
        case 'employeeId':
          dbUpdates.employee_id = value;
          break;
        case 'createdAt':
          dbUpdates.created_at =
            value instanceof Date ? value.toISOString() : value;
          break;
        case 'updatedAt':
          dbUpdates.updated_at =
            value instanceof Date ? value.toISOString() : value;
          break;
        default:
          // For fields that don't need transformation (email, role, permissions, phone, department)
          dbUpdates[key] = value;
      }
    });

    const { data, error } = await supabase
      .from('users')
      .update({
        ...dbUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUsers(organizationId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Equipment operations
export const equipmentService = {
  async getEquipment(organizationId: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        *,
        warehouse:warehouses(name),
        created_by:users(first_name, last_name)
      `
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getEquipmentById(id: string) {
    const { data, error } = await supabase
      .from('equipment')
      .select(
        `
        *,
        warehouse:warehouses(*),
        created_by:users(first_name, last_name, email),
        work_orders:work_orders(
          id,
          title,
          status,
          priority,
          created_at
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createEquipment(
    equipment: Omit<Equipment, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('equipment')
      .insert([equipment])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEquipment(id: string, updates: Partial<Equipment>) {
    const { data, error } = await supabase
      .from('equipment')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEquipment(id: string) {
    const { error } = await supabase.from('equipment').delete().eq('id', id);

    if (error) throw error;
  },
};

// Work Order operations
export const workOrderService = {
  async getWorkOrders(organizationId: string) {
    const { data, error } = await supabase
      .from('work_orders')
      .select(
        `
        *,
        equipment:equipment(name, code),
        warehouse:warehouses(name),
        requested_by:users!work_orders_requested_by_fkey(first_name, last_name),
        assigned_to:users!work_orders_assigned_to_fkey(first_name, last_name)
      `
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getWorkOrderById(id: string) {
    const { data, error } = await supabase
      .from('work_orders')
      .select(
        `
        *,
        equipment:equipment(*),
        warehouse:warehouses(*),
        requested_by:users!work_orders_requested_by_fkey(*),
        assigned_to:users!work_orders_assigned_to_fkey(*),
        work_order_parts:work_order_parts(
          *,
          part:parts(*)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createWorkOrder(
    workOrder: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('work_orders')
      .insert([workOrder])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWorkOrder(id: string, updates: Partial<WorkOrder>) {
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWorkOrder(id: string) {
    const { error } = await supabase.from('work_orders').delete().eq('id', id);

    if (error) throw error;
  },
};

// Parts and Inventory operations
export const inventoryService = {
  async getParts(organizationId: string) {
    const { data, error } = await supabase
      .from('parts')
      .select(
        `
        *,
        warehouse:warehouses(name),
        inventory:inventory(*)
      `
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPartById(id: string) {
    const { data, error } = await supabase
      .from('parts')
      .select(
        `
        *,
        warehouse:warehouses(*),
        inventory:inventory(*),
        inventory_movements:inventory_movements(
          *,
          performed_by:users(first_name, last_name),
          work_order:work_orders(work_order_number, title)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createPart(part: Omit<Part, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('parts')
      .insert([part])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePart(id: string, updates: Partial<Part>) {
    const { data, error } = await supabase
      .from('parts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateInventory(
    partId: string,
    warehouseId: string,
    updates: Partial<Inventory>
  ) {
    const { data, error } = await supabase
      .from('inventory')
      .upsert({
        part_id: partId,
        warehouse_id: warehouseId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createInventoryMovement(movement: {
    organization_id: string;
    part_id: string;
    warehouse_id: string;
    work_order_id?: string;
    movement_type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    unit_cost?: number;
    reference_number?: string;
    notes?: string;
    performed_by: string;
  }) {
    const { data, error } = await supabase
      .from('inventory_movements')
      .insert([movement])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Vendor operations
export const vendorService = {
  async getVendors(organizationId: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getVendorById(id: string) {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createVendor(vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('vendors')
      .insert([vendor])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateVendor(id: string, updates: Partial<Vendor>) {
    const { data, error } = await supabase
      .from('vendors')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteVendor(id: string) {
    const { error } = await supabase.from('vendors').delete().eq('id', id);

    if (error) throw error;
  },
};

// Preventive Maintenance operations
export const pmService = {
  async getSchedules(organizationId: string) {
    const { data, error } = await supabase
      .from('pm_schedules')
      .select(
        `
        *,
        equipment:equipment(name, code),
        assigned_to:users(first_name, last_name)
      `
      )
      .eq('organization_id', organizationId)
      .order('next_due', { ascending: true });

    if (error) throw error;
    return data;
  },

  async getScheduleById(id: string) {
    const { data, error } = await supabase
      .from('pm_schedules')
      .select(
        `
        *,
        equipment:equipment(*),
        assigned_to:users(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createSchedule(
    schedule: Omit<PMSchedule, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('pm_schedules')
      .insert([schedule])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSchedule(id: string, updates: Partial<PMSchedule>) {
    const { data, error } = await supabase
      .from('pm_schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSchedule(id: string) {
    const { error } = await supabase.from('pm_schedules').delete().eq('id', id);

    if (error) throw error;
  },
};

// Warehouse operations
export const warehouseService = {
  async getWarehouses(organizationId: string) {
    const { data, error } = await supabase
      .from('warehouses')
      .select(
        `
        *,
        manager:users(first_name, last_name, email)
      `
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getWarehouseById(id: string) {
    const { data, error } = await supabase
      .from('warehouses')
      .select(
        `
        *,
        manager:users(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createWarehouse(
    warehouse: Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>
  ) {
    const { data, error } = await supabase
      .from('warehouses')
      .insert([warehouse])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWarehouse(id: string, updates: Partial<Warehouse>) {
    const { data, error } = await supabase
      .from('warehouses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteWarehouse(id: string) {
    const { error } = await supabase.from('warehouses').delete().eq('id', id);

    if (error) throw error;
  },
};

// Dashboard analytics
export const analyticsService = {
  async getDashboardStats(organizationId: string) {
    const [
      equipmentCount,
      activeWorkOrders,
      overdueWorkOrders,
      lowStockParts,
      overduePM,
    ] = await Promise.all([
      // Total equipment count
      supabase
        .from('equipment')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId),

      // Active work orders
      supabase
        .from('work_orders')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'in_progress']),

      // Overdue work orders
      supabase
        .from('work_orders')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .lt('scheduled_end', new Date().toISOString())
        .in('status', ['pending', 'in_progress']),

      // Low stock parts
      supabase
        .from('parts')
        .select(
          `
          id,
          inventory!inner(quantity_on_hand, quantity_reserved)
        `
        )
        .eq('organization_id', organizationId),

      // Overdue PM schedules
      supabase
        .from('pm_schedules')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .lt('next_due', new Date().toISOString()),
    ]);

    // Calculate low stock count
    const lowStockCount =
      lowStockParts.data?.filter(part => {
        const inventory = part.inventory?.[0];
        return (
          inventory && inventory.quantity_on_hand <= (part as any).reorder_point
        );
      }).length || 0;

    return {
      totalEquipment: equipmentCount.count || 0,
      activeWorkOrders: activeWorkOrders.count || 0,
      overdueWorkOrders: overdueWorkOrders.count || 0,
      lowStockParts: lowStockCount,
      overduePM: overduePM.count || 0,
    };
  },

  async getWorkOrdersByStatus(organizationId: string) {
    const { data, error } = await supabase
      .from('work_orders')
      .select('status')
      .eq('organization_id', organizationId);

    if (error) throw error;

    const statusCounts = data.reduce(
      (acc, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return statusCounts;
  },
};
