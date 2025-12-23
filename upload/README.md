# KSO Installation & Update Script

## 🚀 Single Command Installation & Updates

This folder contains a comprehensive installation script that handles both **fresh installations** and **updates from GitHub** with a single command.

## 📋 Quick Start

### For Fresh Installation:

**The script automatically fetches code from GitHub!** No need to upload files manually.

The installation script is configured to automatically clone from:
**https://github.com/konceptsolutions/crystal_trading_frontend**

1. **Upload the install.sh script to your server** (or clone the repository)
2. **Run the installation script:**

```bash
sudo bash install.sh
```

The script will:
- ✅ Automatically clone the repository from GitHub
- ✅ Install all dependencies
- ✅ Set up the database
- ✅ Build and configure everything
- ✅ Start all services

**That's it!** The script handles everything automatically.

### Alternative: Manual File Upload

If you prefer to upload files manually instead of using GitHub:

1. Upload your complete project (including `backend` and `frontend` folders) to your server
2. Place the `install.sh` script in the project root
3. Run: `sudo bash install.sh`

The script will detect local files and use them instead of cloning from GitHub.

### For Updates:

If you've already installed the application and want to pull the latest updates from GitHub:

```bash
cd /opt/kso
sudo bash install.sh
```

The script will automatically:
- ✅ Detect if it's an update or fresh installation
- ✅ Pull latest changes from GitHub (if it's a git repository)
- ✅ Remove old build artifacts and node_modules
- ✅ Install/update all dependencies
- ✅ Rebuild the application
- ✅ Run database migrations
- ✅ Restart all services

## 🎯 What the Script Does

### Installation Mode (Fresh Install):
1. Updates system packages
2. Installs Node.js 20
3. Installs PostgreSQL database
4. Installs Nginx web server
5. Installs PM2 process manager
6. Creates database and user
7. Clones/copies application files
8. Converts Prisma schemas to PostgreSQL
9. Sets up environment variables
10. Installs all dependencies
11. Builds backend and frontend
12. Runs database migrations
13. Configures Nginx reverse proxy
14. Sets up SSL (if domain provided)
15. Starts all services with PM2

### Update Mode:
1. Stops running services
2. Backs up existing .env files
3. Pulls latest code from GitHub
4. Removes old build artifacts
5. Installs/updates dependencies
6. Rebuilds application
7. Runs database migrations
8. Restarts all services

## 📝 During Installation

You'll be asked for:
1. **Domain name** (optional) - Enter your domain or press Enter to skip SSL
2. **Email** (if domain provided) - For Let's Encrypt SSL certificate
3. **Database password** (optional) - Press Enter for auto-generated secure password
4. **JWT secret** (optional) - Press Enter for auto-generated secure secret
5. **Create admin user** (optional) - Type 'y' to create admin user

## 🔄 Updating Your Application

When you push updates to GitHub, simply run:

```bash
cd /opt/kso
sudo bash install.sh
```

Or from anywhere:

```bash
sudo bash /opt/kso/upload/install.sh
```

The script will automatically:
- ✅ Detect it's an update (not fresh install)
- ✅ Pull the latest changes from GitHub: https://github.com/konceptsolutions/crystal_trading_frontend
- ✅ Clean old build files and node_modules
- ✅ Reinstall dependencies (if package.json changed)
- ✅ Rebuild the application
- ✅ Run database migrations
- ✅ Restart all services with PM2

**No manual steps required!** Just run one command and everything updates.

## 📁 Files in This Folder

- `install.sh` - Main installation and update script
- `nginx.conf` - Nginx configuration template
- `ecosystem.config.js` - PM2 process configuration
- `README.md` - This file

## ✅ After Installation

Your application will be running at:
- **With domain:** `https://yourdomain.com`
- **Without domain:** `http://your-server-ip`

## 🔧 Useful Commands

```bash
# Check application status
pm2 status

# View logs
pm2 logs

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Create admin user
cd /opt/kso/backend && npm run create-admin

# Check service health
curl http://localhost:5000/api/health
curl http://localhost:3000
```

## 🆘 Troubleshooting

### If installation fails:
1. Check the error messages in the output
2. Ensure you have root/sudo access
3. Check internet connection
4. Verify all prerequisites are met

### If services don't start:
```bash
# Check PM2 logs
pm2 logs

# Check Nginx status
systemctl status nginx

# Check PostgreSQL status
systemctl status postgresql

# Check if ports are in use
netstat -tlnp | grep -E ':(3000|5000)'
```

### If database connection fails:
```bash
# Check PostgreSQL is running
systemctl status postgresql

# Test connection
psql -U kso_user -d kso_db

# Check .env files
cat /opt/kso/backend/.env
cat /opt/kso/frontend/.env
```

## 📦 Requirements

- Ubuntu 20.04+ or 22.04+ server
- Root or sudo access
- Internet connection
- (Optional) Domain name for SSL

## 🔐 Security Notes

- Database passwords and JWT secrets are auto-generated if not provided
- Credentials are saved in `.env` files in backend and frontend directories
- Keep your `.env` files secure and never commit them to Git
- The script backs up existing `.env` files before updates

## 📞 Support

If you encounter issues:
1. Check the installation logs
2. Review the error messages
3. Verify all prerequisites
4. Check service status with `pm2 status` and `systemctl status`

---

**Note:** This script is designed to be idempotent - you can run it multiple times safely. It will detect existing installations and update them accordingly.

