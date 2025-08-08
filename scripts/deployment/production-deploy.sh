#!/bin/bash

# Production PostgreSQL Migration Deployment Script
# This script deploys MaintAInPro with PostgreSQL storage activated

set -e  # Exit on any error

echo "🚀 MaintAInPro PostgreSQL Migration - Production Deployment"
echo "=========================================================="

# Check prerequisites
echo "🔍 Checking prerequisites..."

if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is required"
    echo "💡 Please set DATABASE_URL to your PostgreSQL connection string"
    echo "   Example: export DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

echo "✅ DATABASE_URL is configured"
echo "🔗 Database: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')"

# Set production environment
export NODE_ENV=production

echo ""
echo "🔧 Production Environment Configuration:"
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: ${PORT:-5000}"

# Build the application
echo ""
echo "🏗️ Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully"

# Run database migrations
echo ""
echo "📊 Running database migrations..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Database migrations failed"
    exit 1
fi

echo "✅ Database migrations completed"

# Test database connectivity
echo ""
echo "🔍 Testing database connectivity..."
node -e "
import('./server/db.js').then(module => {
    if (module.db) {
        console.log('✅ Database connection successful');
        process.exit(0);
    } else {
        console.log('❌ Database connection failed');
        process.exit(1);
    }
}).catch(err => {
    console.log('❌ Database test failed:', err.message);
    process.exit(1);
});
"

if [ $? -ne 0 ]; then
    echo "❌ Database connectivity test failed"
    exit 1
fi

echo "✅ Database connectivity verified"

# Start the application
echo ""
echo "🎯 Starting MaintAInPro with PostgreSQL storage..."
echo "📊 Phase 1 Migration: Storage Layer Activation"
echo ""

# Use npm start which sets NODE_ENV=production
npm start
