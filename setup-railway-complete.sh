#!/bin/bash

# Comprehensive Railway Environment Setup Script
# This script will set up all environment variables for Railway deployment

echo "🚂 Railway Environment Setup for MaintAInPro"
echo "=============================================="

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    
    # Try to install Railway CLI
    if command -v npm &> /dev/null; then
        echo "📦 Installing Railway CLI via npm..."
        npm install -g @railway/cli
    else
        echo "❌ npm not found. Please install Railway CLI manually:"
        echo "   curl -fsSL https://railway.app/install.sh | sh"
        echo "   or visit: https://docs.railway.app/guides/cli"
        exit 1
    fi
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please ensure .env.local exists in your project root"
    exit 1
fi

echo "✅ Found .env.local file"

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Link to Railway project
echo "🔗 Linking to Railway project..."
railway link

echo "📋 Setting environment variables from .env.local..."

# Core Supabase Variables (required for the app to work)
echo "Setting VITE_SUPABASE_URL..."
railway variables set VITE_SUPABASE_URL="https://jthortssykpaodtbcnmq.supabase.co"

echo "Setting VITE_SUPABASE_ANON_KEY..."
railway variables set VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTI4OTgsImV4cCI6MjA2ODA4ODg5OH0.HPx8Dg5hVNSNTtmAhQPje_b0YeZU_hLvu7VhQ5Wf55o"

echo "Setting VITE_SUPABASE_SERVICE_ROLE_KEY..."
railway variables set VITE_SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjg5OCwiZXhwIjoyMDY4MDg4ODk4fQ.vkBxHsEL764IWmdq2PLb-Htz2UvADjfbVDel0MKYON0"

echo "Setting DATABASE_URL..."
railway variables set DATABASE_URL="postgres://postgres.jthortssykpaodtbcnmq:BFqa0JeaSoilgxHU@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"

# Application Configuration
echo "Setting application configuration..."
railway variables set VITE_APP_NAME="MaintAInPro"
railway variables set VITE_APP_VERSION="1.0.0"
railway variables set VITE_APP_ENVIRONMENT="production"
railway variables set NODE_ENV="production"

# Additional Supabase Configuration
echo "Setting additional Supabase configuration..."
railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aG9ydHNzeWtwYW9kdGJjbm1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxMjg5OCwiZXhwIjoyMDY4MDg4ODk4fQ.vkBxHsEL764IWmdq2PLb-Htz2UvADjfbVDel0MKYON0"
railway variables set VITE_POSTGRES_USER="postgres"
railway variables set VITE_POSTGRES_HOST="db.jthortssykpaodtbcnmq.supabase.co"
railway variables set VITE_SUPABASE_JWT_SECRET="kCVTejBg7m1Lqr9ftPGatKQT1R0rGEgWscri7d2XzX/XM69KLSWqNizf+OKFsWprvwcNHVxir58BBFlbRoo+Jg=="
railway variables set VITE_POSTGRES_PASSWORD="BFqa0JeaSoilgxHU"
railway variables set VITE_POSTGRES_DATABASE="postgres"

# Feature Flags
echo "Setting feature flags..."
railway variables set VITE_ENABLE_PWA="true"
railway variables set VITE_ENABLE_REALTIME="true"
railway variables set VITE_ENABLE_NOTIFICATIONS="true"
railway variables set VITE_STORAGE_BUCKET="maintainpro-files"

echo "✅ All environment variables have been set!"
echo ""
echo "🚀 Next steps:"
echo "1. Trigger a new deployment: railway up"
echo "2. Or redeploy the current build: railway redeploy"
echo "3. Check deployment status: railway status"
echo "4. View logs: railway logs"
echo ""
echo "🌐 Your app should be available at your Railway domain once deployed."
