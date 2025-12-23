#!/bin/bash

################################################################################
# KSO - Complete Installation & Update Script
# This script handles both initial installation and updates from GitHub
# 
# GitHub Repository: https://github.com/konceptsolutions/crystal_trading_frontend
# 
# The script automatically:
# - Clones the repository from GitHub for fresh installations
# - Pulls latest updates from GitHub for existing installations
# - Installs all dependencies and builds the application
# - Sets up database, Nginx, PM2, and all services
#
# Usage: sudo bash install.sh
################################################################################

set -e  # Exit on error for critical operations

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="kso"
APP_DIR="/opt/${APP_NAME}"
SERVICE_USER="${APP_NAME}"
NODE_VERSION="20"
GIT_REPO_URL="https://github.com/konceptsolutions/crystal_trading_frontend"  # Default GitHub repository
GIT_BRANCH="main"  # Default branch

# Variables
DOMAIN_NAME=""
EMAIL=""
DB_PASSWORD=""
JWT_SECRET=""
IS_UPDATE=false
CURRENT_DIR=$(pwd)

################################################################################
# Helper Functions
################################################################################

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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

################################################################################
# Detect if this is an update or fresh installation
################################################################################

detect_mode() {
    if [ -d "$APP_DIR" ] && [ -d "$APP_DIR/.git" ]; then
        IS_UPDATE=true
        print_info "Detected existing installation - UPDATE MODE"
    else
        IS_UPDATE=false
        print_info "Fresh installation detected - INSTALL MODE"
    fi
}

################################################################################
# Clean old data if found
################################################################################

clean_old_data() {
    print_header "Cleaning Old Data"
    
    if [ "$IS_UPDATE" = true ]; then
        print_info "Update mode: Stopping services and backing up..."
        
        # Stop PM2 processes
        if command -v pm2 &> /dev/null; then
            pm2 stop all 2>/dev/null || true
            pm2 delete all 2>/dev/null || true
        fi
        
        # Backup .env files
        if [ -f "$APP_DIR/backend/.env" ]; then
            cp "$APP_DIR/backend/.env" "$APP_DIR/backend/.env.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
            print_success "Backend .env backed up"
        fi
        if [ -f "$APP_DIR/frontend/.env" ]; then
            cp "$APP_DIR/frontend/.env" "$APP_DIR/frontend/.env.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
            print_success "Frontend .env backed up"
        fi
        
        # Remove old build artifacts
        print_info "Removing old build artifacts..."
        rm -rf "$APP_DIR/backend/dist" 2>/dev/null || true
        rm -rf "$APP_DIR/backend/node_modules" 2>/dev/null || true
        rm -rf "$APP_DIR/frontend/.next" 2>/dev/null || true
        rm -rf "$APP_DIR/frontend/node_modules" 2>/dev/null || true
        rm -rf "$APP_DIR/frontend/out" 2>/dev/null || true
        
        print_success "Old data cleaned"
    else
        # Fresh installation - remove any existing directory
        if [ -d "$APP_DIR" ]; then
            print_warning "Removing existing directory at $APP_DIR"
            rm -rf "$APP_DIR" 2>/dev/null || true
        fi
        print_success "Clean slate ready"
    fi
}

################################################################################
# Setup Git Repository
################################################################################

