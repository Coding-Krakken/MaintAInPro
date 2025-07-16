import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { workOrderService } from '../services/workOrderService';
import {
  CreateWorkOrderRequest,
  UpdateWorkOrderRequest,
  WorkOrderFilters,
  WorkOrderStatus,
} from '../types/workOrder';

// Query keys
export const WORK_ORDER_QUERY_KEYS = {
  all: ['work-orders'] as const,
  lists: () => [...WORK_ORDER_QUERY_KEYS.all, 'list'] as const,
  list: (filters: WorkOrderFilters) => [...WORK_ORDER_QUERY_KEYS.lists(), filters] as const,
  details: () => [...WORK_ORDER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...WORK_ORDER_QUERY_KEYS.details(), id] as const,
  stats: () => [...WORK_ORDER_QUERY_KEYS.all, 'stats'] as const,
  checklist: (workOrderId: string) => [...WORK_ORDER_QUERY_KEYS.all, 'checklist', workOrderId] as const,
  timeLogs: (workOrderId: string) => [...WORK_ORDER_QUERY_KEYS.all, 'time-logs', workOrderId] as const,
};

/**
 * Hook to get work orders with filtering and pagination
 */
export function useWorkOrders(
  filters: WorkOrderFilters = {},
  page: number = 1,
  limit: number = 20
) {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.list({ ...filters }),
    queryFn: () => workOrderService.getWorkOrders(filters, page, limit),
    // keepPreviousData: true, // This option is deprecated in newer versions
  });
}

/**
 * Hook to get a single work order by ID
 */
export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.detail(id),
    queryFn: () => workOrderService.getWorkOrderById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get work order statistics
 */
export function useWorkOrderStats() {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.stats(),
    queryFn: () => workOrderService.getWorkOrderStats(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

/**
 * Hook to get work order checklist items
 */
export function useWorkOrderChecklist(workOrderId: string) {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.checklist(workOrderId),
    queryFn: () => workOrderService.getChecklistItems(workOrderId),
    enabled: !!workOrderId,
  });
}

/**
 * Hook to get work order time logs
 */
export function useWorkOrderTimeLogs(workOrderId: string) {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.timeLogs(workOrderId),
    queryFn: () => workOrderService.getTimeLogs(workOrderId),
    enabled: !!workOrderId,
  });
}

/**
 * Hook to create a new work order
 */
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateWorkOrderRequest) =>
      workOrderService.createWorkOrder(request),
    onSuccess: () => {
      // Invalidate and refetch work orders list
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.stats() });
    },
  });
}

/**
 * Hook to update a work order
 */
export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateWorkOrderRequest }) =>
      workOrderService.updateWorkOrder(id, request),
    onSuccess: (data) => {
      // Update the work order in cache
      queryClient.setQueryData(WORK_ORDER_QUERY_KEYS.detail(data.id), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.stats() });
    },
  });
}

/**
 * Hook to update work order status
 */
export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: WorkOrderStatus; notes?: string }) =>
      workOrderService.updateWorkOrderStatus(id, status, notes),
    onSuccess: (data) => {
      // Update the work order in cache
      queryClient.setQueryData(WORK_ORDER_QUERY_KEYS.detail(data.id), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.stats() });
    },
  });
}

/**
 * Hook to delete a work order
 */
export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => workOrderService.deleteWorkOrder(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: WORK_ORDER_QUERY_KEYS.detail(id) });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.stats() });
    },
  });
}

/**
 * Hook to update a checklist item
 */
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isCompleted, notes }: { id: string; isCompleted: boolean; notes?: string }) =>
      workOrderService.updateChecklistItem(id, isCompleted, notes),
    onSuccess: (data) => {
      // Invalidate the checklist for this work order
      queryClient.invalidateQueries({ 
        queryKey: WORK_ORDER_QUERY_KEYS.checklist(data.work_order_id) 
      });
    },
  });
}

/**
 * Hook to start time tracking
 */
export function useStartTimeTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workOrderId, activity, notes }: { workOrderId: string; activity: string; notes?: string }) =>
      workOrderService.startTimeTracking(workOrderId, activity, notes),
    onSuccess: (data) => {
      // Invalidate time logs for this work order
      queryClient.invalidateQueries({ 
        queryKey: WORK_ORDER_QUERY_KEYS.timeLogs(data.work_order_id) 
      });
    },
  });
}

/**
 * Hook to stop time tracking
 */
export function useStopTimeTracking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ timeLogId, notes }: { timeLogId: string; notes?: string }) =>
      workOrderService.stopTimeTracking(timeLogId, notes),
    onSuccess: (data) => {
      // Invalidate time logs for this work order
      queryClient.invalidateQueries({ 
        queryKey: WORK_ORDER_QUERY_KEYS.timeLogs(data.work_order_id) 
      });
    },
  });
}

/**
 * Hook to get work orders assigned to current user
 */
export function useMyWorkOrders() {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.list({ assigned_to: 'current_user' }),
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      return workOrderService.getWorkOrders({ assigned_to: user.id });
    },
  });
}

/**
 * Hook to get overdue work orders
 */
export function useOverdueWorkOrders() {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.list({ search: 'overdue' }),
    queryFn: async () => {
      const result = await workOrderService.getWorkOrders();
      return {
        ...result,
        data: result.data.filter(wo => wo.is_overdue),
      };
    },
  });
}

/**
 * Hook to get work orders by equipment
 */
export function useWorkOrdersByEquipment(equipmentId: string) {
  return useQuery({
    queryKey: WORK_ORDER_QUERY_KEYS.list({ equipment_id: equipmentId }),
    queryFn: () => workOrderService.getWorkOrders({ equipment_id: equipmentId }),
    enabled: !!equipmentId,
  });
}

/**
 * Hook for bulk operations on work orders
 */
export function useBulkWorkOrderOperations() {
  const queryClient = useQueryClient();

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status, notes }: { ids: string[]; status: WorkOrderStatus; notes?: string }) => {
      const promises = ids.map(id => workOrderService.updateWorkOrderStatus(id, status, notes));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.stats() });
    },
  });

  const bulkAssign = useMutation({
    mutationFn: async ({ ids, assignedTo }: { ids: string[]; assignedTo: string }) => {
      const promises = ids.map(id => workOrderService.updateWorkOrder(id, { assigned_to: assignedTo }));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.lists() });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const promises = ids.map(id => workOrderService.deleteWorkOrder(id));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: WORK_ORDER_QUERY_KEYS.stats() });
    },
  });

  return {
    bulkUpdateStatus,
    bulkAssign,
    bulkDelete,
  };
}