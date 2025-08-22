/**
 * Unit tests for api/monitoring/kpi.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../../api/monitoring/kpi';

// Mock VercelResponse
const createMockResponse = (): VercelResponse => {
  const res = {
    setHeader: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
};

// Mock VercelRequest
const createMockRequest = (method: string = 'GET', query: Record<string, any> = {}): VercelRequest => {
  return {
    method,
    query,
    url: '/api/monitoring/kpi',
  } as VercelRequest;
};

describe('KPI API Handler', () => {
  let mockReq: VercelRequest;
  let mockRes: VercelResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = createMockResponse();
  });

  describe('CORS Headers', () => {
    it('should set CORS headers for all requests', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, OPTIONS');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    });
  });

  describe('OPTIONS Method', () => {
    it('should handle OPTIONS preflight requests', async () => {
      mockReq = createMockRequest('OPTIONS');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('GET Method', () => {
    it('should return KPI metrics with correct structure', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          period: expect.any(String),
          timestamp: expect.any(String),
          workOrders: expect.objectContaining({
            total: expect.any(Number),
            completed: expect.any(Number),
            pending: expect.any(Number),
            overdue: expect.any(Number),
            completionRate: expect.any(Number),
            avgResolutionTime: expect.any(Number),
          }),
          equipment: expect.objectContaining({
            total: expect.any(Number),
            operational: expect.any(Number),
            maintenance: expect.any(Number),
            outOfService: expect.any(Number),
            uptime: expect.any(Number),
            mtbf: expect.any(Number),
          }),
          maintenance: expect.objectContaining({
            scheduled: expect.any(Number),
            completed: expect.any(Number),
            overdue: expect.any(Number),
            compliance: expect.any(Number),
            preventiveRatio: expect.any(Number),
          }),
          costs: expect.objectContaining({
            total: expect.any(Number),
            labor: expect.any(Number),
            parts: expect.any(Number),
            contracts: expect.any(Number),
            savings: expect.any(Number),
          }),
          performance: expect.objectContaining({
            avgResponseTime: expect.any(Number),
            systemUptime: expect.any(Number),
            userSatisfaction: expect.any(Number),
            efficiency: expect.any(Number),
          }),
        })
      );
    });

    it('should default to 24h range when no parameter provided', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.period).toBe('24h');
    });

    it('should handle range parameter correctly', async () => {
      mockReq = createMockRequest('GET', { range: '7d' });
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.period).toBe('7d');
    });

    it('should handle custom range parameter', async () => {
      mockReq = createMockRequest('GET', { range: '30d' });
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.period).toBe('30d');
    });

    it('should generate work orders metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const workOrders = callArgs.workOrders;
      
      expect(workOrders.total).toBeGreaterThanOrEqual(100);
      expect(workOrders.total).toBeLessThanOrEqual(600);
      expect(workOrders.completed).toBeGreaterThanOrEqual(80);
      expect(workOrders.completed).toBeLessThanOrEqual(480);
      expect(workOrders.pending).toBeGreaterThanOrEqual(10);
      expect(workOrders.pending).toBeLessThanOrEqual(60);
      expect(workOrders.overdue).toBeGreaterThanOrEqual(5);
      expect(workOrders.overdue).toBeLessThanOrEqual(25);
      expect(workOrders.completionRate).toBeGreaterThanOrEqual(70);
      expect(workOrders.completionRate).toBeLessThanOrEqual(100);
      expect(workOrders.avgResolutionTime).toBeGreaterThanOrEqual(60);
      expect(workOrders.avgResolutionTime).toBeLessThanOrEqual(180);
    });

    it('should generate equipment metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const equipment = callArgs.equipment;
      
      expect(equipment.total).toBeGreaterThanOrEqual(50);
      expect(equipment.total).toBeLessThanOrEqual(250);
      expect(equipment.operational).toBeGreaterThanOrEqual(40);
      expect(equipment.operational).toBeLessThanOrEqual(220);
      expect(equipment.maintenance).toBeGreaterThanOrEqual(5);
      expect(equipment.maintenance).toBeLessThanOrEqual(20);
      expect(equipment.outOfService).toBeGreaterThanOrEqual(1);
      expect(equipment.outOfService).toBeLessThanOrEqual(11);
      expect(equipment.uptime).toBeGreaterThanOrEqual(80);
      expect(equipment.uptime).toBeLessThanOrEqual(100);
      expect(equipment.mtbf).toBeGreaterThanOrEqual(500);
      expect(equipment.mtbf).toBeLessThanOrEqual(1500);
    });

    it('should generate maintenance metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const maintenance = callArgs.maintenance;
      
      expect(maintenance.scheduled).toBeGreaterThanOrEqual(20);
      expect(maintenance.scheduled).toBeLessThanOrEqual(120);
      expect(maintenance.completed).toBeGreaterThanOrEqual(15);
      expect(maintenance.completed).toBeLessThanOrEqual(95);
      expect(maintenance.overdue).toBeGreaterThanOrEqual(2);
      expect(maintenance.overdue).toBeLessThanOrEqual(12);
      expect(maintenance.compliance).toBeGreaterThanOrEqual(85);
      expect(maintenance.compliance).toBeLessThanOrEqual(100);
      expect(maintenance.preventiveRatio).toBeGreaterThanOrEqual(70);
      expect(maintenance.preventiveRatio).toBeLessThanOrEqual(100);
    });

    it('should generate costs metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const costs = callArgs.costs;
      
      expect(costs.total).toBeGreaterThanOrEqual(10000);
      expect(costs.total).toBeLessThanOrEqual(60000);
      expect(costs.labor).toBeGreaterThanOrEqual(5000);
      expect(costs.labor).toBeLessThanOrEqual(25000);
      expect(costs.parts).toBeGreaterThanOrEqual(3000);
      expect(costs.parts).toBeLessThanOrEqual(18000);
      expect(costs.contracts).toBeGreaterThanOrEqual(2000);
      expect(costs.contracts).toBeLessThanOrEqual(12000);
      expect(costs.savings).toBeGreaterThanOrEqual(1000);
      expect(costs.savings).toBeLessThanOrEqual(6000);
    });

    it('should generate performance metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const performance = callArgs.performance;
      
      expect(performance.avgResponseTime).toBeGreaterThanOrEqual(50);
      expect(performance.avgResponseTime).toBeLessThanOrEqual(150);
      expect(performance.systemUptime).toBeGreaterThanOrEqual(95);
      expect(performance.systemUptime).toBeLessThanOrEqual(100);
      expect(performance.userSatisfaction).toBeGreaterThanOrEqual(80);
      expect(performance.userSatisfaction).toBeLessThanOrEqual(100);
      expect(performance.efficiency).toBeGreaterThanOrEqual(75);
      expect(performance.efficiency).toBeLessThanOrEqual(100);
    });

    it('should return timestamp in ISO format', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(() => new Date(callArgs.timestamp)).not.toThrow();
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle array query parameter correctly', async () => {
      mockReq = createMockRequest('GET', { range: ['24h', '7d'] });
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      // When array is passed, it maintains the array (the actual API would handle this differently)
      expect(callArgs.period).toEqual(['24h', '7d']);
    });

    it('should handle undefined range parameter', async () => {
      mockReq = createMockRequest('GET', { range: undefined });
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.period).toBe('24h');
    });

    it('should handle empty string range parameter', async () => {
      mockReq = createMockRequest('GET', { range: '' });
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.period).toBe('24h');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock Date constructor to throw an error
      vi.spyOn(global, 'Date').mockImplementationOnce(() => {
        throw new Error('Date creation failed');
      });

      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        _error: 'Failed to fetch KPI metrics',
        message: 'Date creation failed',
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.spyOn(global, 'Date').mockImplementationOnce(() => {
        throw 'String error';
      });

      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        _error: 'Failed to fetch KPI metrics',
        message: 'Unknown _error',
      });
    });

    it('should handle error during metrics generation', async () => {
      // Mock Math.random to throw an error (this is called during metrics generation)
      const mathRandomSpy = vi.spyOn(Math, 'random').mockImplementationOnce(() => {
        throw new Error('Math operation failed');
      });

      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        _error: 'Failed to fetch KPI metrics',
        message: expect.any(String), // Accept any error message
      });
      
      mathRandomSpy.mockRestore();
    });

    it('should handle error during timestamp generation', async () => {
      const dateProtoSpy = vi.spyOn(Date.prototype, 'toISOString').mockImplementationOnce(() => {
        throw new Error('Date conversion failed');
      });

      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        _error: 'Failed to fetch KPI metrics',
        message: 'Date conversion failed',
      });
      
      dateProtoSpy.mockRestore();
    });
  });

  describe('Unsupported Methods', () => {
    it.each(['POST', 'PUT', 'DELETE', 'PATCH'])(
      'should return 405 for %s method',
      async (method) => {
        mockReq = createMockRequest(method);
        
        await handler(mockReq, mockRes);
        
        expect(mockRes.status).toHaveBeenCalledWith(405);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
      }
    );
  });
});