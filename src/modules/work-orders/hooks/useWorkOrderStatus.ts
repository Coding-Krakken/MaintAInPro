import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { WorkOrderStatus, WorkOrder } from '../types/workOrder';
import { WORK_ORDER_QUERY_KEYS } from './useWorkOrders';

// Valid status transitions
const STATUS_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.OPEN]: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.ASSIGNED]: [
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.ON_HOLD,
    WorkOrderStatus.OPEN,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.IN_PROGRESS]: [
    WorkOrderStatus.COMPLETED,
    WorkOrderStatus.ON_HOLD,
    WorkOrderStatus.ASSIGNED,
  ],
  [WorkOrderStatus.ON_HOLD]: [
    WorkOrderStatus.ASSIGNED,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.COMPLETED]: [
    WorkOrderStatus.VERIFIED,
    WorkOrderStatus.IN_PROGRESS,
  ], // Allow reopening if needed
  [WorkOrderStatus.VERIFIED]: [WorkOrderStatus.CLOSED],
  [WorkOrderStatus.CLOSED]: [], // Terminal state
  [WorkOrderStatus.CANCELLED]: [], // Terminal state
};

export interface StatusUpdateRequest {
  workOrderId: string;
  newStatus: WorkOrderStatus;
  notes?: string;
  completionNotes?: string;
  actualHours?: number;
  actualCost?: number;
  verifiedBy?: string;
}

export interface StatusValidationResult {
  isValid: boolean;
  message?: string;
}

