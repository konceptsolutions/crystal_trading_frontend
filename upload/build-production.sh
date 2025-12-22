#!/bin/bash

# Production Build Script
# Builds the application for production deployment
# This script is designed to run on the server after installation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Build Backend
build_backend() {
    print_header "Building Backend"
    
    cd backend
    
    print_info "Installing dependencies..."
    npm install --production=false || true
    
    print_info "Generating Prisma client..."
    npx prisma generate || {
        print_error "Prisma generation failed, trying to continue..."
    }
    
    print_info "Compiling TypeScript..."
    npm run build:skip-prisma || npm run build || {
        print_error "Backend build failed"
        return 1
    }
    
    if [ -f "dist/server.js" ]; then
        print_success "Backend build successful"
    else
        print_error "Backend build failed - dist/server.js not found"
        return 1
    fi
    
    cd ..
}

# Build Frontend
build_frontend() {
    print_header "Building Frontend"
    
    cd frontend
    
    print_info "Installing dependencies..."
    npm install --production=false || true
    
    print_info "Generating Prisma client..."
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate || {
            print_error "Prisma generation failed, trying to continue..."
        }
    fi
    
    print_info "Building Next.js application..."
    npm run build:skip-prisma || npm run build || {
        print_error "Frontend build failed"
        return 1
    }
    
    if [ -d ".next" ]; then
        print_success "Frontend build successful"
    else
        print_error "Frontend build failed - .next directory not found"
        return 1
    fi
    
    cd ..
}

# Main build
main() {
    print_header "KSO Production Build"
    
    # Check if we're in the right directory
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    build_backend
    echo ""
    build_frontend
    echo ""
    
    print_header "Build Complete"
    print_success "Application is ready for production!"
}

main

