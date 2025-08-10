/**
 * Performance alerts endpoint for Vercel deployment
 * Provides system alerts for the monitoring dashboard
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Generate simulated alerts for serverless environment
      const alerts = [
        {
          id: '1',
          type: 'warning',
          message: 'High memory usage detected (85%)',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          resolved: false,
          source: 'system-monitor',
          severity: 'medium',
          details: 'Memory usage is approaching critical threshold',
        },
        {
          id: '2',
          type: 'info',
          message: 'Scheduled maintenance window starting soon',
          timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          resolved: false,
          source: 'maintenance-scheduler',
          severity: 'low',
          details: 'System maintenance scheduled for 2:00 AM UTC',
        },
      ];

      // Randomly resolve some alerts to simulate dynamic state
      if (Math.random() > 0.7) {
        alerts.forEach(alert => {
          if (Math.random() > 0.5) {
            alert.resolved = true;
          }
        });
      }

      res.status(200).json(alerts);
    } catch (__error) {
      console.error('Error fetching alerts:', __error);
      res.status(500).json({
        error: 'Failed to fetch performance alerts',
        message: _error instanceof Error ? __error.message : 'Unknown error',
      });
    }
  } else if (req.method === 'POST') {
    // Handle alert resolution (for POST /alerts/:id/resolve)
    try {
      const alertId = req.url?.split('/').pop()?.replace('resolve', '').replace('/', '');

      res.status(200).json({
        message: 'Alert resolved successfully',
        alertId: alertId || 'unknown',
      });
    } catch (__error) {
      console.error('Error resolving alert:', __error);
      res.status(500).json({
        error: 'Failed to resolve alert',
        message: _error instanceof Error ? __error.message : 'Unknown error',
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
