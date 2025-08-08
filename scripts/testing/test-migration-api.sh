#!/bin/bash

# Migration Phase 1 API Test Script
# Tests DatabaseStorage functionality through API calls

echo "🧪 Phase 1 Migration API Test: DatabaseStorage Functionality"
echo "========================================================"

# Export environment variables for testing
export NODE_ENV=production
export DATABASE_URL=${DATABASE_URL:-"postgres://neondb_owner:npg_9wIlAORgDS7L@ep-twilight-hill-adkx14x5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"}
export PORT=5001  # Use different port to avoid conflicts

echo "🔧 Test Environment:"
echo "   NODE_ENV: $NODE_ENV" 
echo "   PORT: $PORT"
echo "   DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')"

# Start the application in background
echo ""
echo "🚀 Starting application with DatabaseStorage on port $PORT..."
cd /workspaces/MaintAInPro
npx tsx server/index.ts &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to initialize..."
sleep 5

# Test API endpoints to verify DatabaseStorage functionality
echo ""
echo "🧪 Testing API endpoints with PostgreSQL storage..."

# Test 1: Health check
echo "1. Health Check:"
curl -s http://localhost:$PORT/api/health | head -1
echo ""

# Test 2: Get profiles (should work with DatabaseStorage)
echo "2. Get Profiles:"
curl -s http://localhost:$PORT/api/profiles | head -1
echo ""

# Test 3: Get warehouses
echo "3. Get Warehouses:"
curl -s http://localhost:$PORT/api/warehouses | head -1
echo ""

# Test 4: Get work orders
echo "4. Get Work Orders:"
curl -s http://localhost:$PORT/api/work-orders | head -1
echo ""

# Test 5: Get equipment
echo "5. Get Equipment:"
curl -s http://localhost:$PORT/api/equipment | head -1
echo ""

echo ""
echo "✅ API tests completed. Check responses above for PostgreSQL data."
echo "🛑 Stopping test server..."

# Clean up
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo "🎯 Phase 1 API testing complete!"
