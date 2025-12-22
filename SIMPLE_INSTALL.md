# 🚀 Super Simple Installation

## One Command Setup

```bash
sudo bash install-production.sh
```

**That's all you need!**

## What You Need

1. Ubuntu server (fresh install is fine)
2. Your files uploaded to the server
3. Run the command above

## Upload Files First

**Option 1: Git**
```bash
cd /opt
git clone <your-repo> kso
cd kso
```

**Option 2: Upload via SCP/SFTP**
Upload your files to `/opt/kso` on the server

## Then Run

```bash
cd /opt/kso
sudo bash install-production.sh
```

## What It Does

- Installs everything automatically
- Handles errors gracefully
- Auto-generates passwords
- Sets up database
- Builds application
- Starts services
- Configures web server

## After Installation

Your app runs at:
- `http://your-server-ip` (or `https://yourdomain.com` if you provided domain)

## Quick Commands

```bash
pm2 status    # Check if running
pm2 logs      # View logs
pm2 restart all  # Restart
```

## That's It!

No Docker, no complexity - just one command!

