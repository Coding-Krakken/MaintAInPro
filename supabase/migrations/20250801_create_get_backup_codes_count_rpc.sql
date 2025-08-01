-- Migration: Create get_backup_codes_count RPC for MFA
CREATE OR REPLACE FUNCTION get_backup_codes_count(user_id uuid)
RETURNS integer AS $$
  SELECT COUNT(*) FROM backup_codes WHERE user_id = get_backup_codes_count.user_id AND used = false;
$$ LANGUAGE sql STABLE;
