# Quick Fix - Manual Setup Steps

## Current Situation
- Files are at: `/var/www/nextapp/upload`
- PM2 is not installed
- Application is not running

## Solution: Run These Commands on Your Server

### Step 1: Install Node.js and PM2

```bash
# Update package list
apt-get update

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify Node.js installation
node -v
npm -v

# Install PM2 globally
npm install -g pm2

# Verify PM2 installation
pm2 -v
```

### Step 2: Move Files to Correct Location (or use current location)

**Option A: Move files to /opt/kso (recommended)**
```bash
# Create directory
mkdir -p /opt/kso

# Move files
mv /var/www/nextapp/upload/* /opt/kso/
cd /opt/kso
```

**Option B: Use current location**
```bash
cd /var/www/nextapp/upload
```

### Step 3: Install Dependencies and Build

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build backend
npm run build

# Navigate to frontend
cd ../frontend

# Install dependencies
npm install

# Generate Prisma client (if needed)
npx prisma generate

# Build frontend
npm run build
```

### Step 4: Setup Database

```bash
# Install PostgreSQL if not installed
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER kso_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE kso_db OWNER kso_user;
GRANT ALL PRIVILEGES ON DATABASE kso_db TO kso_user;
\q
EOF
```

### Step 5: Convert Prisma Schema to PostgreSQL

```bash
# Go to backend
cd /opt/kso/backend  # or /var/www/nextapp/upload/backend

# Edit schema.prisma - change provider from sqlite to postgresql
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' prisma/schema.prisma

# Do the same for frontend if needed
cd ../frontend
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i 's|url.*file:.*|url      = env("DATABASE_URL")|' prisma/schema.prisma
```

### Step 6: Create Environment Files

```bash
# Backend .env
cat > backend/.env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://kso_user:your_secure_password_here@localhost:5432/kso_db?schema=public
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
JWT_EXPIRES_IN=7d
EOF

# Frontend .env
cat > frontend/.env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://kso_user:your_secure_password_here@localhost:5432/kso_db?schema=public
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
NEXT_PUBLIC_API_URL=http://103.60.12.157/api
EOF
```

**Important:** Replace `your_secure_password_here` with the actual password you used in Step 4!

### Step 7: Run Database Migrations

```bash
cd /opt/kso/backend  # or your path
npx prisma migrate deploy
# OR if migrations fail:
npx prisma db push --accept-data-loss
```

### Step 8: Start Application with PM2

```bash
# Go to project root
cd /opt/kso  # or /var/www/nextapp/upload

# Start backend
cd backend
pm2 start dist/server.js --name kso-backend

# Start frontend
cd ../frontend
pm2 start "npm run start" --name kso-frontend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

### Step 9: Configure Nginx

```bash
# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/kso

# Enable site
ln -s /etc/nginx/sites-available/kso /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

### Step 10: Check Status

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Check if ports are listening
netstat -tlnp | grep -E ':(3000|5000)'

# Test backend
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000
```

### Step 11: Create Admin User

```bash
cd /opt/kso/backend  # or your path
npm run create-admin
```

---

## Quick All-in-One Script

If you want to run everything at once, here's a combined script:

```bash
#!/bin/bash
# Quick setup script

# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

# Move to project directory
cd /var/www/nextapp/upload  # or /opt/kso if you moved files

# Setup backend
cd backend
npm install
npx prisma generate
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i 's|url.*file:.*|url = env("DATABASE_URL")|' prisma/schema.prisma
npm run build

# Setup frontend
cd ../frontend
npm install
npx prisma generate
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
sed -i 's|url.*file:.*|url = env("DATABASE_URL")|' prisma/schema.prisma
npm run build

# Create .env files (update password!)
cd ../backend
cat > .env <<EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://kso_user:CHANGE_THIS_PASSWORD@localhost:5432/kso_db?schema=public
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
JWT_EXPIRES_IN=7d
EOF

cd ../frontend
cat > .env <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://kso_user:CHANGE_THIS_PASSWORD@localhost:5432/kso_db?schema=public
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
NEXT_PUBLIC_API_URL=http://103.60.12.157/api
EOF

# Start with PM2
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
cp nginx.conf /etc/nginx/sites-available/kso
ln -s /etc/nginx/sites-available/kso /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "Setup complete! Check with: pm2 status"
```

---

## Troubleshooting

### PM2 command not found
- Make sure Node.js is installed: `node -v`
- Install PM2: `npm install -g pm2`
- Check PATH: `echo $PATH`

### Application not starting
- Check logs: `pm2 logs`
- Check if ports are in use: `netstat -tlnp | grep -E ':(3000|5000)'`
- Verify .env files exist and have correct values

### Database connection errors
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify DATABASE_URL in .env matches database credentials
- Test connection: `psql -U kso_user -d kso_db`

### Nginx still showing default page
- Check Nginx config: `nginx -t`
- Verify site is enabled: `ls -la /etc/nginx/sites-enabled/`
- Check Nginx error log: `tail -f /var/log/nginx/error.log`

