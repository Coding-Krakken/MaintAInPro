/**
 * Parts API Handler for Vercel
 * Handles parts/inventory management
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

  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Parts API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    // Mock parts data
    const mockParts = [
      {
        id: 'part-1',
        partNumber: 'PART-001',
        name: 'Pump Seal',
        description: 'High-pressure pump seal for Model-X1',
        category: 'Seals & Gaskets',
        manufacturer: 'SealTech Inc',
        cost: 45.99,
        quantity: 12,
        minQuantity: 5,
        unit: 'each',
        location: 'Shelf A-1-3',
        status: 'in-stock',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'part-2',
        partNumber: 'PART-002',
        name: 'Motor Bearing',
        description: 'Ball bearing for electric motors',
        category: 'Bearings',
        manufacturer: 'BearingCorp',
        cost: 89.50,
        quantity: 8,
        minQuantity: 3,
        unit: 'each',
        location: 'Shelf B-2-1',
        status: 'in-stock',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'part-3',
        partNumber: 'PART-003',
        name: 'Filter Cartridge',
        description: 'Oil filter cartridge for hydraulic systems',
        category: 'Filters',
        manufacturer: 'FilterMax',
        cost: 29.99,
        quantity: 2,
        minQuantity: 5,
        unit: 'each',
        location: 'Shelf C-1-2',
        status: 'low-stock',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: new Date().toISOString()
      }
    ];

    console.log(`Retrieved ${mockParts.length} parts`);
    return res.status(200).json(mockParts);
    
  } catch (error) {
    console.error('Error fetching parts:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch parts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const partData = req.body;
    
    // Generate ID if not provided
    if (!partData.id) {
      partData.id = `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set default values
    partData.createdAt = partData.createdAt || new Date().toISOString();
    partData.updatedAt = new Date().toISOString();
    partData.status = partData.status || (partData.quantity > partData.minQuantity ? 'in-stock' : 'low-stock');
    
    console.log('Created part:', partData.id);
    return res.status(201).json(partData);
    
  } catch (error) {
    console.error('Error creating part:', error);
    return res.status(500).json({ 
      message: 'Failed to create part',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}