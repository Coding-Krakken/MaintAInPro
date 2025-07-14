-- Row Level Security (RLS) Policies for MaintAInPro CMMS
-- This file contains all RLS policies to ensure proper data isolation

-- Organizations policies
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage organizations" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- Users policies
CREATE POLICY "Users can view users in their organization" ON users
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage users in their organization" ON users
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Warehouses policies
CREATE POLICY "Users can view warehouses in their organization" ON warehouses
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view equipment in their organization" ON equipment
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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

CREATE POLICY "Admins can insert equipment in their organization" ON equipment
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'manager')
    )
  );

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
CREATE POLICY "Users can view work orders in their organization" ON work_orders
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create work orders in their organization" ON work_orders
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view parts in their organization" ON parts
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view inventory in their organization" ON inventory
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view inventory movements in their organization" ON inventory_movements
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view vendors in their organization" ON vendors
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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
CREATE POLICY "Users can view PM schedules in their organization" ON pm_schedules
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

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
