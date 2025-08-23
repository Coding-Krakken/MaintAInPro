import { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import * as storageModule from './storage.js';
import { z } from 'zod';

// Define the vendor schema directly since we can't import from shared in serverless
const insertVendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['supplier', 'contractor']),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  warehouseId: z.string(),
  id: z.string().optional(),
  active: z.boolean().optional(),
});

// Helper function to get current user and warehouse from request headers
const getCurrentUser = (req: VercelRequest) => {
  return (req.headers['x-user-id'] as string) || '00000000-0000-0000-0000-000000000001';
};

const getCurrentWarehouse = (req: VercelRequest) => {
  return (req.headers['x-warehouse-id'] as string) || '00000000-0000-0000-0000-000000000001';
};

// Vendor API handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-user-id, x-warehouse-id'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authentication check (allow demo-token for development)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || token !== 'demo-token') {
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ message: 'Authentication required' });
      }
    }

    const warehouseId = getCurrentWarehouse(req);
    const userId = getCurrentUser(req);

    switch (req.method) {
      case 'GET':
        if (req.query.id) {
          // Get single vendor
          const vendor = await storageModule.getVendorById(req.query.id as string);
          if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
          }
          return res.json(vendor);
        } else {
          // Get all vendors for warehouse
          const vendors = await storageModule.getAllVendors(warehouseId);
          return res.json(vendors);
        }

      case 'POST':
        const vendorData = {
          name: req.body.name,
          type: req.body.type,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
          contactPerson: req.body.contactPerson,
          warehouseId: warehouseId,
        };

        try {
          const parsedData = insertVendorSchema.parse({
            ...vendorData,
            id: req.body.id || randomUUID(),
            active: req.body.active !== undefined ? req.body.active : true,
          });
          const vendor = await storageModule.createVendor(vendorData);
          return res.status(201).json(vendor);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return res.status(400).json({
              message: 'Invalid vendor data',
              errors: error.errors,
            });
          }
          throw error;
        }

      case 'PATCH':
        if (!req.query.id) {
          return res.status(400).json({ message: 'Vendor ID is required' });
        }

        try {
          const updateData = insertVendorSchema.partial().parse(req.body);
          const vendor = await storageModule.updateVendor(req.query.id as string, updateData);
          if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
          }
          return res.json(vendor);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return res.status(400).json({
              message: 'Invalid vendor data',
              errors: error.errors,
            });
          }
          throw error;
        }

      case 'DELETE':
        if (!req.query.id) {
          return res.status(400).json({ message: 'Vendor ID is required' });
        }

        const deleted = await storageModule.deleteVendor(req.query.id as string);
        if (!deleted) {
          return res.status(404).json({ message: 'Vendor not found' });
        }

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Vendor API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
