-- Migration: 0007_comprehensive_schema_alignment.sql
-- Comprehensive schema alignment with DatabaseImplementation.md
-- This migration ensures full compliance with production-ready database design
-- Implements strict multi-tenancy, full audit trail, and performance optimizations

-- =============================================================================
-- STEP 1: Create schema migration tracking table
-- =============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rollback_sql TEXT,
  description TEXT,
  checksum VARCHAR(64)
);

-- Track this migration
INSERT INTO schema_migrations (version, description, rollback_sql) VALUES (
  '0007_comprehensive_schema_alignment',
  'Comprehensive schema alignment with DatabaseImplementation.md specification',
  'DROP TABLE IF EXISTS schema_migrations; -- Additional rollback steps would be defined here'
) ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- STEP 2: Ensure all tables have proper organization_id for multi-tenancy
-- =============================================================================

-- Add organization_id to all core tables if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE pm_templates ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE escalation_rules ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE escalation_history ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE job_queue ADD COLUMN IF NOT EXISTS organization_id UUID;

-- =============================================================================
-- STEP 3: Ensure full audit trail columns on all tables
-- =============================================================================

-- Add comprehensive audit fields where missing
DO $$ 
DECLARE
    table_name TEXT;
    audit_tables TEXT[] := ARRAY[
        'organizations', 'profiles', 'work_orders', 'equipment', 'parts', 
        'vendors', 'pm_templates', 'attachments', 'notifications', 
        'escalation_rules', 'tags', 'custom_fields'
    ];
BEGIN
    FOREACH table_name IN ARRAY audit_tables
    LOOP
        -- Add audit columns if they don't exist
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by UUID', table_name);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by UUID', table_name);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP', table_name);
        
        -- Ensure timestamps exist
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()', table_name);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()', table_name);
    END LOOP;
END $$;

-- =============================================================================
-- STEP 4: Add full-text search columns where needed
-- =============================================================================

-- Add tsvector columns for full-text search
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tsv TSVECTOR;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS tsv TSVECTOR;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS tsv TSVECTOR;

