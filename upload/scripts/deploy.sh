#!/bin/bash

# Production Deployment Script
# This script handles updates to the production environment (Native/PM2)

set -e

APP_DIR="/opt/kso"
cd "$APP_DIR"

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main || git pull origin master || true

# Backup current environment
echo "💾 Backing up environment..."
if [ -f "backend/.env" ]; then
    cp backend/.env backend/.env.backup.$(date +%Y%m%d_%H%M%S)
fi
if [ -f "frontend/.env" ]; then
    cp frontend/.env frontend/.env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Stop services
echo "🛑 Stopping services..."
pm2 stop all || true

# Install dependencies and build backend
echo "🔨 Building backend..."
cd "$APP_DIR/backend"
npm install
npx prisma generate
npm run build

# Install dependencies and build frontend
echo "🔨 Building frontend..."
cd "$APP_DIR/frontend"
npm install
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
fi
npm run build

# Run database migrations
echo "🗄️  Running database migrations..."
cd "$APP_DIR/backend"
npx prisma migrate deploy || npx prisma db push --accept-data-loss || true

# Restart services
echo "🔄 Restarting services..."
cd "$APP_DIR"
pm2 restart all || pm2 start ecosystem.config.js

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed"
    echo "Check logs with: pm2 logs kso-backend"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend is healthy"
else
    echo "✗ Frontend health check failed"
    echo "Check logs with: pm2 logs kso-frontend"
    exit 1
fi

echo "✅ Deployment complete!"
