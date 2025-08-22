/**
 * Notifications API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    userId: 'default-user-id',
    warehouseId: 'default-warehouse-id',
    type: 'work_order',
    title: 'New Work Order Assigned',
    message: 'Work order WO-001 has been assigned to you',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'default-user-id', 
    warehouseId: 'default-warehouse-id',
    type: 'equipment',
    title: 'Equipment Maintenance Due',
    message: 'Conveyor belt EQ001 is due for maintenance',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  }
];

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
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  // Return mock notifications for the user
  const userId = req.headers['x-user-id'] || 'default-user-id';
  const userNotifications = mockNotifications.filter(n => n.userId === userId);
  
  return res.status(200).json(userNotifications);
}