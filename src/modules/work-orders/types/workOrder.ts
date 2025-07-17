// Work Order Management Types
export interface WorkOrder {
  id: string;
  organization_id: string;
  equipment_id?: string;
  warehouse_id?: string;
  wo_number: string;
  title: string;
  description?: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  type: WorkOrderType;
  requested_by: string;
  assigned_to?: string;
  assigned_team?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  completion_notes?: string;
  verified_by?: string;
  verified_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

export enum WorkOrderStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderType {
  CORRECTIVE = 'corrective',
  PREVENTIVE = 'preventive',
  EMERGENCY = 'emergency',
  INSPECTION = 'inspection',
  SAFETY = 'safety',
  IMPROVEMENT = 'improvement',
}

export interface WorkOrderChecklistItem {
  id: string;
  work_order_id: string;
  task: string;
  description?: string;
  is_required: boolean;
  is_completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderTimeLog {
  id: string;
  work_order_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  activity: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderAttachment {
  id: string;
  work_order_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  description?: string;
  created_at: string;
}

export interface WorkOrderPartsUsed {
  id: string;
  work_order_id: string;
  part_id: string;
  quantity_used: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkOrderRequest {
  equipment_id?: string;
  warehouse_id?: string;
  title: string;
  description?: string;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  assigned_to?: string;
  assigned_team?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_hours?: number;
  estimated_cost?: number;
  checklist_items?: Array<{
    task: string;
    description?: string;
    is_required: boolean;
    order_index: number;
  }>;
}

export interface UpdateWorkOrderRequest {
  title?: string;
  description?: string;
  priority?: WorkOrderPriority;
  status?: WorkOrderStatus;
  assigned_to?: string;
  assigned_team?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  estimated_hours?: number;
  estimated_cost?: number;
  completion_notes?: string;
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus[];
  priority?: WorkOrderPriority[];
  type?: WorkOrderType[];
  assigned_to?: string;
  equipment_id?: string;
  warehouse_id?: string;
  created_from?: string;
  created_to?: string;
  search?: string;
}

export interface WorkOrderStats {
  total: number;
  open: number;
  assigned: number;
  in_progress: number;
  completed: number;
  overdue: number;
  avg_completion_time: number;
  completion_rate: number;
}

// UI specific types
export interface WorkOrderFormData {
  equipment_id: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  assigned_to: string;
  scheduled_start: string;
  scheduled_end: string;
  estimated_hours: number;
  estimated_cost: number;
  checklist_items: Array<{
    task: string;
    description: string;
    is_required: boolean;
  }>;
}

export interface WorkOrderListItem {
  id: string;
  wo_number: string;
  title: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  type: WorkOrderType;
  assigned_to_name: string | undefined;
  equipment_name: string | undefined;
  created_at: string;
  scheduled_start: string | undefined;
  is_overdue: boolean;
}
