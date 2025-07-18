export interface Part {
  id: string;
  organizationId: string;
  warehouseId: string;
  name: string;
  description?: string;
  partNumber: string;
  manufacturer?: string;
  categoryId?: string;
  unitCost: number;
  currency: string;
  stockQuantity: number;
  reservedQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  unitOfMeasure: string;
  location?: string;
  supplierId?: string;
  supplierPartNumber?: string;
  leadTimeDays?: number;
  isConsumable: boolean;
  isActive: boolean;
  images: string[];
  specifications?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PartFilters {
  search?: string;
  categoryId?: string;
  manufacturer?: string;
  location?: string;
  isConsumable?: boolean;
  lowStock?: boolean;
  isActive?: boolean;
}

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  OVER_STOCK = 'over_stock',
}
