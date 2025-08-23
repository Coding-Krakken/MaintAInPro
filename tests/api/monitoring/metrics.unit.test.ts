/**
 * Unit tests for api/monitoring/metrics.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../../api/monitoring/metrics';

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
    url: '/api/monitoring/metrics',
  } as VercelRequest;
};

// Mock process methods
vi.spyOn(process, 'memoryUsage').mockReturnValue({
  heapUsed: 75 * 1024 * 1024, // 75MB
  heapTotal: 150 * 1024 * 1024, // 150MB
  rss: 0,
  external: 0,
  arrayBuffers: 0,
});

vi.spyOn(process, 'uptime').mockReturnValue(7200); // 2 hours

describe('Metrics API Handler', () => {
  let mockReq: VercelRequest;
  let mockRes: VercelResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = createMockResponse();

    // Set up process mocks
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 75 * 1024 * 1024, // 75MB
      heapTotal: 150 * 1024 * 1024, // 150MB
      rss: 0,
      external: 0,
      arrayBuffers: 0,
    });

    vi.spyOn(process, 'uptime').mockReturnValue(7200); // 2 hours
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
    it('should return metrics with correct structure', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
          memory: expect.objectContaining({
            used: expect.any(Number),
            free: expect.any(Number),
            total: expect.any(Number),
            usage: expect.any(Number),
          }),
          performance: expect.objectContaining({
            uptime: expect.any(Number),
            avgResponseTime: expect.any(Number),
            requestCount: expect.any(Number),
            errorCount: expect.any(Number),
          }),
          business: expect.objectContaining({
            activeWorkOrders: expect.any(Number),
            overdueWorkOrders: expect.any(Number),
            equipmentCount: expect.any(Number),
            pmCompliance: expect.any(Number),
          }),
        })
      );
    });

    it('should calculate memory metrics correctly', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const memory = callArgs.memory;

      // heapUsed: 75MB, heapTotal: 150MB
      expect(memory.used).toBe(75); // 75MB used
      expect(memory.free).toBe(75); // 150MB total - 75MB used = 75MB free
      expect(memory.total).toBe(150); // 150MB total
      expect(memory.usage).toBe(50); // 75/150 * 100 = 50%
    });

    it('should include correct process uptime', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.performance.uptime).toBe(7200);
    });

    it('should generate performance metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const performance = callArgs.performance;

      expect(performance.avgResponseTime).toBeGreaterThanOrEqual(25);
      expect(performance.avgResponseTime).toBeLessThanOrEqual(175);
      expect(performance.requestCount).toBeGreaterThanOrEqual(100);
      expect(performance.requestCount).toBeLessThanOrEqual(1100);
      expect(performance.errorCount).toBeGreaterThanOrEqual(0);
      expect(performance.errorCount).toBeLessThanOrEqual(10);
    });

    it('should generate business metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const business = callArgs.business;

      expect(business.activeWorkOrders).toBeGreaterThanOrEqual(2);
      expect(business.activeWorkOrders).toBeLessThanOrEqual(12);
      expect(business.overdueWorkOrders).toBeGreaterThanOrEqual(0);
      expect(business.overdueWorkOrders).toBeLessThanOrEqual(3);
      expect(business.equipmentCount).toBeGreaterThanOrEqual(10);
      expect(business.equipmentCount).toBeLessThanOrEqual(30);
      expect(business.pmCompliance).toBeGreaterThanOrEqual(70);
      expect(business.pmCompliance).toBeLessThanOrEqual(100);
    });

    it('should return timestamp in ISO format', async () => {
      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(() => new Date(callArgs.timestamp)).not.toThrow();
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle memory calculations with edge cases', async () => {
      // Mock zero heap usage
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockReturnValueOnce({
        heapUsed: 0,
        heapTotal: 100 * 1024 * 1024,
        rss: 0,
        external: 0,
        arrayBuffers: 0,
      });

      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const memory = callArgs.memory;

      expect(memory.used).toBe(0);
      expect(memory.free).toBe(100);
      expect(memory.total).toBe(100);
      expect(memory.usage).toBe(0);

      memoryUsageSpy.mockRestore();
    });

    it('should handle memory calculations when heap used equals heap total', async () => {
      const heapSize = 100 * 1024 * 1024;
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockReturnValueOnce({
        heapUsed: heapSize,
        heapTotal: heapSize,
        rss: 0,
        external: 0,
        arrayBuffers: 0,
      });

      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const memory = callArgs.memory;

      expect(memory.used).toBe(100);
      expect(memory.free).toBe(0);
      expect(memory.total).toBe(100);
      expect(memory.usage).toBe(100);

      memoryUsageSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock process.memoryUsage to throw an error
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockImplementationOnce(() => {
        throw new Error('Memory access failed');
      });

      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        _error: 'Failed to fetch system metrics',
        message: 'Memory access failed',
      });

      memoryUsageSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockImplementationOnce(() => {
        throw 'String error';
      });

      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        _error: 'Failed to fetch system metrics',
        message: 'Unknown _error',
      });

      memoryUsageSpy.mockRestore();
    });

    it('should handle error during timestamp generation', async () => {
      const dateProtoSpy = vi.spyOn(Date.prototype, 'toISOString').mockImplementationOnce(() => {
        throw new Error('Date conversion failed');
      });

      mockReq = createMockRequest('GET');

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        _error: 'Failed to fetch system metrics',
        message: 'Date conversion failed',
      });

      dateProtoSpy.mockRestore();
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
