/**
 * Unit tests for server/health.ts
 * Tests the health check endpoint functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import health from '@server/health';

// Mock implementations
const mockJson = vi.fn();
const mockStatus = vi.fn(() => ({ json: mockJson }));
const mockSetHeader = vi.fn();

const createMockResponse = (): VercelResponse => ({
  status: mockStatus,
  setHeader: mockSetHeader,
  json: mockJson,
} as any);

const createMockRequest = (overrides: Partial<VercelRequest> = {}): VercelRequest => ({
  headers: { host: 'localhost:3000' },
  method: 'GET',
  url: '/health',
  query: {},
  body: {},
  ...overrides,
} as any);

describe('Health Route', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockUptime: ReturnType<typeof vi.fn>;
  let mockMemoryUsage: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock console.error to avoid noise in test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock process methods
    mockUptime = vi.fn(() => 3600); // 1 hour uptime
    mockMemoryUsage = vi.fn(() => ({
      rss: 104857600,      // 100MB
      heapTotal: 67108864, // 64MB  
      heapUsed: 33554432,  // 32MB
      external: 8388608,   // 8MB
      arrayBuffers: 1048576 // 1MB
    }));
    
    vi.stubGlobal('process', {
      ...process,
      uptime: mockUptime,
      memoryUsage: mockMemoryUsage,
      env: process.env
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe('Success Cases', () => {
    it('should return health data with status 200', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledTimes(1);
      
      const healthData = mockJson.mock.calls[0][0];
      expect(healthData).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        sha: expect.any(String),
        buildId: expect.any(String),
        environment: expect.any(String),
        region: expect.any(String),
        url: expect.any(String),
        version: expect.any(String),
        uptime: 3600,
        memory: expect.objectContaining({
          rss: 104857600,
          heapTotal: 67108864,
          heapUsed: 33554432,
          external: 8388608,
          arrayBuffers: 1048576
        }),
        features: expect.objectContaining({
          auth: expect.any(String),
          database: expect.any(String),
          redis: expect.any(String),
          email: expect.any(String)
        })
      });
    });

    it('should set proper cache headers', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      expect(mockSetHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
      expect(mockSetHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(mockSetHeader).toHaveBeenCalledWith('Expires', '0');
      expect(mockSetHeader).toHaveBeenCalledTimes(3);
    });

    it('should return valid ISO timestamp', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      const timestamp = new Date(healthData.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(healthData.timestamp);
    });

    it('should use request host when VERCEL_URL is not available', () => {
      process.env.VERCEL_URL = undefined;
      const req = createMockRequest({ headers: { host: 'example.com:8080' } });
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      expect(healthData.url).toBe('example.com:8080');
    });
  });

  describe('Environment Variable Handling', () => {
    it('should show features as enabled when environment variables are present', () => {
      process.env.JWT_SECRET = 'test-secret';
      process.env.DATABASE_URL = 'postgres://test';
      process.env.REDIS_URL = 'redis://test';
      process.env.SMTP_HOST = 'smtp.test.com';

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      expect(healthData.features).toEqual({
        auth: 'enabled',
        database: 'enabled',
        redis: 'enabled',
        email: 'enabled'
      });
    });

    it('should show features as disabled when environment variables are missing', () => {
      delete process.env.JWT_SECRET;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      delete process.env.SMTP_HOST;

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      expect(healthData.features).toEqual({
        auth: 'disabled',
        database: 'disabled',
        redis: 'disabled',
        email: 'disabled'
      });
    });

    it('should use default values for missing Vercel environment variables', () => {
      delete process.env.VERCEL_GIT_COMMIT_SHA;
      delete process.env.VERCEL_DEPLOYMENT_ID;
      delete process.env.NODE_ENV;
      delete process.env.VERCEL_REGION;
      delete process.env.npm_package_version;

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      expect(healthData.sha).toBe('unknown');
      expect(healthData.buildId).toBe('unknown');
      expect(healthData.environment).toBe('development');
      expect(healthData.region).toBe('unknown');
      expect(healthData.version).toBe('1.0.0');
    });

    it('should use Vercel environment variables when available', () => {
      process.env.VERCEL_GIT_COMMIT_SHA = 'abc123';
      process.env.VERCEL_DEPLOYMENT_ID = 'deploy456';
      process.env.NODE_ENV = 'production';
      process.env.VERCEL_REGION = 'us-east-1';
      process.env.VERCEL_URL = 'https://myapp.vercel.app';
      process.env.npm_package_version = '2.1.0';

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      expect(healthData.sha).toBe('abc123');
      expect(healthData.buildId).toBe('deploy456');
      expect(healthData.environment).toBe('production');
      expect(healthData.region).toBe('us-east-1');
      expect(healthData.url).toBe('https://myapp.vercel.app');
      expect(healthData.version).toBe('2.1.0');
    });
  });

  describe('Error Cases', () => {
    it('should handle errors and return 503 status', () => {
      // Mock process.uptime to throw an error
      mockUptime.mockImplementation(() => {
        throw new Error('Process uptime failed');
      });

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        timestamp: expect.any(String),
        error: 'Process uptime failed'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Health check failed:', expect.any(Error));
    });

    it('should handle non-Error exceptions', () => {
      // Mock process.memoryUsage to throw a string instead of Error object
      mockMemoryUsage.mockImplementation(() => {
        throw 'String error';
      });

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        timestamp: expect.any(String),
        error: 'Unknown error'
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Health check failed:', 'String error');
    });

    it('should return valid timestamp even in error case', () => {
      mockUptime.mockImplementation(() => {
        throw new Error('Test error');
      });

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const errorData = mockJson.mock.calls[0][0];
      const timestamp = new Date(errorData.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(errorData.timestamp);
    });
  });

  describe('Response Structure Validation', () => {
    it('should have all required fields in success response', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      
      // Check that all expected fields exist
      expect(healthData).toHaveProperty('status');
      expect(healthData).toHaveProperty('timestamp');
      expect(healthData).toHaveProperty('sha');
      expect(healthData).toHaveProperty('buildId');
      expect(healthData).toHaveProperty('environment');
      expect(healthData).toHaveProperty('region');
      expect(healthData).toHaveProperty('url');
      expect(healthData).toHaveProperty('version');
      expect(healthData).toHaveProperty('uptime');
      expect(healthData).toHaveProperty('memory');
      expect(healthData).toHaveProperty('features');
      
      // Verify data types
      expect(typeof healthData.status).toBe('string');
      expect(typeof healthData.timestamp).toBe('string');
      expect(typeof healthData.uptime).toBe('number');
      expect(typeof healthData.memory).toBe('object');
      expect(typeof healthData.features).toBe('object');
    });

    it('should have all required fields in error response', () => {
      mockUptime.mockImplementation(() => {
        throw new Error('Test error');
      });

      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const errorData = mockJson.mock.calls[0][0];
      
      expect(errorData).toHaveProperty('status', 'error');
      expect(errorData).toHaveProperty('timestamp');
      expect(errorData).toHaveProperty('error');
      
      expect(typeof errorData.timestamp).toBe('string');
      expect(typeof errorData.error).toBe('string');
    });

    it('should have correct memory object structure', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      const memory = healthData.memory;
      
      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('external');
      expect(memory).toHaveProperty('arrayBuffers');
      
      // All memory values should be numbers
      expect(typeof memory.rss).toBe('number');
      expect(typeof memory.heapTotal).toBe('number');
      expect(typeof memory.heapUsed).toBe('number');
      expect(typeof memory.external).toBe('number');
      expect(typeof memory.arrayBuffers).toBe('number');
    });

    it('should have correct features object structure', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      health(req, res);

      const healthData = mockJson.mock.calls[0][0];
      const features = healthData.features;
      
      expect(features).toHaveProperty('auth');
      expect(features).toHaveProperty('database');
      expect(features).toHaveProperty('redis');
      expect(features).toHaveProperty('email');
      
      // All feature values should be either 'enabled' or 'disabled'
      const validValues = ['enabled', 'disabled'];
      expect(validValues).toContain(features.auth);
      expect(validValues).toContain(features.database);
      expect(validValues).toContain(features.redis);
      expect(validValues).toContain(features.email);
    });
  });
});