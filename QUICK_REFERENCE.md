# KSO Production - Quick Reference

## 🚀 Installation

```bash
cd /opt/kso
sudo bash install-production.sh
```

## 📝 Essential Commands

### PM2 Process Manager
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# Start all services
pm2 start all

# View specific service
pm2 logs kso-backend
pm2 logs kso-frontend

# Restart specific service
pm2 restart kso-backend
```

### Database
```bash
# Run migrations
cd /opt/kso/backend
npx prisma migrate deploy

# Create admin user
npm run create-admin

# Backup database
cd /opt/kso
bash scripts/backup-database.sh

# Access database
psql -U kso_user -d kso_db
```

### Application
```bash
# Deploy updates
cd /opt/kso
bash scripts/deploy.sh

# Monitor status
bash scripts/monitor.sh

# Prepare for production
bash scripts/prepare-production.sh
```

### Systemd (if installed)
```bash
# Start service
sudo systemctl start kso

# Stop service
sudo systemctl stop kso

# View logs
sudo journalctl -u kso -f
```

## 🔧 Configuration Files

- `backend/.env` - Backend environment variables
- `frontend/.env` - Frontend environment variables
- `ecosystem.config.js` - PM2 configuration
- `nginx.conf` - Nginx reverse proxy
- `/etc/nginx/sites-available/kso` - Nginx site config

## 🌐 URLs

- Frontend: `http://localhost:3000` or `https://yourdomain.com`
- Backend API: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

## 🔍 Troubleshooting

### Check service status
```bash
pm2 status
pm2 logs kso-backend
pm2 logs kso-frontend
```

### Check health
```bash
curl http://localhost:5000/api/health
curl http://localhost:3000
```

### Restart everything
```bash
pm2 restart all
```

### View Nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 📦 Backup & Restore

### Backup
```bash
bash scripts/backup-database.sh
# Backups stored in: /opt/kso/backups/
```

### Restore
```bash
# Extract backup
gunzip backups/kso_backup_YYYYMMDD_HHMMSS.sql.gz

# Restore
psql -U kso_user -d kso_db < backups/kso_backup_YYYYMMDD_HHMMSS.sql
```

## 🔐 Security

### Generate secure secrets
```bash
# JWT Secret
openssl rand -base64 64

# Database Password
openssl rand -base64 32
```

### Update passwords
```bash
# Edit .env files
nano backend/.env
nano frontend/.env

# Restart services
pm2 restart all
```

## 📊 Monitoring

```bash
# Application status
bash scripts/monitor.sh

# PM2 monitoring
pm2 monit

# System resources
htop
df -h
```

## 🔄 Updates

```bash
# Pull latest code
cd /opt/kso
git pull

# Deploy
bash scripts/deploy.sh

# Or manually
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
pm2 restart all
cd ../backend && npx prisma migrate deploy
```
