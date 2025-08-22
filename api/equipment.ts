/**
 * Equipment API Serverless Handler for Vercel
 * Fixed import issue and enhanced error handling
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Log startup information
console.log('Equipment API module loading...');
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Platform:', process.platform);

// Import storage functions directly
import * as storageModule from './storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enhanced logging for debugging
  console.log(`Equipment API called: ${req.method} ${req.url}`);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-warehouse-id');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return res.status(200).end();
  }

  try {
    console.log(`Processing ${req.method} request`);
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({ 
      message: 'Failed to process equipment request',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    
    // Handle single equipment by ID
    if (req.query.id && typeof req.query.id === 'string') {
      const equipment = await storageModule.getEquipmentById(req.query.id);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipment not found' });
      }
      return res.status(200).json(equipment);
    }
    
    // Get all equipment for warehouse
    const equipment = await storageModule.getAllEquipment(warehouseId);
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
  console.log('=== EQUIPMENT CREATION START ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { name, assetTag, description, model, area, status, criticality, ...otherFields } = req.body;

    console.log('Extracted fields:', { name, assetTag, description, model, area, status, criticality });

    // Validate required fields
    if (!name && !description) {
      console.log('Validation failed: missing name/description');
      return res.status(400).json({ 
        message: 'Equipment name or description is required' 
      });
    }

    if (!assetTag) {
      console.log('Validation failed: missing assetTag');
      return res.status(400).json({ 
        message: 'Asset tag is required' 
      });
    }

    if (!model) {
      console.log('Validation failed: missing model');
      return res.status(400).json({ 
        message: 'Model is required' 
      });
    }

    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';

    console.log('Using warehouseId:', warehouseId, 'userId:', userId);

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

    console.log('Equipment data to create:', JSON.stringify(equipmentData, null, 2));
    console.log('About to call createEquipment function...');
    
    const newEquipment = await storageModule.createEquipment(equipmentData);
    console.log('Equipment created successfully:', JSON.stringify(newEquipment, null, 2));
    console.log('=== EQUIPMENT CREATION SUCCESS ===');
    
    return res.status(201).json(newEquipment);
  } catch (error) {
    console.error('=== EQUIPMENT CREATION ERROR ===');
    console.error('Error in handlePost:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return res.status(500).json({ 
      message: 'Failed to create equipment',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}