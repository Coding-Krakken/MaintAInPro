export type WorkOrderStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'verified'
  | 'closed';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WorkOrder {
  id: string;
  fo_number: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  created_date: string;
  due_date: string | null;
  completed_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;

  // Relationships
  assigned_to_id: string | null;
  assigned_to?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };

  equipment_id: string | null;
  equipment?: {
    id: string;
    name: string;
    model: string;
    serial_number: string;
  };

  created_by_id: string;
  created_by?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CreateWorkOrderData {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  due_date?: string;
  estimated_hours?: number;
  assigned_to_id?: string;
  equipment_id?: string;
}

export interface UpdateWorkOrderData {
  title?: string;
  description?: string;
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  assigned_to_id?: string;
  equipment_id?: string;
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus[];
  priority?: WorkOrderPriority[];
  assigned_to_id?: string;
  equipment_id?: string;
  created_date_from?: string;
  created_date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
}

export interface WorkOrderStats {
  total: number;
  new: number;
  assigned: number;
  in_progress: number;
  completed: number;
  verified: number;
  closed: number;
  overdue: number;
}
