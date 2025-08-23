/**
 * Profiles API Handler for Vercel
 * Handles user profiles management
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
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profiles API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    // Mock profiles data
    const mockProfiles = [
      {
        id: 'tech-1',
        name: 'John Smith',
        email: 'john.smith@maintainpro.com',
        role: 'technician',
        department: 'Maintenance',
        avatar: null,
        phone: '+1-555-0123',
        location: 'Main Facility',
        status: 'active',
      },
      {
        id: 'tech-2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@maintainpro.com',
        role: 'technician',
        department: 'Maintenance',
        avatar: null,
        phone: '+1-555-0124',
        location: 'North Wing',
        status: 'active',
      },
      {
        id: 'manager-1',
        name: 'Mike Davis',
        email: 'mike.davis@maintainpro.com',
        role: 'manager',
        department: 'Maintenance',
        avatar: null,
        phone: '+1-555-0125',
        location: 'Main Office',
        status: 'active',
      },
    ];

    console.log(`Retrieved ${mockProfiles.length} profiles`);
    return res.status(200).json(mockProfiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return res.status(500).json({
      message: 'Failed to fetch profiles',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const profileData = req.body;

    // Generate ID if not provided
    if (!profileData.id) {
      profileData.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set default values
    profileData.createdAt = profileData.createdAt || new Date().toISOString();
    profileData.updatedAt = new Date().toISOString();
    profileData.status = profileData.status || 'active';

    console.log('Created profile:', profileData.id);
    return res.status(201).json(profileData);
  } catch (error) {
    console.error('Error creating profile:', error);
    return res.status(500).json({
      message: 'Failed to create profile',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
