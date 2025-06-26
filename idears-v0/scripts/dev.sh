#!/bin/bash

# Development script for the idea collector app

echo "🚀 Starting Idea Collector in development mode..."

# Check if package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development environment
echo "🐳 Starting development containers..."
docker-compose --profile dev up --build
