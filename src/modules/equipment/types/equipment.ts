export enum EquipmentStatus {
  OPERATIONAL = 'operational',
  MAINTENANCE = 'maintenance',
  OUT_OF_SERVICE = 'out_of_service',
  RETIRED = 'retired',
}

export enum EquipmentCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CRITICAL = 'critical',
}

export interface Equipment {
  id: string;
  organizationId: string;
  warehouseId: string;
  name: string;
  description?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  assetTag?: string;
  qrCode?: string;
  locationZoneId?: string;
  categoryId?: string;
  status: EquipmentStatus;
  condition: EquipmentCondition;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiry?: string;
  specifications?: Record<string, string | number | boolean>;
  maintenanceNotes?: string;
  images: string[];
  documents: { id: string; name: string; url: string; type: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentFilters {
  search?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  categoryId?: string;
  location?: string;
  manufacturer?: string;
}
