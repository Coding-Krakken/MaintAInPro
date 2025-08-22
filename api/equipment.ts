/**
 * Equipment API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllEquipment, getEquipmentById, createEquipment } from './storage';

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
  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    
    // Handle single equipment by ID
    if (req.query.id && typeof req.query.id === 'string') {
      const equipment = await getEquipmentById(req.query.id);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      return res.status(200).json(equipment);
    }
    
    // Get all equipment for warehouse
    const equipment = await getAllEquipment(warehouseId);
    console.log(`Retrieved ${equipment.length} equipment items for warehouse ${warehouseId}`);
    
    return res.status(200).json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch equipment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const { name, assetTag, description, model, area, status, criticality, ...otherFields } = req.body;

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

    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';

    // Create equipment using the storage system
    const equipmentData = {
      assetTag,
      model,
      description: name || description, // Use name if provided, fallback to description
      area: area || '',
      status: status || 'active',
      criticality: criticality || 'medium',
      warehouseId,
      organizationId: 'default-organization-id',
      createdBy: userId,
      updatedBy: userId,
      installDate: null,
      warrantyExpiry: null,
      manufacturer: null,
      serialNumber: null,
      specifications: null,
      ...otherFields
    };

    const newEquipment = await createEquipment(equipmentData);
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