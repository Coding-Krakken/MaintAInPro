import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import the monitoring API handlers
import healthHandler from '../../../api/monitoring/health';
import systemHandler from '../../../api/monitoring/system';
import kpiHandler from '../../../api/monitoring/kpi';
import metricsHandler from '../../../api/monitoring/metrics';
import alertsHandler from '../../../api/monitoring/alerts';

// Create a test app that mimics the Vercel serverless function setup
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mount monitoring endpoints
  app.get('/api/monitoring/health', (req, res) => {
    healthHandler(req as any, res as any);
  });

  app.options('/api/monitoring/health', (req, res) => {
    healthHandler(req as any, res as any);
  });

  app.get('/api/monitoring/system', (req, res) => {
    systemHandler(req as any, res as any);
  });

  app.options('/api/monitoring/system', (req, res) => {
    systemHandler(req as any, res as any);
  });

  app.get('/api/monitoring/kpi', (req, res) => {
    kpiHandler(req as any, res as any);
  });

  app.options('/api/monitoring/kpi', (req, res) => {
    kpiHandler(req as any, res as any);
  });

  app.get('/api/monitoring/metrics', (req, res) => {
    metricsHandler(req as any, res as any);
  });

  app.options('/api/monitoring/metrics', (req, res) => {
    metricsHandler(req as any, res as any);
  });

  app.get('/api/monitoring/alerts', (req, res) => {
    alertsHandler(req as any, res as any);
  });

  app.post('/api/monitoring/alerts', (req, res) => {
    alertsHandler(req as any, res as any);
  });

  app.options('/api/monitoring/alerts', (req, res) => {
    alertsHandler(req as any, res as any);
  });

  // Add unsupported method handlers for testing 405 responses
  app.post('/api/monitoring/health', (req, res) => {
    healthHandler(req as any, res as any);
  });

  app.put('/api/monitoring/system', (req, res) => {
    systemHandler(req as any, res as any);
  });

  app.delete('/api/monitoring/kpi', (req, res) => {
    kpiHandler(req as any, res as any);
  });

  app.patch('/api/monitoring/metrics', (req, res) => {
    metricsHandler(req as any, res as any);
  });

  return app;
};

