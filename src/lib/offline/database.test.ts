import { describe, it, expect } from 'vitest';
import { OfflineDatabase, checkDatabaseHealth } from './database';

describe('Offline Database - Basic Functionality', () => {
  describe('Database Initialization', () => {
    it('should create database instance without errors', () => {
      expect(() => new OfflineDatabase()).not.toThrow();
    });

    it('should initialize health check function', () => {
      expect(typeof checkDatabaseHealth).toBe('function');
    });
  });

  describe('Health Check', () => {
    it('should return health object with required properties', async () => {
      const health = await checkDatabaseHealth();

      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('pendingOperations');
      expect(health).toHaveProperty('conflictCount');
      expect(typeof health.isHealthy).toBe('boolean');
      expect(typeof health.pendingOperations).toBe('number');
      expect(typeof health.conflictCount).toBe('number');
    });
  });
});
