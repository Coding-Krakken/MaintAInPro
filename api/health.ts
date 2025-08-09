/**
 * Health Check API endpoint for Vercel
 * Simple health check that matches what the deployment workflow expects
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Health check data that matches the workflow expectations
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    deployment: {
      url: process.env.VERCEL_URL || 'unknown',
      region: process.env.VERCEL_REGION || 'unknown',
      sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    service: 'MaintAInPro CMMS',
  };

  // Set appropriate headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  res.status(200).json(healthData);
}
