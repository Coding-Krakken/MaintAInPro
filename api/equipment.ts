/**
 * Equipment API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Mock storage for serverless deployment
const mockEquipment = [
  {
    id: '1',
    assetTag: 'EQ001',
    model: 'Conveyor Belt X1',
    description: 'Main production line conveyor',
    area: 'Production Floor A',
    status: 'active',
    criticality: 'high',
    warehouseId: 'default-warehouse-id',
    createdAt: new Date().toISOString(),
  },
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
      case 'POST':
        return handlePost(req, res);
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

async function handleGet(req: VercelRequest, res: VercelResponse) {
  // Return mock equipment data
  return res.status(200).json(mockEquipment);
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const { name, assetTag, description, model, area, status, criticality } = req.body;

    // Validate required fields
    if (!name && !description) {
      return res.status(400).json({ 
        message: 'Equipment name or description is required' 
      });
    }

    if (!assetTag) {
      return res.status(400).json({ 
        message: 'Asset tag is required' 
      });
    }

    if (!model) {
      return res.status(400).json({ 
        message: 'Model is required' 
      });
    }

    // Create new equipment
    const newEquipment = {
      id: crypto.randomUUID(),
      assetTag: assetTag,
      model: model,
      description: name || description, // Use name if provided, fallback to description
      area: area || '',
      status: status || 'active',
      criticality: criticality || 'medium',
      warehouseId: req.headers['x-warehouse-id'] || 'default-warehouse-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real implementation, this would save to database
    // For now, we'll just return the created equipment
    console.log('Equipment created successfully:', newEquipment);
    
    return res.status(201).json(newEquipment);
  } catch (error) {
    console.error('Error creating equipment:', error);
    return res.status(500).json({ 
      message: 'Failed to create equipment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}