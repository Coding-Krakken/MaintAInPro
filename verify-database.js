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
