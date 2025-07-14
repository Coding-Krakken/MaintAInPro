import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jthortssykpaodtbcnmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjg5OCwiZXhwIjoyMDY4MDg4ODk4fQ.vkBxHsEL764IWmdq2PLb-Htz2UvADjfbVDel0MKYON0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up MaintAInPro database...');
  
  try {
    // First, let's check if we can connect
    const { data, error } = await supabase.from('organizations').select('count').limit(1);
    
    if (error && error.message.includes('relation "organizations" does not exist')) {
      console.log('❌ Database tables not found. You need to run the migration scripts first.');
      console.log('Please follow these steps:');
      console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
      console.log('2. Navigate to your project: jthortssykpaodtbcnmq');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the contents of supabase/migrations/001_initial_schema.sql');
      console.log('5. Run the SQL script');
      console.log('6. Then copy and paste the contents of supabase/migrations/002_rls_policies.sql');
      console.log('7. Run the RLS policies script');
      console.log('8. Come back and run this script again');
      return;
    }
    
    if (error) {
      console.error('❌ Database connection error:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful!');
    
    // Create test organization
    console.log('📋 Creating test organization...');
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
    
    console.log('✅ Organization created successfully');
    
    // Create test warehouse
    console.log('🏭 Creating test warehouse...');
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
    
    console.log('✅ Warehouse created successfully');
    
    // Create test users with different roles
    console.log('👥 Creating test users...');
    
    const testUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@demo.com',
        password: 'password123',
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        permissions: ['*'],
        department: 'IT',
        employee_id: 'EMP001'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'manager@demo.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Manager',
        role: 'admin',
        permissions: ['users:read', 'users:write', 'work_orders:read', 'work_orders:write', 'equipment:read', 'equipment:write'],
        department: 'Operations',
        employee_id: 'EMP002'
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'tech@demo.com',
        password: 'password123',
        first_name: 'Mike',
        last_name: 'Technician',
        role: 'technician',
        permissions: ['work_orders:read', 'work_orders:write', 'equipment:read', 'inventory:read'],
        department: 'Maintenance',
        employee_id: 'EMP003'
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'inventory@demo.com',
        password: 'password123',
        first_name: 'Sarah',
        last_name: 'Clerk',
        role: 'user',
        permissions: ['inventory:read', 'inventory:write', 'parts:read'],
        department: 'Inventory',
        employee_id: 'EMP004'
      }
    ];
    
    // Create auth users first, then profiles
    for (const user of testUsers) {
      try {
        console.log(`Creating auth user: ${user.email}`);
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name
          }
        });
        
        if (authError) {
          if (authError.message.includes('User already registered')) {
            console.log(`⚠️  User ${user.email} already exists in auth`);
            // Try to get the existing user
            const { data: existingUsers } = await supabase.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === user.email);
            
            if (existingUser) {
              // Create/update profile for existing user
              const { error: profileError } = await supabase
                .from('users')
                .upsert([
                  {
                    id: existingUser.id,
                    organization_id: '123e4567-e89b-12d3-a456-426614174000',
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    permissions: user.permissions,
                    department: user.department,
                    employee_id: user.employee_id,
                    is_active: true
                  }
                ]);
              
              if (profileError) {
                console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
              } else {
                console.log(`✅ Profile updated for ${user.email}`);
              }
            }
          } else {
            console.error(`❌ Error creating auth user ${user.email}:`, authError.message);
          }
          continue;
        }
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .upsert([
            {
              id: authData.user.id,
              organization_id: '123e4567-e89b-12d3-a456-426614174000',
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role,
              permissions: user.permissions,
              department: user.department,
              employee_id: user.employee_id,
              is_active: true
            }
          ]);
        
        if (profileError) {
          console.error(`❌ Error creating profile for ${user.email}:`, profileError.message);
        } else {
          console.log(`✅ User created: ${user.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Error with user ${user.email}:`, error.message);
      }
    }
    
    console.log('✅ Test users created successfully');
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n📋 Test Accounts Created:');
    console.log('┌─────────────────┬─────────────────┬──────────────┐');
    console.log('│ Email           │ Password        │ Role         │');
    console.log('├─────────────────┼─────────────────┼──────────────┤');
    console.log('│ admin@demo.com  │ password123     │ Super Admin  │');
    console.log('│ manager@demo.com│ password123     │ Admin        │');
    console.log('│ tech@demo.com   │ password123     │ Technician   │');
    console.log('│ inventory@demo.com│ password123   │ User         │');
    console.log('└─────────────────┴─────────────────┴──────────────┘');
    
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('1. Go to Supabase Dashboard > Authentication > Users');
    console.log('2. Create these users manually with the emails above');
    console.log('3. Set password as "password123" for all users');
    console.log('4. The user profiles are already created in the database');
    console.log('5. Restart your dev server and try logging in!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupDatabase();
