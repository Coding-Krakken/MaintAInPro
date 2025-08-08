/**
 * Test endpoint to verify serverless functions are working
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    message: 'Vercel serverless function is working',
    environment: 'production',
    deployment: process.env.VERCEL_URL || 'local'
  });
}
