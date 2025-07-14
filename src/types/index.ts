// Core application types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  organizationId: string;
  warehouseIds: string[];
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  settings: OrganizationSettings;
  subscription: Subscription;
  createdAt: Date;
  updatedAt: Date;
}

export interface Warehouse {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  address: Address;
  isActive: boolean;
  managerId?: string;
  settings: WarehouseSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 
  | 'super_admin'
  | 'org_admin'
  | 'warehouse_manager'
  | 'maintenance_supervisor'
  | 'technician'
  | 'inventory_clerk'
  | 'viewer';

export type Permission = 
  | 'users:read'
  | 'users:write'
  | 'work_orders:read'
  | 'work_orders:write'
  | 'work_orders:approve'
  | 'equipment:read'
  | 'equipment:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'inventory:transfer'
  | 'vendors:read'
  | 'vendors:write'
  | 'reports:read'
  | 'reports:export'
  | 'settings:read'
  | 'settings:write';

export interface OrganizationSettings {
  timezone: string;
  dateFormat: string;
  currency: string;
  language: string;
  workingHours: WorkingHours;
  notifications: NotificationSettings;
  maintenance: MaintenanceSettings;
}

export interface WarehouseSettings {
  defaultLocation: string;
  stockAlerts: StockAlertSettings;
  qrCodePrefix: string;
  autoCreateEquipment: boolean;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorkingDay: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  breaks: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  description?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  workOrderAssigned: boolean;
  workOrderOverdue: boolean;
  equipmentAlert: boolean;
  inventoryLow: boolean;
  pmDue: boolean;
}

export interface MaintenanceSettings {
  autoAssignTechnicians: boolean;
  requireApproval: boolean;
  defaultPriority: Priority;
  escalationEnabled: boolean;
  escalationHours: number;
}

export interface StockAlertSettings {
  lowStockThreshold: number;
  criticalStockThreshold: number;
  autoReorderEnabled: boolean;
  reorderPoint: number;
  maxStockLevel: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Subscription {
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
}

export interface SubscriptionFeature {
  name: string;
  enabled: boolean;
  limit?: number;
}

export interface SubscriptionLimits {
  users: number;
  warehouses: number;
  equipment: number;
  workOrders: number;
  storage: number; // in GB
}

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type Status = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'in_progress'
  | 'on_hold'
  | 'overdue';

// Common UI types
export interface Option<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterParams {
  search?: string;
  status?: Status;
  priority?: Priority;
  assignedTo?: string;
  warehouseId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: ApiError[];
}

// File upload types
export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Audit log types
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'view';
  changes?: Record<string, { from: any; to: any }>;
  userId: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'work_order_assigned'
  | 'work_order_completed'
  | 'work_order_overdue'
  | 'equipment_alert'
  | 'inventory_low'
  | 'pm_due'
  | 'system_announcement';

// Theme and UI types
export interface Theme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export type ColorScheme = 'light' | 'dark' | 'system';

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ComponentVariant = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'ghost'
  | 'outline';

// Equipment and Asset Management
export interface Equipment {
  id: string;
  organization_id: string;
  warehouse_id?: string;
  name: string;
  code: string;
  asset_tag?: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  status: 'operational' | 'maintenance' | 'down' | 'retired';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  location?: any;
  specifications?: any;
  documents?: any[];
  qr_code?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Work Order Management
export interface WorkOrder {
  id: string;
  organization_id: string;
  equipment_id?: string;
  warehouse_id?: string;
  title: string;
  description?: string;
  work_order_number: string;
  type: 'corrective' | 'preventive' | 'predictive' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  requested_by?: string;
  assigned_to?: string;
  estimated_hours?: number;
  actual_hours?: number;
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  completion_notes?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
}

// Parts and Inventory Management
export interface Part {
  id: string;
  organization_id: string;
  warehouse_id?: string;
  name: string;
  part_number: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  supplier?: string;
  unit_of_measure?: string;
  unit_cost?: number;
  reorder_point?: number;
  reorder_quantity?: number;
  lead_time_days?: number;
  is_critical?: boolean;
  barcode?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  organization_id: string;
  part_id: string;
  warehouse_id?: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  last_counted?: string;
  last_movement?: string;
  created_at: string;
  updated_at: string;
}

// Vendor Management
export interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: any;
  vendor_type?: 'supplier' | 'contractor' | 'service_provider';
  rating?: number;
  is_approved?: boolean;
  is_active?: boolean;
  payment_terms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Preventive Maintenance
export interface PMSchedule {
  id: string;
  organization_id: string;
  equipment_id: string;
  name: string;
  description?: string;
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'hours' | 'cycles';
  frequency_value: number;
  estimated_hours?: number;
  assigned_to?: string;
  is_active?: boolean;
  last_performed?: string;
  next_due?: string;
  instructions?: string;
  checklist?: any[];
  required_parts?: any[];
  created_at: string;
  updated_at: string;
}
