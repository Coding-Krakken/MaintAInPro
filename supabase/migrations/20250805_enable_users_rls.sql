-- Migration: Ensure users table and columns exist, and enable RLS with permissive policies

-- 1. Create users table if it does not exist (adjust columns as needed)
create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  first_name text,
  last_name text,
  role text,
  organization_id uuid,
  avatar_url text,
  is_active boolean default true
);

-- 2. Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- 3. Policy: Allow users to read their own profile
create policy if not exists "Allow users to read their own profile"
  on public.users for select
  using (auth.uid() = id);

-- 4. Policy: Allow users to update their own profile
create policy if not exists "Allow users to update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- 5. Policy: Allow users to insert their own profile (optional, for sign-up flows)
create policy if not exists "Allow users to insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- 6. Expose all columns to the API (if using PostgREST)
-- (Supabase exposes all columns by default, but you can restrict as needed)
