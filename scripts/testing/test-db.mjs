// Simple database connection test
import { db } from './server/db.js';

console.log('🔗 Testing database connection...');

try {
  const result = await db.execute('SELECT NOW() as current_time');
  console.log('✅ Database connection successful!');
  console.log('⏰ Server time:', result.rows[0].current_time);

  // Check tables
  const tables = await db.execute(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  console.log('📊 Tables found:', tables.rows.length);
  console.log('📋 Table names:', tables.rows.map(r => r.tablename).join(', '));
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
}
