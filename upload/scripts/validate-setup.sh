#!/bin/bash

# Validation Script for KSO Production Setup
# This script validates that all required files and configurations are in place

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

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
    ((ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if file exists
check_file() {
    if [ -f "$1" ]; then
        print_success "File exists: $1"
        return 0
    else
        print_error "File missing: $1"
        return 1
    fi
}

# Check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        print_success "Directory exists: $1"
        return 0
    else
        print_error "Directory missing: $1"
        return 1
    fi
}

# Validate installation script
validate_install_script() {
    print_header "Validating Installation Script"
    
    if [ -f "install-production.sh" ]; then
        print_success "install-production.sh exists"
        
        # Check if it's executable
        if [ -x "install-production.sh" ]; then
            print_success "install-production.sh is executable"
        else
            print_warning "install-production.sh is not executable (run: chmod +x install-production.sh)"
        fi
        
        # Check for syntax errors
        if bash -n install-production.sh 2>/dev/null; then
            print_success "install-production.sh has valid syntax"
        else
            print_error "install-production.sh has syntax errors"
        fi
    else
        print_error "install-production.sh not found"
    fi
}

# Validate required files
validate_required_files() {
    print_header "Validating Required Files"
    
    # Core files
    check_file "install-production.sh"
    check_file ".env.production.example"
    check_file "nginx.conf"
    check_file "ecosystem.config.js"
    
    # Backend files
    check_file "backend/package.json"
    check_file "backend/tsconfig.json"
    check_file "backend/prisma/schema.prisma"
    check_file "backend/src/server.ts"
    
    # Frontend files
    check_file "frontend/package.json"
    check_file "frontend/next.config.js"
    check_file "frontend/tsconfig.json"
    
    # Scripts
    check_dir "scripts"
    check_file "scripts/deploy.sh"
    check_file "scripts/backup-database.sh"
    check_file "scripts/monitor.sh"
    check_file "scripts/prepare-production.sh"
}

# Validate package.json files
validate_package_json() {
    print_header "Validating Package.json Files"
    
    # Backend
    if [ -f "backend/package.json" ]; then
        if command -v node &> /dev/null; then
            if node -e "JSON.parse(require('fs').readFileSync('backend/package.json', 'utf8'))" 2>/dev/null; then
                print_success "backend/package.json is valid JSON"
            else
                print_error "backend/package.json has invalid JSON"
            fi
        else
            print_warning "Node.js not found, skipping JSON validation"
        fi
        
        # Check for required scripts
        if grep -q '"build"' backend/package.json; then
            print_success "backend/package.json has build script"
        else
            print_error "backend/package.json missing build script"
        fi
        
        if grep -q '"start"' backend/package.json; then
            print_success "backend/package.json has start script"
        else
            print_error "backend/package.json missing start script"
        fi
    fi
    
    # Frontend
    if [ -f "frontend/package.json" ]; then
        if command -v node &> /dev/null; then
            if node -e "JSON.parse(require('fs').readFileSync('frontend/package.json', 'utf8'))" 2>/dev/null; then
                print_success "frontend/package.json is valid JSON"
            else
                print_error "frontend/package.json has invalid JSON"
            fi
        fi
        
        # Check for required scripts
        if grep -q '"build"' frontend/package.json; then
            print_success "frontend/package.json has build script"
        else
            print_error "frontend/package.json missing build script"
        fi
        
        if grep -q '"start"' frontend/package.json; then
            print_success "frontend/package.json has start script"
        else
            print_error "frontend/package.json missing start script"
        fi
    fi
}

# Validate Prisma schemas
validate_prisma_schemas() {
    print_header "Validating Prisma Schemas"
    
    # Backend schema
    if [ -f "backend/prisma/schema.prisma" ]; then
        print_success "backend/prisma/schema.prisma exists"
        
        # Check if it's SQLite (needs conversion)
        if grep -q 'provider = "sqlite"' backend/prisma/schema.prisma; then
            print_warning "Backend schema is SQLite (will be converted to PostgreSQL during installation)"
        elif grep -q 'provider = "postgresql"' backend/prisma/schema.prisma; then
            print_success "Backend schema is already PostgreSQL"
        else
            print_warning "Backend schema provider not detected"
        fi
    else
        print_error "backend/prisma/schema.prisma not found"
    fi
    
    # Frontend schema (optional)
    if [ -f "frontend/prisma/schema.prisma" ]; then
        print_success "frontend/prisma/schema.prisma exists"
        
        if grep -q 'provider = "sqlite"' frontend/prisma/schema.prisma; then
            print_warning "Frontend schema is SQLite (will be converted to PostgreSQL during installation)"
        elif grep -q 'provider = "postgresql"' frontend/prisma/schema.prisma; then
            print_success "Frontend schema is already PostgreSQL"
        fi
    else
        print_info "frontend/prisma/schema.prisma not found (optional)"
    fi
}

# Validate configuration files
validate_config_files() {
    print_header "Validating Configuration Files"
    
    # Ecosystem config
    if [ -f "ecosystem.config.js" ]; then
        if command -v node &> /dev/null; then
            if node -c ecosystem.config.js 2>/dev/null; then
                print_success "ecosystem.config.js has valid syntax"
            else
                print_error "ecosystem.config.js has syntax errors"
            fi
        else
            print_warning "Node.js not found, skipping ecosystem.config.js validation"
        fi
    else
        print_error "ecosystem.config.js not found"
    fi
    
    # Nginx config
    if [ -f "nginx.conf" ]; then
        print_success "nginx.conf exists"
        # Basic validation - check for key directives
        if grep -q "upstream backend" nginx.conf; then
            print_success "nginx.conf has backend upstream"
        else
            print_warning "nginx.conf missing backend upstream"
        fi
        
        if grep -q "upstream frontend" nginx.conf; then
            print_success "nginx.conf has frontend upstream"
        else
            print_warning "nginx.conf missing frontend upstream"
        fi
    else
        print_error "nginx.conf not found"
    fi
    
    # Environment example
    if [ -f ".env.production.example" ]; then
        print_success ".env.production.example exists"
        
        # Check for required variables
        if grep -q "DATABASE_URL" .env.production.example; then
            print_success ".env.production.example has DATABASE_URL"
        else
            print_warning ".env.production.example missing DATABASE_URL"
        fi
        
        if grep -q "JWT_SECRET" .env.production.example; then
            print_success ".env.production.example has JWT_SECRET"
        else
            print_warning ".env.production.example missing JWT_SECRET"
        fi
    else
        print_error ".env.production.example not found"
    fi
}

# Validate scripts
validate_scripts() {
    print_header "Validating Scripts"
    
    SCRIPTS=(
        "scripts/deploy.sh"
        "scripts/backup-database.sh"
        "scripts/monitor.sh"
        "scripts/prepare-production.sh"
    )
    
    for script in "${SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            print_success "Script exists: $script"
            
            # Check syntax
            if bash -n "$script" 2>/dev/null; then
                print_success "Script has valid syntax: $script"
            else
                print_error "Script has syntax errors: $script"
            fi
            
            # Check if executable
            if [ -x "$script" ]; then
                print_success "Script is executable: $script"
            else
                print_warning "Script is not executable: $script (run: chmod +x $script)"
            fi
        else
            print_error "Script missing: $script"
        fi
    done
}

# Validate TypeScript configs
validate_typescript_configs() {
    print_header "Validating TypeScript Configurations"
    
    # Backend
    if [ -f "backend/tsconfig.json" ]; then
        if command -v node &> /dev/null; then
            if node -e "JSON.parse(require('fs').readFileSync('backend/tsconfig.json', 'utf8'))" 2>/dev/null; then
                print_success "backend/tsconfig.json is valid JSON"
            else
                print_error "backend/tsconfig.json has invalid JSON"
            fi
        fi
    else
        print_warning "backend/tsconfig.json not found"
    fi
    
    # Frontend
    if [ -f "frontend/tsconfig.json" ]; then
        if command -v node &> /dev/null; then
            if node -e "JSON.parse(require('fs').readFileSync('frontend/tsconfig.json', 'utf8'))" 2>/dev/null; then
                print_success "frontend/tsconfig.json is valid JSON"
            else
                print_error "frontend/tsconfig.json has invalid JSON"
            fi
        fi
    else
        print_warning "frontend/tsconfig.json not found"
    fi
}

# Check for Docker files (should not exist)
check_no_docker() {
    print_header "Checking Docker Files Removed"
    
    DOCKER_FILES=(
        "docker-compose.yml"
        "backend/Dockerfile"
        "frontend/Dockerfile"
        ".dockerignore"
        "backend/.dockerignore"
        "frontend/.dockerignore"
    )
    
    for file in "${DOCKER_FILES[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            print_error "Docker file still exists: $file (should be removed)"
        else
            print_success "Docker file removed: $file"
        fi
    done
}

# Main validation
main() {
    print_header "KSO Production Setup Validation"
    echo ""
    
    validate_install_script
    echo ""
    
    validate_required_files
    echo ""
    
    validate_package_json
    echo ""
    
    validate_prisma_schemas
    echo ""
    
    validate_config_files
    echo ""
    
    validate_scripts
    echo ""
    
    validate_typescript_configs
    echo ""
    
    check_no_docker
    echo ""
    
    # Summary
    print_header "Validation Summary"
    echo -e "Errors: ${RED}${ERRORS}${NC}"
    echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
    echo ""
    
    if [ $ERRORS -eq 0 ]; then
        print_success "All critical validations passed!"
        if [ $WARNINGS -gt 0 ]; then
            print_warning "There are $WARNINGS warnings to review"
        fi
        exit 0
    else
        print_error "Validation failed with $ERRORS errors"
        exit 1
    fi
}

main

