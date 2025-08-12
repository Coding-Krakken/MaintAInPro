#!/bin/bash

# MaintAInPro Domain Management Script
# This script helps manage domain aliases for automatic deployment pointing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCOPE="coding-krakken-projects"
MAIN_DOMAINS=("unitedautosupply.org" "www.unitedautosupply.org")
STABLE_DOMAINS=("uasmaintenance.com" "www.uasmaintenance.com")

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed. Please install it first:"
        echo "npm install -g vercel@latest"
        exit 1
    fi
    print_success "Vercel CLI is available"
}

# Function to get latest deployment for a branch
get_latest_deployment() {
    local branch=$1
    print_status "Getting latest deployment for branch: $branch"
    
    # Get the latest production deployment
    local deployment=$(vercel ls --scope $SCOPE 2>/dev/null | grep "● Ready" | grep "Production" | head -1 | awk '{print $2}' | sed 's/https:\/\///')
    
    if [ -z "$deployment" ]; then
        print_error "❌ No production deployment found for branch $branch"
        echo "deployment-url=" >> "$GITHUB_OUTPUT"
        echo "DEPLOYMENT_FOUND=false" >> "$GITHUB_ENV"
        # Optionally, trigger deployment or notify maintainers here
        return 1
    fi
    echo "$deployment"
}

# Function to update domain alias
update_domain_alias() {
    local deployment_url=$1
    local domain=$2
    
    print_status "Updating $domain -> $deployment_url"
    
    if vercel alias set "$deployment_url" "$domain" --scope "$SCOPE" 2>/dev/null; then
        print_success "✅ $domain updated successfully"
    else
        print_error "❌ Failed to update $domain"
        return 1
    fi
}

# Function to list current aliases
list_current_aliases() {
    print_status "Current domain aliases:"
    vercel alias ls --scope $SCOPE 2>/dev/null | grep -E "(unitedautosupply|uasmaintenance)" || print_warning "No matching aliases found"
}

# Function to update main branch domains
update_main_domains() {
    local deployment_url=$1
    print_status "Updating main branch domains..."
    
    for domain in "${MAIN_DOMAINS[@]}"; do
        update_domain_alias "$deployment_url" "$domain"
    done
}

# Function to update stable branch domains
update_stable_domains() {
    local deployment_url=$1
    print_status "Updating stable branch domains..."
    
    for domain in "${STABLE_DOMAINS[@]}"; do
        update_domain_alias "$deployment_url" "$domain"
    done
}

# Function to setup automatic pointing
setup_automatic_pointing() {
    print_status "Setting up automatic domain pointing..."
    
    # Check if GitHub Actions workflows exist
    if [ -f ".github/workflows/domain-management.yml" ]; then
        print_success "Domain management workflow found"
    else
        print_warning "Domain management workflow not found"
        echo "Please ensure the GitHub Action is properly configured"
    fi
    
    # Check Vercel configuration
    if [ -f "vercel.json" ]; then
        print_success "Vercel configuration found"
    else
        print_warning "vercel.json not found"
    fi
    
    print_status "Automatic pointing setup instructions:"
    echo "1. Ensure VERCEL_TOKEN is set in GitHub Secrets"
    echo "2. Ensure VERCEL_ORG_ID is set in GitHub Secrets"
    echo "3. Ensure VERCEL_PROJECT_ID is set in GitHub Secrets"
    echo "4. Push to main branch to update unitedautosupply.org"
    echo "5. Push to stable branch to update uasmaintenance.com"
}

# Function to verify domain pointing
verify_domain_pointing() {
    print_status "Verifying domain pointing..."
    
    echo ""
    echo "Main Branch Domains:"
    for domain in "${MAIN_DOMAINS[@]}"; do
        print_status "Checking $domain..."
        curl -s -I "https://$domain" | head -n 1 || print_warning "Could not reach $domain"
    done
    
    echo ""
    echo "Stable Branch Domains:"
    for domain in "${STABLE_DOMAINS[@]}"; do
        print_status "Checking $domain..."
        curl -s -I "https://$domain" | head -n 1 || print_warning "Could not reach $domain"
    done
}

# Main script logic
main() {
    echo "🚀 MaintAInPro Domain Management Script"
    echo "======================================"
    
    check_vercel_cli
    
    case "${1:-}" in
        "list")
            list_current_aliases
            ;;
        "update-main")
            deployment=$(get_latest_deployment "main")
            if [ $? -eq 0 ]; then
                update_main_domains "$deployment"
            fi
            ;;
        "update-stable")
            deployment=$(get_latest_deployment "stable")
            if [ $? -eq 0 ]; then
                update_stable_domains "$deployment"
            fi
            ;;
        "update-all")
            deployment=$(get_latest_deployment "main")
            if [ $? -eq 0 ]; then
                update_main_domains "$deployment"
                update_stable_domains "$deployment"
            fi
            ;;
        "setup")
            setup_automatic_pointing
            ;;
        "verify")
            verify_domain_pointing
            ;;
        "help"|*)
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  list          - List current domain aliases"
            echo "  update-main   - Update main branch domains (unitedautosupply.org)"
            echo "  update-stable - Update stable branch domains (uasmaintenance.com)"
            echo "  update-all    - Update all domains to latest deployment"
            echo "  setup         - Show setup instructions for automatic pointing"
            echo "  verify        - Verify domain pointing status"
            echo "  help          - Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 list"
            echo "  $0 update-main"
            echo "  $0 update-stable"
            echo "  $0 verify"
            ;;
    esac
}

# Run the main function with all arguments
main "$@"
