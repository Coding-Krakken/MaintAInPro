/**
 * System metrics endpoint for Vercel deployment
 * Provides system performance metrics for the monitoring dashboard
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
    const range = req.query.range as string || '24h';
    
    // Generate simulated system metrics for serverless environment
    const generateMetrics = (count: number) => {
      const metrics: any[] = [];
      const now = new Date();
      
      for (let i = count - 1; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * (range === '24h' ? 3600000 : range === '7d' ? 86400000 : 3600000)));
        
        metrics.push({
          timestamp: timestamp.toISOString(),
          memory: {
            used: Math.floor(Math.random() * 2000) + 1000, // MB
            free: Math.floor(Math.random() * 1000) + 500,
            total: 4096,
            usage: Math.floor(Math.random() * 60) + 20 // 20-80%
          },
          cpu: {
            usage: Math.floor(Math.random() * 80) + 10, // 10-90%
            load: Math.random() * 2 + 0.5
          },
          performance: {
            avgResponseTime: Math.floor(Math.random() * 200) + 50,
            requestCount: Math.floor(Math.random() * 100) + 20,
            errorCount: Math.floor(Math.random() * 5),
            throughput: Math.floor(Math.random() * 50) + 10
          },
          database: {
            activeConnections: Math.floor(Math.random() * 20) + 5,
            avgQueryTime: Math.floor(Math.random() * 100) + 10,
            queryCount: Math.floor(Math.random() * 200) + 50
          }
        });
      }
      
      return metrics;
    };

    const dataPoints = range === '24h' ? 24 : range === '7d' ? 7 : 24;
    const systemMetrics = generateMetrics(dataPoints);

    res.status(200).json(systemMetrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
