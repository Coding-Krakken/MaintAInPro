#!/bin/bash

echo "🔧 Setting up Railway Environment Variables for MaintAInPro"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "Setting up essential environment variables..."

# Set basic application variables
echo "Setting Node.js and application environment..."
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set VITE_APP_VERSION=1.0.0
railway variables set VITE_APP_ENVIRONMENT=production

print_success "Basic application variables set"

# Set Supabase configuration
echo "Setting up Supabase configuration..."
railway variables set VITE_SUPABASE_URL=https://jthortssykpaodtbcnmq.supabase.co

print_success "Supabase URL configured"

# Check if anon key is provided as argument
if [ -z "$1" ]; then
    print_warning "Supabase anon key not provided as argument"
    echo ""
    echo "To get your Supabase anon key:"
    echo "1. Go to https://supabase.com/dashboard/projects"
    echo "2. Select your project: jthortssykpaodtbcnmq"
    echo "3. Go to Settings > API"
    echo "4. Copy the 'anon public' key"
    echo ""
    echo "Then run: railway variables set VITE_SUPABASE_ANON_KEY=your_anon_key"
    echo ""
    echo "Or rerun this script with the key as argument:"
    echo "./setup-railway-vars.sh your_anon_key_here"
else
    railway variables set VITE_SUPABASE_ANON_KEY="$1"
    print_success "Supabase anon key configured"
fi

# Set optional but recommended variables
echo "Setting up optional application variables..."
railway variables set VITE_APP_NAME="MaintAInPro CMMS"
railway variables set VITE_APP_DESCRIPTION="Enterprise-grade Computerized Maintenance Management System"

# Set build and deployment variables
echo "Setting up build configuration..."
railway variables set BUILD_COMMAND="npm run build"
railway variables set START_COMMAND="npm start"
railway variables set NIXPACKS_NODE_VERSION=20

print_success "Build configuration set"

# Optional: Set up monitoring and analytics (commented out - uncomment if needed)
echo "Optional variables (commented out):"
echo "# railway variables set VITE_SENTRY_DSN=your_sentry_dsn"
echo "# railway variables set VITE_MIXPANEL_TOKEN=your_mixpanel_token"
echo "# railway variables set VITE_HOTJAR_ID=your_hotjar_id"

echo ""
echo "🎯 Configuration Summary:"
echo "========================="
echo "✅ NODE_ENV=production"
echo "✅ PORT=3000"
echo "✅ VITE_SUPABASE_URL=https://jthortssykpaodtbcnmq.supabase.co"
if [ -n "$1" ]; then
    echo "✅ VITE_SUPABASE_ANON_KEY=configured"
else
    echo "⚠️  VITE_SUPABASE_ANON_KEY=needs to be set manually"
fi
echo "✅ VITE_APP_VERSION=1.0.0"
echo "✅ VITE_APP_ENVIRONMENT=production"
echo "✅ BUILD_COMMAND=npm run build"
echo "✅ START_COMMAND=npm start"

echo ""
echo "🚀 Next Steps:"
echo "=============="
if [ -z "$1" ]; then
    echo "1. Set your Supabase anon key (see instructions above)"
    echo "2. Deploy with: railway deploy"
else
    echo "1. Deploy with: railway deploy"
fi
echo "2. Monitor deployment: railway logs"
echo "3. Check status: railway status"
echo "4. Get URL: railway domain"

echo ""
echo "🔍 To verify all variables are set:"
echo "railway variables"
