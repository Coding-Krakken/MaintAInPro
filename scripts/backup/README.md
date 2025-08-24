# Database Backup and Recovery Scripts

This directory contains automated database backup and recovery scripts for
MaintAInPro CMMS.

## Scripts Overview

### `backup.sh`

Automated PostgreSQL database backup script with validation and cleanup.

**Features:**

- Automated pg_dump execution
- Backup file validation
- Checksum calculation (SHA256/MD5)
- Retention policy enforcement
- Comprehensive logging
- Error handling and recovery

**Usage:**

```bash
# Run manual backup
./scripts/backup/backup.sh

# Or use npm script
npm run backup:create
```

**Environment Variables:**

- `DATABASE_URL` or `POSTGRES_URL` - Database connection string (required)
- `BACKUP_DIR` - Backup directory (default: `/var/backups/maintainpro`)
- `BACKUP_RETENTION_DAYS` - Days to keep backups (default: 30)
- `BACKUP_CHECKSUM_ALGORITHM` - Checksum algorithm (default: `sha256`)

### `recovery.sh`

Database recovery script with interactive backup selection and rollback
protection.

**Features:**

- Interactive backup file selection
- Backup verification before restoration
- Pre-restoration backup creation
- Automatic rollback on failure
- Checksum verification
- Confirmation prompts for safety

**Usage:**

```bash
# List available backups
./scripts/backup/recovery.sh --list

# Restore from specific file
./scripts/backup/recovery.sh --file /path/to/backup.sql

# Restore with verification
./scripts/backup/recovery.sh --verify --file backup.sql

# Skip confirmation (for automation)
./scripts/backup/recovery.sh --confirm backup.sql

# Or use npm script
npm run backup:restore
```

**Options:**

- `-l, --list` - List available backup files
- `-f, --file FILE` - Restore from specific backup file
- `-c, --confirm` - Skip confirmation prompt
- `-v, --verify` - Verify backup before restoration
- `-h, --help` - Show help message

### `validate.sh`

Comprehensive backup system validation script.

**Features:**

- System prerequisites validation
- Database connection testing
- Existing backup file verification
- Configuration validation
- Test backup creation
- Comprehensive reporting

**Usage:**

```bash
# Validate backup system
./scripts/backup/validate.sh

# Or use npm script
npm run backup:validate
```

**Validation Checks:**

1. **Prerequisites:**
   - PostgreSQL client tools (`pg_dump`, `psql`)
   - Database URL configuration
   - Backup directory permissions

2. **Database Connection:**
   - URL parsing and validation
   - Connection testing
   - Version compatibility

3. **Existing Backups:**
   - File format validation
   - Size and content checks
   - Checksum verification

4. **Configuration:**
   - Backup settings validation
   - Environment variable checks
   - TypeScript configuration syntax

5. **Test Operations:**
   - Schema-only backup test
   - File creation and cleanup
   - Error handling verification

## Configuration

### Environment Variables

```bash
# Required
DATABASE_URL=postgres://user:pass@host:port/database
# or
POSTGRES_URL=postgres://user:pass@host:port/database

# Optional
BACKUP_ENABLED=true                    # Enable/disable backups
BACKUP_DIR=/var/backups/maintainpro   # Backup directory
BACKUP_RETENTION_DAYS=30              # Retention period
BACKUP_COMPRESSION=true               # Enable compression
BACKUP_VALIDATION=true                # Enable validation
BACKUP_CHECKSUM_ALGORITHM=sha256      # Checksum algorithm
BACKUP_NOTIFY_SUCCESS=true            # Notify on success
BACKUP_NOTIFY_FAILURE=true            # Notify on failure
BACKUP_WEBHOOK_URL=https://...        # Webhook for notifications
```

### Backup Configuration File

The backup system uses TypeScript configuration in `config/backup.ts`:

```typescript
export interface BackupConfig {
  enabled: boolean;
  schedule: {
    interval: number; // milliseconds
    cron?: string; // cron expression
  };
  retention: {
    daily: number; // days
    weekly: number; // weeks
    monthly: number; // months
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
```

## Backup File Naming

Backup files follow the naming convention:

```
maintainpro_YYYYMMDD_HHMMSS.sql
maintainpro_YYYYMMDD_HHMMSS.sql.sha256  # Checksum file
```

Example:

