/**
 * Profile API Handler for Vercel - Dynamic Route
 * Serves user profile information
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
      return res.status(400).json({ message: 'Profile ID is required' });
    }

    // Mock profile data for demonstration
    const mockProfile = {
      id: id,
      name: `User ${id}`,
      email: `${id}@maintainpro.com`,
      role: id.startsWith('tech-') ? 'technician' : 'manager',
      department: 'Maintenance',
      avatar: null,
      phone: '+1-555-0123',
      location: 'Main Facility',
      status: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    console.log(`Retrieved profile for user: ${id}`);
    return res.status(200).json(mockProfile);
  } catch (error) {
    console.error('Profiles API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
