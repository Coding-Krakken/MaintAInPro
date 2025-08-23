/**
 * Parts API Handler for Vercel - Dynamic Route
 * Serves specific part information
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-user-id, x-warehouse-id'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ message: 'Part ID is required' });
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
    console.error('Parts API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    // Mock part data
    const mockPart = {
      id: id,
      partNumber: id.startsWith('part-')
        ? id.replace('part-', 'PART-').toUpperCase()
        : `PART-${id.toUpperCase()}`,
      name: `Part ${id}`,
      description: `Description for part ${id}`,
      category: 'General',
      manufacturer: 'Generic Mfg',
      cost: Math.round((Math.random() * 100 + 10) * 100) / 100,
      quantity: Math.floor(Math.random() * 20) + 1,
      minQuantity: 5,
      unit: 'each',
      location: `Shelf ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}-${Math.floor(Math.random() * 3) + 1}-${Math.floor(Math.random() * 5) + 1}`,
      status: Math.random() > 0.5 ? 'in-stock' : 'low-stock',
      supplier: 'Parts Supplier Inc',
      leadTime: Math.floor(Math.random() * 14) + 1,
      specifications: {
        material: 'Steel',
        dimensions: '10 x 5 x 2 cm',
        weight: '0.5 kg',
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    console.log(`Retrieved part: ${id}`);
    return res.status(200).json(mockPart);
  } catch (error) {
    console.error('Error fetching part:', error);
    return res.status(500).json({
      message: 'Failed to fetch part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    const updateData = req.body;
    updateData.id = id;
    updateData.updatedAt = new Date().toISOString();

    console.log('Updated part:', id);
    return res.status(200).json(updateData);
  } catch (error) {
    console.error('Error updating part:', error);
    return res.status(500).json({
      message: 'Failed to update part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    console.log('Deleted part:', id);
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting part:', error);
    return res.status(500).json({
      message: 'Failed to delete part',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
