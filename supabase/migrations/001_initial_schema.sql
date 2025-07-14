-- Create database schema for MaintAInPro CMMS
-- This file contains the complete database schema including all tables, 
-- row level security policies, and indexes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER DATABASE postgres SET row_security = on;

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'user',
  permissions JSONB DEFAULT '[]',
  avatar_url TEXT,
  phone VARCHAR(20),
  department VARCHAR(100),
  employee_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  address JSONB,
  manager_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on warehouses
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  asset_tag VARCHAR(100),
  description TEXT,
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  warranty_expiry DATE,
  status VARCHAR(50) DEFAULT 'operational',
  criticality VARCHAR(50) DEFAULT 'medium',
  location JSONB,
  specifications JSONB DEFAULT '{}',
  documents JSONB DEFAULT '[]',
  qr_code VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on equipment
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- Work orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id),
  warehouse_id UUID REFERENCES warehouses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  work_order_number VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) DEFAULT 'corrective',
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'pending',
  requested_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on work_orders
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Parts table
CREATE TABLE IF NOT EXISTS parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  name VARCHAR(255) NOT NULL,
  part_number VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100),
  manufacturer VARCHAR(255),
  supplier VARCHAR(255),
  unit_of_measure VARCHAR(50),
  unit_cost DECIMAL(12,2),
  reorder_point INTEGER DEFAULT 0,
  reorder_quantity INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 0,
  is_critical BOOLEAN DEFAULT false,
  barcode VARCHAR(255),
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on parts
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  last_counted TIMESTAMP WITH TIME ZONE,
  last_movement TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(part_id, warehouse_id)
);

-- Enable RLS on inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id),
  work_order_id UUID REFERENCES work_orders(id),
  movement_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'transfer', 'adjustment'
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(12,2),
  reference_number VARCHAR(100),
  notes TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on inventory_movements
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address JSONB,
  vendor_type VARCHAR(50), -- 'supplier', 'contractor', 'service_provider'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  payment_terms VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Preventive maintenance schedules table
CREATE TABLE IF NOT EXISTS pm_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'hours', 'cycles'
  frequency_value INTEGER NOT NULL,
  estimated_hours DECIMAL(8,2),
  assigned_to UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  last_performed TIMESTAMP WITH TIME ZONE,
  next_due TIMESTAMP WITH TIME ZONE,
  instructions TEXT,
  checklist JSONB DEFAULT '[]',
  required_parts JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on pm_schedules
ALTER TABLE pm_schedules ENABLE ROW LEVEL SECURITY;

-- Work order parts table (junction table for parts used in work orders)
CREATE TABLE IF NOT EXISTS work_order_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
  quantity_requested INTEGER NOT NULL,
  quantity_used INTEGER DEFAULT 0,
  unit_cost DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on work_order_parts
ALTER TABLE work_order_parts ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_equipment_organization_id ON equipment(organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_warehouse_id ON equipment(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment(code);
CREATE INDEX IF NOT EXISTS idx_work_orders_organization_id ON work_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment_id ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_parts_organization_id ON parts(organization_id);
CREATE INDEX IF NOT EXISTS idx_parts_warehouse_id ON parts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);
CREATE INDEX IF NOT EXISTS idx_inventory_part_id ON inventory(part_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_part_id ON inventory_movements(part_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_work_order_id ON inventory_movements(work_order_id);
CREATE INDEX IF NOT EXISTS idx_vendors_organization_id ON vendors(organization_id);
CREATE INDEX IF NOT EXISTS idx_pm_schedules_organization_id ON pm_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_pm_schedules_equipment_id ON pm_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_work_order_id ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_part_id ON work_order_parts(part_id);
