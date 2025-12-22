# Single Command Installation Guide

## 🚀 Quick Installation

After uploading your files to the Ubuntu server, run this **single command**:

```bash
sudo bash install-production.sh
```

That's it! The script will automatically:

1. ✅ Update system packages
2. ✅ Install Node.js 20
3. ✅ Install PostgreSQL database
4. ✅ Install Nginx web server
5. ✅ Install PM2 process manager
6. ✅ Configure firewall
7. ✅ Create database and user
8. ✅ Convert Prisma schemas to PostgreSQL
9. ✅ Install all dependencies
10. ✅ Build backend and frontend
11. ✅ Run database migrations
12. ✅ Configure Nginx reverse proxy
13. ✅ Setup SSL certificate (if domain provided)
14. ✅ Start all services with PM2

## 📋 Prerequisites

- **Fresh Ubuntu 20.04+ or 22.04+ server**
- **Root or sudo access**
- **Files uploaded to the server** (via git clone, SCP, or SFTP)

## 📝 What You'll Be Asked

During installation, you'll be prompted for:

1. **Domain name** (optional) - Enter your domain or press Enter to skip
2. **Email address** (if domain provided) - For SSL certificate
3. **Database password** (optional) - Press Enter for auto-generated
4. **JWT secret** (optional) - Press Enter for auto-generated
5. **Create admin user** (optional) - Type 'y' to create admin user

## 🎯 Installation Steps

### Step 1: Upload Files

Upload your application files to the server. You can:

**Option A: Using Git**
```bash
cd /opt
git clone <your-repo-url> kso
cd kso
```

**Option B: Using SCP (from your local machine)**
```bash
scp -r /path/to/kso root@your-server-ip:/opt/
```

**Option C: Using SFTP**
Upload files via FileZilla or similar to `/opt/kso`

### Step 2: Run Installation

```bash
cd /opt/kso
sudo bash install-production.sh
```

The script will handle everything automatically. It will:
- Continue even if some steps have minor issues
- Auto-generate passwords and secrets if not provided
- Retry failed operations
- Show progress with colored output

### Step 3: Wait for Completion

The installation takes approximately 5-10 minutes depending on your server speed.

## ✅ After Installation

Once complete, you'll see:

```
========================================
Installation Complete!
========================================
✓ Application is running

ℹ Access your application at: http://your-server-ip
ℹ Backend API: http://localhost:5000/api
ℹ Frontend: http://localhost:3000
```

## 🔧 Useful Commands

### View Application Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs
```

### Restart Application
```bash
pm2 restart all
```

### Stop Application
```bash
pm2 stop all
```

### Create Admin User
```bash
cd /opt/kso/backend
npm run create-admin
```

### Check Service Health
```bash
curl http://localhost:5000/api/health
curl http://localhost:3000
```

## 🐛 Troubleshooting

### If Installation Fails

The script is designed to continue even with minor errors. If something critical fails:

1. **Check logs**: The script shows what it's doing
2. **Retry**: Run the script again - it will skip already completed steps
3. **Manual check**: 
   ```bash
   # Check Node.js
   node -v
   
   # Check PostgreSQL
   sudo systemctl status postgresql
   
   # Check PM2
   pm2 list
   ```

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
sudo lsof -i :5000
sudo lsof -i :3000

# Kill the process if needed
sudo kill -9 <PID>
```

**Database connection error:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l
```

**PM2 not starting:**
```bash
# Check PM2 logs
pm2 logs

# Restart PM2
pm2 restart all
```

## 📁 File Locations

After installation:

- **Application**: `/opt/kso`
- **Backend**: `/opt/kso/backend`
- **Frontend**: `/opt/kso/frontend`
- **Logs**: `/var/log/kso/`
- **Environment files**: 
  - `/opt/kso/backend/.env`
  - `/opt/kso/frontend/.env`
- **Nginx config**: `/etc/nginx/sites-available/kso`
- **PM2 config**: `/opt/kso/ecosystem.config.js`

## 🔒 Security Notes

- Database password is auto-generated and saved in `.env` files
- JWT secret is auto-generated and saved in `.env` files
- Firewall is configured to allow only ports 22, 80, 443
- SSL certificate is automatically installed if domain is provided

## 📞 Support

If you encounter issues:

1. Check the installation output for error messages
2. Review logs: `pm2 logs`
3. Check service status: `pm2 status`
4. Verify environment variables in `.env` files

## 🎉 That's It!

Your application is now running in production mode without Docker!

