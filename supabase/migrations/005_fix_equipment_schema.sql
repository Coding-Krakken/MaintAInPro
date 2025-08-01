-- Fix equipment table schema to match TypeScript types
-- This migration updates the equipment table to match the expected interface

-- Add missing columns
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'good';

-- Rename columns to match TypeScript interface
ALTER TABLE equipment RENAME COLUMN purchase_price TO purchase_cost;

-- Update location to be TEXT instead of JSONB for simplicity (based on form usage)
ALTER TABLE equipment ALTER COLUMN location TYPE TEXT;

-- Add missing columns that are expected by the interface
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_notes TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Remove the code column requirement for now (it's required in schema but not used in forms)
ALTER TABLE equipment ALTER COLUMN code DROP NOT NULL;

-- Update equipment status values to match enum
UPDATE equipment SET status = 'operational' WHERE status = 'active';
UPDATE equipment SET status = 'out_of_service' WHERE status = 'inactive';

-- Add check constraints for status and condition
ALTER TABLE equipment ADD CONSTRAINT check_equipment_status 
  CHECK (status IN ('operational', 'maintenance', 'out_of_service', 'retired'));

ALTER TABLE equipment ADD CONSTRAINT check_equipment_condition 
  CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'critical'));
