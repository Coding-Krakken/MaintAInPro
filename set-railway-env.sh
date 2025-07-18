#!/bin/bash

# Script to set Railway environment variables from .env.local
# This script will output the railway CLI commands you need to run

echo "🚀 Setting up Railway Environment Variables"
echo "=========================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please ensure you have a .env.local file with your environment variables."
    exit 1
fi

echo "📋 Railway CLI commands to set environment variables:"
echo "----------------------------------------------------"
echo ""

# Read .env.local and generate railway variable set commands
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract variable name and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        var_name="${BASH_REMATCH[1]}"
        var_value="${BASH_REMATCH[2]}"
        
        # Remove quotes if present
        var_value=$(echo "$var_value" | sed 's/^"//;s/"$//')
        
        echo "railway variables set $var_name=\"$var_value\""
    fi
done < .env.local

echo ""
echo "🔧 Alternative: Set variables manually in Railway Dashboard"
echo "--------------------------------------------------------"
echo "1. Go to https://railway.app/dashboard"
echo "2. Select your MaintAInPro project"
echo "3. Go to Variables tab"
echo "4. Add each variable manually:"
echo ""

# Also output variables for manual setting
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Extract variable name and value
    if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        var_name="${BASH_REMATCH[1]}"
        var_value="${BASH_REMATCH[2]}"
        
        # Remove quotes if present
        var_value=$(echo "$var_value" | sed 's/^"//;s/"$//')
        
        echo "   $var_name = $var_value"
    fi
done < .env.local

echo ""
echo "📝 Instructions:"
echo "1. Install Railway CLI: npm install -g @railway/cli"
echo "2. Login to Railway: railway login"
echo "3. Link to your project: railway link"
echo "4. Run the commands above to set each variable"
echo "5. Redeploy your application: railway up"
echo ""
echo "✅ After setting variables, your app should work correctly!"
