/**
 * Test Storage API - Debug endpoint to verify storage functionality
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Robust import with error handling
let storageModule: any;
try {
  storageModule = require('./storage');
  console.log('Test Storage: Storage module imported successfully');
} catch (error) {
  console.error('Test Storage: Failed to import storage module:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('=== STORAGE TEST START ===');

    if (!storageModule) {
      return res.status(500).json({
        message: 'Storage module not available',
        error: 'Failed to import storage module',
      });
    }

    if (req.method === 'GET') {
      // Test reading equipment
      const equipment = await storageModule.getAllEquipment('test-warehouse');
      console.log('Test: Retrieved equipment count:', equipment.length);

      return res.status(200).json({
        message: 'Storage read test successful',
        equipmentCount: equipment.length,
        equipment: equipment.slice(0, 2), // Return first 2 for testing
      });
    }

    if (req.method === 'POST') {
      // Test creating equipment
      const testEquipment = {
        assetTag: `TEST-${Date.now()}`,
        model: 'Test Model',
        description: 'Test Equipment for Storage Verification',
        area: 'Test Area',
        status: 'active',
        criticality: 'medium',
        warehouseId: 'test-warehouse',
        organizationId: 'test-org',
        createdBy: 'test-user',
        updatedBy: 'test-user',
      };

      console.log('Test: Creating equipment with data:', testEquipment);
      const created = await storageModule.createEquipment(testEquipment);
      console.log('Test: Equipment created with ID:', created.id);

      return res.status(201).json({
        message: 'Storage write test successful',
        createdEquipment: created,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('=== STORAGE TEST ERROR ===');
    console.error('Storage test error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    return res.status(500).json({
      message: 'Storage test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
