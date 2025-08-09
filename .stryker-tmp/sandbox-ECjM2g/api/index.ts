/**
 * Simple API Handler for Vercel Deployment Testing
 * This is a minimal API for deployment validation
 * The full Express backend runs locally in server/
 */
// @ts-nocheck


import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  // Set CORS headers for API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple API health check
  if (url?.includes('health')) {
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'MaintAInPro CMMS API',
      environment: 'serverless',
      deployment: process.env.VERCEL_URL || 'local',
    });
  }

  // Default API response
  res.status(200).json({
    message: 'MaintAInPro CMMS API - Serverless Endpoint',
    method,
    path: url,
    timestamp: new Date().toISOString(),
    note: 'This is a minimal API for deployment testing. Full backend runs in server/ for local development.',
  });
}
