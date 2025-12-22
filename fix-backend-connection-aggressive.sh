#!/bin/bash
# Aggressive Fix Script - Clears cache and rebuilds everything
# Run: bash fix-backend-connection-aggressive.sh

set -e

echo "=========================================="
echo "AGGRESSIVE FIX - Complete Rebuild"
echo "=========================================="
echo ""

SERVER_IP="103.60.12.157"
PROJECT_DIR=$(pwd)

# Check directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "ERROR: Run this from project root directory"
    exit 1
fi

echo "Project: $PROJECT_DIR"
echo "Server IP: $SERVER_IP"
echo ""

# Step 1: Stop all PM2 processes
echo "=========================================="
echo "Step 1: Stopping All Services"
echo "=========================================="
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
echo "✓ All PM2 processes stopped"
echo ""

# Step 2: Fix Frontend .env - CRITICAL
echo "=========================================="
echo "Step 2: Fixing Frontend .env File"
echo "=========================================="

# Remove old .env completely
rm -f frontend/.env
rm -f frontend/.env.local
rm -f frontend/.env.production
rm -f frontend/.env.development

# Create fresh .env with correct URL
cat > frontend/.env <<EOF
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=http://${SERVER_IP}/api
EOF

echo "✓ Created frontend/.env"
echo "Content:"
cat frontend/.env
echo ""

# Step 3: COMPLETELY Remove Frontend Build Cache
echo "=========================================="
echo "Step 3: Clearing Frontend Build Cache"
echo "=========================================="

cd frontend

# Remove all build artifacts
rm -rf .next
rm -rf .next-cache
rm -rf out
rm -rf dist
rm -rf node_modules/.cache
rm -rf .turbo

echo "✓ Cleared all frontend build cache"
echo ""

# Step 4: Rebuild Frontend from Scratch
echo "=========================================="
echo "Step 4: Rebuilding Frontend (Fresh Build)"
echo "=========================================="

# Verify .env is correct before building
echo "Verifying .env before build:"
cat .env
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma if needed
if [ -f "prisma/schema.prisma" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Build with explicit env
echo "Building frontend (this will take 2-3 minutes)..."
NODE_ENV=production NEXT_PUBLIC_API_URL="http://${SERVER_IP}/api" npm run build

# Verify the build
if [ ! -d ".next" ]; then
    echo "ERROR: Build failed - .next directory not created"
    exit 1
fi

echo "✓ Frontend rebuilt successfully"
cd ..

echo ""

# Step 5: Verify Backend
echo "=========================================="
echo "Step 5: Verifying Backend"
echo "=========================================="

cd backend

# Check .env
if [ ! -f ".env" ]; then
    echo "Creating backend .env..."
    DB_USER="kso_user"
    DB_NAME="kso_db"
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    cat > .env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
EOF
    echo "⚠ Created backend .env with new password"
fi

# Rebuild backend if needed
if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
    echo "Building backend..."
    npm install
    npx prisma generate
    npm run build
fi

cd ..

echo "✓ Backend verified"
echo ""

# Step 6: Start Services
echo "=========================================="
echo "Step 6: Starting Services"
echo "=========================================="

# Create ecosystem config
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'kso-backend',
      cwd: '${PROJECT_DIR}/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/kso/backend-error.log',
      out_file: '/var/log/kso/backend-out.log',
      autorestart: true,
      max_memory_restart: '1G'
    },
    {
      name: 'kso-frontend',
      cwd: '${PROJECT_DIR}/frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: 'http://${SERVER_IP}/api'
      },
      error_file: '/var/log/kso/frontend-error.log',
      out_file: '/var/log/kso/frontend-out.log',
      autorestart: true,
      max_memory_restart: '1G'
    }
  ]
};
EOF

mkdir -p /var/log/kso

# Start PM2
pm2 start ecosystem.config.js
pm2 save

echo "✓ Services started"
echo ""

# Step 7: Wait and Test
echo "=========================================="
echo "Step 7: Testing Connections"
echo "=========================================="

sleep 8

echo "PM2 Status:"
pm2 status

echo ""
echo "Testing backend..."
if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend responding on localhost:5000"
else
    echo "⚠ Backend not responding - check logs: pm2 logs kso-backend"
fi

echo ""
echo "Testing via Nginx..."
if curl -s -f http://${SERVER_IP}/api/health > /dev/null 2>&1; then
    echo "✓ Backend accessible via Nginx"
else
    echo "⚠ Backend not accessible via Nginx"
fi

echo ""
echo "=========================================="
echo "FIX COMPLETE!"
echo "=========================================="
echo ""
echo "IMPORTANT: Clear your browser cache!"
echo "1. Press Ctrl+Shift+Delete"
echo "2. Select 'Cached images and files'"
echo "3. Click 'Clear data'"
echo "4. Or use Incognito/Private mode"
echo ""
echo "Then visit: http://${SERVER_IP}"
echo ""
echo "If still not working, check:"
echo "  pm2 logs kso-frontend"
echo "  pm2 logs kso-backend"
echo ""

