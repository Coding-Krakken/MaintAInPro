#!/bin/bash
# Railway deployment script

# Exit on error
set -e

echo "Starting Railway deployment..."

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Build the application
echo "Building application..."
npm run build

# Start the application
echo "Starting application..."
npm start