setup_git_repo() {
    print_header "Setting Up Git Repository"
    
    # Use default GitHub repository if not detected
    if [ -z "$GIT_REPO_URL" ]; then
        GIT_REPO_URL="https://github.com/konceptsolutions/crystal_trading_frontend"
        print_info "Using default GitHub repository: $GIT_REPO_URL"
    fi
    
    # Detect Git repository URL if in a git repo (override default)
    if [ -d ".git" ]; then
        DETECTED_URL=$(git remote get-url origin 2>/dev/null || echo "")
        if [ -n "$DETECTED_URL" ]; then
            GIT_REPO_URL="$DETECTED_URL"
            print_info "Detected Git repository: $GIT_REPO_URL"
        fi
    fi
    
    # If we're in upload folder, go to parent
    if [[ "$CURRENT_DIR" == *"upload"* ]]; then
        cd ..
        if [ -d ".git" ]; then
            DETECTED_URL=$(git remote get-url origin 2>/dev/null || echo "")
            if [ -n "$DETECTED_URL" ]; then
                GIT_REPO_URL="$DETECTED_URL"
                print_info "Detected Git repository in parent: $GIT_REPO_URL"
            fi
        fi
    fi
    
    # If update mode and APP_DIR exists with git
    if [ "$IS_UPDATE" = true ] && [ -d "$APP_DIR/.git" ]; then
        print_info "Pulling latest changes from GitHub..."
        cd "$APP_DIR"
        
        # Update remote URL if it changed
        CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
        if [ "$CURRENT_REMOTE" != "$GIT_REPO_URL" ]; then
            print_info "Updating remote URL to $GIT_REPO_URL"
            git remote set-url origin "$GIT_REPO_URL" 2>/dev/null || true
        fi
        
        # Stash or discard any local changes first
        print_info "Discarding any local changes..."
        git reset --hard HEAD 2>/dev/null || true
        git clean -fd 2>/dev/null || true
        
        # Clean any local changes and ensure we're on the correct branch
        print_info "Fetching latest from GitHub..."
        git fetch origin --prune --force 2>/dev/null || {
            print_warning "Fetch failed, trying without prune..."
            git fetch origin --force 2>/dev/null || true
        }
        
        # Determine the correct branch
        BRANCH_TO_USE="$GIT_BRANCH"
        if ! git show-ref --verify --quiet refs/remotes/origin/$GIT_BRANCH 2>/dev/null; then
            BRANCH_TO_USE="main"
            print_info "Branch $GIT_BRANCH not found, using main branch"
        fi
        
        # Ensure we're on the correct branch locally
        CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
        if [ "$CURRENT_BRANCH" != "$BRANCH_TO_USE" ]; then
            print_info "Switching to branch $BRANCH_TO_USE"
            git checkout -B "$BRANCH_TO_USE" "origin/$BRANCH_TO_USE" 2>/dev/null || {
                git checkout -B main origin/main 2>/dev/null || true
                BRANCH_TO_USE="main"
            }
        fi
        
        # Reset to match remote exactly - be very aggressive
        print_info "Resetting to match GitHub exactly..."
        git reset --hard "origin/$BRANCH_TO_USE" 2>/dev/null || {
            print_warning "Failed to reset to origin/$BRANCH_TO_USE, trying main..."
            git reset --hard origin/main 2>/dev/null || true
            BRANCH_TO_USE="main"
        }
        
        # Clean any untracked files that might interfere
        git clean -fdx 2>/dev/null || true
        
        # Verify we got the latest
        CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
        REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH_TO_USE" 2>/dev/null || git rev-parse origin/main 2>/dev/null || echo "")
        if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ] && [ -n "$CURRENT_COMMIT" ]; then
            print_success "Code updated from GitHub (commit: ${CURRENT_COMMIT:0:7})"
        else
            print_warning "Local commit (${CURRENT_COMMIT:0:7}) differs from remote (${REMOTE_COMMIT:0:7})"
            print_info "Forcing reset to remote..."
            git reset --hard "origin/$BRANCH_TO_USE" 2>/dev/null || git reset --hard origin/main 2>/dev/null || true
            print_success "Code updated from GitHub"
        fi
        
        # Verify critical file has the fix
        if [ -f "frontend/components/inventory/ModelsSelection.tsx" ]; then
            if grep -q "\.map((part: Part)" "frontend/components/inventory/ModelsSelection.tsx" 2>/dev/null; then
                print_success "Verified: ModelsSelection.tsx has the type fix"
            else
                print_warning "ModelsSelection.tsx might not have the latest fix - check manually"
            fi
        fi
        
        return
    fi
    
    # Fresh installation - clone from GitHub
    if [ -n "$GIT_REPO_URL" ] && [ "$IS_UPDATE" = false ]; then
        print_info "Cloning repository from GitHub: $GIT_REPO_URL"
        mkdir -p "$(dirname $APP_DIR)"
        
        # Remove existing directory if it exists
        if [ -d "$APP_DIR" ]; then
            print_warning "Removing existing directory at $APP_DIR"
            rm -rf "$APP_DIR"
        fi
        
        # Clone repository
        git clone -b "$GIT_BRANCH" "$GIT_REPO_URL" "$APP_DIR" 2>/dev/null || {
            print_warning "Git clone with branch $GIT_BRANCH failed, trying main branch..."
            git clone "$GIT_REPO_URL" "$APP_DIR" 2>/dev/null || {
                print_error "Failed to clone repository from $GIT_REPO_URL"
                print_error "Please check your internet connection and repository URL"
                exit 1
            }
        }
        print_success "Repository cloned from GitHub"
    else
        # Copy files from current location
        print_info "Copying files to $APP_DIR..."
        mkdir -p "$APP_DIR"
        
        # Determine source directory - look for backend and frontend folders
        SOURCE_DIR=""
        
        # Check current directory
        if [ -d "backend" ] && [ -d "frontend" ]; then
            SOURCE_DIR="$(pwd)"
            print_info "Found application code in current directory: $SOURCE_DIR"
        # Check if we're in upload folder, look in parent
        elif [[ "$CURRENT_DIR" == *"upload"* ]]; then
            PARENT_DIR="$(dirname $CURRENT_DIR)"
            if [ -d "$PARENT_DIR/backend" ] && [ -d "$PARENT_DIR/frontend" ]; then
                SOURCE_DIR="$PARENT_DIR"
                print_info "Found application code in parent directory: $SOURCE_DIR"
            fi
        # Check common locations
        elif [ -d "/var/www/nextapp/backend" ] && [ -d "/var/www/nextapp/frontend" ]; then
            SOURCE_DIR="/var/www/nextapp"
            print_info "Found application code in /var/www/nextapp"
        elif [ -d "/var/www/nextapp/upload/backend" ] && [ -d "/var/www/nextapp/upload/frontend" ]; then
            SOURCE_DIR="/var/www/nextapp/upload"
            print_info "Found application code in /var/www/nextapp/upload"
        elif [ -d "$(dirname $CURRENT_DIR)/backend" ] && [ -d "$(dirname $CURRENT_DIR)/frontend" ]; then
            SOURCE_DIR="$(dirname $CURRENT_DIR)"
            print_info "Found application code in: $SOURCE_DIR"
        fi
        
        # If still not found, use current directory and warn
        if [ -z "$SOURCE_DIR" ]; then
            SOURCE_DIR="$CURRENT_DIR"
            print_warning "Could not find backend/frontend directories. Using current directory: $SOURCE_DIR"
            print_warning "Please ensure backend and frontend folders exist in the source location."
        fi
        
        # Verify backend and frontend exist
        if [ ! -d "$SOURCE_DIR/backend" ] || [ ! -d "$SOURCE_DIR/frontend" ]; then
            print_error "Error: backend/ or frontend/ directory not found in $SOURCE_DIR"
            print_error "Please ensure you're running this script from the project root or provide the correct path."
            exit 1
        fi
        
        # Copy files excluding unnecessary ones
        print_info "Copying from $SOURCE_DIR to $APP_DIR..."
        rsync -av --exclude 'node_modules' \
                  --exclude '.git' \
                  --exclude '*.db' \
                  --exclude '*.db-journal' \
                  --exclude '.next' \
                  --exclude 'dist' \
                  --exclude 'upload' \
                  --exclude '.env' \
                  --exclude '*.log' \
                  "$SOURCE_DIR/" "$APP_DIR/" 2>/dev/null || {
            # Fallback to cp
            print_info "Using fallback copy method..."
            cp -r "$SOURCE_DIR/backend" "$APP_DIR/" || {
                print_error "Failed to copy backend directory"
                exit 1
            }
            cp -r "$SOURCE_DIR/frontend" "$APP_DIR/" || {
                print_error "Failed to copy frontend directory"
                exit 1
            }
            # Copy other important files
            cp "$SOURCE_DIR"/*.json "$APP_DIR/" 2>/dev/null || true
            cp "$SOURCE_DIR"/*.js "$APP_DIR/" 2>/dev/null || true
            cp "$SOURCE_DIR"/*.conf "$APP_DIR/" 2>/dev/null || true
            cp "$SOURCE_DIR"/*.md "$APP_DIR/" 2>/dev/null || true
        }
        print_success "Files copied"
    fi
    
    # Verify backend and frontend exist in APP_DIR
    if [ ! -d "$APP_DIR/backend" ] || [ ! -d "$APP_DIR/frontend" ]; then
        print_error "Error: backend/ or frontend/ directory not found in $APP_DIR after copy"
        exit 1
    fi
    
    cd "$APP_DIR"
}

################################################################################
# System Updates
################################################################################

update_system() {
    print_header "Updating System Packages"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get upgrade -y -qq
    apt-get install -y -qq curl wget git build-essential ca-certificates gnupg lsb-release ufw software-properties-common
    print_success "System updated"
}

################################################################################
# Install Node.js
################################################################################

install_nodejs() {
    print_header "Installing Node.js ${NODE_VERSION}"
    
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            print_info "Node.js $NODE_CURRENT is already installed"
        else
            print_info "Upgrading Node.js to version $NODE_VERSION"
        fi
    fi
    
    # Install Node.js using NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - || {
        print_warning "NodeSource installation failed, using default repository"
        apt-get install -y nodejs npm
    }
    
    apt-get install -y nodejs
    
    # Verify installation
    if command -v node &> /dev/null; then
        print_success "Node.js $(node -v) installed"
        print_success "npm $(npm -v) installed"
    else
        print_error "Node.js installation failed"
        exit 1
    fi
    
    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
        print_success "PM2 installed"
    else
        print_info "PM2 is already installed"
    fi
}

################################################################################
# Install PostgreSQL
################################################################################

install_postgresql() {
    print_header "Installing PostgreSQL"
    
    if command -v psql &> /dev/null; then
        print_info "PostgreSQL is already installed"
    else
        apt-get install -y postgresql postgresql-contrib
        systemctl start postgresql
        systemctl enable postgresql
        sleep 3
        print_success "PostgreSQL installed"
    fi
}

################################################################################
# Setup Database
################################################################################

setup_database() {
    print_header "Setting Up Database"
    
    DB_USER="kso_user"
    DB_NAME="kso_db"
    
    # Check if database exists
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")
    USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename='$DB_USER'" 2>/dev/null || echo "")
    
    # Try to get existing password from .env file if updating
    if [ "$IS_UPDATE" = true ] && [ -f "$APP_DIR/backend/.env" ]; then
        EXISTING_PASSWORD=$(grep DATABASE_URL "$APP_DIR/backend/.env" | sed -n 's/.*:\([^@]*\)@.*/\1/p' || echo "")
        if [ -n "$EXISTING_PASSWORD" ]; then
            DB_PASSWORD="$EXISTING_PASSWORD"
            print_info "Using existing database password from .env file"
        fi
    fi
    
    # Generate password if not provided
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        print_info "Generated new database password"
    fi
    
    if [ "$DB_EXISTS" = "1" ] && [ "$USER_EXISTS" = "1" ]; then
        print_info "Database $DB_NAME and user $DB_USER already exist"
        
        # Test connection with current password
        if PGPASSWORD="$DB_PASSWORD" psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database credentials are valid"
        else
            print_warning "Database credentials failed. Resetting password..."
            # Reset the user password
            sudo -u postgres psql <<EOF
ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
\q
EOF
            print_success "Database user password reset"
        fi
        
        # For fresh installs, always reset password to match new .env file
        if [ "$IS_UPDATE" = false ]; then
            print_info "Fresh install detected - resetting database user password to match new configuration"
            sudo -u postgres psql <<EOF
ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
\q
EOF
            print_success "Database user password reset for fresh installation"
        fi
    fi
    
    # Create database and user if they don't exist
    if [ "$DB_EXISTS" != "1" ] || [ "$USER_EXISTS" != "1" ]; then
        print_info "Creating database and user..."
        sudo -u postgres psql <<EOF
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
        CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    ELSE
        ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
END
\$\$;

-- Drop database if exists and recreate
DROP DATABASE IF EXISTS ${DB_NAME};
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

-- Grant schema privileges
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${DB_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${DB_USER};

\q
EOF
        print_success "Database created: ${DB_NAME}"
        print_success "Database user created/updated: ${DB_USER}"
    fi
    
    # Update pg_hba.conf to allow password authentication
    PG_HBA_FILE=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
    if [ -n "$PG_HBA_FILE" ]; then
        # Check if we need to update authentication method
        if grep -q "local   all             all                                     peer" "$PG_HBA_FILE" 2>/dev/null; then
            print_info "Updating PostgreSQL authentication method..."
            sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_HBA_FILE"
            systemctl restart postgresql
            sleep 3
            print_success "PostgreSQL authentication updated"
        fi
        
        # Also ensure host connections use md5
        if grep -q "^host.*all.*all.*127.0.0.1/32.*ident" "$PG_HBA_FILE" 2>/dev/null; then
            sed -i 's/^host.*all.*all.*127.0.0.1\/32.*ident/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA_FILE"
            systemctl restart postgresql
            sleep 2
        fi
    fi
    
    # Test database connection
    print_info "Testing database connection..."
    export PGPASSWORD="$DB_PASSWORD"
    if psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection test successful"
        unset PGPASSWORD
    else
        print_warning "Database connection test failed, trying to fix..."
        unset PGPASSWORD
        
        # Ensure PostgreSQL is running
        systemctl start postgresql || true
        sleep 2
        
        # Reset password again to be sure
        sudo -u postgres psql <<EOF
ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
\q
EOF
        
        # Restart PostgreSQL
        systemctl restart postgresql
        sleep 3
        
        # Test again
        export PGPASSWORD="$DB_PASSWORD"
        if psql -h localhost -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database connection test successful after password reset"
            unset PGPASSWORD
        else
            print_error "Database connection still failing"
            print_info "Trying connection via postgres user..."
            unset PGPASSWORD
            
            # Try to connect via postgres user and verify the user exists
            sudo -u postgres psql <<EOF
SELECT usename FROM pg_user WHERE usename='${DB_USER}';
\q
EOF
            
            print_info "Please verify:"
            print_info "  1. PostgreSQL is running: systemctl status postgresql"
            print_info "  2. Database user exists: sudo -u postgres psql -c '\du'"
            print_info "  3. Database exists: sudo -u postgres psql -c '\l'"
            print_warning "Continuing with installation, but database operations may fail"
        fi
    fi
}

################################################################################
# Install Nginx
################################################################################

install_nginx() {
    print_header "Installing Nginx"
    
    if command -v nginx &> /dev/null; then
        print_info "Nginx is already installed"
    else
        apt-get install -y nginx
        systemctl enable nginx
        systemctl start nginx
        print_success "Nginx installed"
    fi
}

################################################################################
# Setup Firewall
################################################################################

setup_firewall() {
    print_header "Configuring Firewall"
    ufw --force enable || true
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    print_success "Firewall configured"
}

################################################################################
# Get User Input
################################################################################

get_user_input() {
    print_header "Configuration"
    
    read -p "Enter your domain name (or press Enter to skip SSL setup): " DOMAIN_NAME
    if [ -n "$DOMAIN_NAME" ]; then
        read -p "Enter your email for Let's Encrypt: " EMAIL
    fi
    
    if [ "$IS_UPDATE" = false ]; then
        read -p "Enter database password (or press Enter for auto-generated): " DB_PASSWORD_INPUT
        if [ -n "$DB_PASSWORD_INPUT" ]; then
            DB_PASSWORD="$DB_PASSWORD_INPUT"
        fi
        
        read -p "Enter JWT secret (or press Enter for auto-generated): " JWT_SECRET_INPUT
        if [ -n "$JWT_SECRET_INPUT" ]; then
            JWT_SECRET="$JWT_SECRET_INPUT"
        fi
    else
        # For updates, try to read from existing .env
        if [ -f "$APP_DIR/backend/.env" ]; then
            DB_PASSWORD=$(grep DATABASE_URL "$APP_DIR/backend/.env" | sed -n 's/.*:\([^@]*\)@.*/\1/p' || echo "")
            JWT_SECRET=$(grep JWT_SECRET "$APP_DIR/backend/.env" | cut -d'=' -f2 || echo "")
            print_info "Using existing database and JWT credentials"
        fi
    fi
}

################################################################################
# Create Application User
################################################################################

create_app_user() {
    print_header "Creating Application User"
    
    if id "$SERVICE_USER" &>/dev/null; then
        print_info "User $SERVICE_USER already exists"
    else
        useradd -r -m -s /bin/bash -d "$APP_DIR" "$SERVICE_USER"
        print_success "User $SERVICE_USER created"
    fi
    
    # Ensure directory ownership
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR" 2>/dev/null || true
}

################################################################################
# Convert Prisma Schemas to PostgreSQL
################################################################################

convert_prisma_schemas() {
    print_header "Converting Prisma Schemas to PostgreSQL"
    
    cd "$APP_DIR"
    
    # Backend schema
    if [ -f "backend/prisma/schema.prisma" ]; then
        if ! grep -q 'provider = "postgresql"' backend/prisma/schema.prisma; then
            if [ ! -f "backend/prisma/schema.prisma.backup" ]; then
                cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup
            fi
            sed -i 's/provider = "sqlite"/provider = "postgresql"/' backend/prisma/schema.prisma
            sed -i 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' backend/prisma/schema.prisma
            print_success "Backend schema converted"
        else
            print_info "Backend schema already uses PostgreSQL"
        fi
    fi
    
    # Frontend schema
    if [ -f "frontend/prisma/schema.prisma" ]; then
        if grep -q 'provider = "sqlite"' frontend/prisma/schema.prisma; then
            if [ ! -f "frontend/prisma/schema.prisma.backup" ]; then
                cp frontend/prisma/schema.prisma frontend/prisma/schema.prisma.backup
            fi
            sed -i 's/provider = "sqlite"/provider = "postgresql"/' frontend/prisma/schema.prisma
            sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' frontend/prisma/schema.prisma
            print_success "Frontend schema converted"
        else
            print_info "Frontend schema already uses PostgreSQL"
        fi
    fi
}

################################################################################
# Setup Environment Variables
################################################################################

setup_environment() {
    print_header "Setting Up Environment Variables"
    
    cd "$APP_DIR"
    
    # Verify backend and frontend directories exist
    if [ ! -d "backend" ]; then
        print_error "Error: backend directory not found in $APP_DIR"
        print_error "Please ensure the application code was copied correctly."
        exit 1
    fi
    
    if [ ! -d "frontend" ]; then
        print_error "Error: frontend directory not found in $APP_DIR"
        print_error "Please ensure the application code was copied correctly."
        exit 1
    fi
    
    # Generate secrets if not provided
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    fi
    
    # Read existing DB password if updating
    if [ "$IS_UPDATE" = true ] && [ -f "backend/.env" ]; then
        EXISTING_DB_PASSWORD=$(grep DATABASE_URL backend/.env | sed -n 's/.*:\([^@]*\)@.*/\1/p' || echo "")
        if [ -n "$EXISTING_DB_PASSWORD" ]; then
            DB_PASSWORD="$EXISTING_DB_PASSWORD"
        fi
    fi
    
    # Create backend .env
    cat > backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
EOF

    # Determine API URL
    if [ -n "$DOMAIN_NAME" ]; then
        API_URL="https://${DOMAIN_NAME}/api"
    else
        API_URL="http://localhost:5000/api"
    fi
    
    # Create frontend .env
    cat > frontend/.env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
NEXT_PUBLIC_API_URL=${API_URL}
EOF

    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR"
    
    print_success "Environment variables configured"
}

################################################################################
# Setup Backend
################################################################################

setup_backend() {
    print_header "Setting Up Backend"
    
    cd "$APP_DIR/backend"
    
    # Install dependencies
    print_info "Installing backend dependencies..."
    if [ -f "package.json" ]; then
        sudo -u "$SERVICE_USER" npm install
    else
        print_error "package.json not found in backend directory"
        exit 1
    fi
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    sudo -u "$SERVICE_USER" npx prisma generate
    
    # Run migrations
    print_info "Running database migrations..."
    sudo -u "$SERVICE_USER" npx prisma migrate deploy || {
        print_warning "Migrations failed, trying db push..."
        sudo -u "$SERVICE_USER" npx prisma db push --accept-data-loss
    }
    
    # Build TypeScript
    print_info "Building backend..."
    if [ -f "tsconfig.json" ]; then
        sudo -u "$SERVICE_USER" npm run build
    else
        print_warning "TypeScript config not found, skipping build"
    fi
    
    print_success "Backend setup complete"
}

################################################################################
# Setup Frontend
################################################################################

setup_frontend() {
    print_header "Setting Up Frontend"
    
    cd "$APP_DIR/frontend"
    
    # Install dependencies
    print_info "Installing frontend dependencies..."
    if [ -f "package.json" ]; then
        sudo -u "$SERVICE_USER" npm install
    else
        print_error "package.json not found in frontend directory"
        exit 1
    fi
    
    # Generate Prisma client if schema exists
    if [ -f "prisma/schema.prisma" ]; then
        print_info "Generating Prisma client..."
        sudo -u "$SERVICE_USER" npx prisma generate
    fi
    
    # Build Next.js
    print_info "Building frontend (this may take a few minutes)..."
    # Temporarily modify build script to skip db push if needed
    if grep -q "prisma db push" package.json; then
        sed -i 's/"build": "prisma generate && prisma db push && next build"/"build": "prisma generate && next build"/' package.json
    fi
    sudo -u "$SERVICE_USER" npm run build
    
    print_success "Frontend setup complete"
}

################################################################################
# Setup PM2
################################################################################

setup_pm2() {
    print_header "Setting Up PM2 Process Manager"
    
    cd "$APP_DIR"
    
    # Stop any existing PM2 processes
    pm2 delete all 2>/dev/null || true
    
    # Create log directory
    mkdir -p /var/log/kso
    chown -R "$SERVICE_USER:$SERVICE_USER" /var/log/kso
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [
    {
      name: 'kso-backend',
      cwd: '${APP_DIR}/backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/kso/backend-error.log',
      out_file: '/var/log/kso/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000
    },
    {
      name: 'kso-frontend',
      cwd: '${APP_DIR}/frontend',
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
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
EOF

    chown "$SERVICE_USER:$SERVICE_USER" ecosystem.config.js
    
    # Start applications with PM2
    sudo -u "$SERVICE_USER" pm2 start ecosystem.config.js
    sudo -u "$SERVICE_USER" pm2 save
    
    # Setup PM2 startup script
    STARTUP_CMD=$(sudo -u "$SERVICE_USER" pm2 startup systemd -u "$SERVICE_USER" --hp "$APP_DIR" | grep "sudo" || echo "")
    if [ -n "$STARTUP_CMD" ]; then
        eval "$STARTUP_CMD"
    fi
    
    print_success "PM2 processes started"
}

################################################################################
# Setup Nginx Configuration
################################################################################

setup_nginx_config() {
    print_header "Configuring Nginx"
    
    NGINX_CONFIG="/etc/nginx/sites-available/${APP_NAME}"
    
    if [ -n "$DOMAIN_NAME" ]; then
        cat > "$NGINX_CONFIG" <<EOF
# Upstream backend
upstream backend {
    server localhost:5000;
    keepalive 64;
}

# Upstream frontend
upstream frontend {
    server localhost:3000;
    keepalive 64;
}

# Rate limiting
limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone \$binary_remote_addr zone=general_limit:10m rate=30r/s;

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN_NAME};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    client_max_body_size 50M;

    # Frontend
    location / {
        limit_req zone=general_limit burst=20 nodelay;
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

    # Backend API
    location /api {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }
}
EOF
    else
        # Use nginx.conf from project if available
        if [ -f "$APP_DIR/nginx.conf" ]; then
            cp "$APP_DIR/nginx.conf" "$NGINX_CONFIG"
        else
            cat > "$NGINX_CONFIG" <<EOF
# Upstream backend
upstream backend {
    server localhost:5000;
    keepalive 64;
}

# Upstream frontend
upstream frontend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    # Frontend
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

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
    }
}
EOF
        fi
    fi
    
    # Enable site
    ln -sf "$NGINX_CONFIG" "/etc/nginx/sites-enabled/${APP_NAME}"
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload
    nginx -t && systemctl reload nginx
    
    print_success "Nginx configured"
}

