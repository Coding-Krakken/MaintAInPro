
// @vitest-environment node
/**
 * Integration tests for backup API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { Express } from 'express';

// Mock the storage and other dependencies
vi.mock('../../server/storage', () => ({
  storage: {
    getWorkOrders: vi.fn().mockResolvedValue([]),
    getEquipment: vi.fn().mockResolvedValue([]),
    getParts: vi.fn().mockResolvedValue([]),
    getWarehouses: vi.fn().mockResolvedValue([]),
  },
}));

let app: Express;

describe('Backup API Endpoints', () => {
  beforeAll(async () => {
    // Import the app after setting up mocks
    const express = await import('express');
    const { registerRoutes } = await import('../../server/routes');

    app = express.default();
    await registerRoutes(app);
  });

  afterAll(() => {
    // Clean up any resources
  });

  describe('GET /api/backup/status', () => {
    it('should return backup status', async () => {
      const response = await request(app).get('/api/backup/status').expect('Content-Type', /json/);

      if (process.env.NODE_ENV === 'production') {
        // In production, should require authentication
        expect(response.status).toBe(401);
      } else {
        // In development or test, should allow unauthenticated access
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('backup');
        const backup = response.body.backup;
        expect(backup).toHaveProperty('enabled');
        expect(backup).toHaveProperty('totalBackups');
        expect(typeof backup.enabled).toBe('boolean');
        expect(typeof backup.totalBackups).toBe('number');
        // Optional properties that may be present
        if (backup.lastBackup) {
          expect(typeof backup.lastBackup).toBe('string'); // ISO date string
        }
        if (backup.nextBackup) {
          expect(typeof backup.nextBackup).toBe('string'); // ISO date string
        }
        if (backup.lastBackupSuccess !== undefined) {
          expect(typeof backup.lastBackupSuccess).toBe('boolean');
        }
      }
    });

    it('should handle service errors gracefully', async () => {
      // This test assumes the backup service might not be fully configured
      // in a test environment, which is expected behavior
      const response = await request(app).get('/api/backup/status');

      // Should not crash the server
      expect([200, 401, 500]).toContain(response.status);

      if (response.status === 500) {
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.message).toBe('string');
      }
    });
  });

  describe('Backup system integration', () => {
    it('should have backup service available', async () => {
      const { backupService } = await import('../../server/services/backup.service');

      expect(backupService).toBeDefined();
      expect(typeof backupService.getStatus).toBe('function');
      expect(typeof backupService.createBackup).toBe('function');
      expect(typeof backupService.testBackup).toBe('function');
    });

    it('should have backup configuration available', async () => {
      const { getBackupConfig } = await import('../../config/backup');

      const config = getBackupConfig();

      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('schedule');
      expect(config).toHaveProperty('retention');
      expect(config).toHaveProperty('storage');
      expect(config).toHaveProperty('validation');
      expect(config).toHaveProperty('notifications');
    });

    it('should have background job scheduler with backup job', async () => {
      const { backgroundJobScheduler } = await import('../../server/services/background-jobs');

      const jobStatus = backgroundJobScheduler.getJobStatus();

      // Should have the database backup job
      const backupJob = jobStatus.find(job => job.name === 'Database Backup');
      expect(backupJob).toBeDefined();

      if (backupJob) {
        expect(backupJob).toHaveProperty('interval');
        expect(backupJob).toHaveProperty('running');
        expect(backupJob).toHaveProperty('enabled');
        expect(typeof backupJob.running).toBe('boolean');
        expect(typeof backupJob.enabled).toBe('boolean');
      }
    });
  });
});
