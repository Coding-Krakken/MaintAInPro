#!/bin/bash

echo "🚀 Railway Deployment Script with Fallback Options"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to try nixpacks deployment
try_nixpacks_deployment() {
    echo "🔧 Attempting deployment with nixpacks..."
    railway deploy --detach
    return $?
}

# Function to switch to Docker deployment
switch_to_docker() {
    echo "🐳 Switching to Docker deployment..."
    
    # Backup original railway.toml
    if [ -f "railway.toml" ]; then
        cp railway.toml railway.toml.backup
    fi
    
    # Copy Docker configuration
    cp railway-docker.toml railway.toml
    
    # Try Docker deployment
    railway deploy --detach
    return $?
}

# Function to try alternative nixpacks configurations
try_alternative_nixpacks() {
    echo "🔄 Trying alternative nixpacks configuration..."
    
    # Backup current config
    cp nixpacks.toml nixpacks.toml.backup
    
    # Try with explicit Node.js 18
    cat > nixpacks.toml << EOF
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.build]
cmds = ["npm ci", "npm run build"]

[phases.start]
cmd = "npm start"

[variables]
NODE_VERSION = "18"
NODE_ENV = "production"
EOF
    
    railway deploy --detach
    local result=$?
    
    if [ $result -ne 0 ]; then
        # Try with Node.js 16
        echo "🔄 Trying with Node.js 16..."
        cat > nixpacks.toml << EOF
[phases.setup]
nixPkgs = ["nodejs-16_x"]

[phases.build]
cmds = ["npm ci", "npm run build"]

[phases.start]
cmd = "npm start"

[variables]
NODE_VERSION = "16"
NODE_ENV = "production"
EOF
        railway deploy --detach
        result=$?
    fi
    
    return $result
}

# Main deployment logic
echo "Step 1: Testing local build..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Local build failed. Please fix build issues first."
    exit 1
fi

print_status "Local build successful"

echo "Step 2: Attempting nixpacks deployment..."
if try_nixpacks_deployment; then
    print_status "Nixpacks deployment successful!"
    echo "🌐 Your app will be available at: https://maintainpro-production.up.railway.app"
    exit 0
fi

print_warning "Nixpacks deployment failed. Trying alternative configurations..."

echo "Step 3: Trying alternative nixpacks configurations..."
if try_alternative_nixpacks; then
    print_status "Alternative nixpacks deployment successful!"
    echo "🌐 Your app will be available at: https://maintainpro-production.up.railway.app"
    exit 0
fi

print_warning "Alternative nixpacks failed. Switching to Docker deployment..."

echo "Step 4: Attempting Docker deployment..."
if switch_to_docker; then
    print_status "Docker deployment successful!"
    echo "🌐 Your app will be available at: https://maintainpro-production.up.railway.app"
    exit 0
fi

print_error "All deployment methods failed. Please check the logs:"
echo "railway logs"
echo ""
echo "For manual troubleshooting:"
echo "1. Check Railway variables: railway variables"
echo "2. Check service status: railway status"
echo "3. Try deploying with verbose logs: railway deploy --verbose"

exit 1
