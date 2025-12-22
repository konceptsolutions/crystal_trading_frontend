#!/bin/bash

# Prepare application for production deployment
# This script converts SQLite schema to PostgreSQL and prepares the environment

set -e

echo "🔧 Preparing application for production..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Backup original schema
BACKEND_SCHEMA="backend/prisma/schema.prisma"
if [ -f "$BACKEND_SCHEMA" ]; then
    if [ ! -f "${BACKEND_SCHEMA}.backup" ]; then
        cp "$BACKEND_SCHEMA" "${BACKEND_SCHEMA}.backup"
        echo "✓ Backed up original schema"
    fi
    
    # Convert to PostgreSQL
    echo "📝 Converting Prisma schema to PostgreSQL..."
    
    # Use sed with different syntax for macOS vs Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' "$BACKEND_SCHEMA"
        sed -i '' 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' "$BACKEND_SCHEMA"
    else
        # Linux
        sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$BACKEND_SCHEMA"
        sed -i 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' "$BACKEND_SCHEMA"
    fi
    
    echo "✓ Schema converted to PostgreSQL"
fi

# Check frontend schema
FRONTEND_SCHEMA="frontend/prisma/schema.prisma"
if [ -f "$FRONTEND_SCHEMA" ]; then
    if [ ! -f "${FRONTEND_SCHEMA}.backup" ]; then
        cp "$FRONTEND_SCHEMA" "${FRONTEND_SCHEMA}.backup"
        echo "✓ Backed up frontend schema"
    fi
    
    # Convert frontend schema if needed
    if grep -q 'provider = "sqlite"' "$FRONTEND_SCHEMA"; then
        echo "📝 Converting frontend Prisma schema to PostgreSQL..."
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' "$FRONTEND_SCHEMA"
            sed -i '' 's|url.*file:.*|url      = env("DATABASE_URL")|' "$FRONTEND_SCHEMA"
        else
            sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$FRONTEND_SCHEMA"
            sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' "$FRONTEND_SCHEMA"
        fi
        
        echo "✓ Frontend schema converted to PostgreSQL"
    fi
fi

# Check .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        cp .env.production.example .env
        echo "✓ Created .env file from template"
        echo "⚠️  Please update .env with your production values!"
    else
        echo "⚠️  .env file not found. Please create it manually."
    fi
else
    echo "✓ .env file exists"
fi

echo ""
echo "✅ Production preparation complete!"
echo ""
echo "Next steps:"
echo "1. Update .env file with your production values"
echo "2. Run: docker-compose build"
echo "3. Run: docker-compose up -d"
echo "4. Run: docker-compose exec backend npx prisma migrate deploy"

