# MaintAInPro CMMS Setup Guide

## 🚀 IMPORTANT: Follow These Steps in Order

Your Supabase credentials are already configured. Now you need to set up the database and create user accounts.

### Step 1: Set up Supabase Database Schema

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `jthortssykpaodtbcnmq`

2. **Navigate to SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run Initial Schema Migration:**
   - Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the schema

4. **Run RLS Policies:**
   - Copy the entire contents of `supabase/migrations/002_rls_policies.sql`
   - Paste it into a new SQL query
   - Click "Run" to set up Row Level Security

### Step 2: Create Test Users in Supabase Auth

1. **Go to Authentication > Users:**
   - In your Supabase dashboard, click "Authentication" → "Users"
   - Click "Add user" for each test account

2. **Create these test accounts (EXACTLY as shown):**

   **Super Admin:**
   - Email: `admin@demo.com`
   - Password: `password123`
   - Email Confirm: ✅ (checked)

   **Manager:**
   - Email: `manager@demo.com`
   - Password: `password123`
   - Email Confirm: ✅ (checked)

   **Technician:**
   - Email: `tech@demo.com`
   - Password: `password123`
   - Email Confirm: ✅ (checked)

   **Inventory Clerk:**
   - Email: `inventory@demo.com`
   - Password: `password123`
   - Email Confirm: ✅ (checked)

### Step 3: Run Database Setup Script

After completing Steps 1 & 2, run:

```bash
node setup-database.js
```

This will create:
- Demo organization (Demo Manufacturing Corp)
- Main warehouse
- User profiles linked to the auth accounts
- Sample permissions and roles

### Step 4: Restart the Application

Stop the current dev server (Ctrl+C) and restart:

```bash
npm run dev
```

Then visit: http://localhost:3001

### Step 5: Test Login

Try logging in with any of the test accounts:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@demo.com | password123 | Super Admin | Full Access |
| manager@demo.com | password123 | Admin | Management Access |
| tech@demo.com | password123 | Technician | Work Orders & Equipment |
| inventory@demo.com | password123 | User | Inventory Management |

## 🔧 If You Still See a White Screen

1. **Check browser console for errors (F12)**
2. **Verify environment variables are loaded** - restart dev server
3. **Ensure database migrations ran successfully**
4. **Check that auth users were created in Supabase**

## 📝 Current Status

✅ Supabase credentials configured  
❌ Database schema (needs Step 1)  
❌ Auth users (needs Step 2)  
❌ User profiles (needs Step 3)  

Follow the steps above in order to complete the setup!
