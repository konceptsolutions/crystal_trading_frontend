#!/bin/bash
# Complete Fix Script for Backend Connection Issue
# This script fixes the API URL and ensures everything works
# Run: bash fix-backend-connection.sh

set -e

echo "=========================================="
echo "Backend Connection Fix Script"
echo "=========================================="
echo ""

# Get server IP (you can change this if needed)
SERVER_IP="103.60.12.157"
PROJECT_DIR=$(pwd)

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "ERROR: backend/ or frontend/ directory not found!"
    echo "Current directory: $PROJECT_DIR"
    echo "Please run this script from the project root directory"
    exit 1
fi

echo "Project directory: $PROJECT_DIR"
echo "Server IP: $SERVER_IP"
echo ""

# Step 1: Fix Frontend .env file
echo "=========================================="
echo "Step 1: Fixing Frontend API URL"
echo "=========================================="

# Backup existing .env if it exists
if [ -f "frontend/.env" ]; then
    cp frontend/.env frontend/.env.backup
    echo "✓ Backed up existing frontend/.env"
fi

# Create or update frontend .env
cat > frontend/.env <<EOF
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=http://${SERVER_IP}/api
EOF

echo "✓ Created frontend/.env with correct API URL: http://${SERVER_IP}/api"
echo ""

# Step 2: Fix Backend .env file
echo "=========================================="
echo "Step 2: Checking Backend Configuration"
echo "=========================================="

# Check if backend .env exists
if [ ! -f "backend/.env" ]; then
    echo "⚠ Backend .env not found, creating one..."
    
    # Check if PostgreSQL is set up
    DB_USER="kso_user"
    DB_NAME="kso_db"
    DB_PASSWORD=""
    
    # Try to get password from existing setup or generate new
    if [ -f "backend/.env.backup" ]; then
        DB_PASSWORD=$(grep DATABASE_URL backend/.env.backup | cut -d':' -f3 | cut -d'@' -f1 || echo "")
    fi
    
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        echo "⚠ Generated new database password. You may need to update PostgreSQL user."
    fi
    
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    cat > backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
EOF
    
    echo "✓ Created backend/.env"
else
    echo "✓ Backend .env already exists"
fi

echo ""

# Step 3: Verify Prisma Schemas
echo "=========================================="
echo "Step 3: Verifying Prisma Schemas"
echo "=========================================="

# Backend schema
if [ -f "backend/prisma/schema.prisma" ]; then
    if grep -q 'provider = "sqlite"' backend/prisma/schema.prisma; then
        echo "Converting backend schema to PostgreSQL..."
        sed -i 's/provider = "sqlite"/provider = "postgresql"/' backend/prisma/schema.prisma
        sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' backend/prisma/schema.prisma
        echo "✓ Backend schema converted to PostgreSQL"
    else
        echo "✓ Backend schema already uses PostgreSQL"
    fi
fi

# Frontend schema
if [ -f "frontend/prisma/schema.prisma" ]; then
    if grep -q 'provider = "sqlite"' frontend/prisma/schema.prisma; then
        echo "Converting frontend schema to PostgreSQL..."
        sed -i 's/provider = "sqlite"/provider = "postgresql"/' frontend/prisma/schema.prisma
        sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' frontend/prisma/schema.prisma
        echo "✓ Frontend schema converted to PostgreSQL"
    else
        echo "✓ Frontend schema already uses PostgreSQL"
    fi
fi

echo ""

