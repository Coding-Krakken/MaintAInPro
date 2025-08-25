#!/bin/bash
# Playwright E2E Startup Script: Starts both frontend and backend, with error handling


set -e

echo "🔄 Seeding database for E2E tests..."
npm run seed
if [ $? -ne 0 ]; then
  echo "❌ Database seeding failed. Aborting E2E tests."
  exit 1
fi

FRONTEND_PORT=4173
BACKEND_PORT=5000
FRONTEND_START_CMD="vite --port 4173"
BACKEND_START_CMD="npm run dev"
# FRONTEND_START_CMD="npm run preview --prefix client"
# BACKEND_START_CMD="npm run start"


# echo "� Building frontend and backend for E2E tests..."
# npm run build
# if [ $? -ne 0 ]; then
#   echo "❌ Build failed. Aborting E2E tests."
#   exit 1
# fi

echo "🚀 Starting backend and serving built frontend..."
# Set environment variables for proper E2E testing
export TEST_AUTH_MODE=disabled
export DISABLE_RATE_LIMITING=true
export NODE_ENV=production
PLAYWRIGHT=true $BACKEND_START_CMD &
SERVER_PID=$!

# Wait for backend to be ready
for i in {1..30}; do
  if nc -z localhost $BACKEND_PORT; then
    echo "✅ Backend started on port $BACKEND_PORT"
    break
  fi
  echo "⏳ Waiting for backend to start... ($i)"
  sleep 1
done
if ! nc -z localhost $BACKEND_PORT; then
  echo "❌ Backend failed to start on port $BACKEND_PORT"
  kill $SERVER_PID
  exit 1
fi

# Trap for cleanup
trap "kill $SERVER_PID" EXIT

# Run Playwright tests
npx playwright test --config tests/config/playwright.config.ts
EXIT_CODE=$?

kill $SERVER_PID
exit $EXIT_CODE
