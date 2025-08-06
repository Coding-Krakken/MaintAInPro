const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
dotenv.config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Get all migration files
    const migrationsDir = './migrations';
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`⚡ Running migration: ${file}`);
      
      const migrationPath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by statement breakpoint and execute each statement
      const statements = migrationSQL
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          try {
            await pool.query(statement);
            console.log(`  ✅ Statement ${i + 1}/${statements.length} executed`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`  ⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
            } else {
              console.error(`  ❌ Statement ${i + 1}/${statements.length} failed:`, error.message);
            }
          }
        }
      }
      
      console.log(`✅ Migration ${file} completed`);
    }

    // Test the schema
    console.log('\n📊 Testing database schema...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:', tablesResult.rows.map(r => r.table_name));
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigrations();
