#!/bin/bash
# Railway-specific deployment script for MaintAInPro

echo "🚀 Preparing Railway deployment for MaintAInPro..."

# Set Railway environment variables if not already set
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set VITE_APP_ENVIRONMENT=production

# Check if required environment variables are set
echo "📋 Checking required environment variables..."
if ! railway variables get VITE_SUPABASE_URL > /dev/null 2>&1; then
    echo "⚠️  VITE_SUPABASE_URL not set. Please set it with:"
    echo "   railway variables set VITE_SUPABASE_URL=your_supabase_url"
fi

if ! railway variables get VITE_SUPABASE_ANON_KEY > /dev/null 2>&1; then
    echo "⚠️  VITE_SUPABASE_ANON_KEY not set. Please set it with:"
    echo "   railway variables set VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
fi

# Test local build first
echo "🔨 Testing local build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Please fix build issues before deploying."
    exit 1
fi

echo "✅ Local build successful!"

# Test Docker build
echo "🐳 Testing Docker build..."
docker build -t maintainpro-railway-test .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed. Please fix Docker issues before deploying."
    exit 1
fi

echo "✅ Docker build successful!"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway deploy

if [ $? -eq 0 ]; then
    echo "✅ Railway deployment initiated successfully!"
    echo "🔍 Monitor the deployment logs with: railway logs"
    echo "🌐 Check your app status with: railway status"
else
    echo "❌ Railway deployment failed"
    echo "🔍 Check logs with: railway logs"
    exit 1
fi
