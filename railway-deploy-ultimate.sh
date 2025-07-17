#!/bin/bash

echo "🚀 Fixed Railway Deployment Script for MaintAInPro"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI not found. Installing..."
    curl -fsSL https://railway.app/install.sh | sh
    if [ $? -ne 0 ]; then
        print_error "Failed to install Railway CLI"
        exit 1
    fi
fi

print_status "Railway CLI is available"

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    print_warning "Not logged in to Railway. Please run: railway login"
    echo "After logging in, run this script again."
    exit 1
fi

print_status "Authenticated with Railway"

# Check if we're in a Railway project
if [ ! -f ".railway/railway.json" ]; then
    print_warning "Not in a Railway project. Creating project..."
    railway create --name "maintainpro-cmms"
    if [ $? -ne 0 ]; then
        print_error "Failed to create Railway project"
        exit 1
    fi
fi

print_status "Railway project configured"

# Set essential environment variables
echo "Setting up environment variables..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set BUILD_COMMAND="npm run build"
railway variables set START_COMMAND="npm start"

# Check for required Supabase variables
if ! railway variables get VITE_SUPABASE_URL > /dev/null 2>&1; then
    print_warning "VITE_SUPABASE_URL not set. Please set it manually:"
    echo "railway variables set VITE_SUPABASE_URL=your_supabase_url"
fi

if ! railway variables get VITE_SUPABASE_ANON_KEY > /dev/null 2>&1; then
    print_warning "VITE_SUPABASE_ANON_KEY not set. Please set it manually:"
    echo "railway variables set VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
fi

# Test local build
echo "Testing local build..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Local build failed. Please fix build issues before deploying."
    exit 1
fi

print_status "Local build successful"

# Clean up any existing build artifacts that might interfere
echo "Cleaning up..."
rm -rf .nixpacks/
rm -rf dist/
npm run build > /dev/null 2>&1

# Deploy to Railway
echo "Deploying to Railway..."
railway deploy --detach

if [ $? -eq 0 ]; then
    print_status "Deployment initiated successfully!"
    echo ""
    echo "🔍 You can monitor the deployment with:"
    echo "   railway logs"
    echo ""
    echo "🌐 Once deployed, get your URL with:"
    echo "   railway domain"
    echo ""
    echo "📊 Check service status with:"
    echo "   railway status"
else
    print_error "Deployment failed"
    echo ""
    echo "🔍 Check logs with:"
    echo "   railway logs"
    echo ""
    echo "💡 Common fixes:"
    echo "   1. Check environment variables: railway variables"
    echo "   2. Verify nixpacks.toml configuration"
    echo "   3. Check build logs: railway logs --build"
    exit 1
fi
