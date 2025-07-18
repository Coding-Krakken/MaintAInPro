export enum FrequencyType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  CUSTOM = 'custom',
}

export interface PreventiveMaintenance {
  id: string;
  organizationId: string;
  warehouseId: string;
  name: string;
  description?: string;
  equipmentId: string;
  frequencyType: FrequencyType;
  frequencyValue: number;
  estimatedDuration?: number;
  instructions?: string;
  checklist: ChecklistItem[];
  requiredParts: RequiredPart[];
  assignedTo?: string;
  isActive: boolean;
  nextDueDate?: string;
  lastCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  notes?: string;
}

export interface RequiredPart {
  partId: string;
  quantity: number;
  isOptional: boolean;
}

export interface PreventiveMaintenanceFilters {
  search?: string;
  equipmentId?: string;
  frequencyType?: FrequencyType;
  isActive?: boolean;
  overdue?: boolean;
}