describe('Monitoring API Integration Tests', () => {
  const app = createTestApp();

  describe('GET /api/monitoring/health', () => {
    it('should return health status with proper structure', async () => {
      const response = await request(app).get('/api/monitoring/health').expect(200);

      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('infrastructure');
      expect(response.body).toHaveProperty('application');
      expect(response.body).toHaveProperty('business');
      expect(response.body).toHaveProperty('trends');

      // Validate trends structure
      expect(response.body.trends).toHaveProperty('overall');
      expect(response.body.trends).toHaveProperty('infrastructure');
      expect(response.body.trends).toHaveProperty('application');
      expect(response.body.trends).toHaveProperty('business');

      // Validate data types
      expect(typeof response.body.overall).toBe('number');
      expect(typeof response.body.infrastructure).toBe('number');
      expect(typeof response.body.application).toBe('number');
      expect(typeof response.body.business).toBe('number');
      expect(typeof response.body.trends.overall).toBe('string');
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app).options('/api/monitoring/health').expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe('GET, OPTIONS');
      expect(response.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
    });

    it('should reject unsupported methods', async () => {
      const response = await request(app).post('/api/monitoring/health').expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
    });

    it('should include CORS headers in responses', async () => {
      const response = await request(app).get('/api/monitoring/health').expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe('GET, OPTIONS');
    });
  });

  describe('GET /api/monitoring/system', () => {
    it('should return system metrics array with proper structure', async () => {
      const response = await request(app).get('/api/monitoring/system').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const metric = response.body[0];
      expect(metric).toHaveProperty('timestamp');
      expect(metric).toHaveProperty('memory');
      expect(metric).toHaveProperty('cpu');
      expect(metric).toHaveProperty('performance');
      expect(metric).toHaveProperty('database');

      // Validate memory structure
      expect(metric.memory).toHaveProperty('used');
      expect(metric.memory).toHaveProperty('free');
      expect(metric.memory).toHaveProperty('total');
      expect(metric.memory).toHaveProperty('usage');

      // Validate CPU structure
      expect(metric.cpu).toHaveProperty('usage');
      expect(metric.cpu).toHaveProperty('load');

      // Validate performance structure
      expect(metric.performance).toHaveProperty('avgResponseTime');
      expect(metric.performance).toHaveProperty('requestCount');
      expect(metric.performance).toHaveProperty('errorCount');
      expect(metric.performance).toHaveProperty('throughput');

      // Validate database structure
      expect(metric.database).toHaveProperty('activeConnections');
      expect(metric.database).toHaveProperty('avgQueryTime');
      expect(metric.database).toHaveProperty('queryCount');
    });

    it('should handle different time ranges', async () => {
      const response24h = await request(app).get('/api/monitoring/system?range=24h').expect(200);

      const response7d = await request(app).get('/api/monitoring/system?range=7d').expect(200);

      expect(Array.isArray(response24h.body)).toBe(true);
      expect(Array.isArray(response7d.body)).toBe(true);

      // 24h should have 24 data points, 7d should have 7 data points
      expect(response24h.body.length).toBe(24);
      expect(response7d.body.length).toBe(7);
    });

    it('should handle CORS preflight requests', async () => {
      await request(app).options('/api/monitoring/system').expect(200);
    });

    it('should reject unsupported methods', async () => {
      const response = await request(app).put('/api/monitoring/system').expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
    });
  });

  describe('GET /api/monitoring/kpi', () => {
    it('should return KPI metrics with proper structure', async () => {
      const response = await request(app).get('/api/monitoring/kpi').expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('workOrders');
      expect(response.body).toHaveProperty('equipment');
      expect(response.body).toHaveProperty('maintenance');
      expect(response.body).toHaveProperty('costs');
      expect(response.body).toHaveProperty('performance');

      // Validate workOrders structure
      const workOrders = response.body.workOrders;
      expect(workOrders).toHaveProperty('total');
      expect(workOrders).toHaveProperty('completed');
      expect(workOrders).toHaveProperty('pending');
      expect(workOrders).toHaveProperty('overdue');
      expect(workOrders).toHaveProperty('completionRate');
      expect(workOrders).toHaveProperty('avgResolutionTime');

      // Validate equipment structure
      const equipment = response.body.equipment;
      expect(equipment).toHaveProperty('total');
      expect(equipment).toHaveProperty('operational');
      expect(equipment).toHaveProperty('maintenance');
      expect(equipment).toHaveProperty('outOfService');
      expect(equipment).toHaveProperty('uptime');
      expect(equipment).toHaveProperty('mtbf');

      // Validate maintenance structure
      const maintenance = response.body.maintenance;
      expect(maintenance).toHaveProperty('scheduled');
      expect(maintenance).toHaveProperty('completed');
      expect(maintenance).toHaveProperty('overdue');
      expect(maintenance).toHaveProperty('compliance');
      expect(maintenance).toHaveProperty('preventiveRatio');

      // Validate costs structure
      const costs = response.body.costs;
      expect(costs).toHaveProperty('total');
      expect(costs).toHaveProperty('labor');
      expect(costs).toHaveProperty('parts');
      expect(costs).toHaveProperty('contracts');
      expect(costs).toHaveProperty('savings');

      // Validate performance structure
      const performance = response.body.performance;
      expect(performance).toHaveProperty('avgResponseTime');
      expect(performance).toHaveProperty('systemUptime');
      expect(performance).toHaveProperty('userSatisfaction');
      expect(performance).toHaveProperty('efficiency');
    });

    it('should handle different time ranges in query parameter', async () => {
      const response = await request(app).get('/api/monitoring/kpi?range=7d').expect(200);

      expect(response.body.period).toBe('7d');
    });

    it('should default to 24h range when no parameter provided', async () => {
      const response = await request(app).get('/api/monitoring/kpi').expect(200);

      expect(response.body.period).toBe('24h');
    });

    it('should handle CORS preflight requests', async () => {
      await request(app).options('/api/monitoring/kpi').expect(200);
    });

    it('should reject unsupported methods', async () => {
      const response = await request(app).delete('/api/monitoring/kpi').expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
    });
  });

  describe('GET /api/monitoring/metrics', () => {
    it('should return real-time metrics with proper structure', async () => {
      const response = await request(app).get('/api/monitoring/metrics').expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('performance');
      expect(response.body).toHaveProperty('business');

      // Validate memory structure
      const memory = response.body.memory;
      expect(memory).toHaveProperty('used');
      expect(memory).toHaveProperty('free');
      expect(memory).toHaveProperty('total');
      expect(memory).toHaveProperty('usage');
      expect(typeof memory.used).toBe('number');
      expect(typeof memory.usage).toBe('number');

      // Validate performance structure
      const performance = response.body.performance;
      expect(performance).toHaveProperty('uptime');
      expect(performance).toHaveProperty('avgResponseTime');
      expect(performance).toHaveProperty('requestCount');
      expect(performance).toHaveProperty('errorCount');
      expect(typeof performance.uptime).toBe('number');

      // Validate business structure
      const business = response.body.business;
      expect(business).toHaveProperty('activeWorkOrders');
      expect(business).toHaveProperty('overdueWorkOrders');
      expect(business).toHaveProperty('equipmentCount');
      expect(business).toHaveProperty('pmCompliance');
      expect(typeof business.activeWorkOrders).toBe('number');
      expect(typeof business.pmCompliance).toBe('number');
    });

    it('should handle CORS preflight requests', async () => {
      await request(app).options('/api/monitoring/metrics').expect(200);
    });

    it('should reject unsupported methods', async () => {
      const response = await request(app).patch('/api/monitoring/metrics').expect(405);

      expect(response.body).toHaveProperty('error', 'Method not allowed');
    });

    it('should include proper timestamp format', async () => {
      const response = await request(app).get('/api/monitoring/metrics').expect(200);

      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Verify it's a valid date
      const date = new Date(timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe('GET /api/monitoring/alerts', () => {
    it('should return alerts array with proper structure', async () => {
      const response = await request(app).get('/api/monitoring/alerts').expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const alert = response.body[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('resolved');
        expect(alert).toHaveProperty('source');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('details');

        // Validate data types
        expect(typeof alert.id).toBe('string');
        expect(typeof alert.type).toBe('string');
        expect(typeof alert.message).toBe('string');
        expect(typeof alert.timestamp).toBe('string');
        expect(typeof alert.resolved).toBe('boolean');
        expect(typeof alert.source).toBe('string');
        expect(typeof alert.severity).toBe('string');
        expect(typeof alert.details).toBe('string');

        // Validate timestamp format
        expect(alert.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }
    });

    it('should handle CORS preflight requests', async () => {
      await request(app).options('/api/monitoring/alerts').expect(200);
    });

    it('should include proper CORS headers', async () => {
      const response = await request(app).get('/api/monitoring/alerts').expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
      expect(response.headers['access-control-allow-headers']).toBe('Content-Type, Authorization');
    });
  });

  describe('POST /api/monitoring/alerts', () => {
    it('should handle alert resolution', async () => {
      const response = await request(app).post('/api/monitoring/alerts').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('alertId');
      expect(response.body.message).toBe('Alert resolved successfully');
    });

    it('should include CORS headers in POST responses', async () => {
      const response = await request(app).post('/api/monitoring/alerts').expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe('GET, POST, OPTIONS');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in health endpoint', async () => {
      // This test verifies that the error handling structure is in place
      // The actual error conditions are hard to simulate in the serverless functions
      // but we can at least verify the error response structure would be correct
      // Simulate error by calling handler directly with a mock that throws
      const mockReq = { method: 'GET' };
      const mockRes = {
        statusCode: 0,
        body: undefined,
        setHeader: () => {},
        status: function (code: number) {
          this.statusCode = code;
          return this;
        },
        json: function (obj: any) {
          this.body = obj;
          return this;
        },
      };
      // Force error
      const originalMemoryUsage = process.memoryUsage;
      (process as any).memoryUsage = () => {
        throw new Error('Memory access failed');
      };
      healthHandler(mockReq as any, mockRes as any);
      (process as any).memoryUsage = originalMemoryUsage;

      expect(mockRes.statusCode).toBe(500);
      expect(mockRes.body).toHaveProperty('status', 'error');
      expect(mockRes.body).toHaveProperty('timestamp');
      expect(mockRes.body).toHaveProperty('error', 'Memory access failed');
    });

    it('should validate response structure consistency', async () => {
      // Make multiple requests to ensure consistent response structure
      const healthResponse1 = await request(app).get('/api/monitoring/health').expect(200);
      const healthResponse2 = await request(app).get('/api/monitoring/health').expect(200);

      // Both responses should have the same structure
      expect(Object.keys(healthResponse1.body)).toEqual(Object.keys(healthResponse2.body));
      expect(Object.keys(healthResponse1.body.trends)).toEqual(
        Object.keys(healthResponse2.body.trends)
      );
    });
  });

  describe('Security & CORS', () => {
    it('should include proper CORS headers on all endpoints', async () => {
      const endpoints = [
        '/api/monitoring/health',
        '/api/monitoring/system',
        '/api/monitoring/kpi',
        '/api/monitoring/metrics',
        '/api/monitoring/alerts',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint).expect(200);
        expect(response.headers['access-control-allow-origin']).toBe('*');
        expect(response.headers['access-control-allow-methods']).toContain('GET');
        expect(response.headers['access-control-allow-headers']).toBe(
          'Content-Type, Authorization'
        );
      }
    });

    it('should handle OPTIONS requests on all endpoints', async () => {
      const endpoints = [
        '/api/monitoring/health',
        '/api/monitoring/system',
        '/api/monitoring/kpi',
        '/api/monitoring/metrics',
        '/api/monitoring/alerts',
      ];

      for (const endpoint of endpoints) {
        await request(app).options(endpoint).expect(200);
      }
    });

    it('should reject unsupported methods consistently', async () => {
      const testCases = [
        { endpoint: '/api/monitoring/health', method: 'post' },
        { endpoint: '/api/monitoring/system', method: 'put' },
        { endpoint: '/api/monitoring/kpi', method: 'delete' },
        { endpoint: '/api/monitoring/metrics', method: 'patch' },
      ];

      for (const testCase of testCases) {
        const response = await request(app)[testCase.method](testCase.endpoint).expect(405);
        expect(response.body).toHaveProperty('error', 'Method not allowed');
      }
    });
  });
});
