import { supabase } from '../../../lib/supabase';
import {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '../types/workOrder';

export interface EscalationRule {
  id: string;
  name: string;
  trigger_condition:
    | 'overdue'
    | 'high_priority_stuck'
    | 'no_assignment'
    | 'custom';
  trigger_threshold_hours: number;
  priority_filter?: WorkOrderPriority[];
  status_filter?: WorkOrderStatus[];
  escalation_action:
    | 'notify_supervisor'
    | 'reassign'
    | 'priority_increase'
    | 'custom';
  escalation_target: string; // User ID or role
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EscalationEvent {
  id: string;
  work_order_id: string;
  rule_id: string;
  triggered_at: string;
  action_taken: string;
  escalated_to: string;
  resolved_at?: string;
  notes?: string;
}

export interface EscalationNotification {
  id: string;
  escalation_event_id: string;
  notification_type: 'email' | 'sms' | 'app' | 'webhook';
  recipient: string;
  message: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
}

/**
 * Work Order Escalation Management Service
 * Handles automatic escalation rules, notifications, and tracking
 */
export class WorkOrderEscalationService {
  /**
   * Check all active work orders for escalation conditions
   */
  async checkEscalationTriggers(): Promise<EscalationEvent[]> {
    try {
      // Get active escalation rules
      const { data: rules, error: rulesError } = await supabase
        .from('escalation_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError) {
        console.error('Error fetching escalation rules:', rulesError);
        return [];
      }

      if (!rules || rules.length === 0) {
        return [];
      }

      const escalationEvents: EscalationEvent[] = [];

      // Check each rule against work orders
      for (const rule of rules) {
        const triggeredWorkOrders = await this.checkRuleConditions(rule);

        for (const workOrder of triggeredWorkOrders) {
          // Check if this work order has already been escalated for this rule recently
          const hasRecentEscalation = await this.hasRecentEscalation(
            workOrder.id,
            rule.id
          );

          if (!hasRecentEscalation) {
            const escalationEvent = await this.triggerEscalation(
              workOrder,
              rule
            );
            if (escalationEvent) {
              escalationEvents.push(escalationEvent);
            }
          }
        }
      }

      return escalationEvents;
    } catch (error) {
      console.error('Error in escalation check:', error);
      return [];
    }
  }

  /**
   * Check if a specific rule's conditions are met for work orders
   */
  private async checkRuleConditions(
    rule: EscalationRule
  ): Promise<WorkOrder[]> {
    let query = supabase.from('work_orders').select('*');

    // Apply status filters
    if (rule.status_filter && rule.status_filter.length > 0) {
      query = query.in('status', rule.status_filter);
    }

    // Apply priority filters
    if (rule.priority_filter && rule.priority_filter.length > 0) {
      query = query.in('priority', rule.priority_filter);
    }

    const { data: workOrders, error } = await query;

    if (error) {
      console.error('Error fetching work orders for escalation:', error);
      return [];
    }

    if (!workOrders) return [];

    // Filter by time-based conditions
    const now = new Date();
    const thresholdTime = new Date(
      now.getTime() - rule.trigger_threshold_hours * 60 * 60 * 1000
    );

    return workOrders.filter(wo => {
      switch (rule.trigger_condition) {
        case 'overdue':
          return wo.due_date && new Date(wo.due_date) < now;

        case 'high_priority_stuck':
          return (
            wo.priority === WorkOrderPriority.CRITICAL ||
            wo.priority === WorkOrderPriority.HIGH
          );

        case 'no_assignment':
          return !wo.assigned_to && new Date(wo.created_at) < thresholdTime;

        default:
          return new Date(wo.created_at) < thresholdTime;
      }
    });
  }

  /**
   * Check if a work order has been escalated recently for a specific rule
   */
  private async hasRecentEscalation(
    workOrderId: string,
    ruleId: string
  ): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('escalation_events')
      .select('id')
      .eq('work_order_id', workOrderId)
      .eq('rule_id', ruleId)
      .gte('triggered_at', twentyFourHoursAgo.toISOString())
      .limit(1);

    if (error) {
      console.error('Error checking recent escalations:', error);
      return false;
    }

    return data && data.length > 0;
  }

  /**
   * Trigger escalation for a work order based on a rule
   */
  private async triggerEscalation(
    workOrder: WorkOrder,
    rule: EscalationRule
  ): Promise<EscalationEvent | null> {
    try {
      // Create escalation event
      const { data: escalationEvent, error: eventError } = await supabase
        .from('escalation_events')
        .insert({
          work_order_id: workOrder.id,
          rule_id: rule.id,
          triggered_at: new Date().toISOString(),
          action_taken: rule.escalation_action,
          escalated_to: rule.escalation_target,
          notes: `Auto-escalated due to rule: ${rule.name}`,
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating escalation event:', eventError);
        return null;
      }

      // Execute escalation action
      await this.executeEscalationAction(workOrder, rule, escalationEvent);

      // Send notifications
      await this.sendEscalationNotifications(escalationEvent, workOrder, rule);

      return escalationEvent;
    } catch (error) {
      console.error('Error triggering escalation:', error);
      return null;
    }
  }

  /**
   * Execute the specific escalation action
   */
  private async executeEscalationAction(
    workOrder: WorkOrder,
    rule: EscalationRule,
    _escalationEvent: EscalationEvent
  ): Promise<void> {
    switch (rule.escalation_action) {
      case 'notify_supervisor':
        // Notification is handled separately
        break;

      case 'reassign':
        await this.autoReassignWorkOrder(workOrder, rule.escalation_target);
        break;

      case 'priority_increase':
        await this.increasePriority(workOrder);
        break;

      case 'custom':
        // Custom actions would be implemented based on specific requirements
        console.log(`Custom escalation action for work order ${workOrder.id}`);
        break;
    }
  }

  /**
   * Auto-reassign work order to specified technician or role
   */
  private async autoReassignWorkOrder(
    workOrder: WorkOrder,
    targetId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({
          assigned_to: targetId,
          status: WorkOrderStatus.ASSIGNED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', workOrder.id);

      if (error) {
        console.error('Error auto-reassigning work order:', error);
      } else {
        console.log(
          `Work order ${workOrder.id} auto-reassigned to ${targetId}`
        );
      }
    } catch (error) {
      console.error('Error in auto-reassignment:', error);
    }
  }

  /**
   * Increase work order priority
   */
  private async increasePriority(workOrder: WorkOrder): Promise<void> {
    const priorityHierarchy = {
      [WorkOrderPriority.LOW]: WorkOrderPriority.MEDIUM,
      [WorkOrderPriority.MEDIUM]: WorkOrderPriority.HIGH,
      [WorkOrderPriority.HIGH]: WorkOrderPriority.CRITICAL,
      [WorkOrderPriority.CRITICAL]: WorkOrderPriority.EMERGENCY,
      [WorkOrderPriority.EMERGENCY]: WorkOrderPriority.EMERGENCY, // Already at max
    };

    const newPriority =
      priorityHierarchy[workOrder.priority as WorkOrderPriority];

    if (newPriority !== workOrder.priority) {
      try {
        const { error } = await supabase
          .from('work_orders')
          .update({
            priority: newPriority,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workOrder.id);

        if (error) {
          console.error('Error increasing work order priority:', error);
        } else {
          console.log(
            `Work order ${workOrder.id} priority increased to ${newPriority}`
          );
        }
      } catch (error) {
        console.error('Error in priority increase:', error);
      }
    }
  }

  /**
   * Send escalation notifications
   */
  private async sendEscalationNotifications(
    escalationEvent: EscalationEvent,
    workOrder: WorkOrder,
    rule: EscalationRule
  ): Promise<void> {
    try {
      // Get target user details
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('email, phone, notification_preferences')
        .eq('id', rule.escalation_target)
        .single();

      if (userError || !targetUser) {
        console.error(
          'Error fetching target user for notifications:',
          userError
        );
        return;
      }

      const message = this.createEscalationMessage(workOrder, rule);

      // Send email notification
      if (targetUser.email) {
        await this.sendNotification(
          escalationEvent.id,
          'email',
          targetUser.email,
          message
        );
      }

      // Send SMS if phone number available and user prefers SMS
      if (
        targetUser.phone &&
        targetUser.notification_preferences?.includes('sms')
      ) {
        await this.sendNotification(
          escalationEvent.id,
          'sms',
          targetUser.phone,
          message
        );
      }

      // Send in-app notification
      await this.sendNotification(
        escalationEvent.id,
        'app',
        rule.escalation_target,
        message
      );
    } catch (error) {
      console.error('Error sending escalation notifications:', error);
    }
  }

  /**
   * Create escalation message
   */
  private createEscalationMessage(
    workOrder: WorkOrder,
    rule: EscalationRule
  ): string {
    return `
🚨 WORK ORDER ESCALATION 

Work Order: ${workOrder.work_order_number || workOrder.id}
Title: ${workOrder.title}
Priority: ${workOrder.priority}
Status: ${workOrder.status}
Created: ${new Date(workOrder.created_at).toLocaleString()}

Escalation Rule: ${rule.name}
Triggered: ${new Date().toLocaleString()}

Action Required: Please review and take immediate action on this work order.

View Work Order: [LINK_TO_WORK_ORDER]
    `.trim();
  }

  /**
   * Send individual notification
   */
  private async sendNotification(
    escalationEventId: string,
    type: 'email' | 'sms' | 'app' | 'webhook',
    recipient: string,
    message: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('escalation_notifications').insert({
        escalation_event_id: escalationEventId,
        notification_type: type,
        recipient,
        message,
        status: 'pending',
      });

      if (error) {
        console.error(`Error creating ${type} notification:`, error);
      } else {
        console.log(`${type} notification queued for ${recipient}`);

        // In a real implementation, you would integrate with actual notification services
        // For now, we'll just mark as sent
        await this.markNotificationSent(escalationEventId, type, recipient);
      }
    } catch (error) {
      console.error(`Error sending ${type} notification:`, error);
    }
  }

  /**
   * Mark notification as sent (placeholder for real implementation)
   */
  private async markNotificationSent(
    escalationEventId: string,
    type: string,
    recipient: string
  ): Promise<void> {
    const { error } = await supabase
      .from('escalation_notifications')
      .update({
        sent_at: new Date().toISOString(),
        status: 'sent',
      })
      .eq('escalation_event_id', escalationEventId)
      .eq('notification_type', type)
      .eq('recipient', recipient);

    if (error) {
      console.error('Error marking notification as sent:', error);
    }
  }

  /**
   * Get escalation history for a work order
   */
  async getEscalationHistory(workOrderId: string): Promise<EscalationEvent[]> {
    const { data, error } = await supabase
      .from('escalation_events')
      .select(
        `
        *,
        escalation_rule:escalation_rules(name, escalation_action),
        escalation_notifications(*)
      `
      )
      .eq('work_order_id', workOrderId)
      .order('triggered_at', { ascending: false });

    if (error) {
      console.error('Error fetching escalation history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Create a new escalation rule
   */
  async createEscalationRule(
    rule: Omit<EscalationRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<EscalationRule | null> {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating escalation rule:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in escalation rule creation:', error);
      return null;
    }
  }

  /**
   * Update an escalation rule
   */
  async updateEscalationRule(
    id: string,
    updates: Partial<EscalationRule>
  ): Promise<EscalationRule | null> {
    try {
      const { data, error } = await supabase
        .from('escalation_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating escalation rule:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in escalation rule update:', error);
      return null;
    }
  }

  /**
   * Resolve an escalation event
   */
  async resolveEscalation(
    escalationEventId: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('escalation_events')
        .update({
          resolved_at: new Date().toISOString(),
          notes: notes || 'Manually resolved',
        })
        .eq('id', escalationEventId);

      if (error) {
        console.error('Error resolving escalation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in escalation resolution:', error);
      return false;
    }
  }
}

// Export singleton instance
export const escalationService = new WorkOrderEscalationService();
