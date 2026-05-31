#!/bin/bash

set -e

echo "🚀 Starting deployment with Docker Compose..."

# Build and deploy
docker compose down
docker compose build --no-cache
docker compose up -d

echo "🔧 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment completed!"
