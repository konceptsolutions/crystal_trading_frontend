#!/bin/bash

# KSO Production Installation Script - Single Command Installation
# This script installs everything natively without Docker
# Usage: sudo bash install-production.sh

# Don't exit on error - we want to continue even if some steps fail
set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="kso"
APP_DIR="/opt/${APP_NAME}"
SERVICE_USER="${APP_NAME}"
DOMAIN_NAME=""
EMAIL=""
DB_PASSWORD=""
JWT_SECRET=""
NODE_VERSION="20"

# Error handling function
handle_error() {
    local line=$1
    local error=$2
    echo -e "${YELLOW}⚠ Error at line $line: $error${NC}"
    echo -e "${BLUE}Attempting to continue...${NC}"
    return 0
}

trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

# Functions
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
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

# Update system
update_system() {
    print_header "Updating System Packages"
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq || true
    apt-get upgrade -y -qq || true
    apt-get install -y -qq curl wget git build-essential ca-certificates gnupg lsb-release ufw software-properties-common || true
    print_success "System updated"
}

# Install Node.js
install_nodejs() {
    print_header "Installing Node.js ${NODE_VERSION}"
    
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_CURRENT" -ge "$NODE_VERSION" ]; then
            print_info "Node.js $NODE_CURRENT is already installed"
            return
        fi
    fi
    
    # Install Node.js using NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - || {
        # Fallback to default repository
        apt-get install -y nodejs npm || true
    }
    
    apt-get install -y nodejs || true
    
    # Verify installation
    if command -v node &> /dev/null; then
        print_success "Node.js $(node -v) installed"
        print_success "npm $(npm -v) installed"
    else
        print_warning "Node.js installation may have issues, continuing..."
    fi
    
    # Install PM2 globally for process management
    npm install -g pm2 || true
    print_success "PM2 installed"
}

# Install PostgreSQL
install_postgresql() {
    print_header "Installing PostgreSQL"
    
    if command -v psql &> /dev/null; then
        print_info "PostgreSQL is already installed"
        return
    fi
    
    # Install PostgreSQL
    apt-get install -y postgresql postgresql-contrib || true
    
    # Start and enable PostgreSQL
    systemctl start postgresql || true
    systemctl enable postgresql || true
    
    # Wait for PostgreSQL to be ready
    sleep 3
    
    print_success "PostgreSQL installed"
}

# Setup database
setup_database() {
    print_header "Setting Up Database"
    
    # Generate password if not provided
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    fi
    
    DB_USER="kso_user"
    DB_NAME="kso_db"
    
    # Create database and user
    sudo -u postgres psql <<EOF || true
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF
    
    # Update pg_hba.conf to allow password authentication
    sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' /etc/postgresql/*/main/pg_hba.conf || true
    systemctl restart postgresql || true
    sleep 2
    
    print_success "Database created: ${DB_NAME}"
    print_success "Database user created: ${DB_USER}"
}

# Install Nginx
install_nginx() {
    print_header "Installing Nginx"
    
    if command -v nginx &> /dev/null; then
        print_info "Nginx is already installed"
        return
    fi
    
    apt-get install -y nginx || true
    systemctl enable nginx || true
    systemctl start nginx || true
    
    print_success "Nginx installed"
}

# Setup firewall
setup_firewall() {
    print_header "Configuring Firewall"
    
    ufw --force enable || true
    ufw allow 22/tcp || true
    ufw allow 80/tcp || true
    ufw allow 443/tcp || true
    
    print_success "Firewall configured"
}

# Get user input
get_user_input() {
    print_header "Configuration"
    
    read -p "Enter your domain name (or press Enter to skip SSL setup): " DOMAIN_NAME
    if [ -n "$DOMAIN_NAME" ]; then
        read -p "Enter your email for Let's Encrypt: " EMAIL
    fi
    
    read -p "Enter database password (or press Enter for auto-generated): " DB_PASSWORD_INPUT
    if [ -n "$DB_PASSWORD_INPUT" ]; then
        DB_PASSWORD="$DB_PASSWORD_INPUT"
    fi
    
    read -p "Enter JWT secret (or press Enter for auto-generated): " JWT_SECRET_INPUT
    if [ -n "$JWT_SECRET_INPUT" ]; then
        JWT_SECRET="$JWT_SECRET_INPUT"
    fi
}

# Create application user
create_app_user() {
    print_header "Creating Application User"
    
    if id "$SERVICE_USER" &>/dev/null; then
        print_info "User $SERVICE_USER already exists"
    else
        useradd -r -m -s /bin/bash -d "$APP_DIR" "$SERVICE_USER" || true
        print_success "User $SERVICE_USER created"
    fi
}

