#!/bin/bash

################################################################################
# Start Backend Server Script
# This script starts the backend server for the KSO Inventory System
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found at: $BACKEND_DIR"
    exit 1
fi

cd "$BACKEND_DIR"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating default .env file..."
    cat > .env <<EOF
NODE_ENV=development
PORT=5000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
EOF
    print_success "Default .env file created"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_success "Dependencies installed"
fi

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi
print_success "Prisma client generated"

# Check if database exists, if not run migrations
if [ ! -f "prisma/dev.db" ]; then
    print_info "Database not found. Running migrations..."
    npx prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        print_error "Failed to run migrations"
        exit 1
    fi
    print_success "Database initialized"
fi

# Check if port 5000 is already in use
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_warning "Port 5000 is already in use"
    read -p "Do you want to kill the process using port 5000? (y/n): " KILL_PORT
    if [ "$KILL_PORT" = "y" ]; then
        print_info "Killing process on port 5000..."
        lsof -ti:5000 | xargs kill -9 2>/dev/null || true
        sleep 2
        print_success "Port 5000 is now free"
    else
        print_error "Cannot start backend. Port 5000 is in use."
        exit 1
    fi
fi

# Start the backend server
print_info "Starting backend server..."
print_info "Backend will be available at: http://localhost:5000"
print_info "API endpoints will be at: http://localhost:5000/api"
echo ""

# Check if dist folder exists (production build)
if [ -d "dist" ] && [ -f "dist/server.js" ]; then
    print_info "Starting in production mode (using built files)..."
    npm start
else
    print_info "Starting in development mode (with hot reload)..."
    npm run dev
fi