class WorkOrderStatusService {
  /**
   * Validate if a status transition is allowed
   */
  isValidTransition(
    currentStatus: WorkOrderStatus,
    newStatus: WorkOrderStatus
  ): StatusValidationResult {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        message: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get allowed next statuses for current status
   */
  getAllowedNextStatuses(currentStatus: WorkOrderStatus): WorkOrderStatus[] {
    return STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Update work order status with validation and audit trail
   */
  async updateStatus(request: StatusUpdateRequest): Promise<WorkOrder> {
    const {
      workOrderId,
      newStatus,
      notes,
      completionNotes,
      actualHours,
      actualCost,
      verifiedBy,
    } = request;

    // Get current work order
    const { data: currentWO, error: fetchError } = await supabase
      .from('work_orders')
      .select('status, assigned_to, actual_start')
      .eq('id', workOrderId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch work order: ${fetchError.message}`);
    }

    // Validate transition
    const validation = this.isValidTransition(currentWO.status, newStatus);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }

    // Prepare update data
    const updateData: Partial<WorkOrder> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps based on status
    switch (newStatus) {
      case WorkOrderStatus.IN_PROGRESS:
        if (!currentWO.actual_start) {
          updateData.actual_start = new Date().toISOString();
        }
        break;

      case WorkOrderStatus.COMPLETED:
        updateData.actual_end = new Date().toISOString();
        if (completionNotes) {
          updateData.completion_notes = completionNotes;
        }
        if (actualHours !== undefined) {
          updateData.actual_hours = actualHours;
        }
        if (actualCost !== undefined) {
          updateData.actual_cost = actualCost;
        }
        break;

      case WorkOrderStatus.VERIFIED:
        if (verifiedBy) {
          updateData.verified_by = verifiedBy;
          updateData.verified_at = new Date().toISOString();
        }
        break;
    }

    // Update work order
    const { data, error } = await supabase
      .from('work_orders')
      .update(updateData)
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update work order status: ${error.message}`);
    }

    // Log status change in history
    await this.logStatusChange(workOrderId, currentWO.status, newStatus, notes);

    // Handle auto-escalation for overdue work orders
    if (
      newStatus === WorkOrderStatus.ASSIGNED ||
      newStatus === WorkOrderStatus.IN_PROGRESS
    ) {
      await this.scheduleEscalationCheck(workOrderId);
    }

    // Send notifications based on status change
    await this.sendStatusChangeNotification(
      workOrderId,
      currentWO.status,
      newStatus,
      currentWO.assigned_to
    );

    return data;
  }

  /**
   * Start work order (transition to IN_PROGRESS)
   */
  async startWorkOrder(
    workOrderId: string,
    _technicianId: string,
    notes?: string
  ): Promise<WorkOrder> {
    return this.updateStatus({
      workOrderId,
      newStatus: WorkOrderStatus.IN_PROGRESS,
      notes: notes || `Work started by technician`,
    });
  }

  /**
   * Complete work order
   */
  async completeWorkOrder(
    workOrderId: string,
    completionData: {
      completionNotes?: string;
      actualHours?: number;
      actualCost?: number;
      technicianId: string;
    }
  ): Promise<WorkOrder> {
    return this.updateStatus({
      workOrderId,
      newStatus: WorkOrderStatus.COMPLETED,
      ...(completionData.completionNotes && {
        completionNotes: completionData.completionNotes,
      }),
      ...(completionData.actualHours !== undefined && {
        actualHours: completionData.actualHours,
      }),
      ...(completionData.actualCost !== undefined && {
        actualCost: completionData.actualCost,
      }),
      notes: `Work completed by technician`,
    });
  }

  /**
   * Verify completed work order
   */
  async verifyWorkOrder(
    workOrderId: string,
    verifiedBy: string,
    notes?: string
  ): Promise<WorkOrder> {
    return this.updateStatus({
      workOrderId,
      newStatus: WorkOrderStatus.VERIFIED,
      verifiedBy,
      notes: notes || `Work verified by supervisor`,
    });
  }

  /**
   * Put work order on hold
   */
  async holdWorkOrder(workOrderId: string, reason: string): Promise<WorkOrder> {
    return this.updateStatus({
      workOrderId,
      newStatus: WorkOrderStatus.ON_HOLD,
      notes: `Work order on hold: ${reason}`,
    });
  }

  /**
   * Cancel work order
   */
  async cancelWorkOrder(
    workOrderId: string,
    reason: string
  ): Promise<WorkOrder> {
    return this.updateStatus({
      workOrderId,
      newStatus: WorkOrderStatus.CANCELLED,
      notes: `Work order cancelled: ${reason}`,
    });
  }

  /**
   * Close work order (final step after verification)
   */
  async closeWorkOrder(
    workOrderId: string,
    _closedBy: string,
    notes?: string
  ): Promise<WorkOrder> {
    return this.updateStatus({
      workOrderId,
      newStatus: WorkOrderStatus.CLOSED,
      notes: notes || `Work order closed`,
    });
  }

  /**
   * Get work orders that need escalation
   */
  async getOverdueWorkOrders(): Promise<WorkOrder[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .in('status', [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS])
      .lt('scheduled_end', oneDayAgo);

    if (error) {
      throw new Error(`Failed to fetch overdue work orders: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Escalate overdue work orders
   */
  async escalateOverdueWorkOrders(): Promise<void> {
    const overdueWorkOrders = await this.getOverdueWorkOrders();

    for (const wo of overdueWorkOrders) {
      await this.logStatusChange(
        wo.id,
        wo.status,
        wo.status, // Status doesn't change, but we log the escalation
        `Work order escalated due to being overdue`
      );

      // Send escalation notifications
      await this.sendEscalationNotification(wo.id, wo.assigned_to);
    }
  }

  private async logStatusChange(
    workOrderId: string,
    fromStatus: WorkOrderStatus,
    toStatus: WorkOrderStatus,
    notes?: string
  ): Promise<void> {
    await supabase.from('work_order_history').insert({
      work_order_id: workOrderId,
      action: 'status_change',
      details: {
        from_status: fromStatus,
        to_status: toStatus,
        notes,
      },
      user_id: 'system', // This should be the actual user ID
    });
  }

  private async scheduleEscalationCheck(workOrderId: string): Promise<void> {
    // In a real implementation, this would schedule a job or set a timer
    // For now, just log the scheduling
    console.log(`Scheduled escalation check for work order ${workOrderId}`);
  }

  private async sendStatusChangeNotification(
    workOrderId: string,
    fromStatus: WorkOrderStatus,
    toStatus: WorkOrderStatus,
    assignedTo?: string
  ): Promise<void> {
    // Implementation would depend on notification system
    console.log(
      `Status change notification: WO ${workOrderId} from ${fromStatus} to ${toStatus}, assigned to ${assignedTo}`
    );
  }

  private async sendEscalationNotification(
    workOrderId: string,
    assignedTo?: string
  ): Promise<void> {
    // Implementation would depend on notification system
    console.log(
      `Escalation notification: WO ${workOrderId} is overdue, assigned to ${assignedTo}`
    );
  }
}

const workOrderStatusService = new WorkOrderStatusService();

/**
 * Hook to update work order status
 */
export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: StatusUpdateRequest) =>
      workOrderStatusService.updateStatus(request),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });
    },
  });
}

/**
 * Hook to start a work order
 */
export function useStartWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      technicianId,
      notes,
    }: {
      workOrderId: string;
      technicianId: string;
      notes?: string;
    }) =>
      workOrderStatusService.startWorkOrder(workOrderId, technicianId, notes),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });
    },
  });
}

/**
 * Hook to complete a work order
 */
export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      completionData,
    }: {
      workOrderId: string;
      completionData: {
        completionNotes?: string;
        actualHours?: number;
        actualCost?: number;
        technicianId: string;
      };
    }) => workOrderStatusService.completeWorkOrder(workOrderId, completionData),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });
    },
  });
}

/**
 * Hook to verify a work order
 */
export function useVerifyWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      verifiedBy,
      notes,
    }: {
      workOrderId: string;
      verifiedBy: string;
      notes?: string;
    }) =>
      workOrderStatusService.verifyWorkOrder(workOrderId, verifiedBy, notes),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });
    },
  });
}

/**
 * Hook to hold a work order
 */
export function useHoldWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      reason,
    }: {
      workOrderId: string;
      reason: string;
    }) => workOrderStatusService.holdWorkOrder(workOrderId, reason),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });
    },
  });
}

/**
 * Hook to cancel a work order
 */
export function useCancelWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      reason,
    }: {
      workOrderId: string;
      reason: string;
    }) => workOrderStatusService.cancelWorkOrder(workOrderId, reason),
    onSuccess: (_, { workOrderId }) => {
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });
    },
  });
}

/**
 * Get allowed next statuses for a work order
 */
export function useAllowedStatuses(currentStatus: WorkOrderStatus) {
  return workOrderStatusService.getAllowedNextStatuses(currentStatus);
}

/**
 * Validate status transition
 */
export function useStatusValidation() {
  return (currentStatus: WorkOrderStatus, newStatus: WorkOrderStatus) =>
    workOrderStatusService.isValidTransition(currentStatus, newStatus);
}
