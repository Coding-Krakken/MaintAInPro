#!/bin/bash
#
# MaintAInPro Database Backup Script
# Creates automated PostgreSQL database backups with validation
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/maintainpro}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
    esac
    
    # Write to log file if directory exists
    if [[ -d "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if pg_dump is available
    if ! command -v pg_dump >/dev/null 2>&1; then
        log "ERROR" "pg_dump is not installed or not in PATH"
        exit 1
    fi
    
    # Check database connection
    if [[ -z "$DATABASE_URL" && -z "$POSTGRES_URL" ]]; then
        log "ERROR" "DATABASE_URL or POSTGRES_URL environment variable is required"
        exit 1
    fi
    
    log "INFO" "Prerequisites check passed"
}

# Create backup directory
create_backup_directory() {
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "INFO" "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Create database backup
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/maintainpro_$timestamp.sql"
    
    log "INFO" "Starting database backup..."
    log "INFO" "Backup file: $backup_file"
    
    # Use DATABASE_URL or POSTGRES_URL
    local db_url="${DATABASE_URL:-$POSTGRES_URL}"
    
    if [[ -z "$db_url" ]]; then
        log "ERROR" "No database URL configured"
        exit 1
    fi
    
    # Parse database URL
    local parsed_url
    if command -v node >/dev/null 2>&1; then
        # Use Node.js to parse URL if available
        parsed_url=$(node -e "
            const url = new URL('$db_url');
            console.log(JSON.stringify({
                host: url.hostname,
                port: url.port || '5432',
                database: url.pathname.slice(1),
                username: url.username,
                password: url.password
            }));
        ")
        
        local host=$(echo "$parsed_url" | grep -o '"host":"[^"]*"' | cut -d'"' -f4)
        local port=$(echo "$parsed_url" | grep -o '"port":"[^"]*"' | cut -d'"' -f4)
        local database=$(echo "$parsed_url" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
        local username=$(echo "$parsed_url" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
        local password=$(echo "$parsed_url" | grep -o '"password":"[^"]*"' | cut -d'"' -f4)
    else
        # Fallback: basic URL parsing with bash
        local clean_url="${db_url#postgresql://}"
        clean_url="${clean_url#postgres://}"
        
        local auth_host="${clean_url%/*}"
        local database="${clean_url##*/}"
        database="${database%%\?*}"
        
        local auth="${auth_host%@*}"
        local host="${auth_host##*@}"
        
        local username="${auth%:*}"
        local password="${auth##*:}"
        
        # Extract port if present
        if [[ "$host" == *:* ]]; then
            local port="${host##*:}"
            host="${host%:*}"
        else
            local port="5432"
        fi
    fi
    
    log "INFO" "Connecting to database: $host:$port/$database"
    
    # Set password environment variable
    export PGPASSWORD="$password"
    
    # Create backup with pg_dump
    if pg_dump \
        --host="$host" \
        --port="$port" \
        --username="$username" \
        --dbname="$database" \
        --no-password \
        --verbose \
        --file="$backup_file"; then
        
        log "INFO" "Database backup completed successfully"
        
        # Validate backup
        validate_backup "$backup_file"
        
        # Calculate file size
        local file_size=$(du -h "$backup_file" | cut -f1)
        log "INFO" "Backup file size: $file_size"
        
        echo "$backup_file"
    else
        log "ERROR" "Database backup failed"
        exit 1
    fi
    
    # Unset password
    unset PGPASSWORD
}

# Validate backup file
validate_backup() {
    local backup_file="$1"
    
    log "INFO" "Validating backup file..."
    
    # Check if file exists and has content
    if [[ ! -f "$backup_file" ]]; then
        log "ERROR" "Backup file does not exist: $backup_file"
        exit 1
    fi
    
    if [[ ! -s "$backup_file" ]]; then
        log "ERROR" "Backup file is empty: $backup_file"
        exit 1
    fi
    
    # Check file size (should be at least 1KB)
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo 0)
    if [[ "$file_size" -lt 1024 ]]; then
        log "ERROR" "Backup file is too small: $file_size bytes"
        exit 1
    fi
    
    # Check for PostgreSQL dump header
    if ! head -n 5 "$backup_file" | grep -q "PostgreSQL database dump"; then
        log "ERROR" "Backup file does not appear to be a valid PostgreSQL dump"
        exit 1
    fi
    
    log "INFO" "Backup validation passed"
}

# Clean up old backups
cleanup_old_backups() {
    local retention_days="${BACKUP_RETENTION_DAYS:-30}"
    
    log "INFO" "Cleaning up backups older than $retention_days days..."
    
    if command -v find >/dev/null 2>&1; then
        local deleted_count=$(find "$BACKUP_DIR" -name "maintainpro_*.sql" -mtime +$retention_days -delete -print | wc -l)
        if [[ "$deleted_count" -gt 0 ]]; then
            log "INFO" "Deleted $deleted_count old backup files"
        fi
    else
        log "WARN" "find command not available, skipping cleanup"
    fi
}

# Calculate checksum
calculate_checksum() {
    local backup_file="$1"
    local algorithm="${BACKUP_CHECKSUM_ALGORITHM:-sha256}"
    
    if command -v ${algorithm}sum >/dev/null 2>&1; then
        local checksum=$(${algorithm}sum "$backup_file" | cut -d' ' -f1)
        echo "$checksum" > "${backup_file}.${algorithm}"
        log "INFO" "Calculated $algorithm checksum: $checksum"
    else
        log "WARN" "${algorithm}sum not available, skipping checksum calculation"
    fi
}

# Main execution
main() {
    log "INFO" "Starting MaintAInPro database backup process..."
    
    # Check prerequisites
    check_prerequisites
    
    # Create backup directory
    create_backup_directory
    
    # Create backup
    local backup_file=$(create_backup)
    
    # Calculate checksum
    calculate_checksum "$backup_file"
    
    # Clean up old backups
    cleanup_old_backups
    
    log "INFO" "Backup process completed successfully"
    log "INFO" "Backup file: $backup_file"
}

# Execute main function
main "$@"