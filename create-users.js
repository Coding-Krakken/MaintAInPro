import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jthortssykpaodtbcnmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjg5OCwiZXhwIjoyMDY4MDg4ODk4fQ.vkBxHsEL764IWmdq2PLb-Htz2UvADjfbVDel0MKYON0';

// Create Supabase client with service role (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAuthUsersAndProfiles() {
  console.log('🚀 Creating authentication users and profiles...');
  
  const testUsers = [
    {
      email: 'admin@demo.com',
      password: 'password123',
      profile: {
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        permissions: ['*'],
        department: 'IT',
        employee_id: 'EMP001'
      }
    },
    {
      email: 'manager@demo.com',
      password: 'password123',
      profile: {
        first_name: 'John',
        last_name: 'Manager',
        role: 'admin',
        permissions: ['users:read', 'users:write', 'work_orders:read', 'work_orders:write', 'equipment:read', 'equipment:write'],
        department: 'Operations',
        employee_id: 'EMP002'
      }
    },
    {
      email: 'tech@demo.com',
      password: 'password123',
      profile: {
        first_name: 'Mike',
        last_name: 'Technician',
        role: 'technician',
        permissions: ['work_orders:read', 'work_orders:write', 'equipment:read', 'inventory:read'],
        department: 'Maintenance',
        employee_id: 'EMP003'
      }
    },
    {
      email: 'inventory@demo.com',
      password: 'password123',
      profile: {
        first_name: 'Sarah',
        last_name: 'Clerk',
        role: 'user',
        permissions: ['inventory:read', 'inventory:write', 'parts:read'],
        department: 'Inventory',
        employee_id: 'EMP004'
      }
    }
  ];

  try {
    // First, check if tables exist
    console.log('🔍 Checking database connection...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.message.includes('relation "organizations" does not exist')) {
      console.log('❌ Database tables not found!');
      console.log('Please run the SQL migrations first:');
      console.log('1. Go to https://supabase.com/dashboard/project/jthortssykpaodtbcnmq/sql/new');
      console.log('2. Copy and paste the contents of supabase/migrations/001_initial_schema.sql');
      console.log('3. Click "Run"');
      console.log('4. Then copy and paste the contents of supabase/migrations/002_rls_policies.sql');
      console.log('5. Click "Run"');
      console.log('6. Run this script again');
      return;
    }

    // Create organization first
    console.log('🏢 Creating demo organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .upsert([
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Demo Manufacturing Corp',
          slug: 'demo-manufacturing',
          settings: {
            timezone: 'America/New_York',
            dateFormat: 'MM/dd/yyyy',
            currency: 'USD',
            language: 'en'
          },
          subscription_plan: 'enterprise',
          subscription_status: 'active'
        }
      ])
      .select();
    
    if (orgError) {
      console.error('❌ Error creating organization:', orgError.message);
      return;
    }
    console.log('✅ Organization created');

    // Create warehouse
    console.log('🏭 Creating demo warehouse...');
    const { data: warehouseData, error: warehouseError } = await supabase
      .from('warehouses')
      .upsert([
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          organization_id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Main Warehouse',
          code: 'WH001',
          description: 'Primary manufacturing warehouse',
          address: {
            street: '123 Industrial Blvd',
            city: 'Manufacturing City',
            state: 'NY',
            zipCode: '12345',
            country: 'USA'
          },
          is_active: true
        }
      ])
      .select();
    
    if (warehouseError) {
      console.error('❌ Error creating warehouse:', warehouseError.message);
      return;
    }
    console.log('✅ Warehouse created');

    // Create auth users and profiles
    for (const user of testUsers) {
      console.log(`👤 Creating user: ${user.email}...`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Error creating auth user ${user.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Auth user created: ${user.email}`);

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .upsert([
          {
            id: authData.user.id,
            organization_id: '123e4567-e89b-12d3-a456-426614174000',
            email: user.email,
            ...user.profile,
            is_active: true
          }
        ])
        .select();

      if (profileError) {
        console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Profile created for: ${user.email}`);
      }
    }

    console.log('\n🎉 Setup complete!');
    console.log('\n📋 Test Accounts Created:');
    console.log('┌─────────────────────┬─────────────┬──────────────┐');
    console.log('│ Email               │ Password    │ Role         │');
    console.log('├─────────────────────┼─────────────┼──────────────┤');
    console.log('│ admin@demo.com      │ password123 │ Super Admin  │');
    console.log('│ manager@demo.com    │ password123 │ Admin        │');
    console.log('│ tech@demo.com       │ password123 │ Technician   │');
    console.log('│ inventory@demo.com  │ password123 │ User         │');
    console.log('└─────────────────────┴─────────────┴──────────────┘');
    
    console.log('\n🚀 Ready to test!');
    console.log('1. Go to http://localhost:3000');
    console.log('2. Try logging in with any of the accounts above');
    console.log('3. All users are confirmed and ready to use');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
  }
}

createAuthUsersAndProfiles();
