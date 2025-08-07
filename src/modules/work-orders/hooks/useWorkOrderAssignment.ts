import { useMutation, useQuery } from '@tanstack/react-query';
import { assignmentService, AssignmentCriteria } from '../services/assignment';
import { WorkOrderPriority } from '../types/workOrder';

/**
 * Hook for work order assignment operations
 */
export const useWorkOrderAssignment = () => {
  // Get assignment recommendations
  const getRecommendations = useMutation({
    mutationFn: async ({
      criteria,
      limit = 5,
    }: {
      criteria: AssignmentCriteria;
      limit?: number;
    }) => {
      return assignmentService.getAssignmentRecommendations(criteria, limit);
    },
  });

  // Find best technician
  const findBestTechnician = useMutation({
    mutationFn: async (criteria: AssignmentCriteria) => {
      return assignmentService.findBestTechnician(criteria);
    },
  });

  // Assign work order
  const assignWorkOrder = useMutation({
    mutationFn: async ({
      workOrderId,
      technicianId,
      assignedBy,
    }: {
      workOrderId: string;
      technicianId: string;
      assignedBy: string;
    }) => {
      return assignmentService.assignWorkOrder(
        workOrderId,
        technicianId,
        assignedBy
      );
    },
    onSuccess: () => {
      // Optionally invalidate related queries
      console.log('Work order assigned successfully');
    },
    onError: error => {
      console.error('Failed to assign work order:', error);
    },
  });

  // Auto-assign work order
  const autoAssignWorkOrder = useMutation({
    mutationFn: async ({
      workOrderId,
      criteria,
      assignedBy,
    }: {
      workOrderId: string;
      criteria: AssignmentCriteria;
      assignedBy: string;
    }) => {
      return assignmentService.autoAssignWorkOrder(
        workOrderId,
        criteria,
        assignedBy
      );
    },
    onSuccess: result => {
      if (result) {
        console.log('Work order auto-assigned successfully');
      } else {
        console.log('Auto-assignment failed - manual assignment required');
      }
    },
  });

  // Bulk assign work orders
  const bulkAssignWorkOrders = useMutation({
    mutationFn: async ({
      assignments,
      assignedBy,
    }: {
      assignments: { workOrderId: string; technicianId: string }[];
      assignedBy: string;
    }) => {
      return assignmentService.bulkAssignWorkOrders(assignments, assignedBy);
    },
  });

  // Reassign work order
  const reassignWorkOrder = useMutation({
    mutationFn: async ({
      workOrderId,
      newTechnicianId,
      reason,
      reassignedBy,
    }: {
      workOrderId: string;
      newTechnicianId: string;
      reason: string;
      reassignedBy: string;
    }) => {
      return assignmentService.reassignWorkOrder(
        workOrderId,
        newTechnicianId,
        reason,
        reassignedBy
      );
    },
  });

  return {
    // Queries
    getRecommendations,
    findBestTechnician,

    // Mutations
    assignWorkOrder,
    autoAssignWorkOrder,
    bulkAssignWorkOrders,
    reassignWorkOrder,

    // Loading states
    isAssigning: assignWorkOrder.isPending,
    isAutoAssigning: autoAssignWorkOrder.isPending,
    isBulkAssigning: bulkAssignWorkOrders.isPending,
    isReassigning: reassignWorkOrder.isPending,
    isGettingRecommendations: getRecommendations.isPending,

    // Error states
    assignmentError: assignWorkOrder.error,
    autoAssignmentError: autoAssignWorkOrder.error,
    bulkAssignmentError: bulkAssignWorkOrders.error,
    reassignmentError: reassignWorkOrder.error,
    recommendationsError: getRecommendations.error,
  };
};

/**
 * Hook to get available technicians
 */
export const useAvailableTechnicians = (
  criteria?: Partial<AssignmentCriteria>
) => {
  return useQuery({
    queryKey: ['available-technicians', criteria],
    queryFn: () => assignmentService.getAvailableTechnicians(criteria),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

/**
 * Utility hook for creating assignment criteria
 */
export const useAssignmentCriteria = () => {
  const createCriteria = (
    priority: WorkOrderPriority,
    options?: {
      skills?: string[];
      certifications?: string[];
      location?: string;
      estimatedHours?: number;
      equipmentId?: string;
    }
  ): AssignmentCriteria => {
    const criteria: AssignmentCriteria = { priority };

    if (options?.skills) criteria.skills_required = options.skills;
    if (options?.certifications)
      criteria.certifications_required = options.certifications;
    if (options?.location) criteria.location_preference = options.location;
    if (options?.estimatedHours)
      criteria.estimated_hours = options.estimatedHours;
    if (options?.equipmentId) criteria.equipment_id = options.equipmentId;

    return criteria;
  };

  return { createCriteria };
};
