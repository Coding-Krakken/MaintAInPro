export enum VendorType {
  SUPPLIER = 'supplier',
  CONTRACTOR = 'contractor',
  SERVICE_PROVIDER = 'service_provider',
  MANUFACTURER = 'manufacturer',
}

export interface Vendor {
  id: string;
  organizationId: string;
  name: string;
  type: VendorType;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  website?: string;
  taxId?: string;
  paymentTerms?: string;
  isActive: boolean;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorFilters {
  search?: string;
  type?: VendorType;
  isActive?: boolean;
  rating?: number;
}
