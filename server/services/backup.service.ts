/**
 * Database backup service for MaintAInPro CMMS
 * Handles automated database backups, validation, and cleanup
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { readFile, writeFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { BackupConfig, getBackupConfig, validateBackupConfig } from '../../config/backup';

const execAsync = promisify(exec);

export interface BackupResult {
  success: boolean;
  backupFile?: string;
  size?: number;
  duration?: number;
  checksum?: string;
  error?: string;
}

export interface BackupStatus {
  enabled: boolean;
  lastBackup?: Date;
  lastBackupSuccess?: boolean;
  nextBackup?: Date;
  totalBackups: number;
  lastError?: string;
  diskUsage?: {
    total: number;
    used: number;
    available: number;
  };
}

export class BackupService {
  private static instance: BackupService;
  private config: BackupConfig;
  private isRunning = false;
  private lastBackup?: Date;
  private lastBackupSuccess?: boolean;
  private lastError?: string;

  private constructor() {
    this.config = getBackupConfig();
    this.validateConfiguration();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Validate the backup configuration
   */
  private validateConfiguration(): void {
    const validation = validateBackupConfig(this.config);
    if (!validation.valid) {
      console.warn('Backup configuration issues:', validation.errors);
    }
  }

  /**
   * Create a database backup
   */
  public async createBackup(): Promise<BackupResult> {
    if (this.isRunning) {
      return {
        success: false,
        error: 'Backup already in progress',
      };
    }

    if (!this.config.enabled) {
      return {
        success: false,
        error: 'Backup is disabled',
      };
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `maintainpro_${timestamp}.sql`;
      const backupPath = path.join(this.config.storage.directory, filename);

      console.log(`Starting database backup to ${backupPath}`);

      // Create database backup using pg_dump
      const backupResult = await this.executePgDump(backupPath);
      
      // Validate the backup file
      const validation = await this.validateBackup(backupPath);
      
      if (!validation.valid) {
        await this.cleanup(backupPath);
        throw new Error(`Backup validation failed: ${validation.error}`);
      }

      // Calculate file size and checksum
      const stats = await stat(backupPath);
      const checksum = await this.calculateChecksum(backupPath);

      // Clean up old backups
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      this.lastBackup = new Date();
      this.lastBackupSuccess = true;
      this.lastError = undefined;

      console.log(`Backup completed successfully in ${duration}ms: ${backupPath}`);

      return {
        success: true,
        backupFile: backupPath,
        size: stats.size,
        duration,
        checksum,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.lastBackup = new Date();
      this.lastBackupSuccess = false;
      this.lastError = error instanceof Error ? error.message : String(error);

      console.error('Backup failed:', error);

      return {
        success: false,
        duration,
        error: this.lastError,
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    if (!existsSync(this.config.storage.directory)) {
      await mkdir(this.config.storage.directory, { recursive: true });
      console.log(`Created backup directory: ${this.config.storage.directory}`);
    }
  }

  /**
   * Execute pg_dump command
   */
  private async executePgDump(backupPath: string): Promise<void> {
    const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!dbUrl) {
      throw new Error('Database URL not configured');
    }

    // Parse database URL to extract connection parameters
    const url = new URL(dbUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1);
    const username = url.username;
    const password = url.password;

    // Build pg_dump command
    const command = [
      'pg_dump',
      '--host', host,
      '--port', port,
      '--username', username,
      '--dbname', database,
      '--no-password',
      '--verbose',
      '--file', backupPath
    ].join(' ');

    // Set environment variables for authentication
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    try {
      const { stdout, stderr } = await execAsync(command, { env });
      
      if (stderr && !stderr.includes('NOTICE:')) {
        console.warn('pg_dump warnings:', stderr);
      }
      
      console.log('pg_dump completed:', stdout);
    } catch (error) {
      throw new Error(`pg_dump failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate backup file
   */
  private async validateBackup(backupPath: string): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.validation.enabled) {
      return { valid: true };
    }

    try {
      // Check if file exists and has content
      const stats = await stat(backupPath);
      
      if (stats.size === 0) {
        return { valid: false, error: 'Backup file is empty' };
      }

      if (stats.size < 1024) {
        return { valid: false, error: 'Backup file is too small' };
      }

      // Check for SQL content
      const content = await readFile(backupPath, 'utf-8');
      
      if (!content.includes('PostgreSQL database dump')) {
        return { valid: false, error: 'Invalid backup file format' };
      }

      console.log(`Backup validation passed: ${stats.size} bytes`);
      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Calculate backup file checksum
   */
  private async calculateChecksum(backupPath: string): Promise<string> {
    const content = await readFile(backupPath);
    const hash = createHash(this.config.validation.checksumAlgorithm);
    hash.update(content);
    return hash.digest('hex');
  }

  /**
   * Clean up old backup files based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const files = await readdir(this.config.storage.directory);
      const backupFiles = files.filter(file => file.startsWith('maintainpro_') && file.endsWith('.sql'));
      
      if (backupFiles.length <= this.config.retention.daily) {
        return; // Not enough files to warrant cleanup
      }

      // Sort files by creation time (newest first)
      const filesWithStats = await Promise.all(
        backupFiles.map(async file => {
          const filePath = path.join(this.config.storage.directory, file);
          const stats = await stat(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        })
      );

      filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep files based on retention policy
      const now = new Date();
      const filesToDelete: string[] = [];

      for (let i = this.config.retention.daily; i < filesWithStats.length; i++) {
        const fileAge = now.getTime() - filesWithStats[i].mtime.getTime();
        const daysOld = fileAge / (24 * 60 * 60 * 1000);

        if (daysOld > this.config.retention.daily) {
          filesToDelete.push(filesWithStats[i].path);
        }
      }

      // Delete old files
      for (const filePath of filesToDelete) {
        await unlink(filePath);
        console.log(`Deleted old backup: ${path.basename(filePath)}`);
      }

      if (filesToDelete.length > 0) {
        console.log(`Cleaned up ${filesToDelete.length} old backup files`);
      }

    } catch (error) {
      console.error('Error during backup cleanup:', error);
    }
  }

  /**
   * Clean up a specific backup file
   */
  private async cleanup(backupPath: string): Promise<void> {
    try {
      if (existsSync(backupPath)) {
        await unlink(backupPath);
        console.log(`Cleaned up failed backup: ${backupPath}`);
      }
    } catch (error) {
      console.error('Error cleaning up backup file:', error);
    }
  }

  /**
   * Get current backup status
   */
  public async getStatus(): Promise<BackupStatus> {
    const totalBackups = await this.countBackups();
    
    return {
      enabled: this.config.enabled,
      lastBackup: this.lastBackup,
      lastBackupSuccess: this.lastBackupSuccess,
      nextBackup: this.calculateNextBackup(),
      totalBackups,
      lastError: this.lastError,
    };
  }

  /**
   * Count total backup files
   */
  private async countBackups(): Promise<number> {
    try {
      if (!existsSync(this.config.storage.directory)) {
        return 0;
      }

      const files = await readdir(this.config.storage.directory);
      return files.filter(file => file.startsWith('maintainpro_') && file.endsWith('.sql')).length;
    } catch {
      return 0;
    }
  }

  /**
   * Calculate next backup time
   */
  private calculateNextBackup(): Date | undefined {
    if (!this.config.enabled || !this.lastBackup) {
      return undefined;
    }

    return new Date(this.lastBackup.getTime() + this.config.schedule.interval);
  }

  /**
   * Test backup functionality without creating a full backup
   */
  public async testBackup(): Promise<{ success: boolean; message: string }> {
    try {
      // Test database connection
      const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      
      if (!dbUrl) {
        throw new Error('Database URL not configured');
      }

      // Test pg_dump availability
      await execAsync('pg_dump --version');

      // Test backup directory
      await this.ensureBackupDirectory();

      return {
        success: true,
        message: 'Backup system is properly configured',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const backupService = BackupService.getInstance();