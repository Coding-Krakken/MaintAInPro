-- Migration: Add categories table and foreign key relationships

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add category_id to equipment and parts, migrate data, and add foreign keys
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE parts ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);

-- Optional: Migrate existing category string data to categories table and update references
-- (This step would require a script or manual SQL for real data migration)

-- 3. (Optional) Remove old category string columns if no longer needed
-- ALTER TABLE equipment DROP COLUMN IF EXISTS category;
-- ALTER TABLE parts DROP COLUMN IF EXISTS category;

-- 4. Create a profiles view for compatibility if needed
CREATE OR REPLACE VIEW profiles AS
SELECT id, organization_id, email, first_name, last_name, role, avatar_url, phone, department, employee_id, is_active, last_login, created_at, updated_at
FROM users;
