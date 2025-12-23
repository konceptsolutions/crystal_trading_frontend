#!/bin/bash

################################################################################
# Quick Backend Start Script
# Simple script to start the backend server
################################################################################

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Backend Server...${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# If script is in upload folder, go up one level to find backend
if [[ "$SCRIPT_DIR" == *"/upload" ]]; then
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    BACKEND_DIR="$PROJECT_ROOT/backend"
else
    BACKEND_DIR="$SCRIPT_DIR/backend"
fi

# Check if backend exists, try common locations
if [ ! -d "$BACKEND_DIR" ]; then
    if [ -d "/opt/kso/backend" ]; then
        BACKEND_DIR="/opt/kso/backend"
    elif [ -d "/var/www/nextapp/backend" ]; then
        BACKEND_DIR="/var/www/nextapp/backend"
    elif [ -d "$(pwd)/backend" ]; then
        BACKEND_DIR="$(pwd)/backend"
    else
        echo "Error: Backend directory not found"
        exit 1
    fi
fi

# Navigate to backend directory
cd "$BACKEND_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env <<EOF
NODE_ENV=development
PORT=5000
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
EOF
fi

# Generate Prisma client if needed
if [ ! -d "node_modules/.prisma" ]; then
    echo "Generating Prisma client..."
    npx prisma generate
fi

# Start the server
echo -e "${GREEN}Backend starting on http://localhost:5000${NC}"
echo -e "${GREEN}API available at http://localhost:5000/api${NC}"
echo ""

# Try production build first, fallback to dev
if [ -f "dist/server.js" ]; then
    npm start
else
    npm run dev
fi

