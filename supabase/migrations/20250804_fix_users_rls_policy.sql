-- Fix RLS policy for users table to ensure users can view users in their own organization using JWT claims
-- This migration can be run in the Supabase SQL editor or CLI

-- Remove the old policy if it exists
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;

-- Create a new policy that allows users to view users in their own organization
CREATE POLICY "Users can view users in their organization" ON users
  FOR SELECT USING (
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

-- Optionally, allow users to view their own user row (uncomment if needed)
-- OR id = auth.uid()
