# 🚀 Single Command Installation

## Quick Start

**Just upload your files and run ONE command:**

```bash
sudo bash install-production.sh
```

That's it! Everything installs automatically.

## 📋 What You Need

1. **Fresh Ubuntu Server** (20.04+ or 22.04+)
2. **Root/Sudo Access**
3. **Your Application Files** (uploaded to server)

## 📤 Step 1: Upload Files

Upload your files to the server. Choose one method:

### Option A: Git Clone
```bash
cd /opt
git clone <your-repo-url> kso
cd kso
```

### Option B: SCP (from your computer)
```bash
scp -r /path/to/kso root@your-server-ip:/opt/
```

### Option C: Manual Upload
Use FileZilla, WinSCP, or similar to upload files to `/opt/kso`

## 🎯 Step 2: Run Installation

```bash
cd /opt/kso
sudo bash install-production.sh
```

## ⏱️ What Happens

The script automatically installs:

1. ✅ System updates
2. ✅ Node.js 20
3. ✅ PostgreSQL database
4. ✅ Nginx web server
5. ✅ PM2 process manager
6. ✅ All dependencies
7. ✅ Builds backend & frontend
8. ✅ Configures database
9. ✅ Sets up reverse proxy
10. ✅ Installs SSL (if domain provided)
11. ✅ Starts all services

**Time:** 5-10 minutes

## 💬 During Installation

You'll be asked:

1. **Domain name?** (Enter domain or press Enter)
2. **Email?** (If domain provided, for SSL)
3. **Database password?** (Press Enter for auto-generated)
4. **JWT secret?** (Press Enter for auto-generated)
5. **Create admin?** (Type 'y' or 'n')

## ✅ After Installation

Your app will be running at:

- **With domain:** `https://yourdomain.com`
- **Without domain:** `http://your-server-ip`

## 🔧 Quick Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart
pm2 restart all

# Create admin user
cd /opt/kso/backend && npm run create-admin
```

## 🆘 If Something Goes Wrong

The script continues even with minor errors. If installation fails:

1. Check the output for error messages
2. Run again - it will skip completed steps
3. Check logs: `pm2 logs`

## 📝 Notes

- ✅ No Docker required
- ✅ Everything installs natively
- ✅ Auto-generates secure passwords
- ✅ Handles errors automatically
- ✅ Works on fresh Ubuntu install

## 🎉 Done!

Your application is now running in production!

For detailed information, see [INSTALL.md](./INSTALL.md)

