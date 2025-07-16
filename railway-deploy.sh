#!/bin/bash

# Railway deployment script for MaintAInPro
echo "🚀 Deploying MaintAInPro to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway auth whoami &> /dev/null; then
    echo "🔑 Please log in to Railway:"
    railway auth login
fi

# Build locally first to check for issues
echo "📦 Building application locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Local build failed. Please fix build issues before deploying."
    exit 1
fi

echo "✅ Local build successful!"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your application should be available at your Railway domain"
    
    # Get the domain
    DOMAIN=$(railway domain)
    if [ ! -z "$DOMAIN" ]; then
        echo "🔗 Domain: $DOMAIN"
    fi
else
    echo "❌ Deployment failed"
    exit 1
fi