-- Create or replace function to update full-text search vectors
CREATE OR REPLACE FUNCTION update_work_order_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv := to_tsvector('english', 
    COALESCE(NEW.fo_number, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.area, '') || ' ' ||
    COALESCE(NEW.asset_model, '') || ' ' ||
    COALESCE(NEW.notes, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_equipment_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv := to_tsvector('english', 
    COALESCE(NEW.asset_tag, '') || ' ' ||
    COALESCE(NEW.model, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.manufacturer, '') || ' ' ||
    COALESCE(NEW.serial_number, '') || ' ' ||
    COALESCE(NEW.area, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_parts_tsv() RETURNS TRIGGER AS $$
BEGIN
  NEW.tsv := to_tsvector('english', 
    COALESCE(NEW.part_number, '') || ' ' ||
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.vendor, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic tsvector updates
DROP TRIGGER IF EXISTS work_order_tsv_trigger ON work_orders;
CREATE TRIGGER work_order_tsv_trigger 
  BEFORE INSERT OR UPDATE ON work_orders 
  FOR EACH ROW EXECUTE FUNCTION update_work_order_tsv();

DROP TRIGGER IF EXISTS equipment_tsv_trigger ON equipment;
CREATE TRIGGER equipment_tsv_trigger 
  BEFORE INSERT OR UPDATE ON equipment 
  FOR EACH ROW EXECUTE FUNCTION update_equipment_tsv();

DROP TRIGGER IF EXISTS parts_tsv_trigger ON parts;
CREATE TRIGGER parts_tsv_trigger 
  BEFORE INSERT OR UPDATE ON parts 
  FOR EACH ROW EXECUTE FUNCTION update_parts_tsv();

-- =============================================================================
-- STEP 5: Create comprehensive indexing strategy
-- =============================================================================

-- Core indexes for multi-tenancy and performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_organization_id ON work_orders(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_organization_id ON equipment(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_organization_id ON parts(organization_id) WHERE deleted_at IS NULL;

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tsv ON work_orders USING GIN(tsv);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_tsv ON equipment USING GIN(tsv);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_tsv ON parts USING GIN(tsv);

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_org_status_priority 
  ON work_orders(organization_id, status, priority) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_org_assigned_status 
  ON work_orders(organization_id, assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_org_created_at 
  ON work_orders(organization_id, created_at DESC) WHERE deleted_at IS NULL;

-- Equipment indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_org_status 
  ON equipment(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_org_criticality 
  ON equipment(organization_id, criticality) WHERE deleted_at IS NULL;

-- Parts inventory indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_org_active 
  ON parts(organization_id, active) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_org_stock_level 
  ON parts(organization_id, stock_level) WHERE active = true AND deleted_at IS NULL;

-- Audit and activity indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_org_created_at 
  ON activity_logs(organization_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_entity 
  ON activity_logs(organization_id, entity_type, entity_id);

-- Authentication and session indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_active 
  ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email_active 
  ON profiles(email) WHERE active = true AND deleted_at IS NULL;

-- =============================================================================
-- STEP 6: Add check constraints for data integrity
-- =============================================================================

-- Work order constraints
ALTER TABLE work_orders ADD CONSTRAINT IF NOT EXISTS chk_work_orders_status 
  CHECK (status IN ('new', 'assigned', 'in_progress', 'completed', 'verified', 'closed'));
ALTER TABLE work_orders ADD CONSTRAINT IF NOT EXISTS chk_work_orders_priority 
  CHECK (priority IN ('low', 'medium', 'high', 'critical'));
ALTER TABLE work_orders ADD CONSTRAINT IF NOT EXISTS chk_work_orders_type 
  CHECK (type IN ('corrective', 'preventive', 'emergency'));

-- Equipment constraints
ALTER TABLE equipment ADD CONSTRAINT IF NOT EXISTS chk_equipment_status 
  CHECK (status IN ('active', 'inactive', 'maintenance', 'retired'));
ALTER TABLE equipment ADD CONSTRAINT IF NOT EXISTS chk_equipment_criticality 
  CHECK (criticality IN ('low', 'medium', 'high', 'critical'));

-- Profile constraints
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS chk_profiles_role 
  CHECK (role IN ('technician', 'supervisor', 'manager', 'admin', 'inventory_clerk', 'contractor', 'requester'));

-- Parts constraints
ALTER TABLE parts ADD CONSTRAINT IF NOT EXISTS chk_parts_stock_level 
  CHECK (stock_level >= 0);
ALTER TABLE parts ADD CONSTRAINT IF NOT EXISTS chk_parts_reorder_point 
  CHECK (reorder_point >= 0);

-- =============================================================================
-- STEP 7: Create updated_at trigger function for all tables
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to main tables
DO $$ 
DECLARE
    table_name TEXT;
    update_tables TEXT[] := ARRAY[
        'organizations', 'profiles', 'work_orders', 'equipment', 'parts', 
        'vendors', 'pm_templates', 'attachments', 'notifications', 
        'escalation_rules', 'tags', 'custom_fields'
    ];
BEGIN
    FOREACH table_name IN ARRAY update_tables
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I_updated_at_trigger ON %I', table_name, table_name);
        EXECUTE format('CREATE TRIGGER %I_updated_at_trigger 
                       BEFORE UPDATE ON %I 
                       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', 
                       table_name, table_name);
    END LOOP;
END $$;

-- =============================================================================
-- STEP 8: Add foreign key constraints with proper cascade rules
-- =============================================================================

-- Organization foreign keys (enforce multi-tenancy)
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS fk_profiles_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE work_orders ADD CONSTRAINT IF NOT EXISTS fk_work_orders_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE equipment ADD CONSTRAINT IF NOT EXISTS fk_equipment_organization 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Audit foreign keys (SET NULL on delete to preserve audit trail)
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS fk_profiles_created_by 
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD CONSTRAINT IF NOT EXISTS fk_profiles_updated_by 
  FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- =============================================================================
-- STEP 9: Add Row Level Security (RLS) policies for multi-tenant isolation
-- =============================================================================

-- Enable RLS on core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization-based access
CREATE POLICY IF NOT EXISTS org_isolation_policy_profiles ON profiles
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY IF NOT EXISTS org_isolation_policy_work_orders ON work_orders
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY IF NOT EXISTS org_isolation_policy_equipment ON equipment
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

CREATE POLICY IF NOT EXISTS org_isolation_policy_parts ON parts
  FOR ALL TO authenticated
  USING (organization_id = current_setting('app.current_organization_id', true)::uuid);

-- =============================================================================
-- STEP 10: Performance optimization and maintenance
-- =============================================================================

-- Update table statistics
ANALYZE organizations;
ANALYZE profiles;
ANALYZE work_orders;
ANALYZE equipment;
ANALYZE parts;
ANALYZE vendors;
ANALYZE pm_templates;
ANALYZE attachments;
ANALYZE notifications;

-- Create performance monitoring view
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public' 
  AND tablename IN ('work_orders', 'equipment', 'parts', 'profiles')
ORDER BY tablename, attname;

-- Create index usage monitoring view
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =============================================================================
-- STEP 11: Data validation and cleanup
-- =============================================================================

-- Update any existing tsvector columns
UPDATE work_orders SET tsv = to_tsvector('english', 
  COALESCE(fo_number, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(area, '') || ' ' ||
  COALESCE(asset_model, '') || ' ' ||
  COALESCE(notes, '')
) WHERE tsv IS NULL;

UPDATE equipment SET tsv = to_tsvector('english', 
  COALESCE(asset_tag, '') || ' ' ||
  COALESCE(model, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(manufacturer, '') || ' ' ||
  COALESCE(serial_number, '') || ' ' ||
  COALESCE(area, '')
) WHERE tsv IS NULL;

UPDATE parts SET tsv = to_tsvector('english', 
  COALESCE(part_number, '') || ' ' ||
  COALESCE(name, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(category, '') || ' ' ||
  COALESCE(vendor, '')
) WHERE tsv IS NULL;

-- Set default values for audit fields where NULL
UPDATE organizations SET created_at = NOW() WHERE created_at IS NULL;
UPDATE organizations SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE profiles SET created_at = NOW() WHERE created_at IS NULL;
UPDATE profiles SET updated_at = NOW() WHERE updated_at IS NULL;

-- =============================================================================
-- FINAL: Log completion
-- =============================================================================

INSERT INTO system_logs (
  action, 
  table_name, 
  old_values, 
  new_values, 
  created_at
) VALUES (
  'SCHEMA_MIGRATION_COMPLETED',
  'schema_migrations',
  '{}',
  jsonb_build_object(
    'migration', '0007_comprehensive_schema_alignment',
    'completion_time', NOW(),
    'status', 'SUCCESS'
  ),
  NOW()
);

COMMIT;
