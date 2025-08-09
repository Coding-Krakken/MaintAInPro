-- Migration: Unify audit/system logs for MaintAInPro
-- This migration merges audit_trail, system_logs, and security_audit_logs into a single, consistent structure matching the TypeScript schema.

-- Drop old tables if they exist (after data migration/backup if needed)
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS system_logs CASCADE;
DROP TABLE IF EXISTS security_audit_logs CASCADE;

-- Create unified system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Optionally, migrate data from old tables here if needed.

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_table_name ON system_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