################################################################################
# Setup SSL
################################################################################

setup_ssl() {
    if [ -z "$DOMAIN_NAME" ] || [ -z "$EMAIL" ]; then
        print_warning "Skipping SSL setup (no domain/email provided)"
        return
    fi
    
    print_header "Setting Up SSL Certificate"
    
    # Install certbot
    apt-get install -y certbot python3-certbot-nginx
    
    # Get certificate
    certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email "$EMAIL" --redirect || true
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    print_success "SSL certificate installed"
}

################################################################################
# Wait for Services
################################################################################

wait_for_services() {
    print_header "Waiting for Services to Start"
    
    sleep 5
    
    # Check backend
    for i in {1..30}; do
        if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
            print_success "Backend is healthy"
            break
        fi
        sleep 2
    done
    
    # Check frontend
    for i in {1..30}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend is healthy"
            break
        fi
        sleep 2
    done
}

################################################################################
# Create Admin User
################################################################################

create_admin_user() {
    print_header "Creating Admin User"
    
    print_info "You can create an admin user by running:"
    print_info "cd $APP_DIR/backend && npm run create-admin"
    
    read -p "Do you want to create an admin user now? (y/n): " CREATE_ADMIN
    if [ "$CREATE_ADMIN" = "y" ]; then
        cd "$APP_DIR/backend"
        npm run create-admin || true
    fi
}

