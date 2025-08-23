/**
 * Shared storage for serverless API endpoints
 * This file provides persistent data storage for Vercel serverless functions
 */

import { promises as fs } from 'fs';

// Add runtime check to ensure we can access fs module
console.log('Storage module loading - fs module available:', typeof fs);
console.log('Storage module loading - environment:', process.env.NODE_ENV);

// Types for our data structures
interface Equipment {
  id: string;
  assetTag: string;
  model: string;
  description: string;
  area: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  organizationId: string;
  warehouseId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
  installDate?: Date | null;
  warrantyExpiry?: Date | null;
  manufacturer?: string | null;
  serialNumber?: string | null;
  specifications?: Record<string, any> | null;
}

interface WorkOrder {
  id: string;
  foNumber: string;
  type: 'corrective' | 'preventive';
  description: string;
  area: string;
  assetModel: string;
  status: 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedBy: string;
  assignedTo: string;
  equipmentId: string;
  dueDate: Date;
  completedAt?: Date | null;
  estimatedHours: string;
  actualHours?: string | null;
  notes: string;
  organizationId: string;
  warehouseId: string;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Notification {
  id: string;
  userId: string;
  type: 'wo_assigned' | 'wo_completed' | 'part_low_stock' | 'wo_overdue';
  title: string;
  message: string;
  read: boolean;
  workOrderId?: string | null;
  equipmentId?: string | null;
  partId?: string | null;
  createdAt: Date;
}

interface DashboardStats {
  totalEquipment: number;
  totalWorkOrders: number;
  newWorkOrders: number;
  inProgressWorkOrders: number;
  completedWorkOrders: number;
  overdueWorkOrders: number;
  activeEquipment: number;
  maintenanceEquipment: number;
}

interface Vendor {
  id: string;
  name: string;
  type: 'supplier' | 'contractor';
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  active: boolean;
  warehouseId: string;
  createdAt: Date;
}

interface StorageData {
  equipment: Equipment[];
  workOrders: WorkOrder[];
  notifications: Notification[];
  vendors: Vendor[];
  initialized: boolean;
}

// Simple file-based storage for serverless environments
const STORAGE_FILE = '/tmp/equipment-data.json';

let cachedData: StorageData | null = null;
let lastLoadTime: number = 0;
const CACHE_TTL = 5000; // 5 seconds cache TTL

async function loadData(): Promise<StorageData> {
  const now = Date.now();
  if (cachedData && now - lastLoadTime < CACHE_TTL) {
    return cachedData;
  }

  console.log('Loading data from storage file:', STORAGE_FILE);

  try {
    const fileContent = await fs.readFile(STORAGE_FILE, 'utf-8');
    const data = JSON.parse(fileContent, (key, value) => {
      // Parse Date strings back to Date objects
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    });
    cachedData = data;
    lastLoadTime = now;
    console.log('Successfully loaded data from storage file');
    return data;
  } catch (error) {
    console.log('No existing storage file found or error reading it:', error);
    console.log('Initializing with sample data');
    const data = await initializeData();
    await saveData(data);
    return data;
  }
}

async function saveData(data: StorageData): Promise<void> {
  console.log('Attempting to save data to:', STORAGE_FILE);

  try {
    // Ensure /tmp directory exists
    await fs.mkdir('/tmp', { recursive: true });
    console.log('/tmp directory ensured');

    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
    cachedData = data;
    lastLoadTime = Date.now();
    console.log('Successfully saved data to storage file');
  } catch (error) {
    console.error('Failed to save data:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      path: (error as any)?.path,
    });
    throw error;
  }
}

