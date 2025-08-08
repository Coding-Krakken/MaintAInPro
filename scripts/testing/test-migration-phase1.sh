#!/bin/bash

# Migration Phase 1 Test Script
# Tests DatabaseStorage activation with PostgreSQL

echo "🚀 Phase 1 Migration Test: DatabaseStorage Activation"
echo "=================================================="

# Export environment variables for testing
export NODE_ENV=production
export DATABASE_URL=${DATABASE_URL:-"postgres://neondb_owner:npg_9wIlAORgDS7L@ep-twilight-hill-adkx14x5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"}

echo "🔧 Test Environment:"
echo "   NODE_ENV: $NODE_ENV" 
echo "   DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')"

# Start the application directly with tsx
echo ""
echo "🚀 Starting application with DatabaseStorage..."
cd /workspaces/MaintAInPro
npx tsx server/index.ts
