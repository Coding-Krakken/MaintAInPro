import { supabase } from '../../../lib/supabase';
import {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '../types/workOrder';

export interface TechnicianAvailability {
  id: string;
  full_name: string;
  email: string;
  skills: string[];
  certifications: string[];
  current_workload: number;
  max_concurrent_orders: number;
  location: string;
  is_available: boolean;
  availability_start?: string;
  availability_end?: string;
}

export interface AssignmentCriteria {
  skills_required?: string[];
  certifications_required?: string[];
  location_preference?: string;
  priority: WorkOrderPriority;
  estimated_hours?: number;
  equipment_id?: string;
}

export interface AssignmentResult {
  technician_id: string;
  confidence_score: number;
  reasons: string[];
}

class AssignmentService {
  /**
   * Get available technicians based on criteria
   */
  async getAvailableTechnicians(
    _criteria?: Partial<AssignmentCriteria>
  ): Promise<TechnicianAvailability[]> {
    const query = supabase
      .from('profiles')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        phone,
        skills,
        certifications,
        location,
        user_settings,
        is_active
      `
      )
      .eq('is_active', true)
      .in('role', ['technician', 'supervisor', 'manager']);

    const { data: technicians, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch technicians: ${error.message}`);
    }

    // Get current workload for each technician
    const technicianIds = technicians.map(t => t.id);

    const { data: workloadData } = await supabase
      .from('work_orders')
      .select('assigned_to, estimated_hours')
      .in('assigned_to', technicianIds)
      .in('status', ['assigned', 'in_progress']);

    // Calculate workload for each technician
    const workloadMap = new Map<string, number>();
    workloadData?.forEach(wo => {
      if (wo.assigned_to) {
        const current = workloadMap.get(wo.assigned_to) || 0;
        workloadMap.set(wo.assigned_to, current + (wo.estimated_hours || 4));
      }
    });

    return technicians.map(tech => ({
      id: tech.id,
      full_name: `${tech.first_name} ${tech.last_name}`,
      email: tech.email,
      skills: tech.skills || [],
      certifications: tech.certifications || [],
      current_workload: workloadMap.get(tech.id) || 0,
      max_concurrent_orders: tech.user_settings?.max_concurrent_orders || 40, // 40 hours default
      location: tech.location || '',
      is_available:
        (workloadMap.get(tech.id) || 0) <
        (tech.user_settings?.max_concurrent_orders || 40),
      availability_start: tech.user_settings?.availability_start,
      availability_end: tech.user_settings?.availability_end,
    }));
  }

  /**
   * Find the best technician for a work order
   */
  async findBestTechnician(
    criteria: AssignmentCriteria
  ): Promise<AssignmentResult | null> {
    const availableTechnicians = await this.getAvailableTechnicians(criteria);

    if (availableTechnicians.length === 0) {
      return null;
    }

    const scoredTechnicians = availableTechnicians
      .filter(tech => tech.is_available)
      .map(tech => {
        let score = 0;
        const reasons: string[] = [];

        // Skills matching (30% weight)
        if (criteria.skills_required?.length) {
          const matchingSkills = criteria.skills_required.filter(skill =>
            tech.skills.includes(skill)
          );
          const skillsScore =
            (matchingSkills.length / criteria.skills_required.length) * 30;
          score += skillsScore;

          if (skillsScore > 20) {
            reasons.push(
              `Has ${matchingSkills.length}/${criteria.skills_required.length} required skills`
            );
          }
        }

        // Certifications matching (25% weight)
        if (criteria.certifications_required?.length) {
          const matchingCerts = criteria.certifications_required.filter(cert =>
            tech.certifications.includes(cert)
          );
          const certsScore =
            (matchingCerts.length / criteria.certifications_required.length) *
            25;
          score += certsScore;

          if (certsScore > 15) {
            reasons.push(
              `Has ${matchingCerts.length}/${criteria.certifications_required.length} required certifications`
            );
          }
        }

        // Workload balancing (25% weight)
        const workloadScore = Math.max(
          0,
          25 - (tech.current_workload / tech.max_concurrent_orders) * 25
        );
        score += workloadScore;

        if (tech.current_workload < tech.max_concurrent_orders * 0.5) {
          reasons.push('Low current workload');
        }

        // Location preference (20% weight)
        if (
          criteria.location_preference &&
          tech.location === criteria.location_preference
        ) {
          score += 20;
          reasons.push('Same location as work order');
        }

        // Priority bonus for high/critical/emergency
        if (
          [
            WorkOrderPriority.HIGH,
            WorkOrderPriority.CRITICAL,
            WorkOrderPriority.EMERGENCY,
          ].includes(criteria.priority)
        ) {
          if (tech.certifications.includes('emergency_response')) {
            score += 10;
            reasons.push('Emergency response certified');
          }
        }

        return {
          technician_id: tech.id,
          confidence_score: Math.round(score),
          reasons,
        };
      })
      .sort((a, b) => b.confidence_score - a.confidence_score);

    return scoredTechnicians[0] || null;
  }

  /**
   * Assign work order to technician
   */
  async assignWorkOrder(
    workOrderId: string,
    technicianId: string,
    assignedBy: string
  ): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        assigned_to: technicianId,
        status: WorkOrderStatus.ASSIGNED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign work order: ${error.message}`);
    }

    // Log the assignment
    await this.logAssignment(workOrderId, technicianId, assignedBy);

    // Send notification to technician
    await this.sendAssignmentNotification(workOrderId, technicianId);

    return data;
  }

  /**
   * Bulk assign work orders
   */
  async bulkAssignWorkOrders(
    assignments: { workOrderId: string; technicianId: string }[],
    assignedBy: string
  ): Promise<void> {
    const results = await Promise.allSettled(
      assignments.map(({ workOrderId, technicianId }) =>
        this.assignWorkOrder(workOrderId, technicianId, assignedBy)
      )
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`${failures.length} assignments failed:`, failures);
    }
  }

  /**
   * Auto-assign work order based on criteria
   */
  async autoAssignWorkOrder(
    workOrderId: string,
    criteria: AssignmentCriteria,
    assignedBy: string
  ): Promise<WorkOrder | null> {
    const bestMatch = await this.findBestTechnician(criteria);

    if (!bestMatch || bestMatch.confidence_score < 50) {
      // Don't auto-assign if confidence is too low
      return null;
    }

    return await this.assignWorkOrder(
      workOrderId,
      bestMatch.technician_id,
      assignedBy
    );
  }

  /**
   * Reassign work order
   */
  async reassignWorkOrder(
    workOrderId: string,
    newTechnicianId: string,
    reason: string,
    reassignedBy: string
  ): Promise<WorkOrder> {
    // Get current assignment
    const { data: currentWO } = await supabase
      .from('work_orders')
      .select('assigned_to')
      .eq('id', workOrderId)
      .single();

    // Update assignment
    const { data, error } = await supabase
      .from('work_orders')
      .update({
        assigned_to: newTechnicianId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', workOrderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reassign work order: ${error.message}`);
    }

    // Log the reassignment
    await this.logReassignment(
      workOrderId,
      currentWO?.assigned_to,
      newTechnicianId,
      reason,
      reassignedBy
    );

    // Send notifications
    await this.sendReassignmentNotification(
      workOrderId,
      currentWO?.assigned_to,
      newTechnicianId
    );

    return data;
  }

  /**
   * Get workload distribution across technicians
   */
  async getWorkloadDistribution(): Promise<
    Array<{
      technician_id: string;
      technician_name: string;
      workload: number;
      capacity: number;
    }>
  > {
    const technicians = await this.getAvailableTechnicians();

    return technicians.map(tech => ({
      technician_id: tech.id,
      technician_name: tech.full_name,
      workload: tech.current_workload,
      capacity: tech.max_concurrent_orders,
    }));
  }

  /**
   * Get assignment recommendations for a work order
   */
  async getAssignmentRecommendations(
    criteria: AssignmentCriteria,
    limit: number = 5
  ): Promise<AssignmentResult[]> {
    const availableTechnicians = await this.getAvailableTechnicians(criteria);

    const scoredTechnicians = availableTechnicians
      .filter(tech => tech.is_available)
      .map(tech => {
        let score = 0;
        const reasons: string[] = [];

        // Apply scoring logic (same as findBestTechnician)
        if (criteria.skills_required?.length) {
          const matchingSkills = criteria.skills_required.filter(skill =>
            tech.skills.includes(skill)
          );
          score +=
            (matchingSkills.length / criteria.skills_required.length) * 30;
          if (matchingSkills.length > 0) {
            reasons.push(
              `${matchingSkills.length}/${criteria.skills_required.length} skills match`
            );
          }
        }

        if (criteria.certifications_required?.length) {
          const matchingCerts = criteria.certifications_required.filter(cert =>
            tech.certifications.includes(cert)
          );
          score +=
            (matchingCerts.length / criteria.certifications_required.length) *
            25;
          if (matchingCerts.length > 0) {
            reasons.push(
              `${matchingCerts.length}/${criteria.certifications_required.length} certifications match`
            );
          }
        }

        score += Math.max(
          0,
          25 - (tech.current_workload / tech.max_concurrent_orders) * 25
        );
        reasons.push(
          `${Math.round((1 - tech.current_workload / tech.max_concurrent_orders) * 100)}% available capacity`
        );

        if (
          criteria.location_preference &&
          tech.location === criteria.location_preference
        ) {
          score += 20;
          reasons.push('Same location');
        }

        return {
          technician_id: tech.id,
          confidence_score: Math.round(score),
          reasons,
        };
      })
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit);

    return scoredTechnicians;
  }

  private async logAssignment(
    workOrderId: string,
    technicianId: string,
    assignedBy: string
  ): Promise<void> {
    await supabase.from('work_order_history').insert({
      work_order_id: workOrderId,
      action: 'assigned',
      details: {
        assigned_to: technicianId,
        assigned_by: assignedBy,
      },
      user_id: assignedBy,
    });
  }

  private async logReassignment(
    workOrderId: string,
    oldTechnicianId: string | undefined,
    newTechnicianId: string,
    reason: string,
    reassignedBy: string
  ): Promise<void> {
    await supabase.from('work_order_history').insert({
      work_order_id: workOrderId,
      action: 'reassigned',
      details: {
        from_technician: oldTechnicianId,
        to_technician: newTechnicianId,
        reason,
        reassigned_by: reassignedBy,
      },
      user_id: reassignedBy,
    });
  }

  private async sendAssignmentNotification(
    workOrderId: string,
    technicianId: string
  ): Promise<void> {
    // Implementation would depend on notification system
    // For now, just log the action
    console.log(
      `Sending assignment notification for WO ${workOrderId} to technician ${technicianId}`
    );
  }

  private async sendReassignmentNotification(
    workOrderId: string,
    oldTechnicianId: string | undefined,
    newTechnicianId: string
  ): Promise<void> {
    // Implementation would depend on notification system
    console.log(
      `Sending reassignment notification for WO ${workOrderId} from ${oldTechnicianId} to ${newTechnicianId}`
    );
  }
}

export const assignmentService = new AssignmentService();