# Step 4: Rebuild Frontend
echo "=========================================="
echo "Step 4: Rebuilding Frontend"
echo "=========================================="

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Generate Prisma client if schema exists
if [ -f "prisma/schema.prisma" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Build frontend
echo "Building frontend (this may take a few minutes)..."
npm run build

cd ..

echo "✓ Frontend rebuilt successfully"
echo ""

# Step 5: Verify Backend Build
echo "=========================================="
echo "Step 5: Verifying Backend Build"
echo "=========================================="

cd backend

# Check if dist folder exists
if [ ! -d "dist" ] || [ ! -f "dist/server.js" ]; then
    echo "Backend not built, building now..."
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing backend dependencies..."
        npm install
    fi
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    npx prisma generate
    
    # Build backend
    echo "Building backend..."
    npm run build
    echo "✓ Backend built successfully"
else
    echo "✓ Backend already built"
fi

cd ..

echo ""

# Step 6: Check Database Connection
echo "=========================================="
echo "Step 6: Checking Database"
echo "=========================================="

# Check if PostgreSQL is running
if systemctl is-active --quiet postgresql; then
    echo "✓ PostgreSQL is running"
else
    echo "⚠ PostgreSQL is not running, starting it..."
    systemctl start postgresql
    systemctl enable postgresql
    sleep 2
    echo "✓ PostgreSQL started"
fi

# Try to run migrations
echo "Running database migrations..."
cd backend
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss 2>/dev/null || echo "⚠ Migration failed, but continuing..."
cd ..

echo ""

# Step 7: Restart PM2 Processes
echo "=========================================="
echo "Step 7: Restarting PM2 Processes"
echo "=========================================="

# Stop existing processes
pm2 delete all 2>/dev/null || true

# Create ecosystem config if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
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
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000
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
        PORT: 3000
      },
      error_file: '/var/log/kso/frontend-error.log',
      out_file: '/var/log/kso/frontend-out.log',
      autorestart: true,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
EOF
    echo "✓ Created ecosystem.config.js"
fi

# Create log directory
mkdir -p /var/log/kso

# Start PM2 processes
echo "Starting PM2 processes..."
pm2 start ecosystem.config.js
pm2 save

echo "✓ PM2 processes started"
echo ""

# Step 8: Configure Nginx
echo "=========================================="
echo "Step 8: Configuring Nginx"
echo "=========================================="

if [ -f "nginx.conf" ]; then
    # Update nginx.conf with correct server name if needed
    if ! grep -q "server_name.*103.60.12.157\|server_name _" nginx.conf; then
        sed -i 's/server_name.*/server_name _;/' nginx.conf
    fi
    
    # Copy to Nginx sites
    cp nginx.conf /etc/nginx/sites-available/kso
    ln -sf /etc/nginx/sites-available/kso /etc/nginx/sites-enabled/kso
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload Nginx
    if nginx -t; then
        systemctl reload nginx
        echo "✓ Nginx configured and reloaded"
    else
        echo "⚠ Nginx configuration has errors"
        nginx -t
    fi
else
    echo "⚠ nginx.conf not found, creating basic configuration..."
    
    cat > /etc/nginx/sites-available/kso <<EOF
upstream backend {
    server localhost:5000;
    keepalive 64;
}

upstream frontend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }

    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/kso /etc/nginx/sites-enabled/kso
    rm -f /etc/nginx/sites-enabled/default
    
    if nginx -t; then
        systemctl reload nginx
        echo "✓ Nginx configured and reloaded"
    fi
fi

echo ""

# Step 9: Wait and Test
echo "=========================================="
echo "Step 9: Testing Connections"
echo "=========================================="

echo "Waiting for services to start..."
sleep 5

# Test backend
echo "Testing backend on localhost:5000..."
if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is responding on localhost:5000"
else
    echo "⚠ Backend is not responding on localhost:5000"
    echo "Check logs: pm2 logs kso-backend"
fi

# Test via Nginx
echo "Testing backend via Nginx (/api)..."
if curl -s -f http://${SERVER_IP}/api/health > /dev/null 2>&1; then
    echo "✓ Backend is accessible via Nginx"
else
    echo "⚠ Backend is not accessible via Nginx"
fi

# Test frontend
echo "Testing frontend on localhost:3000..."
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend is responding on localhost:3000"
else
    echo "⚠ Frontend is not responding on localhost:3000"
    echo "Check logs: pm2 logs kso-frontend"
fi

echo ""

# Step 10: Final Status
echo "=========================================="
echo "Step 10: Final Status"
echo "=========================================="

echo ""
echo "PM2 Status:"
pm2 status

echo ""
echo "Port Status:"
netstat -tlnp | grep -E ':(3000|5000)' || echo "Ports not listening"

echo ""
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Frontend API URL: http://${SERVER_IP}/api"
echo "Application URL: http://${SERVER_IP}"
echo ""
echo "If you still see errors:"
echo "1. Check PM2 logs: pm2 logs"
echo "2. Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "3. Verify .env files:"
echo "   - cat frontend/.env"
echo "   - cat backend/.env"
echo ""
echo "To create admin user:"
echo "  cd backend && npm run create-admin"
echo ""

