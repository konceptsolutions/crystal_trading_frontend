# Production Deployment Guide

This guide will help you deploy the KSO (Inventory Management System) to a production VPS server using native installation (no Docker).

## Prerequisites

- Ubuntu 20.04+ or Debian 11+ VPS
- Root or sudo access
- Domain name (optional, for SSL)
- At least 2GB RAM and 20GB disk space

## Quick Installation

### Automated Installation (Recommended)

1. **Clone or upload your application to the VPS:**
   ```bash
   cd /opt
   git clone <your-repo-url> kso
   # OR upload your files via SCP/SFTP
   ```

2. **Run the installation script:**
   ```bash
   cd /opt/kso
   sudo bash install-production.sh
   ```

3. **Follow the prompts:**
   - Enter your domain name (or skip for IP-only access)
   - Enter your email for SSL certificate
   - Set database password (or use auto-generated)
   - Set JWT secret (or use auto-generated)

The script will automatically:
- Install Node.js, PostgreSQL, Nginx, PM2
- Configure firewall
- Set up SSL certificate (if domain provided)
- Build and start the application
- Configure reverse proxy

### Manual Installation

If you prefer manual installation, follow these steps:

#### 1. Install System Dependencies

```bash
sudo apt-get update
sudo apt-get install -y curl wget git build-essential
```

#### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Install PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 4. Install Nginx

```bash
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 5. Install PM2

```bash
sudo npm install -g pm2
```

#### 6. Configure Environment Variables

```bash
cd /opt/kso
cp .env.production.example backend/.env
cp .env.production.example frontend/.env
nano backend/.env  # Edit with your values
nano frontend/.env  # Edit with your values
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong random secret for JWT tokens
- `DB_PASSWORD`: Database password
- `NEXT_PUBLIC_API_URL`: Your API URL (http://yourdomain.com/api or http://localhost:5000/api)

#### 7. Convert Prisma Schema to PostgreSQL

```bash
cd backend/prisma
# Edit schema.prisma and change:
# provider = "sqlite" -> provider = "postgresql"
# url = "file:./dev.db" -> url = env("DATABASE_URL")
```

Or use the conversion script:
```bash
bash scripts/prepare-production.sh
```

#### 8. Setup Database

```bash
sudo -u postgres psql
CREATE USER kso_user WITH PASSWORD 'your_password';
CREATE DATABASE kso_db OWNER kso_user;
GRANT ALL PRIVILEGES ON DATABASE kso_db TO kso_user;
\q
```

#### 9. Install Dependencies and Build

```bash
# Backend
cd /opt/kso/backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend
cd /opt/kso/frontend
npm install
npx prisma generate
npm run build
```

#### 10. Configure Nginx

Copy the nginx configuration:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/kso
sudo ln -s /etc/nginx/sites-available/kso /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

#### 11. Setup PM2

```bash
cd /opt/kso
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 12. Setup SSL (Optional but Recommended)

If you have a domain name:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Installation

### Create Admin User

```bash
cd /opt/kso/backend
npm run create-admin
```

### Verify Installation

1. Check services are running:
   ```bash
   pm2 status
   ```

2. Check logs:
   ```bash
   pm2 logs
   ```

3. Test endpoints:
   ```bash
   curl http://localhost:5000/api/health
   curl http://localhost:3000
   ```

## Maintenance

### Updating the Application

```bash
cd /opt/kso
bash scripts/deploy.sh
```

Or manually:
```bash
git pull
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart all
cd ../backend && npx prisma migrate deploy
```

### Database Backups

Create a backup:
```bash
bash scripts/backup-database.sh
```

Backups are stored in `/opt/kso/backups/` and automatically cleaned up after 30 days.

### Viewing Logs

```bash
# PM2 logs
pm2 logs

# Specific service
pm2 logs kso-backend
pm2 logs kso-frontend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restarting Services

```bash
# Restart all
pm2 restart all

# Restart specific service
pm2 restart kso-backend
pm2 restart kso-frontend
```

### Stopping Services

```bash
pm2 stop all
```

### Starting Services

```bash
pm2 start all
```

## Troubleshooting

### Services won't start

1. Check logs: `pm2 logs`
2. Check environment variables: `cat backend/.env`
3. Check database connection: `psql -U kso_user -d kso_db`

### Database connection errors

1. Verify DATABASE_URL in .env matches PostgreSQL setup
2. Check PostgreSQL is running: `sudo systemctl status postgresql`
3. Check database exists: `sudo -u postgres psql -l`

### Port conflicts

If ports 3000 or 5000 are already in use:
1. Change ports in ecosystem.config.js
2. Update Nginx configuration
3. Update .env files

### SSL certificate issues

1. Ensure domain DNS points to your server
2. Ensure ports 80 and 443 are open
3. Check certificate: `sudo certbot certificates`
4. Renew manually: `sudo certbot renew`

## Security Considerations

1. **Change default passwords**: Update all default passwords in .env
2. **Firewall**: Ensure only necessary ports are open
3. **SSL**: Always use HTTPS in production
4. **Regular updates**: Keep system and Node.js packages updated
5. **Backups**: Set up automated backups
6. **Monitoring**: Consider setting up monitoring and alerting

## Performance Optimization

1. **Database indexing**: Ensure Prisma migrations include proper indexes
2. **PM2 clustering**: Consider using PM2 cluster mode for better performance
3. **CDN**: Use a CDN for static assets
4. **Load balancing**: For high traffic, consider multiple instances behind a load balancer

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Review this documentation
3. Check application logs in PM2

## File Structure

```
/opt/kso/
├── backend/          # Backend application
├── frontend/         # Frontend application
├── ecosystem.config.js # PM2 configuration
├── .env              # Environment variables (create from .env.production.example)
├── nginx.conf        # Nginx configuration
├── install-production.sh # Automated installation script
├── scripts/          # Utility scripts
│   ├── deploy.sh
│   ├── backup-database.sh
│   └── prepare-production.sh
└── backups/          # Database backups (created automatically)
```

## Environment Variables Reference

See `.env.production.example` for all available environment variables and their descriptions.
