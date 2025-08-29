#!/bin/bash

# Start backend server with TEST_AUTH_MODE
echo "Starting backend server with TEST_AUTH_MODE=true..."
TEST_AUTH_MODE=true npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend server
echo "Starting frontend server..."
vite --port 4173 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

echo "Servers started:"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

# Keep running until interrupted
wait