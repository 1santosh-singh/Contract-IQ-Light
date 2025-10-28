#!/bin/bash
# Build script for Contract IQ Backend Docker image

echo "================================"
echo "Building Contract IQ Backend"
echo "================================"
echo ""

# Check if backend .env.local file exists
if [ ! -f packages/backend/.env.local ]; then
    echo "ERROR: packages/backend/.env.local file not found"
    echo "Please create .env.local file in packages/backend/ directory"
    exit 1
fi

echo "📦 Building Backend Image..."
echo ""
cd packages/backend
docker build -t contract-iq-backend:latest .
if [ $? -eq 0 ]; then
    echo "✅ Backend image built successfully!"
else
    echo "❌ Backend image build failed"
    exit 1
fi
cd ../..

echo ""
echo "================================"
echo "✅ Backend image built successfully!"
echo "================================"
echo ""
echo "Built image:"
docker images | grep contract-iq-backend
echo ""
echo "To run:"
echo "  docker run -p 8000:8000 --env-file packages/backend/.env.local contract-iq-backend"