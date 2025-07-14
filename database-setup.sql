-- MaintAInPro CMMS Database Setup with Test Data
-- Run this script in your Supabase SQL Editor

-- First, let's ensure we have the required tables (if not already created)
-- This script assumes the migration files have been run

-- Create a test organization
INSERT INTO organizations (id, name, slug, settings, subscription_plan, subscription_status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'ACME Manufacturing Corp',
  'acme-manufacturing',
  '{"timezone": "America/New_York", "currency": "USD", "language": "en"}',
  'enterprise',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Create a test warehouse
INSERT INTO warehouses (id, organization_id, name, code, description, address, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Main Warehouse',
  'WH001',
  'Primary warehouse for ACME Manufacturing',
  '{"street": "123 Industrial Blvd", "city": "Manufacturing City", "state": "NY", "zip": "12345", "country": "USA"}',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create test users for each role
-- Note: These users will need to be created in Supabase Auth first, then we insert profiles

-- Super Admin
INSERT INTO users (id, organization_id, email, first_name, last_name, role, permissions, department, employee_id, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  'superadmin@acme.com',
  'Super',
  'Admin',
  'super_admin',
  '["users:read", "users:write", "work_orders:read", "work_orders:write", "work_orders:approve", "equipment:read", "equipment:write", "inventory:read", "inventory:write", "inventory:transfer", "vendors:read", "vendors:write", "reports:read", "reports:export", "settings:read", "settings:write"]',
  'Administration',
  'EMP001',
  true
) ON CONFLICT (id) DO NOTHING;

-- Organization Admin
INSERT INTO users (id, organization_id, email, first_name, last_name, role, permissions, department, employee_id, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@acme.com',
  'Org',
  'Admin',
  'admin',
  '["users:read", "users:write", "work_orders:read", "work_orders:write", "work_orders:approve", "equipment:read", "equipment:write", "inventory:read", "inventory:write", "vendors:read", "vendors:write", "reports:read", "reports:export", "settings:read"]',
  'Administration',
  'EMP002',
  true
) ON CONFLICT (id) DO NOTHING;

-- Warehouse Manager
INSERT INTO users (id, organization_id, email, first_name, last_name, role, permissions, department, employee_id, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  'manager@acme.com',
  'Warehouse',
  'Manager',
  'manager',
  '["work_orders:read", "work_orders:write", "equipment:read", "equipment:write", "inventory:read", "inventory:write", "inventory:transfer", "vendors:read", "reports:read"]',
  'Warehouse',
  'EMP003',
  true
) ON CONFLICT (id) DO NOTHING;

-- Maintenance Technician
INSERT INTO users (id, organization_id, email, first_name, last_name, role, permissions, department, employee_id, is_active)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '550e8400-e29b-41d4-a716-446655440000',
  'technician@acme.com',
  'Mike',
  'Technician',
  'technician',
  '["work_orders:read", "work_orders:write", "equipment:read", "equipment:write", "inventory:read", "inventory:write"]',
  'Maintenance',
  'EMP004',
  true
) ON CONFLICT (id) DO NOTHING;

-- Inventory Manager
INSERT INTO users (id, organization_id, email, first_name, last_name, role, permissions, department, employee_id, is_active)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '550e8400-e29b-41d4-a716-446655440000',
  'inventory@acme.com',
  'Inventory',
  'Manager',
  'inventory_manager',
  '["inventory:read", "inventory:write", "inventory:transfer", "vendors:read", "reports:read"]',
  'Inventory',
  'EMP005',
  true
) ON CONFLICT (id) DO NOTHING;

-- Regular User/Viewer
INSERT INTO users (id, organization_id, email, first_name, last_name, role, permissions, department, employee_id, is_active)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '550e8400-e29b-41d4-a716-446655440000',
  'user@acme.com',
  'Regular',
  'User',
  'user',
  '["work_orders:read", "equipment:read", "inventory:read", "reports:read"]',
  'Operations',
  'EMP006',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create some sample equipment
