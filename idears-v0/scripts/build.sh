#!/bin/bash

# Build script for the idea collector app

echo "🚀 Building Idea Collector..."

# Check if package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo "📦 Generating package-lock.json..."
    npm install
fi

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t idea-collector:latest .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "🎉 You can now run: docker-compose up -d"
else
    echo "❌ Build failed!"
    exit 1
fi
