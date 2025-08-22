/**
 * Dashboard Stats API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

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
    // Return mock dashboard statistics
    const stats = {
      totalWorkOrders: 12,
      pendingWorkOrders: 3,
      completedWorkOrders: 8,
      activeWorkOrders: 4,
      overdueWorkOrders: 1,
      totalEquipment: 15,
      activeEquipment: 13,
      equipmentOnlinePercentage: 87,
      lowStockParts: 2,
      totalParts: 45,
      timestamp: new Date().toISOString(),
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}