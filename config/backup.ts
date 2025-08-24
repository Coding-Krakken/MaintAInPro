/**
 * Database backup configuration for MaintAInPro CMMS
 * Provides centralized backup settings and validation
 */

export interface BackupConfig {
  enabled: boolean;
  schedule: {
    interval: number; // in milliseconds
    cron?: string; // optional cron expression
  };
  retention: {
    daily: number; // days to keep daily backups
    weekly: number; // weeks to keep weekly backups
    monthly: number; // months to keep monthly backups
  };
  storage: {
    directory: string;
    compression: boolean;
    encryption?: boolean;
  };
  validation: {
    enabled: boolean;
    checksumAlgorithm: 'md5' | 'sha256';
  };
  notifications: {
    onSuccess: boolean;
    onFailure: boolean;
    webhookUrl?: string;
  };
}

export const defaultBackupConfig: BackupConfig = {
  enabled: process.env.BACKUP_ENABLED !== 'false',
  schedule: {
    interval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    cron: process.env.BACKUP_CRON || '0 2 * * *', // Daily at 2 AM
  },
  retention: {
    daily: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    weekly: parseInt(process.env.BACKUP_RETENTION_WEEKS || '12', 10),
    monthly: parseInt(process.env.BACKUP_RETENTION_MONTHS || '6', 10),
  },
  storage: {
    directory: process.env.BACKUP_DIR || '/var/backups/maintainpro',
    compression: process.env.BACKUP_COMPRESSION !== 'false',
    encryption: process.env.BACKUP_ENCRYPTION === 'true',
  },
  validation: {
    enabled: process.env.BACKUP_VALIDATION !== 'false',
    checksumAlgorithm: (process.env.BACKUP_CHECKSUM_ALGORITHM as 'md5' | 'sha256') || 'sha256',
  },
  notifications: {
    onSuccess: process.env.BACKUP_NOTIFY_SUCCESS === 'true',
    onFailure: process.env.BACKUP_NOTIFY_FAILURE !== 'false',
    webhookUrl: process.env.BACKUP_WEBHOOK_URL,
  },
};

/**
 * Validate backup configuration
 */
export function validateBackupConfig(config: BackupConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.schedule.interval < 60 * 60 * 1000) {
    errors.push('Backup interval must be at least 1 hour');
  }

  if (config.retention.daily < 1) {
    errors.push('Daily retention must be at least 1 day');
  }

  if (config.retention.weekly < 1) {
    errors.push('Weekly retention must be at least 1 week');
  }

  if (config.retention.monthly < 1) {
    errors.push('Monthly retention must be at least 1 month');
  }

  if (!config.storage.directory || config.storage.directory.trim() === '') {
    errors.push('Backup directory must be specified');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get the current backup configuration with environment overrides
 */
export function getBackupConfig(): BackupConfig {
  return defaultBackupConfig;
}