import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp } from '../../server';
import { storage } from '../../server/storage';
import { insertVendorSchema } from '@shared/schema';
import { z } from 'zod';

// Initialize the app to set up middleware and authentication
let app: any = null;

const initializeIfNeeded = async () => {
  if (!app) {
    app = await initializeApp();
  }
  return app;
};

// Helper function to get current user and warehouse from request headers
const getCurrentUser = (req: VercelRequest) => {
  return req.headers['x-user-id'] as string || '00000000-0000-0000-0000-000000000001';
};

const getCurrentWarehouse = (req: VercelRequest) => {
  return req.headers['x-warehouse-id'] as string || '00000000-0000-0000-0000-000000000001';
};

// Individual vendor API handler (for /api/vendors/[id])
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-warehouse-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await initializeIfNeeded();

    // Authentication check (skip for development with demo-token)
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || (token !== 'demo-token' && process.env.NODE_ENV === 'development')) {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ message: 'Authentication required' });
      }
    }

    const vendorId = req.query.id as string;
    if (!vendorId) {
      return res.status(400).json({ message: 'Vendor ID is required' });
    }

    switch (req.method) {
      case 'GET':
        const vendor = await storage.getVendor(vendorId);
        if (!vendor) {
          return res.status(404).json({ message: 'Vendor not found' });
        }
        return res.json(vendor);

      case 'PATCH':
        try {
          const updateData = insertVendorSchema.partial().parse(req.body);
          const updatedVendor = await storage.updateVendor(vendorId, updateData);
          return res.json(updatedVendor);
        } catch (error) {
          if (error instanceof z.ZodError) {
            return res.status(400).json({ 
              message: 'Invalid vendor data', 
              errors: error.errors 
            });
          }
          if (error.message === 'Vendor not found') {
            return res.status(404).json({ message: 'Vendor not found' });
          }
          throw error;
        }

      case 'DELETE':
        const existingVendor = await storage.getVendor(vendorId);
        if (!existingVendor) {
          return res.status(404).json({ message: 'Vendor not found' });
        }

        await storage.deleteVendor(vendorId);
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Vendor API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}