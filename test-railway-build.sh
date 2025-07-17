#!/bin/bash

echo "🔧 Testing Railway build configuration..."

# Test if nixpacks is installed
if ! command -v nixpacks &> /dev/null; then
    echo "⚠️  Nixpacks not found locally. Installing..."
    npm install -g nixpacks
fi

# Test build with nixpacks
echo "📦 Testing nixpacks build..."
nixpacks build . --name maintainpro-test

if [ $? -eq 0 ]; then
    echo "✅ Nixpacks build successful!"
    echo "🧪 Running test container..."
    docker run -p 3000:3000 --rm maintainpro-test &
    CONTAINER_PID=$!
    
    # Wait a bit for container to start
    sleep 5
    
    # Test if container is responding
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Container is running successfully!"
    else
        echo "⚠️  Container started but not responding on port 3000"
    fi
    
    # Clean up
    kill $CONTAINER_PID 2>/dev/null
    docker rmi maintainpro-test 2>/dev/null
else
    echo "❌ Nixpacks build failed"
    exit 1
fi

echo "🎯 Configuration test complete!"
