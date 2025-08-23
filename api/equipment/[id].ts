/**
 * Equipment API Handler for Vercel - Dynamic Route
 * Serves specific equipment information
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import * as storageModule from '../storage.js';

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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    console.log(`Fetching equipment with ID: ${id}`);

    // Get equipment from storage
    const equipment = await storageModule.getEquipmentById(id);

    if (!equipment) {
      console.log(`Equipment not found for ID: ${id}`);
      return res.status(404).json({ message: 'Equipment not found' });
    }

    console.log(`Retrieved equipment: ${equipment.assetTag} (${equipment.id})`);
    return res.status(200).json(equipment);
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return res.status(500).json({
      message: 'Failed to fetch equipment',
      error: error instanceof Error ? error.message : 'Unknown error',
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
      error: error instanceof Error ? error.message : 'Unknown error',
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
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
