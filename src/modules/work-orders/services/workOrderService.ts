import { supabase } from '../../../lib/supabase';
import {
  WorkOrder,
  CreateWorkOrderRequest,
  UpdateWorkOrderRequest,
  WorkOrderFilters,
  WorkOrderStats,
  WorkOrderListItem,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderType,
  WorkOrderChecklistItem,
  WorkOrderTimeLog,
} from '../types/workOrder';

class WorkOrderService {
  /**
   * Get work orders with filtering and pagination
   */
  async getWorkOrders(
    filters: WorkOrderFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: WorkOrderListItem[];
    total: number;
    page: number;
    limit: number;
  }> {
    let query = supabase
      .from('work_orders')
      .select(
        `
        id,
        wo_number,
        title,
        priority,
        status,
        type,
        created_at,
        scheduled_start,
        assigned_to_profile:profiles!work_orders_assigned_to_fkey(first_name, last_name),
        equipment:equipment!work_orders_equipment_id_fkey(name)
      `,
        { count: 'exact' }
      )
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.type?.length) {
      query = query.in('type', filters.type);
    }
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters.equipment_id) {
      query = query.eq('equipment_id', filters.equipment_id);
    }
    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id);
    }
    if (filters.created_from) {
      query = query.gte('created_at', filters.created_from);
    }
    if (filters.created_to) {
      query = query.lte('created_at', filters.created_to);
    }
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,wo_number.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch work orders: ${error.message}`);
    }

    // Transform data to WorkOrderListItem format
    const workOrders: WorkOrderListItem[] = (data || []).map(
      (wo: {
        id: string;
        wo_number: string;
        title: string;
        priority: WorkOrderPriority;
        status: WorkOrderStatus;
        type: WorkOrderType;
        created_at: string;
        scheduled_start: string | null;
        assigned_to_profile: { first_name: string; last_name: string }[] | null;
        equipment: { name: string }[] | null;
      }) => ({
        id: wo.id,
        wo_number: wo.wo_number,
        title: wo.title,
        priority: wo.priority,
        status: wo.status,
        type: wo.type,
        assigned_to_name: wo.assigned_to_profile?.[0]
          ? `${wo.assigned_to_profile[0].first_name} ${wo.assigned_to_profile[0].last_name}`
          : undefined,
        equipment_name: wo.equipment?.[0]?.name || undefined,
        created_at: wo.created_at,
        scheduled_start: wo.scheduled_start || undefined,
        is_overdue: this.isOverdue(wo.scheduled_start, wo.status),
      })
    );

    return {
      data: workOrders,
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Get a single work order by ID
   */
  async getWorkOrderById(id: string): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(
        `
        *,
        requested_by_profile:profiles!work_orders_requested_by_fkey(first_name, last_name),
        assigned_to_profile:profiles!work_orders_assigned_to_fkey(first_name, last_name),
        verified_by_profile:profiles!work_orders_verified_by_fkey(first_name, last_name),
        equipment:equipment!work_orders_equipment_id_fkey(name, asset_tag),
        warehouse:warehouses!work_orders_warehouse_id_fkey(name, code)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch work order: ${error.message}`);
    }

    if (!data) {
      throw new Error('Work order not found');
    }

    return data as WorkOrder;
  }

  /**
   * Create a new work order
   */
  async createWorkOrder(request: CreateWorkOrderRequest): Promise<WorkOrder> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;

    // Generate work order number
    const woNumber = await this.generateWorkOrderNumber();

    const workOrderData = {
      ...request,
      wo_number: woNumber,
      requested_by: userId,
      status: WorkOrderStatus.OPEN,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('work_orders')
      .insert([workOrderData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create work order: ${error.message}`);
    }

    // Create checklist items if provided
    if (request.checklist_items?.length) {
      await this.createChecklistItems(data.id, request.checklist_items);
    }

    return data as WorkOrder;
  }

  /**
   * Update a work order
   */
  async updateWorkOrder(
    id: string,
    request: UpdateWorkOrderRequest
  ): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        ...request,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update work order: ${error.message}`);
    }

    return data as WorkOrder;
  }

  /**
   * Update work order status
   */
  async updateWorkOrderStatus(
    id: string,
    status: WorkOrderStatus,
    notes?: string
  ): Promise<WorkOrder> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;

    const updates: Partial<WorkOrder> = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps for specific status changes
    if (status === WorkOrderStatus.IN_PROGRESS && !updates.actual_start) {
      updates.actual_start = new Date().toISOString();
    }
    if (status === WorkOrderStatus.COMPLETED && !updates.actual_end) {
      updates.actual_end = new Date().toISOString();
    }
    if (status === WorkOrderStatus.VERIFIED && userId) {
      updates.verified_by = userId;
      updates.verified_at = new Date().toISOString();
    }
    if (notes) {
      updates.completion_notes = notes;
    }

    const { data, error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update work order status: ${error.message}`);
    }

    return data as WorkOrder;
  }

  /**
   * Delete a work order
   */
  async deleteWorkOrder(id: string): Promise<void> {
    const { error } = await supabase.from('work_orders').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete work order: ${error.message}`);
    }
  }

  /**
   * Get work order statistics
   */
  async getWorkOrderStats(): Promise<WorkOrderStats> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('status, created_at, actual_end, scheduled_end');

    if (error) {
      throw new Error(
        `Failed to fetch work order statistics: ${error.message}`
      );
    }

    const stats: WorkOrderStats = {
      total: data?.length || 0,
      open: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      avg_completion_time: 0,
      completion_rate: 0,
    };

    if (!data?.length) {
      return stats;
    }

    // Calculate statistics
    let totalCompletionTime = 0;
    let completedCount = 0;

    data.forEach(wo => {
      switch (wo.status) {
        case WorkOrderStatus.OPEN:
          stats.open++;
          break;
        case WorkOrderStatus.ASSIGNED:
          stats.assigned++;
          break;
        case WorkOrderStatus.IN_PROGRESS:
          stats.in_progress++;
          break;
        case WorkOrderStatus.COMPLETED:
        case WorkOrderStatus.VERIFIED:
        case WorkOrderStatus.CLOSED:
          stats.completed++;
          completedCount++;
          break;
      }

      // Check if overdue
      if (
        wo.scheduled_end &&
        wo.status !== WorkOrderStatus.COMPLETED &&
        wo.status !== WorkOrderStatus.VERIFIED &&
        wo.status !== WorkOrderStatus.CLOSED
      ) {
        if (new Date(wo.scheduled_end) < new Date()) {
          stats.overdue++;
        }
      }

      // Calculate completion time
      if (wo.actual_end && wo.created_at) {
        const startTime = new Date(wo.created_at).getTime();
        const endTime = new Date(wo.actual_end).getTime();
        totalCompletionTime += endTime - startTime;
      }
    });

    stats.avg_completion_time =
      completedCount > 0 ? totalCompletionTime / completedCount : 0;
    stats.completion_rate =
      stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return stats;
  }

  /**
   * Get work order checklist items
   */
  async getChecklistItems(
    workOrderId: string
  ): Promise<WorkOrderChecklistItem[]> {
    const { data, error } = await supabase
      .from('wo_checklist_items')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('order_index');

    if (error) {
      throw new Error(`Failed to fetch checklist items: ${error.message}`);
    }

    return data as WorkOrderChecklistItem[];
  }

  /**
   * Update checklist item completion
   */
  async updateChecklistItem(
    id: string,
    isCompleted: boolean,
    notes?: string
  ): Promise<WorkOrderChecklistItem> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;

    const updates: Partial<WorkOrderChecklistItem> = {
      is_completed: isCompleted,
      updated_at: new Date().toISOString(),
    };

    if (isCompleted) {
      updates.completed_by = userId;
      updates.completed_at = new Date().toISOString();
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const { data, error } = await supabase
      .from('wo_checklist_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update checklist item: ${error.message}`);
    }

    return data as WorkOrderChecklistItem;
  }

  /**
   * Get work order time logs
   */
  async getTimeLogs(workOrderId: string): Promise<WorkOrderTimeLog[]> {
    const { data, error } = await supabase
      .from('wo_time_logs')
      .select('*')
      .eq('work_order_id', workOrderId)
      .order('start_time', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch time logs: ${error.message}`);
    }

    return data as WorkOrderTimeLog[];
  }

  /**
   * Start time tracking for a work order
   */
  async startTimeTracking(
    workOrderId: string,
    activity: string,
    notes?: string
  ): Promise<WorkOrderTimeLog> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = user.id;

    const { data, error } = await supabase
      .from('wo_time_logs')
      .insert([
        {
          work_order_id: workOrderId,
          user_id: userId,
          start_time: new Date().toISOString(),
          activity,
          notes,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start time tracking: ${error.message}`);
    }

    return data as WorkOrderTimeLog;
  }

  /**
   * Stop time tracking for a work order
   */
  async stopTimeTracking(
    timeLogId: string,
    notes?: string
  ): Promise<WorkOrderTimeLog> {
    const endTime = new Date().toISOString();

    // First get the existing time log to calculate duration
    const { data: existingLog, error: fetchError } = await supabase
      .from('wo_time_logs')
      .select('start_time')
      .eq('id', timeLogId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch time log: ${fetchError.message}`);
    }

    const startTime = new Date(existingLog.start_time);
    const duration = Math.round(
      (new Date(endTime).getTime() - startTime.getTime()) / 60000
    ); // Duration in minutes

    const { data, error } = await supabase
      .from('wo_time_logs')
      .update({
        end_time: endTime,
        duration_minutes: duration,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', timeLogId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to stop time tracking: ${error.message}`);
    }

    return data as WorkOrderTimeLog;
  }

  /**
   * Private helper methods
   */
  private async generateWorkOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('work_orders')
      .select('wo_number')
      .like('wo_number', `WO-${year}-%`)
      .order('wo_number', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to generate work order number: ${error.message}`);
    }

    let nextNumber = 1;
    if (data && data.length > 0 && data[0]?.wo_number) {
      const lastNumber = data[0].wo_number.split('-').pop();
      nextNumber = parseInt(lastNumber || '0') + 1;
    }

    return `WO-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private async createChecklistItems(
    workOrderId: string,
    items: Array<{
      task: string;
      description?: string;
      is_required: boolean;
      order_index: number;
    }>
  ): Promise<void> {
    const checklistItems = items.map(item => ({
      work_order_id: workOrderId,
      ...item,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('wo_checklist_items')
      .insert(checklistItems);

    if (error) {
      throw new Error(`Failed to create checklist items: ${error.message}`);
    }
  }

  private isOverdue(
    scheduledEnd: string | null,
    status: WorkOrderStatus
  ): boolean {
    if (!scheduledEnd) return false;

    const completedStatuses = [
      WorkOrderStatus.COMPLETED,
      WorkOrderStatus.VERIFIED,
      WorkOrderStatus.CLOSED,
    ];

    if (completedStatuses.includes(status)) return false;

    return new Date(scheduledEnd) < new Date();
  }
}

export const workOrderService = new WorkOrderService();
