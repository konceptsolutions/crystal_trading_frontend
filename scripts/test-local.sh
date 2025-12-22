#!/bin/bash

# Local Testing Script
# Tests the setup without requiring a full server installation

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

# Test Node.js availability
test_nodejs() {
    print_header "Testing Node.js"
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check version (should be 18+)
        MAJOR_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 18 ]; then
            print_success "Node.js version is 18 or higher"
        else
            print_error "Node.js version is too old (need 18+)"
        fi
    else
        print_error "Node.js is not installed"
    fi
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        print_success "npm is installed: $NPM_VERSION"
    else
        print_error "npm is not installed"
    fi
}

# Test if dependencies can be installed
test_dependencies() {
    print_header "Testing Dependencies Installation"
    
    # Backend
    if [ -d "backend" ]; then
        print_info "Testing backend dependencies..."
        cd backend
        
        if [ -f "package.json" ]; then
            # Try to parse package.json
            if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
                print_success "backend/package.json is valid"
                
                # Check if node_modules exists or can be created
                if [ -d "node_modules" ]; then
                    print_success "backend/node_modules exists"
                else
                    print_info "backend/node_modules not found (will be created during installation)"
                fi
            else
                print_error "backend/package.json is invalid"
            fi
        else
            print_error "backend/package.json not found"
        fi
        
        cd ..
    else
        print_error "backend directory not found"
    fi
    
    # Frontend
    if [ -d "frontend" ]; then
        print_info "Testing frontend dependencies..."
        cd frontend
        
        if [ -f "package.json" ]; then
            if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
                print_success "frontend/package.json is valid"
                
                if [ -d "node_modules" ]; then
                    print_success "frontend/node_modules exists"
                else
                    print_info "frontend/node_modules not found (will be created during installation)"
                fi
            else
                print_error "frontend/package.json is invalid"
            fi
        else
            print_error "frontend/package.json not found"
        fi
        
        cd ..
    else
        print_error "frontend directory not found"
    fi
}

# Test Prisma schemas
test_prisma_schemas() {
    print_header "Testing Prisma Schemas"
    
    # Check if Prisma CLI is available
    if command -v npx &> /dev/null; then
        print_success "npx is available (for Prisma commands)"
    else
        print_error "npx is not available"
    fi
    
    # Backend schema
    if [ -f "backend/prisma/schema.prisma" ]; then
        print_success "backend/prisma/schema.prisma exists"
        
        # Check for basic Prisma syntax
        if grep -q "datasource db" backend/prisma/schema.prisma; then
            print_success "Backend schema has datasource"
        else
            print_error "Backend schema missing datasource"
        fi
        
        if grep -q "generator client" backend/prisma/schema.prisma; then
            print_success "Backend schema has generator"
        else
            print_error "Backend schema missing generator"
        fi
    else
        print_error "backend/prisma/schema.prisma not found"
    fi
}

# Test configuration files
test_config_files() {
    print_header "Testing Configuration Files"
    
    # Ecosystem config
    if [ -f "ecosystem.config.js" ]; then
        print_success "ecosystem.config.js exists"
        
        if command -v node &> /dev/null; then
            if node -c ecosystem.config.js 2>/dev/null; then
                print_success "ecosystem.config.js syntax is valid"
            else
                print_error "ecosystem.config.js has syntax errors"
            fi
        fi
    else
        print_error "ecosystem.config.js not found"
    fi
    
    # Next.js config
    if [ -f "frontend/next.config.js" ]; then
        print_success "frontend/next.config.js exists"
        
        if command -v node &> /dev/null; then
            if node -c frontend/next.config.js 2>/dev/null; then
                print_success "frontend/next.config.js syntax is valid"
            else
                print_error "frontend/next.config.js has syntax errors"
            fi
        fi
    else
        print_error "frontend/next.config.js not found"
    fi
}

# Test installation script syntax
test_install_script() {
    print_header "Testing Installation Script"
    
    if [ -f "install-production.sh" ]; then
        print_success "install-production.sh exists"
        
        # Test syntax
        if bash -n install-production.sh 2>/dev/null; then
            print_success "install-production.sh syntax is valid"
        else
            print_error "install-production.sh has syntax errors"
            bash -n install-production.sh
        fi
    else
        print_error "install-production.sh not found"
    fi
}

# Test scripts syntax
test_scripts() {
    print_header "Testing Scripts Syntax"
    
    SCRIPTS=(
        "scripts/deploy.sh"
        "scripts/backup-database.sh"
        "scripts/monitor.sh"
        "scripts/prepare-production.sh"
    )
    
    for script in "${SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            if bash -n "$script" 2>/dev/null; then
                print_success "Syntax valid: $script"
            else
                print_error "Syntax error: $script"
            fi
        else
            print_error "Missing: $script"
        fi
    done
}

# Main test
main() {
    print_header "KSO Local Testing"
    echo ""
    print_info "This script tests the setup without requiring a full server"
    echo ""
    
    test_nodejs
    echo ""
    
    test_dependencies
    echo ""
    
    test_prisma_schemas
    echo ""
    
    test_config_files
    echo ""
    
    test_install_script
    echo ""
    
    test_scripts
    echo ""
    
    print_header "Testing Complete"
    print_info "Run 'bash scripts/validate-setup.sh' for full validation"
}

main

