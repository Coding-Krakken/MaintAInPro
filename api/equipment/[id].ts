/**
 * Equipment API Handler for Vercel - Dynamic Route
 * Serves specific equipment information
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
    const { id } = req.query;
    
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Equipment ID is required' });
    }

    switch (req.method) {
      case 'GET':
        return handleGet(req, res, id);
      case 'PATCH':
      case 'PUT':
        return handleUpdate(req, res, id);
      case 'DELETE':
        return handleDelete(req, res, id);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Equipment API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    // Mock equipment data
    const mockEquipment = {
      id: id,
      name: `Equipment ${id}`,
      assetTag: id.startsWith('equip-') ? id.replace('equip-', 'ASSET-') : `ASSET-${id}`,
      type: 'Pump',
      manufacturer: 'Industrial Corp',
      model: 'Model-X1',
      serialNumber: `SN-${id}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      location: 'Floor 1, Section A',
      status: 'operational',
      criticality: 'medium',
      installDate: '2023-01-15',
      lastMaintenance: '2024-01-15',
      nextMaintenance: '2024-07-15',
      specifications: {
        power: '10 HP',
        voltage: '480V',
        flowRate: '500 GPM'
      },
      notes: 'Equipment in good working condition',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: new Date().toISOString()
    };

    console.log(`Retrieved equipment: ${id}`);
    return res.status(200).json(mockEquipment);
    
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch equipment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    const updateData = req.body;
    updateData.id = id;
    updateData.updatedAt = new Date().toISOString();
    
    console.log('Updated equipment:', id);
    return res.status(200).json(updateData);
    
  } catch (error) {
    console.error('Error updating equipment:', error);
    return res.status(500).json({ 
      message: 'Failed to update equipment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    console.log('Deleted equipment:', id);
    return res.status(204).end();
    
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return res.status(500).json({ 
      message: 'Failed to delete equipment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}