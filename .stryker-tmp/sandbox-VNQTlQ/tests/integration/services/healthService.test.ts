// @ts-nocheck
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { healthService } from '@/services/healthService';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Health Service Integration', () => {
  beforeAll(() => {
    // Set up localStorage mocks
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'userId') return 'test-user-id';
      if (key === 'warehouseId') return 'test-warehouse-id';
      return null;
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('getHealth', () => {
    it('should fetch health data successfully', async () => {
      const mockHealthData = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        env: 'test',
        port: 5000,
        version: '1.0.0',
        uptime: 3600,
        memory: {
          rss: 104857600,
          heapTotal: 67108864,
          heapUsed: 33554432,
          external: 8388608,
          arrayBuffers: 1048576,
        },
        websocket: {
          totalConnections: 5,
          activeConnections: 3,
          connectionsByWarehouse: {},
        },
        features: {
          auth: 'enabled',
          database: 'enabled',
          redis: 'disabled',
          email: 'enabled',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

      const result = await healthService.getHealth();

      expect(result).toEqual(mockHealthData);
      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        headers: {
          Authorization: 'Bearer demo-token',
          'x-user-id': 'test-user-id',
          'x-warehouse-id': 'test-warehouse-id',
        },
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(healthService.getHealth()).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(healthService.getHealth()).rejects.toThrow('Failed to fetch health data');
    });

    it('should include correct headers with default values when localStorage is empty', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const mockHealthData = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        env: 'test',
        port: 5000,
        version: '1.0.0',
        uptime: 3600,
        memory: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
        websocket: { totalConnections: 0, activeConnections: 0, connectionsByWarehouse: {} },
        features: { auth: 'enabled', database: 'enabled', redis: 'disabled', email: 'enabled' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealthData,
      });

      await healthService.getHealth();

      expect(mockFetch).toHaveBeenCalledWith('/api/health', {
        headers: {
          Authorization: 'Bearer demo-token',
          'x-user-id': 'default-user-id',
          'x-warehouse-id': 'default-warehouse-id',
        },
      });
    });
  });

  describe('Health API Response Structure', () => {
    it('should handle minimal health response', async () => {
      const minimalHealthData = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        env: 'test',
        port: 5000,
        version: '1.0.0',
        uptime: 0,
        memory: {
          rss: 0,
          heapTotal: 0,
          heapUsed: 0,
          external: 0,
          arrayBuffers: 0,
        },
        websocket: {
          totalConnections: 0,
          activeConnections: 0,
          connectionsByWarehouse: {},
        },
        features: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => minimalHealthData,
      });

      const result = await healthService.getHealth();

      expect(result).toEqual(minimalHealthData);
      expect(result.status).toBe('ok');
      expect(result.features).toEqual({});
      expect(result.websocket.connectionsByWarehouse).toEqual({});
    });

    it('should handle health response with deployment info', async () => {
      const healthDataWithDeployment = {
        status: 'ok',
        timestamp: '2024-01-01T00:00:00.000Z',
        env: 'production',
        port: 5000,
        version: '1.0.0',
        uptime: 86400, // 1 day
        memory: {
          rss: 209715200, // 200MB
          heapTotal: 134217728, // 128MB
          heapUsed: 67108864, // 64MB
          external: 16777216, // 16MB
          arrayBuffers: 2097152, // 2MB
        },
        websocket: {
          totalConnections: 100,
          activeConnections: 85,
          connectionsByWarehouse: {
            'warehouse-1': 30,
            'warehouse-2': 25,
            'warehouse-3': 30,
          },
        },
        features: {
          auth: 'enabled',
          database: 'enabled',
          redis: 'enabled',
          email: 'enabled',
        },
        sha: 'abcdef1234567890abcdef1234567890abcdef12',
        buildId: 'build-12345-67890',
        region: 'us-east-1',
        url: 'maintainpro.app',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => healthDataWithDeployment,
      });

      const result = await healthService.getHealth();

      expect(result).toEqual(healthDataWithDeployment);
      expect(result.sha).toBe('abcdef1234567890abcdef1234567890abcdef12');
      expect(result.buildId).toBe('build-12345-67890');
      expect(result.region).toBe('us-east-1');
      expect(result.url).toBe('maintainpro.app');
    });

    it('should handle unhealthy status', async () => {
      const unhealthyData = {
        status: 'error',
        timestamp: '2024-01-01T00:00:00.000Z',
        env: 'production',
        port: 5000,
        version: '1.0.0',
        uptime: 60,
        memory: {
          rss: 1073741824, // 1GB - high memory usage
          heapTotal: 536870912, // 512MB
          heapUsed: 536870912, // 512MB - 100% heap usage
          external: 67108864, // 64MB
          arrayBuffers: 10485760, // 10MB
        },
        websocket: {
          totalConnections: 0,
          activeConnections: 0,
          connectionsByWarehouse: {},
        },
        features: {
          auth: 'disabled',
          database: 'error',
          redis: 'disabled',
          email: 'disabled',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => unhealthyData,
      });

      await expect(healthService.getHealth()).rejects.toThrow('Failed to fetch health data');
    });
  });
});
