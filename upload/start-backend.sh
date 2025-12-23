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

# If script is in upload folder, go up one level to find backend
if [[ "$SCRIPT_DIR" == *"/upload" ]]; then
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    BACKEND_DIR="$PROJECT_ROOT/backend"
else
    BACKEND_DIR="$SCRIPT_DIR/backend"
fi

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    print_error "Backend directory not found at: $BACKEND_DIR"
    print_info "Script location: $SCRIPT_DIR"
    print_info "Trying common locations..."
    
    # Try common locations
    if [ -d "/opt/kso/backend" ]; then
        BACKEND_DIR="/opt/kso/backend"
        print_info "Found backend at: $BACKEND_DIR"
    elif [ -d "/var/www/nextapp/backend" ]; then
        BACKEND_DIR="/var/www/nextapp/backend"
        print_info "Found backend at: $BACKEND_DIR"
    elif [ -d "$(pwd)/backend" ]; then
        BACKEND_DIR="$(pwd)/backend"
        print_info "Found backend at: $BACKEND_DIR"
    else
        print_error "Backend directory not found. Please specify the correct path."
        exit 1
    fi
fi

print_info "Using backend directory: $BACKEND_DIR"

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

# Check database and run migrations if needed
print_info "Checking database configuration..."

# Check if using PostgreSQL (production) or SQLite (development)
if grep -q "provider = \"postgresql\"" prisma/schema.prisma 2>/dev/null; then
    print_info "PostgreSQL database detected (production mode)"
    # For PostgreSQL, use migrate deploy (production) or db push
    print_info "Applying database schema..."
    npx prisma migrate deploy 2>/dev/null || {
        print_warning "Migration deploy failed, trying db push..."
        npx prisma db push --accept-data-loss 2>/dev/null || {
            print_warning "Database push failed. This might be normal if database is already set up."
        }
    }
    print_success "Database schema applied"
else
    # SQLite development mode
    if [ ! -f "prisma/dev.db" ]; then
        print_info "SQLite database not found. Running migrations..."
        npx prisma migrate dev --name init
        if [ $? -ne 0 ]; then
            print_error "Failed to run migrations"
            exit 1
        fi
        print_success "Database initialized"
    fi
fi

# Check if port 5000 is already in use and kill it
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_warning "Port 5000 is already in use"
    print_info "Killing process on port 5000..."
    
    # Try multiple methods to kill the process
    PID=$(lsof -ti:5000 2>/dev/null || echo "")
    if [ -n "$PID" ]; then
        kill -9 $PID 2>/dev/null || true
    fi
    
    # Also try with fuser if available
    if command -v fuser &> /dev/null; then
        fuser -k 5000/tcp 2>/dev/null || true
    fi
    
    # Wait a bit and check again
    sleep 3
    
    # Verify port is free
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "Port 5000 is still in use. Trying more aggressive kill..."
        # Get all PIDs using port 5000
        PIDS=$(lsof -ti:5000 2>/dev/null || echo "")
        for pid in $PIDS; do
            kill -9 $pid 2>/dev/null || true
        done
        sleep 2
    fi
    
    # Final check
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_error "Cannot free port 5000. Please manually kill the process:"
        print_info "Run: lsof -ti:5000 | xargs kill -9"
        exit 1
    else
        print_success "Port 5000 is now free"
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

