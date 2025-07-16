-- MFA Database Schema and Functions

-- Add MFA fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_methods TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_last_used TIMESTAMP WITH TIME ZONE;

-- Create backup codes table
CREATE TABLE IF NOT EXISTS user_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, code_hash)
);

-- Create indexes for backup codes
CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON user_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_unused ON user_backup_codes(user_id, used_at) WHERE used_at IS NULL;

-- Function to generate TOTP secret
CREATE OR REPLACE FUNCTION generate_totp_secret(user_id UUID)
RETURNS TABLE(secret TEXT) AS $$
BEGIN
    -- Generate a random 32-character base32 secret
    RETURN QUERY SELECT encode(gen_random_bytes(20), 'base32');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify TOTP token
CREATE OR REPLACE FUNCTION verify_totp(user_id UUID, token TEXT, secret TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_time BIGINT;
    time_step BIGINT;
    computed_token TEXT;
    window_size INTEGER := 1; -- Allow 1 time step before/after
    i INTEGER;
BEGIN
    -- Get current Unix timestamp and convert to 30-second steps
    current_time := EXTRACT(EPOCH FROM NOW())::BIGINT;
    time_step := current_time / 30;
    
    -- Check current time step and adjacent windows
    FOR i IN -window_size..window_size LOOP
        computed_token := generate_totp_token(secret, time_step + i);
        IF computed_token = token THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate TOTP token (helper function)
CREATE OR REPLACE FUNCTION generate_totp_token(secret TEXT, time_step BIGINT)
RETURNS TEXT AS $$
DECLARE
    decoded_secret BYTEA;
    time_bytes BYTEA;
    hmac_result BYTEA;
    offset INTEGER;
    binary_code BIGINT;
    token INTEGER;
BEGIN
    -- Decode base32 secret
    decoded_secret := decode(secret, 'base32');
    
    -- Convert time step to 8-byte big-endian format
    time_bytes := int8send(time_step);
    
    -- Generate HMAC-SHA1
    hmac_result := hmac(time_bytes, decoded_secret, 'sha1');
    
    -- Dynamic truncation
    offset := (get_byte(hmac_result, 19) & 15);
    binary_code := (
        (get_byte(hmac_result, offset) & 127) << 24 |
        (get_byte(hmac_result, offset + 1) & 255) << 16 |
        (get_byte(hmac_result, offset + 2) & 255) << 8 |
        (get_byte(hmac_result, offset + 3) & 255)
    );
    
    -- Generate 6-digit token
    token := binary_code % 1000000;
    
    -- Return with leading zeros
    RETURN LPAD(token::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[];
    i INTEGER;
    code TEXT;
BEGIN
    codes := ARRAY[]::TEXT[];
    
    -- Clear existing backup codes
    DELETE FROM user_backup_codes WHERE user_id = $1;
    
    -- Generate 10 backup codes
    FOR i IN 1..10 LOOP
        -- Generate 8-character alphanumeric code
        code := array_to_string(
            ARRAY(
                SELECT substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 
                    (random() * 35 + 1)::INTEGER, 1)
                FROM generate_series(1, 8)
            ), 
            ''
        );
        
        -- Store hashed version
        INSERT INTO user_backup_codes (user_id, code_hash)
        VALUES ($1, crypt(code, gen_salt('bf')));
        
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to regenerate backup codes
CREATE OR REPLACE FUNCTION regenerate_backup_codes(user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN generate_backup_codes($1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify backup code
CREATE OR REPLACE FUNCTION verify_backup_code(user_id UUID, code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    backup_code_record RECORD;
BEGIN
    -- Find unused backup code
    SELECT * INTO backup_code_record
    FROM user_backup_codes
    WHERE user_id = $1 
      AND used_at IS NULL 
      AND code_hash = crypt($2, code_hash);
    
    IF FOUND THEN
        -- Mark code as used
        UPDATE user_backup_codes 
        SET used_at = NOW() 
        WHERE id = backup_code_record.id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get backup codes count
CREATE OR REPLACE FUNCTION get_backup_codes_count(user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM user_backup_codes
        WHERE user_id = $1 AND used_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear backup codes
CREATE OR REPLACE FUNCTION clear_backup_codes(user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM user_backup_codes WHERE user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on backup codes table
ALTER TABLE user_backup_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for backup codes
CREATE POLICY "Users can view their own backup codes" ON user_backup_codes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backup codes" ON user_backup_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup codes" ON user_backup_codes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup codes" ON user_backup_codes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_backup_codes TO authenticated;
GRANT EXECUTE ON FUNCTION generate_totp_secret(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_totp(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_backup_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_backup_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_backup_code(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_backup_codes_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION clear_backup_codes(UUID) TO authenticated;
