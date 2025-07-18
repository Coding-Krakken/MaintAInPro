#!/bin/bash

# Railway Environment Variables Setup Script
# This script checks and sets the required environment variables for MaintAInPro

echo "🚀 Checking Railway Environment Variables..."

# Function to check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        echo "❌ Railway CLI is not installed"
        echo "Please install it first: npm install -g @railway/cli"
        exit 1
    else
        echo "✅ Railway CLI is installed"
    fi
}

# Function to check if logged in to Railway
check_railway_auth() {
    if ! railway status &> /dev/null; then
        echo "❌ Not logged in to Railway"
        echo "Please login first: railway login"
        exit 1
    else
        echo "✅ Logged in to Railway"
    fi
}

# Function to get current variables
get_current_variables() {
    echo "📋 Current Railway Variables:"
    railway variables
}

# Function to set required variables
set_variables() {
    echo "🔧 Setting required environment variables..."
    
    # Read from local .env.local file
    if [ -f ".env.local" ]; then
        echo "📄 Reading variables from .env.local..."
        
        # Extract Supabase URL
        SUPABASE_URL=$(grep "VITE_SUPABASE_URL=" .env.local | cut -d'=' -f2)
        SUPABASE_ANON_KEY=$(grep "VITE_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)
        
        if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_ANON_KEY" ]; then
            echo "Setting VITE_SUPABASE_URL..."
            railway variables set VITE_SUPABASE_URL="$SUPABASE_URL"
            
            echo "Setting VITE_SUPABASE_ANON_KEY..."
            railway variables set VITE_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
            
            echo "Setting NODE_ENV..."
            railway variables set NODE_ENV="production"
            
            echo "✅ Environment variables set successfully!"
        else
            echo "❌ Could not find Supabase credentials in .env.local"
            echo "Please check your .env.local file"
            exit 1
        fi
    else
        echo "❌ .env.local file not found"
        echo "Please create it first with your Supabase credentials"
        exit 1
    fi
}

# Function to redeploy
redeploy() {
    echo "🚀 Redeploying application..."
    railway up --detach
    echo "✅ Deployment triggered"
}

# Main execution
echo "🔄 Starting Railway environment setup..."

check_railway_cli
check_railway_auth

echo ""
echo "Current variables:"
get_current_variables

echo ""
read -p "Do you want to set/update environment variables? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_variables
    
    echo ""
    read -p "Do you want to redeploy the application? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        redeploy
    fi
else
    echo "Skipping variable setup"
fi

echo ""
echo "📋 Final Railway Variables:"
railway variables

echo ""
echo "🎯 To check deployment status: railway status"
echo "🌐 To open app: railway open"
echo "📊 To view logs: railway logs"
