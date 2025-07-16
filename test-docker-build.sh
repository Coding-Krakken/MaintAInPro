#!/bin/bash

# Test Docker build script for MaintAInPro
echo "🐳 Testing Docker build for MaintAInPro..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t maintainpro-test .

if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    # Test running the container
    echo "🚀 Testing container..."
    docker run -d -p 3000:3000 --name maintainpro-test-container maintainpro-test
    
    if [ $? -eq 0 ]; then
        echo "✅ Container started successfully!"
        echo "🌐 Test the application at http://localhost:3000"
        echo "🛑 To stop the container, run: docker stop maintainpro-test-container"
        echo "🗑️  To remove the container, run: docker rm maintainpro-test-container"
    else
        echo "❌ Failed to start container"
        exit 1
    fi
else
    echo "❌ Docker build failed"
    exit 1
fi
