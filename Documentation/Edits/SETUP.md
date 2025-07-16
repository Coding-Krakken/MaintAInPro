# MaintAInPro CMMS - Supabase Setup Guide

## Test Accounts and Credentials

After setting up Supabase, you'll have these test accounts to work with:

### 1. Super Admin

- **Email:** `superadmin@acme.com`
- **Password:** `SuperAdmin123!`
- **Role:** Super Admin
- **Access:** Full system access, all modules

### 2. Organization Admin

- **Email:** `admin@acme.com`
- **Password:** `OrgAdmin123!`
- **Role:** Organization Admin
- **Access:** All modules except system settings

### 3. Warehouse Manager

- **Email:** `manager@acme.com`
- **Password:** `Manager123!`
- **Role:** Warehouse Manager
- **Access:** Work orders, equipment, inventory, reports

### 4. Maintenance Technician

- **Email:** `technician@acme.com`
- **Password:** `Tech123!`
- **Role:** Technician
- **Access:** Work orders, equipment, limited inventory

### 5. Inventory Manager

- **Email:** `inventory@acme.com`
- **Password:** `Inventory123!`
- **Role:** Inventory Manager
- **Access:** Inventory management, vendors, reports

### 6. Regular User

- **Email:** `user@acme.com`
- **Password:** `User123!`
- **Role:** User/Viewer
- **Access:** Read-only access to most modules

## Setup Instructions

### Step 1: Get Your Supabase Keys

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to Settings > API
3. Copy your "Project URL" and "anon public" key
4. Your Project URL should be: `https://jthortssykpaodtbcnmq.supabase.co`

### Step 2: Update Environment Variables

Edit your `.env.local` file and replace `your-anon-key-here` with your actual anon key:

```bash
VITE_SUPABASE_URL=https://jthortssykpaodtbcnmq.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Step 3: Set Up Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the migrations in this order:
   - First: Run `supabase/migrations/001_initial_schema.sql`
   - Second: Run `supabase/migrations/002_rls_policies.sql`
   - Third: Run `database-setup.sql` (for test data)

### Step 4: Create Authentication Users

In your Supabase dashboard, go to Authentication > Users and create these users:

1. **superadmin@acme.com** - Password: `SuperAdmin123!`
2. **admin@acme.com** - Password: `OrgAdmin123!`
3. **manager@acme.com** - Password: `Manager123!`
4. **technician@acme.com** - Password: `Tech123!`
5. **inventory@acme.com** - Password: `Inventory123!`
6. **user@acme.com** - Password: `User123!`

⚠️ **Important:** After creating each user in Supabase Auth, the user profiles will be automatically
created when they first sign in due to our database triggers.

### Step 5: Test the Application

1. Restart your development server: `npm run dev`
2. Open http://localhost:3001
3. Try logging in with any of the test accounts above
4. Explore different modules based on user permissions

## Sample Data Included

The setup script creates:

- 1 Organization: "ACME Manufacturing Corp"
- 1 Warehouse: "Main Warehouse"
- 6 Users with different roles
- 3 Equipment items (Production Line, HVAC, Forklift)
- 3 Parts with inventory
- 3 Work Orders (pending, in progress, completed)
- 1 Vendor
- 2 PM Schedules

## Troubleshooting

### If you get authentication errors:

1. Check that your Supabase URL and anon key are correct
2. Ensure RLS policies are properly set up
3. Verify that users exist in Supabase Auth

### If you see a blank page:

1. Check browser console for JavaScript errors
2. Ensure environment variables are loaded (restart dev server)
3. Verify that the database tables exist

### If you can't see data:

1. Check that RLS policies allow your user to access data
2. Ensure the user profile exists in the users table
3. Verify the organization_id matches in all tables

## Next Steps

After setup:

1. Explore the dashboard with different user roles
2. Create new work orders and equipment
3. Test the inventory management features
4. Try the QR code scanning (placeholder for now)
5. Customize the application for your specific needs

## Production Deployment

For production:

1. Set up proper environment variables
2. Configure your own Supabase project
3. Set up proper email templates in Supabase
4. Configure storage buckets for file uploads
5. Set up monitoring and backups
