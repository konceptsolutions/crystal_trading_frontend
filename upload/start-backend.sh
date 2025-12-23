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
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":5000 " || ss -tuln 2>/dev/null | grep -q ":5000 "; then
    print_warning "Port 5000 is already in use"
    print_info "Attempting to free port 5000..."
    
    # Method 1: Try lsof
    if command -v lsof &> /dev/null; then
        PIDS=$(lsof -ti:5000 2>/dev/null || echo "")
        if [ -n "$PIDS" ]; then
            print_info "Found processes using port 5000: $PIDS"
            for pid in $PIDS; do
                print_info "Killing process $pid..."
                kill -9 $pid 2>/dev/null || true
                # Wait a moment for process to die
                sleep 1
                # Verify it's dead
                if ps -p $pid > /dev/null 2>&1; then
                    print_warning "Process $pid still running, trying harder..."
                    kill -9 $pid 2>/dev/null || true
                    sleep 1
                fi
            done
        fi
    fi
    
    # Method 2: Try fuser if available
    if command -v fuser &> /dev/null; then
        fuser -k 5000/tcp 2>/dev/null || true
    fi
    
    # Method 3: Try netstat + kill
    if command -v netstat &> /dev/null; then
        NETSTAT_PID=$(netstat -tlnp 2>/dev/null | grep ":5000 " | awk '{print $7}' | cut -d'/' -f1 | head -1)
        if [ -n "$NETSTAT_PID" ] && [ "$NETSTAT_PID" != "-" ]; then
            kill -9 $NETSTAT_PID 2>/dev/null || true
        fi
    fi
    
    # Method 4: Try ss + kill
    if command -v ss &> /dev/null; then
        SS_PID=$(ss -tlnp 2>/dev/null | grep ":5000 " | grep -oP 'pid=\K[0-9]+' | head -1)
        if [ -n "$SS_PID" ]; then
            kill -9 $SS_PID 2>/dev/null || true
        fi
    fi
    
    # Wait for processes to die
    sleep 3
    
    # Final verification
    PORT_IN_USE=false
    if command -v lsof &> /dev/null; then
        if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
            PORT_IN_USE=true
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":5000 "; then
            PORT_IN_USE=true
        fi
    elif command -v ss &> /dev/null; then
        if ss -tuln 2>/dev/null | grep -q ":5000 "; then
            PORT_IN_USE=true
        fi
    fi
    
    if [ "$PORT_IN_USE" = true ]; then
        print_error "Cannot free port 5000 automatically."
        print_info "Please run these commands manually:"
        print_info "  lsof -ti:5000 | xargs kill -9"
        print_info "  OR"
        print_info "  netstat -tlnp | grep :5000"
        print_info "  Then kill the PID shown"
        print_info ""
        print_warning "Attempting to continue anyway (might fail)..."
        sleep 2
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

