#!/bin/bash

# Migration Phase 1: Storage Layer Activation
# This script sets up the environment for PostgreSQL migration testing

echo "🚀 MaintAInPro PostgreSQL Migration - Phase 1 Setup"
echo "================================================="

# Check if DATABASE_URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "💡 Please set DATABASE_URL to your PostgreSQL connection string"
    echo "   Example: export DATABASE_URL='postgresql://user:pass@host:port/db'"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Set environment for production-like testing
export NODE_ENV=production
export MIGRATION_PHASE=1

echo "🔧 Environment Configuration:"
echo "   NODE_ENV: $NODE_ENV"
echo "   MIGRATION_PHASE: $MIGRATION_PHASE"
echo "   DATABASE_URL: $(echo $DATABASE_URL | sed 's/:[^@]*@/:***@/')" # Hide password

# Run database migrations
echo ""
echo "📊 Running database migrations..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ Database migrations failed"
    exit 1
fi

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

if [ $? -eq 0 ]; then
    echo "✅ Database connectivity test passed"
else
    echo "❌ Database connectivity test failed"
    exit 1
fi

echo ""
echo "🎯 Phase 1 setup complete! Ready for migration testing."
echo "📋 Next steps:"
echo "   1. Start the application: npm run dev"
echo "   2. Verify DatabaseStorage initialization in logs"
echo "   3. Test API endpoints for data persistence"
echo "   4. Monitor performance and error logs"
echo ""
echo "🔄 To rollback, unset DATABASE_URL or set NODE_ENV=development"
