-- Row Level Security (RLS) Policies for MaintAInPro CMMS
-- This file contains all RLS policies to ensure proper data isolation

-- Organizations policies
-- Organizations policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Super admins can manage organizations" ON organizations;
CREATE POLICY "Super admins can manage organizations" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Users policies
-- Users policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
CREATE POLICY "Users can view users in their organization" ON users
  FOR SELECT USING (
    id = auth.uid() OR organization_id = (auth.jwt()->>'organization_id')::uuid
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage users in their organization" ON users;
CREATE POLICY "Admins can manage users in their organization" ON users
  FOR ALL USING (
    organization_id = (auth.jwt()->>'organization_id')::uuid
    AND (auth.jwt()->>'role') IN ('admin', 'super_admin')
  );

-- Warehouses policies
-- Warehouses policies
DROP POLICY IF EXISTS "Users can view warehouses in their organization" ON warehouses;
CREATE POLICY "Users can view warehouses in their organization" ON warehouses
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage warehouses in their organization" ON warehouses;
CREATE POLICY "Admins can manage warehouses in their organization" ON warehouses
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Equipment policies
-- Equipment policies
DROP POLICY IF EXISTS "Users can view equipment in their organization" ON equipment;
CREATE POLICY "Users can view equipment in their organization" ON equipment
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update equipment in their organization" ON equipment;
CREATE POLICY "Users can update equipment in their organization" ON equipment
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager', 'technician')
    )
  );

DROP POLICY IF EXISTS "Admins can insert equipment in their organization" ON equipment;
CREATE POLICY "Admins can insert equipment in their organization" ON equipment
  FOR INSERT WITH CHECK (
    organization_id = (auth.jwt()->>'organization_id')::uuid
    AND (auth.jwt()->>'role') IN ('admin', 'super_admin', 'manager')
  );

DROP POLICY IF EXISTS "Admins can delete equipment in their organization" ON equipment;
CREATE POLICY "Admins can delete equipment in their organization" ON equipment
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Work orders policies
-- Work orders policies
DROP POLICY IF EXISTS "Users can view work orders in their organization" ON work_orders;
CREATE POLICY "Users can view work orders in their organization" ON work_orders
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create work orders in their organization" ON work_orders;
CREATE POLICY "Users can create work orders in their organization" ON work_orders
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update work orders in their organization" ON work_orders;
CREATE POLICY "Users can update work orders in their organization" ON work_orders
  FOR UPDATE USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND (
      requested_by = auth.uid() 
      OR assigned_to = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'manager')
      )
    )
  );

DROP POLICY IF EXISTS "Admins can delete work orders in their organization" ON work_orders;
CREATE POLICY "Admins can delete work orders in their organization" ON work_orders
  FOR DELETE USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- Parts policies
-- Parts policies
DROP POLICY IF EXISTS "Users can view parts in their organization" ON parts;
CREATE POLICY "Users can view parts in their organization" ON parts
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Inventory managers can manage parts in their organization" ON parts;
CREATE POLICY "Inventory managers can manage parts in their organization" ON parts
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager', 'inventory_manager')
    )
  );

-- Inventory policies
-- Inventory policies
DROP POLICY IF EXISTS "Users can view inventory in their organization" ON inventory;
CREATE POLICY "Users can view inventory in their organization" ON inventory
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Inventory managers can manage inventory in their organization" ON inventory;
CREATE POLICY "Inventory managers can manage inventory in their organization" ON inventory
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager', 'inventory_manager', 'technician')
    )
  );

-- Inventory movements policies
-- Inventory movements policies
DROP POLICY IF EXISTS "Users can view inventory movements in their organization" ON inventory_movements;
CREATE POLICY "Users can view inventory movements in their organization" ON inventory_movements
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create inventory movements in their organization" ON inventory_movements;
CREATE POLICY "Users can create inventory movements in their organization" ON inventory_movements
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager', 'inventory_manager', 'technician')
    )
  );

-- Vendors policies
-- Vendors policies
DROP POLICY IF EXISTS "Users can view vendors in their organization" ON vendors;
CREATE POLICY "Users can view vendors in their organization" ON vendors
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Managers can manage vendors in their organization" ON vendors;
CREATE POLICY "Managers can manage vendors in their organization" ON vendors
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

-- PM schedules policies
-- PM schedules policies
DROP POLICY IF EXISTS "Users can view PM schedules in their organization" ON pm_schedules;
CREATE POLICY "Users can view PM schedules in their organization" ON pm_schedules
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Managers can manage PM schedules in their organization" ON pm_schedules;
CREATE POLICY "Managers can manage PM schedules in their organization" ON pm_schedules
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager', 'technician')
    )
  );

-- Work order parts policies
-- Work order parts policies
DROP POLICY IF EXISTS "Users can view work order parts in their organization" ON work_order_parts;
CREATE POLICY "Users can view work order parts in their organization" ON work_order_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage work order parts in their organization" ON work_order_parts;
CREATE POLICY "Users can manage work order parts in their organization" ON work_order_parts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM work_orders wo
      WHERE wo.id = work_order_id
      AND wo.organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin', 'manager', 'technician')
      )
    )
  );
