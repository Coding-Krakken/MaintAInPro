-- Migration: Add MFA columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_methods JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS mfa_last_used TIMESTAMP WITH TIME ZONE;
