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
const _originalEnv = process.env.VERCEL_URL;
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
    it('should return performance health status with correct structure', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          overall: expect.any(Number),
          infrastructure: expect.any(Number),
          application: expect.any(Number),
          business: expect.any(Number),
          trends: expect.objectContaining({
            overall: expect.stringMatching(/^(improving|stable|declining)$/),
            infrastructure: expect.stringMatching(/^(improving|stable|declining)$/),
            application: expect.stringMatching(/^(improving|stable|declining)$/),
            business: expect.stringMatching(/^(improving|stable|declining)$/),
          }),
        })
      );
    });

    it('should return valid performance health values', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      expect(callArgs.overall).toBeGreaterThanOrEqual(0);
      expect(callArgs.overall).toBeLessThanOrEqual(100);
      expect(callArgs.infrastructure).toBeGreaterThanOrEqual(0);
      expect(callArgs.infrastructure).toBeLessThanOrEqual(100);
      expect(callArgs.application).toBeGreaterThanOrEqual(0);
      expect(callArgs.application).toBeLessThanOrEqual(100);
      expect(callArgs.business).toBeGreaterThanOrEqual(0);
      expect(callArgs.business).toBeLessThanOrEqual(100);
    });

    it('should return valid trend indicators', async () => {
      mockReq = createMockRequest('GET');
      
      await handler(mockReq, mockRes);
      
      const callArgs = (mockRes.json as any).mock.calls[0][0];
      const validTrends = ['improving', 'stable', 'declining'];
      expect(validTrends).toContain(callArgs.trends.overall);
      expect(validTrends).toContain(callArgs.trends.infrastructure);
      expect(validTrends).toContain(callArgs.trends.application);
      expect(validTrends).toContain(callArgs.trends.business);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully by returning error response', async () => {
      // Mock process.memoryUsage to throw an error
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockImplementationOnce(() => {
        throw new Error('Memory access failed');
      });

      mockReq = createMockRequest('GET');
      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        error: 'Memory access failed',
        timestamp: expect.any(String),
      }));
      memoryUsageSpy.mockRestore();
    });

    it('should handle non-Error exceptions by returning error response', async () => {
      // Mock process.memoryUsage to throw a non-Error object
      const memoryUsageSpy = vi.spyOn(process, 'memoryUsage').mockImplementationOnce(() => {
        throw 'String error';
      });

      mockReq = createMockRequest('GET');
      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        error: 'Unknown error',
        timestamp: expect.any(String),
      }));
      memoryUsageSpy.mockRestore();
    });
  });

  describe('Unsupported Methods', () => {
  it.each(['POST', 'PUT', 'DELETE', 'PATCH'])('should return 405 for %s method', async (method) => {
        mockReq = createMockRequest(method);
        await handler(mockReq, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(405);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
      }
    );
  });
});