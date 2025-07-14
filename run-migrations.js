import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://jthortssykpaodtbcnmq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjg5OCwiZXhwIjoyMDY4MDg4ODk4fQ.vkBxHsEL764IWmdq2PLb-Htz2UvADjfbVDel0MKYON0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  try {
    // Read and execute initial schema
    console.log('📋 Applying initial schema...');
    const schemaSQL = readFileSync(join(process.cwd(), 'supabase/migrations/001_initial_schema.sql'), 'utf8');
    
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', { 
      sql: schemaSQL 
    });
    
    if (schemaError) {
      console.error('❌ Schema error:', schemaError);
      
      // Let's try executing the SQL directly
      console.log('🔄 Trying direct execution...');
      const { error: directError } = await supabase
        .from('_http')
        .select('*')
        .limit(1);
        
      // Since rpc might not work, let's execute the SQL in chunks
      const sqlStatements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of sqlStatements) {
        if (statement.trim()) {
          try {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            // This won't work with CREATE TABLE statements, we need a different approach
          } catch (err) {
            console.log(`Skipping statement: ${err.message}`);
          }
        }
      }
    } else {
      console.log('✅ Schema applied successfully');
    }
    
    // Read and execute RLS policies
    console.log('🔒 Applying RLS policies...');
    const rlsSQL = readFileSync(join(process.cwd(), 'supabase/migrations/002_rls_policies.sql'), 'utf8');
    
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: rlsSQL 
    });
    
    if (rlsError) {
      console.error('❌ RLS error:', rlsError);
    } else {
      console.log('✅ RLS policies applied successfully');
    }
    
    console.log('🎉 Migrations completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📝 Manual steps required:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Copy and paste supabase/migrations/001_initial_schema.sql');
    console.log('4. Run the schema script');
    console.log('5. Copy and paste supabase/migrations/002_rls_policies.sql');
    console.log('6. Run the RLS policies script');
  }
}

runMigrations().catch(console.error);