async function initializeData(): Promise<StorageData> {
  console.log('Initializing sample data for serverless storage');

  const equipment1: Equipment = {
    id: 'equip-1',
    assetTag: 'UAS-001',
    model: 'CB-2000X',
    description: 'Conveyor Belt System',
    area: 'Warehouse A',
    status: 'active',
    criticality: 'high',
    organizationId: 'default-org',
    warehouseId: 'default-warehouse-id',
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    installDate: new Date('2020-01-15'),
    warrantyExpiry: new Date('2025-01-15'),
    manufacturer: 'ConveyorCorp',
    serialNumber: 'CB2000X-001',
    specifications: { speed: '2.5 m/s', capacity: '500 kg' },
  };

  const equipment2: Equipment = {
    id: 'equip-2',
    assetTag: 'HVAC-205',
    model: 'HVAC-PRO-500',
    description: 'HVAC System - Main Floor',
    area: 'Main Floor',
    status: 'active',
    criticality: 'medium',
    organizationId: 'default-org',
    warehouseId: 'default-warehouse-id',
    createdBy: 'system',
    updatedBy: 'system',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    installDate: new Date('2019-06-20'),
    warrantyExpiry: new Date('2024-06-20'),
    manufacturer: 'ClimateControl Inc',
    serialNumber: 'HVAC500-205',
    specifications: { capacity: '50 tons', efficiency: '95%' },
  };

  const workOrder1: WorkOrder = {
    id: 'wo-1',
    foNumber: 'WO-001',
    type: 'corrective',
    description: 'Conveyor Belt Maintenance - Belt alignment adjustment required',
    area: 'Warehouse A',
    assetModel: 'CB-2000X',
    status: 'in_progress',
    priority: 'high',
    requestedBy: 'supervisor-1',
    assignedTo: 'tech-1',
    equipmentId: 'equip-1',
    dueDate: new Date(),
    estimatedHours: '4.00',
    notes: 'Belt showing signs of misalignment. Customer reported unusual noise.',
    organizationId: 'default-org',
    warehouseId: 'default-warehouse-id',
    createdBy: 'supervisor-1',
    updatedBy: 'supervisor-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    equipment: [equipment1, equipment2],
    workOrders: [workOrder1],
    notifications: [],
    vendors: [],
    initialized: true,
  };
}

// Equipment operations
export async function getAllEquipment(warehouseId: string): Promise<Equipment[]> {
  const data = await loadData();
  return data.equipment.filter(e => e.warehouseId === warehouseId);
}

export async function getEquipmentById(id: string): Promise<Equipment | undefined> {
  const data = await loadData();
  return data.equipment.find(e => e.id === id);
}

