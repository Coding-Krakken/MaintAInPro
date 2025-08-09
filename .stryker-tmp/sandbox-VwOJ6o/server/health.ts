/**
 * Health Check Endpoint for Vercel Deployment
 * Returns system status, build info, and deployment metadata
 */
// @ts-nocheck


import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function health(req: VercelRequest, res: VercelResponse) {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      sha: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      buildId: process.env.VERCEL_DEPLOYMENT_ID || 'unknown',
      environment: process.env.NODE_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      url: process.env.VERCEL_URL || req.headers.host,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        auth: process.env.JWT_SECRET ? 'enabled' : 'disabled',
        database: process.env.DATABASE_URL ? 'enabled' : 'disabled',
        redis: process.env.REDIS_URL ? 'enabled' : 'disabled',
        email: process.env.SMTP_HOST ? 'enabled' : 'disabled',
      },
    };

    // Set cache headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Return health data
    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check failed:', error);

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
