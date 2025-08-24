#!/bin/bash
#
# MaintAInPro Database Recovery Script
# Restores PostgreSQL database from backup files
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/maintainpro}"
LOG_FILE="${BACKUP_DIR}/recovery.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
    
    # Write to log file if directory exists
    if [[ -d "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS] [BACKUP_FILE]"
    echo ""
    echo "Options:"
    echo "  -l, --list              List available backup files"
    echo "  -f, --file FILE         Restore from specific backup file"
    echo "  -c, --confirm           Skip confirmation prompt"
    echo "  -v, --verify            Verify backup before restoration"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list"
    echo "  $0 --file /path/to/backup.sql"
    echo "  $0 --confirm /var/backups/maintainpro/maintainpro_20240825_120000.sql"
}

# Check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if psql is available
    if ! command -v psql >/dev/null 2>&1; then
        log "ERROR" "psql is not installed or not in PATH"
        exit 1
    fi
    
    # Check database connection
    if [[ -z "$DATABASE_URL" && -z "$POSTGRES_URL" ]]; then
        log "ERROR" "DATABASE_URL or POSTGRES_URL environment variable is required"
        exit 1
    fi
    
    log "INFO" "Prerequisites check passed"
}

# List available backup files
list_backups() {
    log "INFO" "Available backup files:"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "WARN" "Backup directory does not exist: $BACKUP_DIR"
        return 1
    fi
    
    local backup_files=($(find "$BACKUP_DIR" -name "maintainpro_*.sql" -type f | sort -r))
    
    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log "WARN" "No backup files found in $BACKUP_DIR"
        return 1
    fi
    
    echo ""
    printf "%-5s %-25s %-15s %-10s\n" "No." "Backup File" "Date" "Size"
    printf "%-5s %-25s %-15s %-10s\n" "---" "-----------" "----" "----"
    
    local i=1
    for backup_file in "${backup_files[@]}"; do
        local basename=$(basename "$backup_file")
        local file_date=$(stat -f%Sm -t "%Y-%m-%d %H:%M" "$backup_file" 2>/dev/null || stat -c%y "$backup_file" 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1 || echo "Unknown")
        local file_size=$(du -h "$backup_file" | cut -f1)
        
        printf "%-5d %-25s %-15s %-10s\n" "$i" "$basename" "$file_date" "$file_size"
        i=$((i + 1))
    done
    
    echo ""
    return 0
}

# Verify backup file
verify_backup() {
    local backup_file="$1"
    
    log "INFO" "Verifying backup file: $backup_file"
    
    # Check if file exists
    if [[ ! -f "$backup_file" ]]; then
        log "ERROR" "Backup file does not exist: $backup_file"
        return 1
    fi
    
    # Check file size
    if [[ ! -s "$backup_file" ]]; then
        log "ERROR" "Backup file is empty: $backup_file"
        return 1
    fi
    
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo 0)
    if [[ "$file_size" -lt 1024 ]]; then
        log "ERROR" "Backup file is too small: $file_size bytes"
        return 1
    fi
    
    # Check for PostgreSQL dump header
    if ! head -n 5 "$backup_file" | grep -q "PostgreSQL database dump"; then
        log "ERROR" "Backup file does not appear to be a valid PostgreSQL dump"
        return 1
    fi
    
    # Verify checksum if available
    local checksum_file=""
    if [[ -f "${backup_file}.sha256" ]]; then
        checksum_file="${backup_file}.sha256"
    elif [[ -f "${backup_file}.md5" ]]; then
        checksum_file="${backup_file}.md5"
    fi
    
    if [[ -n "$checksum_file" ]]; then
        log "INFO" "Verifying checksum..."
        local algorithm=$(basename "$checksum_file" | cut -d'.' -f2)
        
        if command -v ${algorithm}sum >/dev/null 2>&1; then
            local expected_checksum=$(cat "$checksum_file")
            local actual_checksum=$(${algorithm}sum "$backup_file" | cut -d' ' -f1)
            
            if [[ "$expected_checksum" == "$actual_checksum" ]]; then
                log "INFO" "Checksum verification passed"
            else
                log "ERROR" "Checksum verification failed"
                log "ERROR" "Expected: $expected_checksum"
                log "ERROR" "Actual:   $actual_checksum"
                return 1
            fi
        else
            log "WARN" "${algorithm}sum not available, skipping checksum verification"
        fi
    else
        log "WARN" "No checksum file found, skipping checksum verification"
    fi
    
    log "INFO" "Backup verification passed"
    return 0
}

