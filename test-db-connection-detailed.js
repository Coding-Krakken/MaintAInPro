require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('📄 DATABASE_URL present:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ No DATABASE_URL found in environment');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('📊 Database version:', result.rows[0].version.split(' ')[1]);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:', tablesResult.rows.map(r => r.table_name));
    
    client.release();
    await pool.end();
    
    console.log('🎉 Database connection test completed successfully');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    await pool.end();
  }
}

testConnection();
