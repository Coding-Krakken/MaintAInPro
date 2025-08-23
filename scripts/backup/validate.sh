#!/bin/bash
#
# MaintAInPro Backup Validation Script  
# Validates backup files and system configuration
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/maintainpro}"

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
        "SUCCESS")
            echo -e "${GREEN}[SUCCESS]${NC} $message"
            ;;
    esac
}

# Validate system prerequisites
validate_prerequisites() {
    local errors=0
    
    log "INFO" "Validating system prerequisites..."
    
    # Check if pg_dump is available
    if command -v pg_dump >/dev/null 2>&1; then
        local pg_version=$(pg_dump --version | head -n1)
        log "INFO" "PostgreSQL client found: $pg_version"
    else
        log "ERROR" "pg_dump is not installed or not in PATH"
        errors=$((errors + 1))
    fi
    
    # Check if psql is available
    if command -v psql >/dev/null 2>&1; then
        local psql_version=$(psql --version | head -n1)
        log "INFO" "PostgreSQL psql found: $psql_version"
    else
        log "ERROR" "psql is not installed or not in PATH"
        errors=$((errors + 1))
    fi
    
    # Check database URL
    if [[ -n "$DATABASE_URL" || -n "$POSTGRES_URL" ]]; then
        log "INFO" "Database URL configured"
    else
        log "ERROR" "DATABASE_URL or POSTGRES_URL environment variable is required"
        errors=$((errors + 1))
    fi
    
    # Check backup directory
    if [[ -d "$BACKUP_DIR" ]]; then
        log "INFO" "Backup directory exists: $BACKUP_DIR"
        
        # Check write permissions
        if [[ -w "$BACKUP_DIR" ]]; then
            log "INFO" "Backup directory is writable"
        else
            log "ERROR" "Backup directory is not writable: $BACKUP_DIR"
            errors=$((errors + 1))
        fi
    else
        log "WARN" "Backup directory does not exist: $BACKUP_DIR"
        
        # Try to create it
        if mkdir -p "$BACKUP_DIR" 2>/dev/null; then
            log "INFO" "Created backup directory: $BACKUP_DIR"
        else
            log "ERROR" "Cannot create backup directory: $BACKUP_DIR"
            errors=$((errors + 1))
        fi
    fi
    
    return $errors
}

