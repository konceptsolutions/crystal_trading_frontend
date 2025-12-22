# KSO Production Setup - Quick Start Guide

This is a production-ready setup for the KSO (Inventory Management System) application using native installation (no Docker).

## 🚀 Quick Installation

### Single Command Installation (Recommended)

```bash
# 1. Upload your application to the VPS
cd /opt
git clone <your-repo-url> kso
cd kso

# 2. Run the installation script
sudo bash install-production.sh
```

The script will guide you through:
- System dependencies installation
- Node.js, PostgreSQL, Nginx, PM2 setup
- Nginx configuration
- SSL certificate setup (if domain provided)
- Application build and deployment

### Option 2: Manual Installation

See [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) for detailed manual installation steps.

## 📋 Prerequisites

- Ubuntu 20.04+ or Debian 11+ VPS
- Root or sudo access
- Domain name (optional, for SSL)
- At least 2GB RAM and 20GB disk space

## ⚙️ Configuration

### Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.production.example backend/.env
cp .env.production.example frontend/.env
nano backend/.env
nano frontend/.env
```

**Important variables to set:**
- `DB_PASSWORD`: Strong database password
- `JWT_SECRET`: Strong random secret (use `openssl rand -base64 64`)
- `NEXT_PUBLIC_API_URL`: Your API URL
- `DATABASE_URL`: PostgreSQL connection string

### Prepare for Production

Before first deployment, convert Prisma schemas to PostgreSQL:

```bash
bash scripts/prepare-production.sh
```

## 🔧 PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Start services
pm2 start all

# View specific service logs
pm2 logs kso-backend
pm2 logs kso-frontend
```

## 🔧 Maintenance

### Update Application

```bash
cd /opt/kso
bash scripts/deploy.sh
```

### Database Backup

```bash
bash scripts/backup-database.sh
```

### Monitor Application

```bash
bash scripts/monitor.sh
```

### Create Admin User

```bash
cd /opt/kso/backend
npm run create-admin
```

## 📁 Project Structure

```
kso/
├── backend/              # Backend API (Express/TypeScript)
├── frontend/             # Frontend (Next.js/React)
├── ecosystem.config.js   # PM2 configuration
├── .env                  # Environment variables (create from .env.production.example)
├── nginx.conf            # Nginx reverse proxy config
├── install-production.sh # Automated installation script
├── scripts/              # Utility scripts
│   ├── deploy.sh
│   ├── backup-database.sh
│   ├── prepare-production.sh
│   └── monitor.sh
└── PRODUCTION_DEPLOYMENT.md  # Detailed deployment guide
```

## 🌐 Accessing the Application

- **With Domain**: `https://yourdomain.com`
- **Without Domain**: `http://your-server-ip`
- **Backend API**: `http://localhost:5000/api`
- **Frontend**: `http://localhost:3000`

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET
- [ ] Configure firewall (ports 80, 443, 22)
- [ ] Enable SSL/HTTPS
- [ ] Set up regular backups
- [ ] Keep system updated
- [ ] Review Nginx security headers
- [ ] Monitor application logs

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
pm2 logs

# Check environment
cat backend/.env
cat frontend/.env

# Verify database connection
psql -U kso_user -d kso_db
```

### Database migration errors

```bash
# Run migrations manually
cd /opt/kso/backend
npx prisma migrate deploy
```

### Port conflicts

Check what's using the ports:
```bash
sudo lsof -i :5000
sudo lsof -i :3000
```

## 📚 Documentation

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Detailed deployment guide
- [INSTALL.md](./INSTALL.md) - Installation instructions
- [Accounts.md](./Accounts.md) - Accounts system documentation

## 🆘 Support

For issues:
1. Check application logs: `pm2 logs`
2. Check system logs: `journalctl -u kso -f` (if systemd service installed)
3. Review this documentation
4. Check service health: `bash scripts/monitor.sh`

## 📝 License

[Your License Here]
