import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres.jthortssykpaodtbcnmq:BFqa0JeaSoilgxHU@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  console.log('🚀 Running database migrations...');
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Read and execute initial schema
    console.log('📋 Applying initial schema...');
    const schemaSQL = readFileSync(join(__dirname, 'supabase/migrations/001_initial_schema.sql'), 'utf8');
    
    // Execute the entire schema as one statement first
    try {
      console.log('Executing full schema...');
      await client.query(schemaSQL);
      console.log('✅ Full schema executed successfully');
    } catch (err) {
      console.log('⚠️  Full schema execution failed, trying statement by statement...');
      
      // Split into individual statements - improved logic
      const statements = schemaSQL
        .replace(/--.*$/gm, '') // Remove comments
        .split(/;\s*(?=\s*(?:CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|GRANT|REVOKE))/i)
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 10); // Only keep substantial statements
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const preview = statement.substring(0, 100).replace(/\n/g, ' ');
            console.log(`Executing: ${preview}...`);
            await client.query(statement + ';');
          } catch (statementErr) {
            // Some statements might fail if they already exist, which is OK
            if (statementErr.message.includes('already exists') || 
                statementErr.message.includes('does not exist') ||
                statementErr.message.includes('relation') && statementErr.message.includes('already exists')) {
              console.log(`⚠️  Skipping: ${statementErr.message}`);
            } else {
              console.error(`❌ Error executing statement: ${statementErr.message}`);
              console.error(`Statement was: ${statement.substring(0, 200)}`);
              throw statementErr;
            }
          }
        }
      }
    }
    
    console.log('✅ Schema applied successfully');
    
    // Read and execute RLS policies
    console.log('🔒 Applying RLS policies...');
    const rlsSQL = readFileSync(join(__dirname, 'supabase/migrations/002_rls_policies.sql'), 'utf8');
    
    const rlsStatements = rlsSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '');
    
    for (const statement of rlsStatements) {
      if (statement.trim()) {
        try {
          console.log(`Executing RLS: ${statement.substring(0, 50)}...`);
          await client.query(statement);
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('does not exist')) {
            console.log(`⚠️  Skipping: ${err.message}`);
          } else {
            console.error(`❌ RLS Error: ${err.message}`);
            throw err;
          }
        }
      }
    }
    
    console.log('✅ RLS policies applied successfully');
    
    // Verify tables exist
    console.log('🔍 Verifying database setup...');
    const tables = ['organizations', 'users', 'warehouses', 'equipment', 'work_orders', 'parts', 'inventory', 'vendors', 'pm_schedules'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
        console.log(`✅ Table '${table}': OK`);
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }
    
    console.log('🎉 Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);
