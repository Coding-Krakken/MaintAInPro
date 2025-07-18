import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignmentService, AssignmentCriteria } from '../services/assignment';
import { WORK_ORDER_QUERY_KEYS } from './useWorkOrders';

export const ASSIGNMENT_QUERY_KEYS = {
  all: ['assignments'] as const,
  technicians: () => [...ASSIGNMENT_QUERY_KEYS.all, 'technicians'] as const,
  workload: () => [...ASSIGNMENT_QUERY_KEYS.all, 'workload'] as const,
  recommendations: (criteria: AssignmentCriteria) =>
    [...ASSIGNMENT_QUERY_KEYS.all, 'recommendations', criteria] as const,
};

/**
 * Hook to get available technicians
 */
export function useAvailableTechnicians(
  criteria?: Partial<AssignmentCriteria>
) {
  return useQuery({
    queryKey: ASSIGNMENT_QUERY_KEYS.technicians(),
    queryFn: () => assignmentService.getAvailableTechnicians(criteria),
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });
}

/**
 * Hook to get workload distribution
 */
export function useWorkloadDistribution() {
  return useQuery({
    queryKey: ASSIGNMENT_QUERY_KEYS.workload(),
    queryFn: () => assignmentService.getWorkloadDistribution(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

/**
 * Hook to get assignment recommendations
 */
export function useAssignmentRecommendations(
  criteria: AssignmentCriteria,
  limit: number = 5
) {
  return useQuery({
    queryKey: ASSIGNMENT_QUERY_KEYS.recommendations(criteria),
    queryFn: () =>
      assignmentService.getAssignmentRecommendations(criteria, limit),
    enabled: !!criteria.priority, // Only fetch if we have basic criteria
  });
}

/**
 * Hook to assign a work order
 */
export function useAssignWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      technicianId,
      assignedBy,
    }: {
      workOrderId: string;
      technicianId: string;
      assignedBy: string;
    }) =>
      assignmentService.assignWorkOrder(workOrderId, technicianId, assignedBy),
    onSuccess: (_, { workOrderId }) => {
      // Invalidate work order queries
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });

      // Invalidate assignment queries
      queryClient.invalidateQueries({
        queryKey: ASSIGNMENT_QUERY_KEYS.technicians(),
      });
      queryClient.invalidateQueries({
        queryKey: ASSIGNMENT_QUERY_KEYS.workload(),
      });
    },
  });
}

/**
 * Hook to auto-assign a work order
 */
export function useAutoAssignWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      criteria,
      assignedBy,
    }: {
      workOrderId: string;
      criteria: AssignmentCriteria;
      assignedBy: string;
    }) =>
      assignmentService.autoAssignWorkOrder(workOrderId, criteria, assignedBy),
    onSuccess: (result, { workOrderId }) => {
      if (result) {
        // Invalidate work order queries
        queryClient.invalidateQueries({
          queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
        });
        queryClient.invalidateQueries({
          queryKey: WORK_ORDER_QUERY_KEYS.lists(),
        });
        queryClient.invalidateQueries({
          queryKey: WORK_ORDER_QUERY_KEYS.stats(),
        });

        // Invalidate assignment queries
        queryClient.invalidateQueries({
          queryKey: ASSIGNMENT_QUERY_KEYS.technicians(),
        });
        queryClient.invalidateQueries({
          queryKey: ASSIGNMENT_QUERY_KEYS.workload(),
        });
      }
    },
  });
}

/**
 * Hook to reassign a work order
 */
export function useReassignWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workOrderId,
      newTechnicianId,
      reason,
      reassignedBy,
    }: {
      workOrderId: string;
      newTechnicianId: string;
      reason: string;
      reassignedBy: string;
    }) =>
      assignmentService.reassignWorkOrder(
        workOrderId,
        newTechnicianId,
        reason,
        reassignedBy
      ),
    onSuccess: (_, { workOrderId }) => {
      // Invalidate work order queries
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.detail(workOrderId),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.stats(),
      });

      // Invalidate assignment queries
      queryClient.invalidateQueries({
        queryKey: ASSIGNMENT_QUERY_KEYS.technicians(),
      });
      queryClient.invalidateQueries({
        queryKey: ASSIGNMENT_QUERY_KEYS.workload(),
      });
    },
  });
}

/**
 * Hook to bulk assign work orders
 */
export function useBulkAssignWorkOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      assignments,
      assignedBy,
    }: {
      assignments: { workOrderId: string; technicianId: string }[];
      assignedBy: string;
    }) => assignmentService.bulkAssignWorkOrders(assignments, assignedBy),
    onSuccess: () => {
      // Invalidate all work order and assignment queries
      queryClient.invalidateQueries({
        queryKey: WORK_ORDER_QUERY_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ASSIGNMENT_QUERY_KEYS.all,
      });
    },
  });
}

/**
 * Hook to find the best technician for a work order
 */
export function useFindBestTechnician() {
  return useMutation({
    mutationFn: (criteria: AssignmentCriteria) =>
      assignmentService.findBestTechnician(criteria),
  });
}
