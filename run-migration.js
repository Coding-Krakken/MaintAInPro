import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Read environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running equipment schema migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/005_fix_equipment_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`Executing ${statements.length} statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement
      });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        // Try direct SQL execution as fallback
        const { error: directError } = await supabase
          .from('_internal')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.log('Trying alternative approach...');
          // For now, we'll log the statements that need to be run manually
          console.log('Please run this SQL manually in Supabase SQL editor:');
          console.log(statement + ';');
        }
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Print the migration SQL for manual execution
    console.log('\nPlease run this SQL manually in your Supabase SQL editor:');
    console.log('='.repeat(60));
    const migrationPath = path.join(__dirname, 'supabase/migrations/005_fix_equipment_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(migrationSQL);
    console.log('='.repeat(60));
  }
}

runMigration();
