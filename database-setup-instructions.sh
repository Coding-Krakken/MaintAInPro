#!/bin/bash

echo "🚀 MaintAInPro Database Setup Instructions"
echo "=========================================="
echo ""
echo "Since we cannot run migrations programmatically without Supabase CLI,"
echo "please follow these manual steps to set up your database:"
echo ""
echo "1. Open your browser and go to: https://supabase.com/dashboard"
echo "2. Sign in to your Supabase account"
echo "3. Navigate to your project: jthortssykpaodtbcnmq"
echo "4. Click on 'SQL Editor' in the left sidebar"
echo ""
echo "STEP 1: Create the database schema"
echo "================================="
echo "5. Create a new query and copy the entire contents of:"
echo "   📁 supabase/migrations/001_initial_schema.sql"
echo "6. Paste it into the SQL editor and click 'RUN'"
echo ""
echo "STEP 2: Apply Row Level Security policies"
echo "========================================"
echo "7. Create another new query and copy the entire contents of:"
echo "   📁 supabase/migrations/002_rls_policies.sql"
echo "8. Paste it into the SQL editor and click 'RUN'"
echo ""
echo "STEP 3: Verify the setup"
echo "======================="
echo "9. After both scripts run successfully, come back to the terminal"
echo "10. Run: node setup-database.js"
echo ""
echo "📝 Alternative: Use Supabase CLI (if available)"
echo "=============================================="
echo "If you have Supabase CLI installed locally:"
echo "1. supabase login"
echo "2. supabase link --project-ref jthortssykpaodtbcnmq"
echo "3. supabase db push"
echo ""
echo "⚠️  Important Notes:"
echo "==================="
echo "- Make sure you're connected to the correct project"
echo "- The scripts should run without errors"
echo "- If you see 'relation already exists' errors, that's normal on re-runs"
echo "- After setup, the application will have proper user/organization relationships"
echo ""

# Also create a simple verification script
echo "Creating verification script..."

cat > verify-database.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jthortssykpaodtbcnmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjg5OCwiZXhwIjoyMDY4MDg4ODk4fQ.vkBxHsEL764IWmdq2PLb-Htz2UvADjfbVDel0MKYON0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...');
  
  const tables = [
    'organizations',
    'users', 
    'warehouses',
    'equipment',
    'work_orders',
    'parts',
    'inventory',
    'vendors',
    'pm_schedules'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': OK`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }
  
  // Check for relationships
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .limit(1);
      
    if (error) {
      console.log(`❌ Relationship 'users->organizations': ${error.message}`);
    } else {
      console.log(`✅ Relationship 'users->organizations': OK`);
    }
  } catch (err) {
    console.log(`❌ Relationship check failed: ${err.message}`);
  }
}

verifyDatabase().catch(console.error);
EOF

echo ""
echo "📋 After completing the manual setup, run:"
echo "   node verify-database.js"
echo ""
echo "🎯 This will verify that all tables and relationships are working correctly."