- `maintainpro_20240825_143022.sql`
- `maintainpro_20240825_143022.sql.sha256`

## Integration

### Background Job Scheduler

The backup system integrates with the existing background job scheduler:

```typescript
// Backup job runs every 24 hours
{
  name: 'Database Backup',
  interval: 24 * 60 * 60 * 1000, // 24 hours
  enabled: process.env.BACKUP_ENABLED !== 'false'
}
```

### API Endpoint

Backup status is available via REST API:

```bash
GET /api/backup/status
```

Response:

```json
{
  "timestamp": "2024-08-25T14:30:00Z",
  "backup": {
    "enabled": true,
    "lastBackup": "2024-08-25T02:00:00Z",
    "lastBackupSuccess": true,
    "nextBackup": "2024-08-26T02:00:00Z",
    "totalBackups": 15,
    "diskUsage": {
      "total": 1000000000,
      "used": 250000000,
      "available": 750000000
    }
  }
}
```

### NPM Scripts

The following npm scripts are available:

```bash
npm run backup:validate   # Validate backup system
npm run backup:create     # Create manual backup
npm run backup:restore    # Interactive restore
```

## Error Handling

### Common Issues

1. **Permission Denied**
   - Ensure backup directory is writable
   - Check PostgreSQL user permissions

2. **Connection Failed**
   - Verify database URL configuration
   - Check network connectivity
   - Validate credentials

3. **pg_dump Not Found**
   - Install PostgreSQL client tools
   - Update PATH environment variable

4. **Disk Space**
   - Monitor backup directory space
   - Adjust retention policies
   - Enable compression

### Troubleshooting

1. **Run validation script:**

   ```bash
   npm run backup:validate
   ```

2. **Check logs:**

   ```bash
   tail -f /var/backups/maintainpro/backup.log
   ```

3. **Test database connection:**

   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

4. **Manual backup test:**
   ```bash
   pg_dump $DATABASE_URL --schema-only
   ```

## Security Considerations

1. **Database Credentials:**
   - Use environment variables
   - Avoid hardcoding passwords
   - Consider connection pooling URIs

2. **Backup Files:**
   - Secure backup directory permissions (600/700)
   - Consider encryption at rest
   - Implement access controls

3. **Network Security:**
   - Use SSL/TLS connections
   - Restrict database access
   - Monitor connection attempts

4. **Audit Trail:**
   - All backup operations are logged
   - Failed attempts are recorded
   - Success/failure notifications

## Monitoring and Alerting

### Health Checks

The backup system provides health check endpoints:

```bash
# Overall system health
GET /api/health

# Backup-specific status
GET /api/backup/status
```

### Notifications

Configure webhooks for backup events:

```bash
BACKUP_WEBHOOK_URL=https://hooks.slack.com/services/...
BACKUP_NOTIFY_SUCCESS=true
BACKUP_NOTIFY_FAILURE=true
```

### Metrics

Key metrics to monitor:

- Backup success/failure rate
- Backup file sizes and growth
- Backup duration trends
- Disk usage in backup directory
- Recovery test results

## Recovery Procedures

### Full Database Recovery

1. **Identify backup file:**

   ```bash
   npm run backup:restore -- --list
   ```

2. **Verify backup:**

   ```bash
   npm run backup:restore -- --verify --file backup.sql
   ```

3. **Perform recovery:**
   ```bash
   npm run backup:restore -- --file backup.sql
   ```

### Point-in-Time Recovery

For point-in-time recovery, use the backup file closest to the desired time:

1. List backups with timestamps
2. Select appropriate backup
3. Follow full recovery procedure
4. Apply any necessary manual corrections

### Testing Recovery

Regularly test recovery procedures:

1. **Automated tests:** Use CI/CD pipelines
2. **Manual tests:** Quarterly recovery drills
3. **Documentation:** Keep runbooks updated
4. **Training:** Ensure team familiarity

## Maintenance

### Regular Tasks

**Daily:**

- Monitor backup job execution
- Check backup file creation
- Verify disk space availability

**Weekly:**

- Review backup logs
- Test random backup file
- Validate configuration

**Monthly:**

- Full recovery test
- Update documentation
- Review retention policies
- Performance optimization

### Capacity Planning

Monitor and plan for:

- Database growth trends
- Backup file size increases
- Storage capacity requirements
- Network bandwidth for backups

---

For additional support, see the main project documentation or contact the
development team.
