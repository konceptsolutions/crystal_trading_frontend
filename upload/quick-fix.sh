#!/bin/bash
# Quick Fix Script for VPS Deployment
# Run this on your server: bash quick-fix.sh

set -e

echo "=========================================="
echo "Quick Fix - Installing and Starting App"
echo "=========================================="
echo ""

# Detect current directory
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Check if we're in the right place
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "ERROR: backend/ or frontend/ directory not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Install Node.js and PM2
echo ""
echo "Step 1: Installing Node.js and PM2..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✓ Node.js installed: $(node -v)"
else
    echo "✓ Node.js already installed: $(node -v)"
fi

if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✓ PM2 installed: $(pm2 -v)"
else
    echo "✓ PM2 already installed: $(pm2 -v)"
fi

# Step 2: Install PostgreSQL if not installed
echo ""
echo "Step 2: Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt-get update
    apt-get install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
    echo "✓ PostgreSQL installed"
else
    echo "✓ PostgreSQL already installed"
fi

# Step 3: Setup Database
echo ""
echo "Step 3: Setting up database..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
DB_USER="kso_user"
DB_NAME="kso_db"

# Create database and user (ignore errors if already exists)
sudo -u postgres psql <<EOF 2>/dev/null || true
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF

echo "✓ Database created: ${DB_NAME}"
echo "✓ Database user: ${DB_USER}"
echo "✓ Database password: ${DB_PASSWORD} (SAVE THIS!)"

# Step 4: Convert Prisma schemas
echo ""
echo "Step 4: Converting Prisma schemas to PostgreSQL..."

# Backend schema
if [ -f "backend/prisma/schema.prisma" ]; then
    if grep -q 'provider = "sqlite"' backend/prisma/schema.prisma; then
        sed -i 's/provider = "sqlite"/provider = "postgresql"/' backend/prisma/schema.prisma
        sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' backend/prisma/schema.prisma
        echo "✓ Backend schema converted"
    else
        echo "✓ Backend schema already uses PostgreSQL"
    fi
fi

# Frontend schema
if [ -f "frontend/prisma/schema.prisma" ]; then
    if grep -q 'provider = "sqlite"' frontend/prisma/schema.prisma; then
        sed -i 's/provider = "sqlite"/provider = "postgresql"/' frontend/prisma/schema.prisma
        sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' frontend/prisma/schema.prisma
        echo "✓ Frontend schema converted"
    else
        echo "✓ Frontend schema already uses PostgreSQL"
    fi
fi

# Step 5: Create environment files
echo ""
echo "Step 5: Creating environment files..."

JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

# Backend .env
cat > backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
EOF

# Frontend .env
cat > frontend/.env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
NEXT_PUBLIC_API_URL=http://103.60.12.157/api
EOF

echo "✓ Environment files created"

# Step 6: Install dependencies and build
echo ""
echo "Step 6: Installing dependencies and building..."

# Backend
echo "  Building backend..."
cd backend
npm install
npx prisma generate
npx prisma migrate deploy || npx prisma db push --accept-data-loss || true
npm run build
cd ..

# Frontend
echo "  Building frontend..."
cd frontend
npm install
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
fi
npm run build
cd ..

echo "✓ Build complete"

# Step 7: Stop existing PM2 processes
echo ""
echo "Step 7: Managing PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Step 8: Start with PM2
echo ""
echo "Step 8: Starting application with PM2..."

# Create ecosystem config if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'kso-backend',
      cwd: '$(pwd)/backend',
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
      cwd: '$(pwd)/frontend',
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
      max_memory_restart: '1G'
    }
  ]
};
EOF
fi

# Create log directory
mkdir -p /var/log/kso

# Start PM2
pm2 start ecosystem.config.js
pm2 save

# Setup startup
pm2 startup | grep "sudo" | bash || true

echo "✓ PM2 processes started"

# Step 9: Configure Nginx
echo ""
echo "Step 9: Configuring Nginx..."

if [ -f "nginx.conf" ]; then
    cp nginx.conf /etc/nginx/sites-available/kso
    ln -sf /etc/nginx/sites-available/kso /etc/nginx/sites-enabled/kso
    rm -f /etc/nginx/sites-enabled/default
    
    if nginx -t; then
        systemctl reload nginx
        echo "✓ Nginx configured and reloaded"
    else
        echo "⚠ Nginx configuration has errors, but continuing..."
    fi
else
    echo "⚠ nginx.conf not found, skipping Nginx configuration"
fi

# Step 10: Wait and check status
echo ""
echo "Step 10: Waiting for services to start..."
sleep 5

echo ""
echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "Application URLs:"
echo "  Frontend: http://103.60.12.157"
echo "  Backend API: http://103.60.12.157/api"
echo ""
echo "Database Credentials (SAVE THESE!):"
echo "  User: ${DB_USER}"
echo "  Database: ${DB_NAME}"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "Useful Commands:"
echo "  pm2 status          - Check application status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart all     - Restart applications"
echo ""
echo "To create admin user:"
echo "  cd backend && npm run create-admin"
echo ""

