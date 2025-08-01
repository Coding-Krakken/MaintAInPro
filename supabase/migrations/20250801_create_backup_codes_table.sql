-- Migration: Create backup_codes table for MFA
CREATE TABLE IF NOT EXISTS public.backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code text NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON public.backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_used ON public.backup_codes(used);