export async function createEquipment(equipmentData: {
  assetTag: string;
  model: string;
  description: string;
  area?: string;
  status?: string;
  criticality?: string;
  warehouseId: string;
  organizationId: string;
  createdBy: string;
  updatedBy: string;
  [key: string]: any;
}): Promise<Equipment> {
  console.log('=== STORAGE createEquipment START ===');
  console.log('Input equipmentData:', JSON.stringify(equipmentData, null, 2));

  try {
    console.log('Loading data from storage...');
    const data = await loadData();
    console.log(`Current equipment count: ${data.equipment.length}`);

    const id = `equip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated equipment ID:', id);

    const equipment: Equipment = {
      id,
      assetTag: equipmentData.assetTag,
      model: equipmentData.model,
      description: equipmentData.description,
      area: equipmentData.area || '',
      status: (equipmentData.status as any) || 'active',
      criticality: (equipmentData.criticality as any) || 'medium',
      organizationId: equipmentData.organizationId,
      warehouseId: equipmentData.warehouseId,
      createdBy: equipmentData.createdBy,
      updatedBy: equipmentData.updatedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      installDate: equipmentData.installDate ? new Date(equipmentData.installDate) : null,
      warrantyExpiry: equipmentData.warrantyExpiry ? new Date(equipmentData.warrantyExpiry) : null,
      manufacturer: equipmentData.manufacturer || null,
      serialNumber: equipmentData.serialNumber || null,
      specifications: equipmentData.specifications || null,
    };

    console.log('Equipment object created:', JSON.stringify(equipment, null, 2));

    data.equipment.push(equipment);
    console.log('Equipment added to data array. New count:', data.equipment.length);

    console.log('Saving data...');
    await saveData(data);
    console.log('Data saved successfully');

    console.log('=== STORAGE createEquipment SUCCESS ===');
    console.log(`Created equipment with ID: ${id}, total equipment: ${data.equipment.length}`);
    return equipment;
  } catch (error) {
    console.error('=== STORAGE createEquipment ERROR ===');
    console.error('Error in createEquipment:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
}

// Work order operations
export async function getAllWorkOrders(
  warehouseId: string,
  filters?: {
    status?: string[];
    assignedTo?: string;
    priority?: string[];
  }
): Promise<WorkOrder[]> {
  const data = await loadData();
  let workOrders = data.workOrders.filter(wo => wo.warehouseId === warehouseId);

  if (filters?.status) {
    workOrders = workOrders.filter(wo => filters.status!.includes(wo.status));
  }
  if (filters?.assignedTo) {
    workOrders = workOrders.filter(wo => wo.assignedTo === filters.assignedTo);
  }
  if (filters?.priority) {
    workOrders = workOrders.filter(wo => filters.priority!.includes(wo.priority));
  }

  return workOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | undefined> {
  const data = await loadData();
  return data.workOrders.find(wo => wo.id === id);
}

// Notification operations
export async function getAllNotifications(userId: string): Promise<Notification[]> {
  const data = await loadData();
  return data.notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Dashboard stats
export async function getDashboardStats(warehouseId: string): Promise<DashboardStats> {
  const equipment = await getAllEquipment(warehouseId);
  const workOrders = await getAllWorkOrders(warehouseId);

  const now = new Date();

  return {
    totalEquipment: equipment.length,
    totalWorkOrders: workOrders.length,
    newWorkOrders: workOrders.filter(wo => wo.status === 'new').length,
    inProgressWorkOrders: workOrders.filter(wo => wo.status === 'in_progress').length,
    completedWorkOrders: workOrders.filter(wo => wo.status === 'completed').length,
    overdueWorkOrders: workOrders.filter(
      wo => wo.status !== 'completed' && new Date(wo.dueDate) < now
    ).length,
    activeEquipment: equipment.filter(e => e.status === 'active').length,
    maintenanceEquipment: equipment.filter(e => e.status === 'maintenance').length,
  };
}

// Vendor operations
export async function getAllVendors(warehouseId: string): Promise<Vendor[]> {
  const data = await loadData();
  return data.vendors.filter(v => v.warehouseId === warehouseId && v.active);
}

export async function getVendorById(id: string): Promise<Vendor | undefined> {
  const data = await loadData();
  return data.vendors.find(v => v.id === id);
}

export async function createVendor(vendorData: {
  name: string;
  type: 'supplier' | 'contractor';
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  warehouseId: string;
}): Promise<Vendor> {
  const data = await loadData();

  const newVendor: Vendor = {
    id: `vendor-${Date.now()}`,
    name: vendorData.name,
    type: vendorData.type,
    email: vendorData.email,
    phone: vendorData.phone,
    address: vendorData.address,
    contactPerson: vendorData.contactPerson,
    active: true,
    warehouseId: vendorData.warehouseId,
    createdAt: new Date(),
  };

  data.vendors.push(newVendor);
  await saveData(data);

  return newVendor;
}

export async function updateVendor(
  id: string,
  updates: Partial<Vendor>
): Promise<Vendor | undefined> {
  const data = await loadData();
  const vendorIndex = data.vendors.findIndex(v => v.id === id);

  if (vendorIndex === -1) {
    return undefined;
  }

  data.vendors[vendorIndex] = {
    ...data.vendors[vendorIndex],
    ...updates,
  };

  await saveData(data);
  return data.vendors[vendorIndex];
}

export async function deleteVendor(id: string): Promise<boolean> {
  const data = await loadData();
  const vendorIndex = data.vendors.findIndex(v => v.id === id);

  if (vendorIndex === -1) {
    return false;
  }

  data.vendors.splice(vendorIndex, 1);
  await saveData(data);

  return true;
}
