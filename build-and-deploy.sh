#!/bin/bash

# Build and deploy script for Contract IQ Backend

echo "🚀 Building Contract IQ Backend Docker Image..."

# Navigate to backend directory
cd packages/backend

# Build Docker image
docker build -t contract-iq-backend:latest .

# Tag for different registries
docker tag contract-iq-backend:latest contract-iq-backend:$(date +%Y%m%d-%H%M%S)

echo "✅ Docker image built successfully!"

# Test the image locally (optional)
echo "🧪 Testing image locally..."
docker run -d -p 8000:8000 --name contract-iq-test contract-iq-backend:latest

# Wait for container to start
sleep 5

# Test health endpoint
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
fi

# Stop test container
docker stop contract-iq-test
docker rm contract-iq-test

echo "🎉 Backend is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Render"
echo "3. Set environment variables in Render dashboard"
echo "4. Deploy using the render.yaml configuration"