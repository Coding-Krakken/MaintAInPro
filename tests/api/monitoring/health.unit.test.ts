/**
 * Unit tests for api/monitoring/health.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../../../api/monitoring/health';

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
    url: '/api/monitoring/health',
  } as VercelRequest;
};

// Mock process methods
vi.spyOn(process, 'memoryUsage').mockReturnValue({
  heapUsed: 50 * 1024 * 1024, // 50MB
  heapTotal: 100 * 1024 * 1024, // 100MB
  rss: 0,
  external: 0,
  arrayBuffers: 0
});

vi.spyOn(process, 'uptime').mockReturnValue(3600); // 1 hour

// Mock environment variable
const originalEnv = process.env.VERCEL_URL;
process.env.VERCEL_URL = 'https://test.vercel.app';

describe('Health API Handler', () => {
  let mockReq: VercelRequest;
  let mockRes: VercelResponse;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = createMockResponse();
    
    // Set up process mocks
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      heapUsed: 50 * 1024 * 1024, // 50MB
      heapTotal: 100 * 1024 * 1024, // 100MB
      rss: 0,
      external: 0,
      arrayBuffers: 0
    });
    
    vi.spyOn(process, 'uptime').mockReturnValue(3600); // 1 hour
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
    it('should return health status with correct structure', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          metrics: expect.objectContaining({
            memoryUsage: expect.any(Number),
            avgResponseTime: expect.any(Number),
            requestCount: expect.any(Number),
            errorCount: expect.any(Number),
          }),
          activeAlerts: 0,
          environment: 'serverless',
          deployment: expect.any(String),
        })
      );
    });

    it('should calculate memory usage correctly', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.metrics.memoryUsage).toBe(50); // 50MB used / 100MB total * 100 = 50%
    });

    it('should include process uptime', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.uptime).toBe(3600);
    });

    it('should include deployment URL from environment', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.deployment).toBe('https://test.vercel.app');
    });

    it('should use "local" when VERCEL_URL is not set', async () => {
      const originalEnv = process.env.VERCEL_URL;
      delete process.env.VERCEL_URL;
      
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.deployment).toBe('local');
      
      // Restore original environment
      if (originalEnv !== undefined) {
        process.env.VERCEL_URL = originalEnv;
      }
    });

    it('should generate simulated metrics within expected ranges', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const metrics = callArgs.metrics;
      
      expect(metrics.avgResponseTime).toBeGreaterThanOrEqual(50);
      expect(metrics.avgResponseTime).toBeLessThanOrEqual(150);
      expect(metrics.requestCount).toBeGreaterThanOrEqual(100);
      expect(metrics.requestCount).toBeLessThanOrEqual(1100);
      expect(metrics.errorCount).toBeGreaterThanOrEqual(0);
      expect(metrics.errorCount).toBeLessThanOrEqual(5);
    });

    it('should return timestamp in ISO format', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(() => new Date(callArgs.timestamp)).not.toThrow();
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
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
        status: 'error',
        timestamp: expect.any(String),
        error: 'Memory access failed',
      });
      
      memoryUsageSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      // Mock process.memoryUsage to throw a non-Error object
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockImplementationOnce(() => {
        throw 'String error';
      });

      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        timestamp: expect.any(String),
        error: 'Unknown error',
      });
      
      memoryUsageSpy.mockRestore();
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