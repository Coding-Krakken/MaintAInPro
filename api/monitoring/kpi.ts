/**
 * KPI metrics endpoint for Vercel deployment
 * Provides key performance indicators for the monitoring dashboard
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
    
    // Generate simulated KPI metrics for serverless environment
    const kpiMetrics = {
      period: range,
      timestamp: new Date().toISOString(),
      workOrders: {
        total: Math.floor(Math.random() * 500) + 100,
        completed: Math.floor(Math.random() * 400) + 80,
        pending: Math.floor(Math.random() * 50) + 10,
        overdue: Math.floor(Math.random() * 20) + 5,
        completionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
        avgResolutionTime: Math.floor(Math.random() * 120) + 60 // minutes
      },
      equipment: {
        total: Math.floor(Math.random() * 200) + 50,
        operational: Math.floor(Math.random() * 180) + 40,
        maintenance: Math.floor(Math.random() * 15) + 5,
        outOfService: Math.floor(Math.random() * 10) + 1,
        uptime: Math.floor(Math.random() * 20) + 80, // 80-100%
        mtbf: Math.floor(Math.random() * 1000) + 500 // hours
      },
      maintenance: {
        scheduled: Math.floor(Math.random() * 100) + 20,
        completed: Math.floor(Math.random() * 80) + 15,
        overdue: Math.floor(Math.random() * 10) + 2,
        compliance: Math.floor(Math.random() * 15) + 85, // 85-100%
        preventiveRatio: Math.floor(Math.random() * 30) + 70 // 70-100%
      },
      costs: {
        total: Math.floor(Math.random() * 50000) + 10000,
        labor: Math.floor(Math.random() * 20000) + 5000,
        parts: Math.floor(Math.random() * 15000) + 3000,
        contracts: Math.floor(Math.random() * 10000) + 2000,
        savings: Math.floor(Math.random() * 5000) + 1000
      },
      performance: {
        avgResponseTime: Math.floor(Math.random() * 100) + 50,
        systemUptime: Math.floor(Math.random() * 5) + 95, // 95-100%
        userSatisfaction: Math.floor(Math.random() * 20) + 80, // 80-100%
        efficiency: Math.floor(Math.random() * 25) + 75 // 75-100%
      }
    };

    res.status(200).json(kpiMetrics);
  } catch (error) {
    console.error('Error fetching KPI metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch KPI metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
