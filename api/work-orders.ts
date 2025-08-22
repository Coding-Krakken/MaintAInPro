/**
 * Work Orders API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock work orders data
const mockWorkOrders = [
  {
    id: '1',
    foNumber: 'WO-001',
    type: 'corrective',
    description: 'Repair conveyor belt motor',
    status: 'new',
    priority: 'high',
    equipmentId: '1',
    warehouseId: 'default-warehouse-id',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2', 
    foNumber: 'WO-002',
    type: 'preventive',
    description: 'Monthly maintenance check',
    status: 'in_progress',
    priority: 'medium',
    equipmentId: '1',
    warehouseId: 'default-warehouse-id',
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
    console.error('Work Orders API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  const { status } = req.query;
  
  let filteredWorkOrders = mockWorkOrders;
  
  // Filter by status if provided
  if (status && typeof status === 'string') {
    const statusFilters = status.split(',');
    filteredWorkOrders = mockWorkOrders.filter(wo => 
      statusFilters.includes(wo.status)
    );
  }
  
  return res.status(200).json(filteredWorkOrders);
}