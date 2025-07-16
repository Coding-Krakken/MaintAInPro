-- Update work_orders table to match TypeScript types
-- and add missing work order related tables

-- Update work_orders table structure
ALTER TABLE work_orders 
  DROP COLUMN IF EXISTS work_order_number,
  ADD COLUMN IF NOT EXISTS wo_number VARCHAR(100) UNIQUE NOT NULL DEFAULT 'WO-' || DATE_PART('year', NOW()) || '-' || LPAD(NEXTVAL('wo_number_seq')::text, 4, '0'),
  ADD COLUMN IF NOT EXISTS assigned_team VARCHAR(100),
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create sequence for work order numbering if not exists
CREATE SEQUENCE IF NOT EXISTS wo_number_seq START 1;

-- Update work_orders table columns to match enum values
ALTER TABLE work_orders 
  ALTER COLUMN type SET DEFAULT 'corrective',
  ALTER COLUMN priority SET DEFAULT 'medium',
  ALTER COLUMN status SET DEFAULT 'open';

-- Add constraints for enum values
ALTER TABLE work_orders 
  ADD CONSTRAINT IF NOT EXISTS work_orders_type_check 
  CHECK (type IN ('corrective', 'preventive', 'emergency', 'inspection', 'safety', 'improvement'));

ALTER TABLE work_orders 
  ADD CONSTRAINT IF NOT EXISTS work_orders_priority_check 
  CHECK (priority IN ('low', 'medium', 'high', 'critical', 'emergency'));

ALTER TABLE work_orders 
  ADD CONSTRAINT IF NOT EXISTS work_orders_status_check 
  CHECK (status IN ('open', 'assigned', 'in_progress', 'on_hold', 'completed', 'verified', 'closed', 'cancelled'));

-- Create work order checklist items table
CREATE TABLE IF NOT EXISTS wo_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on wo_checklist_items
ALTER TABLE wo_checklist_items ENABLE ROW LEVEL SECURITY;

-- Create work order time logs table
CREATE TABLE IF NOT EXISTS wo_time_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  activity VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on wo_time_logs
ALTER TABLE wo_time_logs ENABLE ROW LEVEL SECURITY;

-- Create work order attachments table
CREATE TABLE IF NOT EXISTS wo_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on wo_attachments
ALTER TABLE wo_attachments ENABLE ROW LEVEL SECURITY;

-- Create work order parts used table
CREATE TABLE IF NOT EXISTS wo_parts_used (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on wo_parts_used
ALTER TABLE wo_parts_used ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment_id ON work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_warehouse_id ON work_orders(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_start ON work_orders(scheduled_start);

CREATE INDEX IF NOT EXISTS idx_wo_checklist_items_work_order_id ON wo_checklist_items(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_checklist_items_order_index ON wo_checklist_items(work_order_id, order_index);

CREATE INDEX IF NOT EXISTS idx_wo_time_logs_work_order_id ON wo_time_logs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_time_logs_user_id ON wo_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wo_time_logs_start_time ON wo_time_logs(start_time DESC);

CREATE INDEX IF NOT EXISTS idx_wo_attachments_work_order_id ON wo_attachments(work_order_id);

CREATE INDEX IF NOT EXISTS idx_wo_parts_used_work_order_id ON wo_parts_used(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_parts_used_part_id ON wo_parts_used(part_id);

-- Update updated_at timestamp function for work_orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON work_orders;
CREATE TRIGGER update_work_orders_updated_at 
  BEFORE UPDATE ON work_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wo_checklist_items_updated_at ON wo_checklist_items;
CREATE TRIGGER update_wo_checklist_items_updated_at 
  BEFORE UPDATE ON wo_checklist_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wo_time_logs_updated_at ON wo_time_logs;
CREATE TRIGGER update_wo_time_logs_updated_at 
  BEFORE UPDATE ON wo_time_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wo_parts_used_updated_at ON wo_parts_used;
CREATE TRIGGER update_wo_parts_used_updated_at 
  BEFORE UPDATE ON wo_parts_used 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();