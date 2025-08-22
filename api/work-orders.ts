/**
 * Work Orders API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Robust import with error handling
let storageModule: any;
try {
  storageModule = require('./storage');
  console.log('Work Orders: Storage module imported successfully');
} catch (error) {
  console.error('Work Orders: Failed to import storage module:', error);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-warehouse-id');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!storageModule) {
      return res.status(500).json({ message: 'Storage module not available' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Work Orders API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const { status } = req.query;
    
    const filters: any = {};
    if (status && typeof status === 'string') {
      filters.status = status.split(',');
    }
    
    const workOrders = await storageModule.getAllWorkOrders(warehouseId, filters);
    console.log(`Retrieved ${workOrders.length} work orders for warehouse ${warehouseId}`);
    
    return res.status(200).json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch work orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}