-- Migration: Align schema with DatabaseImplementation.md specification
-- This migration implements the core principles from the roadmap:
-- 1. Multi-tenancy with organization_id (instead of warehouse_id)
-- 2. Complete audit fields (created_by, updated_by, deleted_at)
-- 3. Full-text search support (tsvector columns)
-- 4. Strategic indexes for performance
-- 5. Soft delete support

-- =============================================================================
-- STEP 1: Add missing audit and multi-tenancy columns
-- =============================================================================

-- Add organizations table (core multi-tenant entity)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'basic',
  max_users INTEGER DEFAULT 10,
  max_assets INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL,
  created_by UUID,
  updated_by UUID
);

-- Add comprehensive audit fields to all main tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tsv TSVECTOR; -- Full-text search

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS tsv TSVECTOR; -- Full-text search

ALTER TABLE parts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- =============================================================================
-- STEP 2: Add strategic indexes for performance (matching roadmap)
-- =============================================================================

-- Multi-tenancy indexes (organization_id on all core tables)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_org_id ON profiles(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_org_id ON work_orders(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_org_id ON equipment(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_org_id ON parts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_org_id ON vendors(organization_id) WHERE deleted_at IS NULL;

-- Full-text search indexes (GIN indexes for tsvector)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tsv ON work_orders USING GIN(tsv);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_tsv ON equipment USING GIN(tsv);

-- Status and priority indexes for filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_status ON work_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_priority ON work_orders(priority) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_status ON equipment(status) WHERE deleted_at IS NULL;

-- Audit and timestamp indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_updated_at ON work_orders(updated_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_org_status ON work_orders(organization_id, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_org_assigned ON work_orders(organization_id, assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_equipment_org_status ON equipment(organization_id, status) WHERE deleted_at IS NULL;

-- =============================================================================
-- STEP 3: Add foreign key constraints for referential integrity
-- =============================================================================

-- Organization foreign keys (after data migration would be complete)
-- Note: These will be added after data migration to avoid constraint violations
-- ALTER TABLE profiles ADD CONSTRAINT fk_profiles_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
-- ALTER TABLE work_orders ADD CONSTRAINT fk_work_orders_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
-- ALTER TABLE equipment ADD CONSTRAINT fk_equipment_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
-- ALTER TABLE parts ADD CONSTRAINT fk_parts_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
-- ALTER TABLE vendors ADD CONSTRAINT fk_vendors_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);

-- Audit trail foreign keys
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_created_by FOREIGN KEY (created_by) REFERENCES profiles(id);
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_updated_by FOREIGN KEY (updated_by) REFERENCES profiles(id);

-- =============================================================================
-- STEP 4: Add triggers for automatic full-text search updates
-- =============================================================================

-- Function to update tsvector columns automatically
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

-- Create triggers for automatic tsvector updates
DROP TRIGGER IF EXISTS work_orders_tsv_update ON work_orders;
CREATE TRIGGER work_orders_tsv_update 
  BEFORE INSERT OR UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_work_order_tsv();

DROP TRIGGER IF EXISTS equipment_tsv_update ON equipment;
CREATE TRIGGER equipment_tsv_update 
  BEFORE INSERT OR UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_equipment_tsv();

-- =============================================================================
-- STEP 5: Add updated_at trigger for all tables
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all main tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: Create activity_logs table for comprehensive audit trail
-- =============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID,
  session_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  correlation_id TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for activity_logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_org_id ON activity_logs(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- =============================================================================
-- STEP 7: Add entity tags system for extensibility
-- =============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(organization_id, name)
);

CREATE TABLE IF NOT EXISTS entity_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  UNIQUE(tag_id, entity_type, entity_id)
);

-- Indexes for tagging system
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_org_id ON tags(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_tags_org_id ON entity_tags(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_entity_tags_tag_id ON entity_tags(tag_id);

-- =============================================================================
-- STEP 8: Add custom fields system for extensibility
-- =============================================================================

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect')),
  field_options JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(organization_id, entity_type, field_name)
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(custom_field_id, entity_id)
);

-- Indexes for custom fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_custom_fields_org_entity ON custom_fields(organization_id, entity_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_custom_field_values_org_id ON custom_field_values(organization_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_custom_field_values_entity ON custom_field_values(entity_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_custom_field_values_field ON custom_field_values(custom_field_id);

-- =============================================================================
-- MIGRATION NOTES AND ROLLBACK SUPPORT
-- =============================================================================

-- Insert migration record for tracking
INSERT INTO schema_migrations (version, applied_at, rollback_sql) VALUES (
  '0006_align_with_database_implementation',
  NOW(),
  '-- Rollback script would drop added columns and tables (implement if needed)'
) ON CONFLICT (version) DO NOTHING;

-- Performance monitoring query for post-migration validation
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Multi-tenant organizations for CMMS isolation';
COMMENT ON TABLE activity_logs IS 'Comprehensive audit trail for all sensitive operations';
COMMENT ON TABLE tags IS 'Flexible tagging system for all entities';
COMMENT ON TABLE entity_tags IS 'Many-to-many relationship between tags and entities';
COMMENT ON TABLE custom_fields IS 'Dynamic custom field definitions per organization';
COMMENT ON TABLE custom_field_values IS 'Values for custom fields on entities';

COMMENT ON COLUMN work_orders.tsv IS 'Full-text search vector for work order content';
COMMENT ON COLUMN equipment.tsv IS 'Full-text search vector for equipment content';