# Validate database connection
validate_database_connection() {
    local errors=0
    
    log "INFO" "Validating database connection..."
    
    local db_url="${DATABASE_URL:-$POSTGRES_URL}"
    
    if [[ -z "$db_url" ]]; then
        log "ERROR" "No database URL configured"
        return 1
    fi
    
    # Parse database URL
    local parsed_url
    if command -v node >/dev/null 2>&1; then
        parsed_url=$(node -e "
            try {
                const url = new URL('$db_url');
                console.log(JSON.stringify({
                    host: url.hostname,
                    port: url.port || '5432',
                    database: url.pathname.slice(1),
                    username: url.username,
                    password: url.password ? '***' : ''
                }));
            } catch (e) {
                console.error('Invalid database URL');
                process.exit(1);
            }
        ")
        
        if [[ $? -eq 0 ]]; then
            log "INFO" "Database URL parsed successfully"
            log "INFO" "Connection details: $parsed_url"
        else
            log "ERROR" "Invalid database URL format"
            errors=$((errors + 1))
        fi
        
        # Test actual connection
        local host=$(echo "$parsed_url" | grep -o '"host":"[^"]*"' | cut -d'"' -f4)
        local port=$(echo "$parsed_url" | grep -o '"port":"[^"]*"' | cut -d'"' -f4)
        local database=$(echo "$parsed_url" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
        local username=$(echo "$parsed_url" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
        
        # Extract password from original URL
        local clean_url="${db_url#postgresql://}"
        clean_url="${clean_url#postgres://}"
        local auth="${clean_url%@*}"
        local password="${auth##*:}"
        
        export PGPASSWORD="$password"
        
        if psql \
            --host="$host" \
            --port="$port" \
            --username="$username" \
            --dbname="$database" \
            --no-password \
            --command="SELECT version();" >/dev/null 2>&1; then
            
            log "INFO" "Database connection successful"
        else
            log "ERROR" "Cannot connect to database"
            errors=$((errors + 1))
        fi
        
        unset PGPASSWORD
    else
        log "WARN" "Node.js not available, skipping detailed URL validation"
    fi
    
    return $errors
}

# Validate existing backup files
validate_backup_files() {
    local errors=0
    
    log "INFO" "Validating existing backup files..."
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        log "WARN" "Backup directory does not exist: $BACKUP_DIR"
        return 0
    fi
    
    local backup_files=($(find "$BACKUP_DIR" -name "maintainpro_*.sql" -type f 2>/dev/null))
    
    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log "WARN" "No backup files found in $BACKUP_DIR"
        return 0
    fi
    
    log "INFO" "Found ${#backup_files[@]} backup files"
    
    for backup_file in "${backup_files[@]}"; do
        local basename=$(basename "$backup_file")
        local file_valid=true
        
        # Check file size
        if [[ ! -s "$backup_file" ]]; then
            log "ERROR" "$basename: Backup file is empty"
            errors=$((errors + 1))
            file_valid=false
        else
            local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo 0)
            if [[ "$file_size" -lt 1024 ]]; then
                log "ERROR" "$basename: Backup file is too small ($file_size bytes)"
                errors=$((errors + 1))
                file_valid=false
            fi
        fi
        
        # Check PostgreSQL dump header
        if [[ "$file_valid" == true ]]; then
            if head -n 5 "$backup_file" | grep -q "PostgreSQL database dump"; then
                log "INFO" "$basename: Valid PostgreSQL dump format"
            else
                log "ERROR" "$basename: Invalid PostgreSQL dump format"
                errors=$((errors + 1))
                file_valid=false
            fi
        fi
        
        # Check checksum if available
        local checksum_file=""
        if [[ -f "${backup_file}.sha256" ]]; then
            checksum_file="${backup_file}.sha256"
        elif [[ -f "${backup_file}.md5" ]]; then
            checksum_file="${backup_file}.md5"
        fi
        
        if [[ -n "$checksum_file" && "$file_valid" == true ]]; then
            local algorithm=$(basename "$checksum_file" | cut -d'.' -f2)
            
            if command -v ${algorithm}sum >/dev/null 2>&1; then
                local expected_checksum=$(cat "$checksum_file")
                local actual_checksum=$(${algorithm}sum "$backup_file" | cut -d' ' -f1)
                
                if [[ "$expected_checksum" == "$actual_checksum" ]]; then
                    log "INFO" "$basename: Checksum validation passed"
                else
                    log "ERROR" "$basename: Checksum validation failed"
                    errors=$((errors + 1))
                fi
            else
                log "WARN" "$basename: ${algorithm}sum not available for checksum validation"
            fi
        fi
    done
    
    return $errors
}

# Validate backup configuration
validate_backup_config() {
    local errors=0
    
    log "INFO" "Validating backup configuration..."
    
    # Check Node.js for running configuration validation
    if command -v node >/dev/null 2>&1; then
        local config_file="$PROJECT_DIR/config/backup.ts"
        
        if [[ -f "$config_file" ]]; then
            log "INFO" "Backup configuration file exists"
            
            # Try to compile and validate the configuration
            if node -e "
                const ts = require('typescript');
                const fs = require('fs');
                
                try {
                    const source = fs.readFileSync('$config_file', 'utf8');
                    const result = ts.transpile(source, { module: ts.ModuleKind.CommonJS });
                    console.log('Configuration file syntax is valid');
                } catch (error) {
                    console.error('Configuration file has syntax errors:', error.message);
                    process.exit(1);
                }
            " 2>/dev/null; then
                log "INFO" "Backup configuration syntax is valid"
            else
                log "ERROR" "Backup configuration has syntax errors"
                errors=$((errors + 1))
            fi
        else
            log "ERROR" "Backup configuration file not found: $config_file"
            errors=$((errors + 1))
        fi
    else
        log "WARN" "Node.js not available, skipping configuration validation"
    fi
    
    # Check environment variables
    local env_vars=(
        "BACKUP_ENABLED:optional"
        "BACKUP_RETENTION_DAYS:optional"
        "BACKUP_DIR:optional"
        "BACKUP_COMPRESSION:optional"
        "BACKUP_VALIDATION:optional"
    )
    
    for env_var in "${env_vars[@]}"; do
        local var_name=$(echo "$env_var" | cut -d':' -f1)
        local var_required=$(echo "$env_var" | cut -d':' -f2)
        local var_value=$(eval "echo \$$var_name")
        
        if [[ -n "$var_value" ]]; then
            log "INFO" "$var_name is set"
        elif [[ "$var_required" == "required" ]]; then
            log "ERROR" "$var_name is required but not set"
            errors=$((errors + 1))
        else
            log "INFO" "$var_name is using default value"
        fi
    done
    
    return $errors
}

# Test backup creation (dry run)
test_backup_creation() {
    local errors=0
    
    log "INFO" "Testing backup creation (dry run)..."
    
    # Check if we can create a test backup
    local test_backup_dir="/tmp/maintainpro_backup_test"
    local test_backup_file="$test_backup_dir/test_backup.sql"
    
    # Create test directory
    if mkdir -p "$test_backup_dir" 2>/dev/null; then
        log "INFO" "Created test backup directory: $test_backup_dir"
    else
        log "ERROR" "Cannot create test backup directory: $test_backup_dir"
        return 1
    fi
    
    # Test pg_dump with schema only
    local db_url="${DATABASE_URL:-$POSTGRES_URL}"
    
    if [[ -z "$db_url" ]]; then
        log "ERROR" "No database URL configured"
        rm -rf "$test_backup_dir"
        return 1
    fi
    
    # Parse database URL
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
    
    export PGPASSWORD="$password"
    
    if pg_dump \
        --host="$host" \
        --port="$port" \
        --username="$username" \
        --dbname="$database" \
        --no-password \
        --schema-only \
        --file="$test_backup_file" 2>/dev/null; then
        
        log "INFO" "Test backup creation successful"
        
        # Verify test backup
        if [[ -s "$test_backup_file" ]] && head -n 5 "$test_backup_file" | grep -q "PostgreSQL database dump"; then
            log "INFO" "Test backup file is valid"
        else
            log "ERROR" "Test backup file is invalid"
            errors=$((errors + 1))
        fi
    else
        log "ERROR" "Test backup creation failed"
        errors=$((errors + 1))
    fi
    
    unset PGPASSWORD
    
    # Cleanup test files
    rm -rf "$test_backup_dir"
    
    return $errors
}

# Main validation function
main() {
    local total_errors=0
    
    log "INFO" "Starting MaintAInPro backup system validation..."
    echo ""
    
    # Run all validation checks
    validate_prerequisites
    total_errors=$((total_errors + $?))
    echo ""
    
    validate_database_connection
    total_errors=$((total_errors + $?))
    echo ""
    
    validate_backup_files
    total_errors=$((total_errors + $?))
    echo ""
    
    validate_backup_config
    total_errors=$((total_errors + $?))
    echo ""
    
    test_backup_creation
    total_errors=$((total_errors + $?))
    echo ""
    
    # Summary
    if [[ $total_errors -eq 0 ]]; then
        log "SUCCESS" "All backup system validations passed!"
        log "INFO" "Backup system is ready for production use"
        exit 0
    else
        log "ERROR" "Backup system validation failed with $total_errors errors"
        log "ERROR" "Please fix the issues above before using the backup system"
        exit 1
    fi
}

# Execute main function
main "$@"