# Parse database URL and restore database
restore_database() {
    local backup_file="$1"
    
    log "INFO" "Starting database restoration..."
    log "INFO" "Backup file: $backup_file"
    
    # Use DATABASE_URL or POSTGRES_URL
    local db_url="${DATABASE_URL:-$POSTGRES_URL}"
    
    if [[ -z "$db_url" ]]; then
        log "ERROR" "No database URL configured"
        return 1
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
    
    # Create a backup of current database before restoration (if possible)
    local pre_restore_backup="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql"
    log "INFO" "Creating pre-restoration backup: $pre_restore_backup"
    
    if pg_dump \
        --host="$host" \
        --port="$port" \
        --username="$username" \
        --dbname="$database" \
        --no-password \
        --file="$pre_restore_backup" 2>/dev/null; then
        log "INFO" "Pre-restoration backup created successfully"
    else
        log "WARN" "Could not create pre-restoration backup (database might be empty)"
    fi
    
    # Restore database with psql
    log "INFO" "Restoring database from backup..."
    
    if psql \
        --host="$host" \
        --port="$port" \
        --username="$username" \
        --dbname="$database" \
        --no-password \
        --file="$backup_file" \
        --single-transaction \
        --set ON_ERROR_STOP=on; then
        
        log "INFO" "Database restoration completed successfully"
        return 0
    else
        log "ERROR" "Database restoration failed"
        
        # Attempt to restore from pre-restoration backup if it exists
        if [[ -f "$pre_restore_backup" ]]; then
            log "INFO" "Attempting to restore from pre-restoration backup..."
            if psql \
                --host="$host" \
                --port="$port" \
                --username="$username" \
                --dbname="$database" \
                --no-password \
                --file="$pre_restore_backup" \
                --single-transaction \
                --set ON_ERROR_STOP=on; then
                log "INFO" "Rollback to pre-restoration state completed"
            else
                log "ERROR" "Rollback failed - manual intervention required"
            fi
        fi
        
        return 1
    fi
    
    # Unset password
    unset PGPASSWORD
}

# Get confirmation from user
confirm_restoration() {
    local backup_file="$1"
    
    echo ""
    log "WARN" "WARNING: This will replace the current database with the backup data!"
    log "WARN" "Database restoration is a destructive operation."
    echo ""
    log "INFO" "Backup file: $backup_file"
    log "INFO" "File size: $(du -h "$backup_file" | cut -f1)"
    log "INFO" "File date: $(stat -f%Sm -t "%Y-%m-%d %H:%M:%S" "$backup_file" 2>/dev/null || stat -c%y "$backup_file" 2>/dev/null | cut -d'.' -f1 || echo "Unknown")"
    echo ""
    
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    
    if [[ "$confirmation" != "yes" ]]; then
        log "INFO" "Restoration cancelled by user"
        exit 0
    fi
}

# Main execution
main() {
    local backup_file=""
    local skip_confirmation=false
    local verify_backup=false
    local list_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -l|--list)
                list_only=true
                shift
                ;;
            -f|--file)
                backup_file="$2"
                shift 2
                ;;
            -c|--confirm)
                skip_confirmation=true
                shift
                ;;
            -v|--verify)
                verify_backup=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            -*)
                log "ERROR" "Unknown option: $1"
                usage
                exit 1
                ;;
            *)
                if [[ -z "$backup_file" ]]; then
                    backup_file="$1"
                fi
                shift
                ;;
        esac
    done
    
    log "INFO" "Starting MaintAInPro database recovery process..."
    
    # List backups and exit if requested
    if [[ "$list_only" == true ]]; then
        list_backups
        exit 0
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # If no backup file specified, list available backups and ask user to choose
    if [[ -z "$backup_file" ]]; then
        if ! list_backups; then
            exit 1
        fi
        
        echo ""
        read -p "Enter backup file path or number: " choice
        
        if [[ "$choice" =~ ^[0-9]+$ ]]; then
            # User entered a number
            local backup_files=($(find "$BACKUP_DIR" -name "maintainpro_*.sql" -type f | sort -r))
            if [[ "$choice" -gt 0 && "$choice" -le ${#backup_files[@]} ]]; then
                backup_file="${backup_files[$((choice-1))]}"
            else
                log "ERROR" "Invalid backup number: $choice"
                exit 1
            fi
        else
            # User entered a file path
            backup_file="$choice"
        fi
    fi
    
    # Verify backup file if requested
    if [[ "$verify_backup" == true ]]; then
        if ! verify_backup "$backup_file"; then
            exit 1
        fi
    fi
    
    # Get confirmation unless skipped
    if [[ "$skip_confirmation" != true ]]; then
        confirm_restoration "$backup_file"
    fi
    
    # Restore database
    if restore_database "$backup_file"; then
        log "INFO" "Database recovery completed successfully"
        exit 0
    else
        log "ERROR" "Database recovery failed"
        exit 1
    fi
}

# Execute main function
main "$@"