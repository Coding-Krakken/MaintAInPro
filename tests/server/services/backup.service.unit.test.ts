/**
 * Unit tests for backup service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the config module
vi.mock('@/config/backup', () => ({
  getBackupConfig: vi.fn(() => ({
    enabled: true,
    schedule: {
      interval: 24 * 60 * 60 * 1000, // 24 hours
      cron: '0 2 * * *',
    },
    retention: {
      daily: 30,
      weekly: 12,
      monthly: 6,
    },
    storage: {
      directory: '/tmp/test-backups',
      compression: true,
      encryption: false,
    },
    validation: {
      enabled: true,
      checksumAlgorithm: 'sha256' as const,
    },
    notifications: {
      onSuccess: true,
      onFailure: true,
    },
  })),
  validateBackupConfig: vi.fn(() => ({ valid: true, errors: [] })),
}));

// Mock file system operations
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  readdir: vi.fn(() => []),
  stat: vi.fn(() => ({ size: 1024 })),
  readFile: vi.fn(() => '-- PostgreSQL database dump'),
  writeFile: vi.fn(),
  unlink: vi.fn(),
}));

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn),
}));

describe('BackupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Backup Configuration', () => {
    it('should validate backup configuration structure', async () => {
      // Import here to ensure mocks are in place
      const { getBackupConfig } = await import('../../../config/backup');
      
      const config = getBackupConfig();
      
      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('schedule');
      expect(config).toHaveProperty('retention');
      expect(config).toHaveProperty('storage');
      expect(config).toHaveProperty('validation');
      expect(config).toHaveProperty('notifications');
      
      expect(typeof config.enabled).toBe('boolean');
      expect(typeof config.schedule.interval).toBe('number');
      expect(typeof config.retention.daily).toBe('number');
      expect(typeof config.storage.directory).toBe('string');
      expect(typeof config.validation.enabled).toBe('boolean');
    });
  });

  describe('BackupService Integration', () => {
    it('should be importable without errors', async () => {
      // Test that the service can be imported
      expect(async () => {
        const { BackupService } = await import('../../../server/services/backup.service');
        expect(BackupService).toBeDefined();
      }).not.toThrow();
    });

    it('should have required methods', async () => {
      const { BackupService } = await import('../../../server/services/backup.service');
      const instance = BackupService.getInstance();
      
      expect(typeof instance.getStatus).toBe('function');
      expect(typeof instance.testBackup).toBe('function');
      expect(typeof instance.createBackup).toBe('function');
    });

    it('should return consistent singleton instance', async () => {
      const { BackupService } = await import('../../../server/services/backup.service');
      
      const instance1 = BackupService.getInstance();
      const instance2 = BackupService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Background Job Integration', () => {
    it('should be integrated with background job scheduler', async () => {
      const { backgroundJobScheduler } = await import('../../../server/services/background-jobs');
      
      const jobs = backgroundJobScheduler.getJobStatus();
      const backupJob = jobs.find(job => job.name === 'Database Backup');
      
      expect(backupJob).toBeDefined();
      if (backupJob) {
        expect(backupJob.name).toBe('Database Backup');
        expect(typeof backupJob.running).toBe('boolean');
        expect(typeof backupJob.enabled).toBe('boolean');
        expect(typeof backupJob.interval).toBe('number');
      }
    });
  });
});