const dotenv = require('dotenv');
// Load both .env.local and .env
dotenv.config({ path: '.env.local' });
dotenv.config();

async function testNeonConnection() {
  console.log('🔍 Testing Neon database connection...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ No DATABASE_URL found');
    return;
  }
  
  console.log('📄 DATABASE_URL configured');
  
  try {
    // Using pg for connection test
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    console.log('🔌 Testing connection...');
    const result = await pool.query('SELECT 1 as test, current_timestamp as time');
    console.log('✅ Database connection successful!');
    console.log('📊 Test result:', result.rows[0]);
    
    await pool.end();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Also test drizzle setup
async function testDrizzleSetup() {
  console.log('\n🔧 Testing Drizzle ORM setup...');
  
  try {
    const { drizzle } = require('drizzle-orm/node-postgres');
    const { Pool } = require('pg');
    const schema = require('./shared/schema');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const db = drizzle(pool, { schema });
    console.log('✅ Drizzle ORM initialized successfully');
    
    await pool.end();
    return true;
  } catch (error) {
    console.error('❌ Drizzle setup failed:', error.message);
    return false;
  }
}

async function main() {
  const connectionOk = await testNeonConnection();
  if (connectionOk) {
    await testDrizzleSetup();
    console.log('\n🎉 Database setup validation complete!');
  }
}

main().catch(console.error);
