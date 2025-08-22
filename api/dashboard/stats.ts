/**
 * Dashboard Stats API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Import storage functions directly
import * as storageModule from '../storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-warehouse-id');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const stats = await storageModule.getDashboardStats(warehouseId);
    console.log(`Retrieved dashboard stats for warehouse ${warehouseId}`);
    
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}