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

// In-memory storage for demo purposes
let partsStorage: any[] = [
  {
    id: 'part-1',
    partNumber: 'PART-001',
    name: 'Pump Seal',
    description: 'High-pressure pump seal for Model-X1',
    category: 'mechanical',
    unitOfMeasure: 'each',
    unitCost: 45.99,
    stockLevel: 12,
    reorderPoint: 5,
    location: 'Shelf A-1-3',
    vendor: 'SealTech Inc',
    active: true,
    warehouseId: '00000000-0000-0000-0000-000000000001',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part-2',
    partNumber: 'PART-002',
    name: 'Motor Bearing',
    description: 'Ball bearing for electric motors',
    category: 'mechanical',
    unitOfMeasure: 'each',
    unitCost: 89.50,
    stockLevel: 8,
    reorderPoint: 3,
    location: 'Shelf B-2-1',
    vendor: 'BearingCorp',
    active: true,
    warehouseId: '00000000-0000-0000-0000-000000000001',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'part-3',
    partNumber: 'PART-003',
    name: 'Filter Cartridge',
    description: 'Oil filter cartridge for hydraulic systems',
    category: 'hydraulic',
    unitOfMeasure: 'each',
    unitCost: 29.99,
    stockLevel: 2,
    reorderPoint: 5,
    location: 'Shelf C-1-2',
    vendor: 'FilterMax',
    active: true,
    warehouseId: '00000000-0000-0000-0000-000000000001',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    console.log(`Retrieved ${partsStorage.length} parts`);
    return res.status(200).json(partsStorage);
    
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
    
    // Set default values and ensure proper field mapping
    const newPart = {
      id: partData.id,
      partNumber: partData.partNumber,
      name: partData.name,
      description: partData.description,
      category: partData.category || 'general',
      unitOfMeasure: partData.unitOfMeasure || 'each',
      unitCost: partData.unitCost || 0,
      stockLevel: partData.stockLevel || 0,
      reorderPoint: partData.reorderPoint || 0,
      maxStock: partData.maxStock,
      location: partData.location,
      vendor: partData.vendor,
      active: partData.active !== undefined ? partData.active : true,
      warehouseId: partData.warehouseId || '00000000-0000-0000-0000-000000000001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to storage
    partsStorage.push(newPart);
    
    console.log('Created part:', newPart.id, newPart.name);
    return res.status(201).json(newPart);
    
  } catch (error) {
    console.error('Error creating part:', error);
    return res.status(500).json({ 
      message: 'Failed to create part',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}