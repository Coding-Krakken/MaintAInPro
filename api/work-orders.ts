/**
 * Work Orders API Serverless Handler for Vercel
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Import storage functions directly
import * as storageModule from './storage.js';

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
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      case 'PUT':
      case 'PATCH':
        return handlePatch(req, res);
      case 'DELETE':
        return handleDelete(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Work Orders API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const { status } = req.query;

    const filters: { status?: string[] } = {};
    if (status && typeof status === 'string') {
      filters.status = status.split(',');
    }

    const workOrders = await storageModule.getAllWorkOrders(warehouseId, filters);
    console.log(`Retrieved ${workOrders.length} work orders for warehouse ${warehouseId}`);

    return res.status(200).json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return res.status(500).json({
      message: 'Failed to fetch work orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';

    const workOrderData = req.body;

    // Generate ID if not provided
    if (!workOrderData.id) {
      workOrderData.id = `wo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set default values
    workOrderData.createdAt = workOrderData.createdAt || new Date().toISOString();
    workOrderData.updatedAt = new Date().toISOString();
    workOrderData.createdBy = workOrderData.createdBy || userId;
    workOrderData.status = workOrderData.status || 'new';
    workOrderData.priority = workOrderData.priority || 'medium';

    const createdWorkOrder = await storageModule.createWorkOrder(warehouseId, workOrderData);
    console.log('Created work order:', createdWorkOrder.id);

    return res.status(201).json(createdWorkOrder);
  } catch (error) {
    console.error('Error creating work order:', error);
    return res.status(500).json({
      message: 'Failed to create work order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePatch(req: VercelRequest, res: VercelResponse) {
  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Work order ID is required' });
    }

    const updateData = req.body;
    updateData.updatedAt = new Date().toISOString();

    const updatedWorkOrder = await storageModule.updateWorkOrder(warehouseId, id, updateData);
    console.log('Updated work order:', id);

    return res.status(200).json(updatedWorkOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    return res.status(500).json({
      message: 'Failed to update work order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  try {
    const warehouseId = (req.headers['x-warehouse-id'] as string) || 'default-warehouse-id';
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Work order ID is required' });
    }

    await storageModule.deleteWorkOrder(warehouseId, id);
    console.log('Deleted work order:', id);

    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting work order:', error);
    return res.status(500).json({
      message: 'Failed to delete work order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
