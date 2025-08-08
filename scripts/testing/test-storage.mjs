#!/usr/bin/env node

// Test script for storage initialization
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('🚀 Testing Storage Initialization...');
console.log('📊 Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? '***CONNECTION_CONFIGURED***' : 'NOT_SET'
});

// Set production environment for testing
process.env.NODE_ENV = 'production';

try {
  console.log('💾 Importing DatabaseStorage...');
  const { DatabaseStorage } = await import('./server/dbStorage.js');
  
  console.log('🔧 Creating DatabaseStorage instance...');
  const storage = new DatabaseStorage();
  
  console.log('🏗️ Initializing database data...');
  await storage.initializeData();
  
  console.log('🧪 Testing basic operations...');
  const warehouses = await storage.getWarehouses();
  console.log(`✅ Warehouses found: ${warehouses.length}`);
  
  const profiles = await storage.getProfiles();
  console.log(`✅ Profiles found: ${profiles.length}`);
  
  const equipment = await storage.getEquipment(warehouses[0]?.id || 'default');
  console.log(`✅ Equipment found: ${equipment.length}`);
  
  console.log('');
  console.log('🎯 Phase 1 Migration Test: SUCCESSFUL ✅');
  console.log('📊 DatabaseStorage is operational and ready for production');
  
} catch (error) {
  console.error('❌ Phase 1 Migration Test: FAILED');
  console.error('💥 Error details:', error.message);
  console.error('📋 Stack trace:', error.stack);
  process.exit(1);
}
