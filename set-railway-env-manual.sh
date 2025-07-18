#!/bin/bash

# Manual Railway Environment Variable Setup
# Run this script after installing Railway CLI locally

echo "Setting up Railway environment variables..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found!"
    echo "Please ensure .env.local exists in your local environment"
    exit 1
fi

echo "Reading environment variables from .env.local..."

# Read .env.local and set each variable in Railway
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" == \#* ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    echo "Setting $key..."
    railway variables set "$key=$value"
    
done < .env.local

echo "All environment variables have been set in Railway!"
echo "Now trigger a new deployment to apply the changes."