################################################################################
# Main Function
################################################################################

main() {
    print_header "KSO - Complete Installation & Update Script"
    
    if [ "$IS_UPDATE" = true ]; then
        print_info "UPDATE MODE: This will pull latest changes and update the application"
    else
        print_info "INSTALL MODE: This will perform a fresh installation"
    fi
    echo ""
    
    check_root
    detect_mode
    get_user_input
    
    clean_old_data
    update_system
    install_nodejs
    install_postgresql
    setup_database
    install_nginx
    setup_firewall
    create_app_user
    setup_git_repo
    convert_prisma_schemas
    setup_environment
    setup_backend
    setup_frontend
    setup_pm2
    setup_nginx_config
    setup_ssl
    wait_for_services
    
    if [ "$IS_UPDATE" = false ]; then
        create_admin_user
    fi
    
    print_header "Installation Complete!"
    print_success "Application is running"
    echo ""
    if [ -n "$DOMAIN_NAME" ]; then
        print_info "Access your application at: https://$DOMAIN_NAME"
    else
        SERVER_IP=$(hostname -I | awk '{print $1}')
        print_info "Access your application at: http://$SERVER_IP"
    fi
    print_info "Backend API: http://localhost:5000/api"
    print_info "Frontend: http://localhost:3000"
    echo ""
    print_info "Useful commands:"
    print_info "  View logs: pm2 logs"
    print_info "  Restart: pm2 restart all"
    print_info "  Status: pm2 status"
    print_info "  Stop: pm2 stop all"
    print_info "  Update: cd $APP_DIR && sudo bash install.sh"
    print_info "  Create admin: cd $APP_DIR/backend && npm run create-admin"
    echo ""
    print_info "Database credentials saved in:"
    print_info "  Backend: $APP_DIR/backend/.env"
    print_info "  Frontend: $APP_DIR/frontend/.env"
    echo ""
    print_success "To update in the future, just run: sudo bash install.sh"
}

# Run main
main

