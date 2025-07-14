import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jthortssykpaodtbcnmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjg5OCwiZXhwIjoyMDY4MDg4ODk4fQ.vkBxHsEL764IWmdq2PLb-Htz2UvADjfbVDel0MKYON0';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database error:', error.message);
      console.log('❌ Error code:', error.code);
      console.log('❌ Error details:', error.details);
      
      if (error.message.includes('relation "organizations" does not exist')) {
        console.log('\n📋 SOLUTION: You need to run the database migrations first!');
        console.log('1. Go to: https://supabase.com/dashboard/project/jthortssykpaodtbcnmq/sql/new');
        console.log('2. Copy and paste the ENTIRE contents of: supabase/migrations/001_initial_schema.sql');
        console.log('3. Click "Run"');
        console.log('4. Then copy and paste the ENTIRE contents of: supabase/migrations/002_rls_policies.sql');
        console.log('5. Click "Run"');
        console.log('6. Run this script again: node create-users.js');
      }
      return;
    }
    
    console.log('✅ Database connection successful!');
    console.log('✅ Organizations table exists');
    console.log('Found organizations:', data?.length || 0);
    
    // Test auth creation capability
    console.log('🔐 Testing auth user creation...');
    
    // Try to create a test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@demo.com',
      password: 'password123',
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
    } else {
      console.log('✅ Auth user creation works!');
      
      // Clean up test user
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('🧹 Test user cleaned up');
    }
    
    console.log('\n🚀 Ready to create actual users! Run: node create-users.js');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();
