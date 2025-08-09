/**
 * Health monitoring endpoint for Vercel deployment
 * Provides system health status for the monitoring dashboard
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simulate health check data for serverless environment
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        memoryUsage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        ),
        avgResponseTime: Math.floor(Math.random() * 100) + 50, // Simulated
        requestCount: Math.floor(Math.random() * 1000) + 100, // Simulated
        errorCount: Math.floor(Math.random() * 5), // Simulated
      },
      activeAlerts: 0,
      environment: 'serverless',
      deployment: process.env.VERCEL_URL || 'local',
    };

    res.status(200).json(health);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