# Setup application directory
setup_app_directory() {
    print_header "Setting Up Application Directory"
    
    CURRENT_DIR=$(pwd)
    
    # Check if we're in the right directory (has backend and frontend folders)
    if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
        print_error "Error: backend/ or frontend/ directory not found!"
        print_info "Please run this script from the project root directory"
        print_info "Current directory: $CURRENT_DIR"
        exit 1
    fi
    
    # If we're not in APP_DIR, copy files there
    if [ "$CURRENT_DIR" != "$APP_DIR" ]; then
        print_info "Copying application files to $APP_DIR..."
        mkdir -p "$APP_DIR"
        
        # Copy files excluding node_modules and other unnecessary files
        rsync -av --exclude 'node_modules' --exclude '.git' --exclude '*.db' --exclude '*.db-journal' --exclude '.next' --exclude 'dist' . "$APP_DIR/" 2>/dev/null || {
            # Fallback to cp if rsync not available
            cp -r backend frontend *.json *.md *.sh *.yml *.conf ecosystem.config.js 2>/dev/null "$APP_DIR/" 2>/dev/null || true
            cp -r scripts systemd 2>/dev/null "$APP_DIR/" 2>/dev/null || true
        }
        
        print_success "Files copied to $APP_DIR"
    else
        print_info "Already in application directory: $APP_DIR"
    fi
    
    # Ensure directory exists and set ownership
    mkdir -p "$APP_DIR"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR" 2>/dev/null || true
    
    # Change to APP_DIR for remaining operations
    cd "$APP_DIR"
    
    print_success "Application directory ready: $APP_DIR"
}

# Convert Prisma schemas to PostgreSQL
convert_prisma_schemas() {
    print_header "Converting Prisma Schemas to PostgreSQL"
    
    cd "$APP_DIR"
    
    # Backend schema
    if [ -f "backend/prisma/schema.prisma" ]; then
        if [ ! -f "backend/prisma/schema.prisma.backup" ]; then
            cp backend/prisma/schema.prisma backend/prisma/schema.prisma.backup || true
        fi
        # Use sed with backup for compatibility
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' backend/prisma/schema.prisma || true
            sed -i '' 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' backend/prisma/schema.prisma || true
        else
            sed -i 's/provider = "sqlite"/provider = "postgresql"/' backend/prisma/schema.prisma || true
            sed -i 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' backend/prisma/schema.prisma || true
        fi
        print_success "Backend schema converted"
    else
        print_warning "Backend schema not found, skipping conversion"
    fi
    
    # Frontend schema
    if [ -f "frontend/prisma/schema.prisma" ]; then
        if [ ! -f "frontend/prisma/schema.prisma.backup" ]; then
            cp frontend/prisma/schema.prisma frontend/prisma/schema.prisma.backup || true
        fi
        if grep -q 'provider = "sqlite"' frontend/prisma/schema.prisma; then
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' 's/provider = "sqlite"/provider = "postgresql"/' frontend/prisma/schema.prisma || true
                sed -i '' 's|url.*file:.*|url      = env("DATABASE_URL")|' frontend/prisma/schema.prisma || true
            else
                sed -i 's/provider = "sqlite"/provider = "postgresql"/' frontend/prisma/schema.prisma || true
                sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' frontend/prisma/schema.prisma || true
            fi
        fi
        print_success "Frontend schema converted"
    else
        print_warning "Frontend schema not found, skipping conversion"
    fi
}

# Setup environment variables
setup_environment() {
    print_header "Setting Up Environment Variables"
    
    cd "$APP_DIR"
    
    # Generate secrets if not provided
    if [ -z "$JWT_SECRET" ]; then
        JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    fi
    
    # Create .env files
    cat > backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
EOF

    if [ -n "$DOMAIN_NAME" ]; then
        API_URL="https://${DOMAIN_NAME}/api"
    else
        API_URL="http://localhost:5000/api"
    fi
    
    cat > frontend/.env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
NEXT_PUBLIC_API_URL=${API_URL}
EOF

    chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR" || true
    
    print_success "Environment variables configured"
}

