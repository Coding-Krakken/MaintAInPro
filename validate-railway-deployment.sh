#!/bin/bash

# Local Railway Deployment Validator
# This script tests the Railway deployment process locally before pushing

set -e

echo "🚀 MaintAInPro Railway Deployment Validator"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions for colored output
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

info() {
    echo -e "ℹ️  $1"
}

# Cleanup function
cleanup() {
    info "Cleaning up..."
    docker stop railway-local-test 2>/dev/null || true
    docker rm railway-local-test 2>/dev/null || true
    docker rmi railway-local-test:latest 2>/dev/null || true
}

# Set up trap for cleanup
trap cleanup EXIT

# Check prerequisites
echo
info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "npm is not installed or not in PATH"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    error "curl is not installed or not in PATH"
    exit 1
fi

success "Prerequisites check passed"

# Test 1: Configuration validation
echo
info "Test 1: Validating Railway configuration..."

if [ ! -f railway.toml ]; then
    error "railway.toml not found"
    exit 1
fi

if [ ! -f Dockerfile ]; then
    error "Dockerfile not found"
    exit 1
fi

# Check railway.toml content
if ! grep -q "builder.*dockerfile" railway.toml; then
    error "Dockerfile builder not configured in railway.toml"
    exit 1
fi

if ! grep -q "healthcheckPath" railway.toml; then
    error "Health check path not configured in railway.toml"
    exit 1
fi

if ! grep -q "startCommand" railway.toml; then
    error "Start command not configured in railway.toml"
    exit 1
fi

# Check Dockerfile content
if ! grep -q "HEALTHCHECK" Dockerfile; then
    error "HEALTHCHECK not found in Dockerfile"
    exit 1
fi

if ! grep -q "curl" Dockerfile; then
    error "curl not installed in Dockerfile (required for health checks)"
    exit 1
fi

success "Configuration validation passed"

# Test 2: Local build
echo
info "Test 2: Testing local build..."

npm ci
npm run build

if [ $? -ne 0 ]; then
    error "Local build failed"
    exit 1
fi

success "Local build passed"

# Test 3: Environment file handling
echo
info "Test 3: Testing environment file handling..."

# Backup existing .env.local if it exists
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
fi

# Test without .env.local
rm -f .env.local
info "Testing build without .env.local..."
if ! docker build -t railway-local-test:latest . > /dev/null 2>&1; then
    error "Build failed without .env.local"
    exit 1
fi

# Test with .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=https://test.supabase.co
VITE_SUPABASE_ANON_KEY=test-key
VITE_APP_VERSION=local-test
VITE_APP_ENVIRONMENT=test
EOF

info "Testing build with .env.local..."
if ! docker build -t railway-local-test:latest . > /dev/null 2>&1; then
    error "Build failed with .env.local"
    exit 1
fi

# Restore backup if it existed
if [ -f .env.local.backup ]; then
    mv .env.local.backup .env.local
fi

success "Environment file handling passed"

# Test 4: Docker container startup
echo
info "Test 4: Testing Docker container startup..."

# Start container
docker run -d --name railway-local-test -p 3000:3000 -e PORT=3000 -e NODE_ENV=production railway-local-test:latest

# Wait for container to be ready
info "Waiting for container to be ready..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker exec railway-local-test curl -f http://localhost:3000/ > /dev/null 2>&1; then
        success "Container is healthy and responding"
        break
    fi
    echo -n "."
    sleep 2
    timeout=$((timeout-2))
done

if [ $timeout -eq 0 ]; then
    error "Container failed to start within timeout"
    docker logs railway-local-test
    exit 1
fi

success "Container startup passed"

# Test 5: Health check validation
echo
info "Test 5: Testing health check endpoint..."

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)

if [ "$response" = "200" ]; then
    success "Health check passed (HTTP $response)"
else
    error "Health check failed (HTTP $response)"
    docker logs railway-local-test
    exit 1
fi

success "Health check validation passed"

# Test 6: Load testing
echo
info "Test 6: Running basic load test..."

# Check if Apache Bench is available
if command -v ab &> /dev/null; then
    ab -n 50 -c 5 http://localhost:3000/ > load_test.log 2>&1
    
    if grep -q "Failed requests:        0" load_test.log; then
        success "Load test passed - no failed requests"
    else
        warning "Load test had some failed requests - check load_test.log"
    fi
    
    rm -f load_test.log
else
    # Simple curl-based load test
    info "Apache Bench not available, running simple load test..."
    for i in {1..10}; do
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
        if [ "$response" != "200" ]; then
            error "Load test failed on request $i (HTTP $response)"
            exit 1
        fi
    done
    success "Simple load test passed"
fi

# Test 7: Resource usage check
echo
info "Test 7: Checking resource usage..."

# Get memory usage
memory_usage=$(docker stats railway-local-test --no-stream --format "{{.MemUsage}}" 2>/dev/null || echo "Unknown")
cpu_usage=$(docker stats railway-local-test --no-stream --format "{{.CPUPerc}}" 2>/dev/null || echo "Unknown")

info "Memory usage: $memory_usage"
info "CPU usage: $cpu_usage"

# Check if container is still running
if docker ps | grep railway-local-test > /dev/null; then
    success "Container is still running after tests"
else
    error "Container stopped unexpectedly"
    exit 1
fi

success "Resource usage check passed"

# Test 8: Railway deployment script validation
echo
info "Test 8: Validating deployment script..."

if [ -f railway-deploy-fixed.sh ]; then
    chmod +x railway-deploy-fixed.sh
    
    # Test script syntax
    if bash -n railway-deploy-fixed.sh; then
        success "Deployment script syntax is valid"
    else
        error "Deployment script has syntax errors"
        exit 1
    fi
else
    warning "Railway deployment script not found"
fi

# Final summary
echo
echo "🎉 All Railway deployment tests passed!"
echo "==========================================="
echo
success "Your application is ready for Railway deployment"
echo
info "Next steps:"
echo "  1. Push your changes to create a pull request"
echo "  2. The CI/CD pipeline will run the full Railway deployment test"
echo "  3. If all tests pass, your PR will be ready for merge"
echo "  4. Use './railway-deploy-fixed.sh' to deploy to Railway"
echo
info "For troubleshooting, check:"
echo "  - RAILWAY_DEPLOYMENT_TROUBLESHOOTING.md"
echo "  - GitHub Actions logs"
echo "  - Railway deployment logs"
echo

exit 0
