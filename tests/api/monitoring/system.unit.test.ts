/**
 * Unit tests for api/monitoring/system.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../../api/monitoring/system';

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
const createMockRequest = (
  method: string = 'GET',
  query: Record<string, any> = {}
): VercelRequest => {
  return {
    method,
    query,
    url: '/api/monitoring/system',
  } as VercelRequest;
};

describe('System API Handler', () => {
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
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, OPTIONS'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
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
    it('should return system metrics array with correct structure', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            timestamp: expect.any(String),
            memory: expect.objectContaining({
              used: expect.any(Number),
              free: expect.any(Number),
              total: 4096,
              usage: expect.any(Number),
            }),
            cpu: expect.objectContaining({
              usage: expect.any(Number),
              load: expect.any(Number),
            }),
            performance: expect.objectContaining({
              avgResponseTime: expect.any(Number),
              requestCount: expect.any(Number),
              errorCount: expect.any(Number),
              throughput: expect.any(Number),
            }),
            database: expect.objectContaining({
              activeConnections: expect.any(Number),
              avgQueryTime: expect.any(Number),
              queryCount: expect.any(Number),
            }),
          }),
        ])
      );
    });

    it('should default to 24h range and return 24 data points', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(24);
    });

    it('should handle 24h range parameter and return 24 data points', async () => {
      mockReq = createMockRequest('GET', { range: '24h' });

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(24);
    });

    it('should handle 7d range parameter and return 7 data points', async () => {
      mockReq = createMockRequest('GET', { range: '7d' });

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(7);
    });

    it('should handle invalid range parameter and default to 24 data points', async () => {
      mockReq = createMockRequest('GET', { range: 'invalid' });

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(24);
    });

    it('should generate timestamps with correct intervals for 24h range', async () => {
      const beforeCall = Date.now();
      mockReq = createMockRequest('GET', { range: '24h' });

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(24);

      // Check that timestamps are 1 hour apart (3600000ms)
      for (let i = 1; i < callArgs.length; i++) {
        const current = new Date(callArgs[i].timestamp).getTime();
        const previous = new Date(callArgs[i - 1].timestamp).getTime();
        expect(current - previous).toBe(3600000); // 1 hour
      }

      // First timestamp should be about 23 hours ago
      const firstTimestamp = new Date(callArgs[0].timestamp).getTime();
      const expectedFirstTime = beforeCall - 23 * 3600000;
      expect(Math.abs(firstTimestamp - expectedFirstTime)).toBeLessThan(1000); // Within 1 second
    });

    it('should generate timestamps with correct intervals for 7d range', async () => {
      const beforeCall = Date.now();
      mockReq = createMockRequest('GET', { range: '7d' });

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs).toHaveLength(7);

      // Check that timestamps are 1 day apart (86400000ms)
      for (let i = 1; i < callArgs.length; i++) {
        const current = new Date(callArgs[i].timestamp).getTime();
        const previous = new Date(callArgs[i - 1].timestamp).getTime();
        expect(current - previous).toBe(86400000); // 1 day
      }

      // First timestamp should be about 6 days ago
      const firstTimestamp = new Date(callArgs[0].timestamp).getTime();
      const expectedFirstTime = beforeCall - 6 * 86400000;
      expect(Math.abs(firstTimestamp - expectedFirstTime)).toBeLessThan(1000); // Within 1 second
    });

    it('should generate memory metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const metric = callArgs[0];

      expect(metric.memory.used).toBeGreaterThanOrEqual(1000);
      expect(metric.memory.used).toBeLessThanOrEqual(3000);
      expect(metric.memory.free).toBeGreaterThanOrEqual(500);
      expect(metric.memory.free).toBeLessThanOrEqual(1500);
      expect(metric.memory.total).toBe(4096);
      expect(metric.memory.usage).toBeGreaterThanOrEqual(20);
      expect(metric.memory.usage).toBeLessThanOrEqual(80);
    });

    it('should generate CPU metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const metric = callArgs[0];

      expect(metric.cpu.usage).toBeGreaterThanOrEqual(10);
      expect(metric.cpu.usage).toBeLessThanOrEqual(90);
      expect(metric.cpu.load).toBeGreaterThanOrEqual(0.5);
      expect(metric.cpu.load).toBeLessThanOrEqual(2.5);
    });

    it('should generate performance metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const metric = callArgs[0];

      expect(metric.performance.avgResponseTime).toBeGreaterThanOrEqual(50);
      expect(metric.performance.avgResponseTime).toBeLessThanOrEqual(250);
      expect(metric.performance.requestCount).toBeGreaterThanOrEqual(20);
      expect(metric.performance.requestCount).toBeLessThanOrEqual(120);
      expect(metric.performance.errorCount).toBeGreaterThanOrEqual(0);
      expect(metric.performance.errorCount).toBeLessThanOrEqual(5);
      expect(metric.performance.throughput).toBeGreaterThanOrEqual(10);
      expect(metric.performance.throughput).toBeLessThanOrEqual(60);
    });

    it('should generate database metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const metric = callArgs[0];

      expect(metric.database.activeConnections).toBeGreaterThanOrEqual(5);
      expect(metric.database.activeConnections).toBeLessThanOrEqual(25);
      expect(metric.database.avgQueryTime).toBeGreaterThanOrEqual(10);
      expect(metric.database.avgQueryTime).toBeLessThanOrEqual(110);
      expect(metric.database.queryCount).toBeGreaterThanOrEqual(50);
      expect(metric.database.queryCount).toBeLessThanOrEqual(250);
    });

    it('should return timestamps in ISO format', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      callArgs.forEach((metric: any) => {
        expect(() => new Date(metric.timestamp)).not.toThrow();
        expect(metric.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('should handle array query parameter correctly', async () => {
      mockReq = createMockRequest('GET', { range: ['24h', '7d'] });

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      // Should default to 24 when array is passed
      expect(callArgs).toHaveLength(24);
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
        _error: 'Failed to fetch system metrics',
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
        _error: 'Failed to fetch system metrics',
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
        _error: 'Failed to fetch system metrics',
        message: expect.any(String), // Accept any error message
      });

      mathRandomSpy.mockRestore();
    });
  });

  describe('Unsupported Methods', () => {
    it.each(['POST', 'PUT', 'DELETE', 'PATCH'])('should return 405 for %s method', async method => {
      mockReq = createMockRequest(method);

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });
  });
});