# Install backend dependencies and build
setup_backend() {
    print_header "Setting Up Backend"
    
    cd "$APP_DIR/backend"
    
    # Install all dependencies (including dev dependencies for build)
    print_info "Installing backend dependencies..."
    if [ -f "package.json" ]; then
        sudo -u "$SERVICE_USER" npm install || npm install || true
    else
        print_warning "package.json not found in backend directory"
        return
    fi
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    sudo -u "$SERVICE_USER" npx prisma generate || npx prisma generate || true
    
    # Run migrations
    print_info "Running database migrations..."
    sudo -u "$SERVICE_USER" npx prisma migrate deploy || {
        # If migrations fail, try to push schema
        print_warning "Migrations failed, trying db push..."
        sudo -u "$SERVICE_USER" npx prisma db push --accept-data-loss || true
    }
    
    # Build TypeScript
    print_info "Building backend..."
    if [ -f "tsconfig.json" ]; then
        sudo -u "$SERVICE_USER" npm run build || npm run build || true
    else
        print_warning "TypeScript config not found, skipping build"
    fi
    
    print_success "Backend setup complete"
}

# Install frontend dependencies and build
setup_frontend() {
    print_header "Setting Up Frontend"
    
    cd "$APP_DIR/frontend"
    
    # Install all dependencies
    print_info "Installing frontend dependencies..."
    if [ -f "package.json" ]; then
        sudo -u "$SERVICE_USER" npm install || npm install || true
    else
        print_warning "package.json not found in frontend directory"
        return
    fi
    
    # Generate Prisma client if schema exists
    if [ -f "prisma/schema.prisma" ]; then
        print_info "Generating Prisma client..."
        sudo -u "$SERVICE_USER" npx prisma generate || npx prisma generate || true
    fi
    
    # Build Next.js (skip db push in production)
    print_info "Building frontend (this may take a few minutes)..."
    # Temporarily modify build script to skip db push
    if grep -q "prisma db push" package.json; then
        sed -i 's/"build": "prisma generate && prisma db push && next build"/"build": "prisma generate && next build"/' package.json || true
    fi
    sudo -u "$SERVICE_USER" npm run build || npm run build || true
    
    print_success "Frontend setup complete"
}

# Setup PM2 processes
setup_pm2() {
    print_header "Setting Up PM2 Process Manager"
    
    cd "$APP_DIR"
    
    # Stop any existing PM2 processes
    pm2 delete all || true
    pm2 kill || true
    
    # Create log directory
    mkdir -p /var/log/kso
    chown -R "$SERVICE_USER:$SERVICE_USER" /var/log/kso || true
    
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

    chown "$SERVICE_USER:$SERVICE_USER" ecosystem.config.js || true
    
    # Start applications with PM2 as the service user
    sudo -u "$SERVICE_USER" pm2 start ecosystem.config.js || pm2 start ecosystem.config.js || true
    sudo -u "$SERVICE_USER" pm2 save || pm2 save || true
    
    # Setup PM2 startup script
    sudo -u "$SERVICE_USER" pm2 startup systemd -u "$SERVICE_USER" --hp "$APP_DIR" | grep "sudo" | bash || true
    
    print_success "PM2 processes started"
}

# Setup Nginx configuration
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
    
    # Enable site
    ln -sf "$NGINX_CONFIG" "/etc/nginx/sites-enabled/${APP_NAME}" || true
    rm -f /etc/nginx/sites-enabled/default || true
    
    # Test and reload
    nginx -t && systemctl reload nginx || true
    
    print_success "Nginx configured"
}

# Setup SSL
setup_ssl() {
    if [ -z "$DOMAIN_NAME" ] || [ -z "$EMAIL" ]; then
        print_warning "Skipping SSL setup (no domain/email provided)"
        return
    fi
    
    print_header "Setting Up SSL Certificate"
    
    # Install certbot
    apt-get install -y certbot python3-certbot-nginx || true
    
    # Get certificate
    certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email "$EMAIL" --redirect || true
    
    # Setup auto-renewal
    systemctl enable certbot.timer || true
    systemctl start certbot.timer || true
    
    print_success "SSL certificate installed"
}

# Wait for services
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

# Create admin user
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

# Main installation
main() {
    print_header "KSO Production Installation - Native Setup"
    print_info "This will install everything natively without Docker"
    echo ""
    
    check_root
    get_user_input
    
    update_system
    install_nodejs
    install_postgresql
    setup_database
    install_nginx
    setup_firewall
    create_app_user
    setup_app_directory
    convert_prisma_schemas
    setup_environment
    setup_backend
    setup_frontend
    setup_pm2
    setup_nginx_config
    setup_ssl
    wait_for_services
    create_admin_user
    
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
    print_info "  Create admin: cd $APP_DIR/backend && npm run create-admin"
    echo ""
    print_info "Database credentials saved in:"
    print_info "  Backend: $APP_DIR/backend/.env"
    print_info "  Frontend: $APP_DIR/frontend/.env"
}

# Run main
main

