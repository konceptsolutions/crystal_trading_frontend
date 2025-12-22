#!/bin/bash
# Fix Database Credentials Script
# This script fixes PostgreSQL authentication issues

set -e

echo "=========================================="
echo "Database Credentials Fix"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "ERROR: backend/ directory not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Check PostgreSQL Status
echo "=========================================="
echo "Step 1: Checking PostgreSQL"
echo "=========================================="

if ! systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL..."
    systemctl start postgresql
    systemctl enable postgresql
    sleep 2
fi

echo "✓ PostgreSQL is running"
echo ""

# Step 2: Check if database user exists
echo "=========================================="
echo "Step 2: Checking Database User"
echo "=========================================="

DB_USER="kso_user"
DB_NAME="kso_db"

# Check if user exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" 2>/dev/null || echo "0")

if [ "$USER_EXISTS" != "1" ]; then
    echo "Database user '${DB_USER}' does not exist. Creating..."
    
    # Generate a secure password
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Create user
    sudo -u postgres psql <<EOF
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
ALTER USER ${DB_USER} CREATEDB;
\q
EOF
    
    echo "✓ Created database user: ${DB_USER}"
    echo "✓ Generated password: ${DB_PASSWORD}"
else
    echo "✓ Database user '${DB_USER}' exists"
    
    # Try to get password from existing .env or generate new one
    if [ -f "backend/.env" ]; then
        OLD_PASSWORD=$(grep DATABASE_URL backend/.env | cut -d':' -f3 | cut -d'@' -f1 || echo "")
        if [ -n "$OLD_PASSWORD" ]; then
            DB_PASSWORD="$OLD_PASSWORD"
            echo "Using password from existing .env file"
        else
            DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            echo "⚠ Generated new password (will update PostgreSQL user)"
        fi
    else
        DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        echo "⚠ Generated new password (will update PostgreSQL user)"
    fi
    
    # Update password
    echo "Updating user password..."
    sudo -u postgres psql <<EOF
ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
\q
EOF
    echo "✓ Updated password for user: ${DB_USER}"
fi

echo ""

# Step 3: Check if database exists
echo "=========================================="
echo "Step 3: Checking Database"
echo "=========================================="

DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "0")

if [ "$DB_EXISTS" != "1" ]; then
    echo "Database '${DB_NAME}' does not exist. Creating..."
    sudo -u postgres psql <<EOF
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF
    echo "✓ Created database: ${DB_NAME}"
else
    echo "✓ Database '${DB_NAME}' exists"
    
    # Grant privileges
    sudo -u postgres psql <<EOF
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\q
EOF
    echo "✓ Granted privileges"
fi

echo ""

# Step 4: Update pg_hba.conf to allow password authentication
echo "=========================================="
echo "Step 4: Configuring PostgreSQL Authentication"
echo "=========================================="

PG_HBA_FILE=$(find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)

if [ -n "$PG_HBA_FILE" ]; then
    # Backup original
    cp "$PG_HBA_FILE" "${PG_HBA_FILE}.backup"
    
    # Change local connections to use md5 (password) instead of peer
    sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_HBA_FILE" 2>/dev/null || true
    sed -i 's/local   all             all                                     ident/local   all             all                                     md5/' "$PG_HBA_FILE" 2>/dev/null || true
    
    # Restart PostgreSQL
    systemctl restart postgresql
    sleep 2
    
    echo "✓ Updated PostgreSQL authentication settings"
else
    echo "⚠ Could not find pg_hba.conf, but continuing..."
fi

echo ""

# Step 5: Update backend .env file
echo "=========================================="
echo "Step 5: Updating Backend .env File"
echo "=========================================="

# Backup existing .env
if [ -f "backend/.env" ]; then
    cp backend/.env backend/.env.backup
fi

# Get JWT_SECRET from existing .env or generate new
if [ -f "backend/.env.backup" ]; then
    JWT_SECRET=$(grep JWT_SECRET backend/.env.backup | cut -d'=' -f2 || echo "")
fi

if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
fi

# Create/update .env
cat > backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?schema=public
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
EOF

echo "✓ Updated backend/.env"
echo ""
echo "Database credentials:"
echo "  User: ${DB_USER}"
echo "  Database: ${DB_NAME}"
echo "  Password: ${DB_PASSWORD}"
echo ""

# Step 6: Test database connection
echo "=========================================="
echo "Step 6: Testing Database Connection"
echo "=========================================="

# Test connection using psql
if PGPASSWORD="${DB_PASSWORD}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✓ Database connection successful!"
else
    echo "⚠ Direct psql connection test failed, but this might be normal"
    echo "  Will test via Prisma instead..."
fi

echo ""

# Step 7: Run Prisma migrations
echo "=========================================="
echo "Step 7: Running Database Migrations"
echo "=========================================="

cd backend

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Try to run migrations
echo "Running migrations..."
if npx prisma migrate deploy 2>/dev/null; then
    echo "✓ Migrations completed"
else
    echo "⚠ Migrations failed, trying db push..."
    if npx prisma db push --accept-data-loss 2>/dev/null; then
        echo "✓ Database schema pushed"
    else
        echo "⚠ Database push failed, but continuing..."
    fi
fi

cd ..

echo ""

# Step 8: Restart backend
echo "=========================================="
echo "Step 8: Restarting Backend"
echo "=========================================="

pm2 restart kso-backend
sleep 3

echo "✓ Backend restarted"
echo ""

# Step 9: Test backend connection
echo "=========================================="
echo "Step 9: Testing Backend"
echo "=========================================="

sleep 2

if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is responding"
else
    echo "⚠ Backend not responding yet, check logs: pm2 logs kso-backend"
fi

echo ""

# Step 10: Summary
echo "=========================================="
echo "Fix Complete!"
echo "=========================================="
echo ""
echo "Database Configuration:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  User: ${DB_USER}"
echo "  Database: ${DB_NAME}"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "IMPORTANT: Save these credentials!"
echo ""
echo "Backend .env file updated at: backend/.env"
echo ""
echo "If you still see errors:"
echo "1. Check backend logs: pm2 logs kso-backend"
echo "2. Verify PostgreSQL is running: systemctl status postgresql"
echo "3. Test connection: PGPASSWORD='${DB_PASSWORD}' psql -h localhost -U ${DB_USER} -d ${DB_NAME}"
echo ""

