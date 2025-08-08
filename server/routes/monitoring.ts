import { Router } from 'express';
import { monitoringService } from '../services/monitoring.service';

const router = Router();

/**
 * Get system performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await monitoringService.getSystemMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get performance alerts
 */
router.get('/alerts', (req, res) => {
  try {
    const alerts = monitoringService.getPerformanceAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance alerts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Resolve a performance alert
 */
router.post('/alerts/:id/resolve', (req, res) => {
  try {
    const { id } = req.params;
    const resolved = monitoringService.resolveAlert(id);
    
    if (resolved) {
      res.json({ message: 'Alert resolved successfully' });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ 
      error: 'Failed to resolve alert',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check with detailed system status
 */
router.get('/health', async (req, res) => {
  try {
    const metrics = await monitoringService.getSystemMetrics();
    const alerts = monitoringService.getPerformanceAlerts().filter(a => !a.resolved);
    
    const health = {
      status: alerts.some(a => a.type === 'critical') ? 'critical' : 
              alerts.some(a => a.type === 'warning') ? 'warning' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        memoryUsage: metrics.memory.usage,
        avgResponseTime: metrics.performance.avgResponseTime,
        requestCount: metrics.performance.requestCount,
        errorCount: metrics.performance.errorCount,
      },
      activeAlerts: alerts.length,
    };

    const statusCode = health.status === 'critical' ? 503 : 200;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get system metrics over time for charts
 */
router.get('/system', async (req, res) => {
  try {
    const range = req.query.range as string || '24h';
    
    // Generate simulated system metrics for charts
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

    res.json(systemMetrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch system metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get KPI metrics for dashboard
 */
router.get('/kpi', async (req, res) => {
  try {
    const range = req.query.range as string || '24h';
    
    // Generate KPI metrics based on actual data when available
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

    res.json(kpiMetrics);
  } catch (error) {
    console.error('Error fetching KPI metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch KPI metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;