INSERT INTO equipment (id, organization_id, warehouse_id, name, code, description, category, manufacturer, model, serial_number, status, criticality, created_by)
VALUES 
(
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'Production Line A',
  'EQ001',
  'Main production line for widget manufacturing',
  'Production Equipment',
  'Industrial Corp',
  'PL-2000',
  'SN123456789',
  'operational',
  'critical',
  '33333333-3333-3333-3333-333333333333'
),
(
  '770e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'HVAC Unit 1',
  'EQ002',
  'Main building HVAC system',
  'HVAC',
  'Climate Control Inc',
  'CC-500',
  'SN987654321',
  'operational',
  'high',
  '33333333-3333-3333-3333-333333333333'
),
(
  '770e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'Forklift #3',
  'EQ003',
  'Electric forklift for warehouse operations',
  'Material Handling',
  'Forklift Co',
  'FL-Electric-200',
  'SN456789123',
  'maintenance',
  'medium',
  '33333333-3333-3333-3333-333333333333'
) ON CONFLICT (id) DO NOTHING;

-- Create some sample parts
INSERT INTO parts (id, organization_id, warehouse_id, name, part_number, description, category, unit_of_measure, unit_cost, reorder_point, reorder_quantity)
VALUES 
(
  '880e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'Belt Drive Assembly',
  'BDA-001',
  'Main belt drive for production line',
  'Mechanical Parts',
  'Each',
  125.50,
  5,
  10
),
(
  '880e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'HVAC Filter',
  'FLT-001',
  'Air filter for HVAC system',
  'Filters',
  'Each',
  25.00,
  10,
  20
),
(
  '880e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440001',
  'Hydraulic Oil',
  'OIL-001',
  'Hydraulic oil for forklift',
  'Fluids',
  'Gallon',
  45.00,
  20,
  50
) ON CONFLICT (id) DO NOTHING;

-- Create inventory records
INSERT INTO inventory (id, organization_id, part_id, warehouse_id, quantity_on_hand, quantity_reserved)
VALUES 
(
  '990e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '880e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  8,
  0
),
(
  '990e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '880e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  15,
  2
),
(
  '990e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '880e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  45,
  5
) ON CONFLICT (id) DO NOTHING;

-- Create some sample work orders
INSERT INTO work_orders (id, organization_id, equipment_id, warehouse_id, title, description, work_order_number, type, priority, status, requested_by, assigned_to, estimated_hours)
VALUES 
(
  'aa0e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  'Replace Belt Drive Assembly',
  'The belt drive assembly is showing signs of wear and needs replacement',
  'WO-2024-001',
  'corrective',
  'high',
  'pending',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  4.0
),
(
  'aa0e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  'HVAC Filter Replacement',
  'Monthly HVAC filter replacement',
  'WO-2024-002',
  'preventive',
  'medium',
  'in_progress',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  1.0
),
(
  'aa0e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440001',
  'Forklift Hydraulic Service',
  'Routine hydraulic system maintenance',
  'WO-2024-003',
  'preventive',
  'medium',
  'completed',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  2.5
) ON CONFLICT (id) DO NOTHING;

-- Create a sample vendor
INSERT INTO vendors (id, organization_id, name, code, contact_person, email, phone, vendor_type, is_approved, is_active)
VALUES (
  'bb0e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Industrial Parts Supply Co',
  'IPSC001',
  'John Smith',
  'john@industrialparts.com',
  '+1-555-0123',
  'supplier',
  true,
  true
) ON CONFLICT (id) DO NOTHING;

-- Create sample PM schedules
INSERT INTO pm_schedules (id, organization_id, equipment_id, name, description, frequency_type, frequency_value, estimated_hours, assigned_to, is_active, next_due)
VALUES 
(
  'cc0e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440001',
  'Production Line A - Monthly Inspection',
  'Monthly preventive maintenance inspection',
  'monthly',
  1,
  3.0,
  '44444444-4444-4444-4444-444444444444',
  true,
  '2025-08-15 09:00:00+00'
),
(
  'cc0e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  '770e8400-e29b-41d4-a716-446655440002',
  'HVAC Filter Change',
  'Replace HVAC filters monthly',
  'monthly',
  1,
  1.0,
  '44444444-4444-4444-4444-444444444444',
  true,
  '2025-08-01 10:00:00+00'
) ON CONFLICT (id) DO NOTHING;

-- Display summary
SELECT 'Database setup completed successfully!' as status;
SELECT 'Organizations created: ' || COUNT(*) as organizations_count FROM organizations;
SELECT 'Users created: ' || COUNT(*) as users_count FROM users;
SELECT 'Equipment created: ' || COUNT(*) as equipment_count FROM equipment;
SELECT 'Work Orders created: ' || COUNT(*) as work_orders_count FROM work_orders;
SELECT 'Parts created: ' || COUNT(*) as parts_count FROM parts;
