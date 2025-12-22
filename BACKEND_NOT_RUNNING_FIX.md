# Fix: "Backend server is not running" Error

## Current Status ✅❌
- ✅ Frontend is working (you can see the registration page)
- ❌ Backend API is not running or not accessible

## Quick Fix Steps

### Step 1: Check if Backend is Running

SSH into your server and run:

```bash
pm2 status
```

**Expected output:**
```
┌─────┬─────────────────┬─────────┬─────────┬─────────┐
│ id  │ name            │ status  │ restart │ uptime  │
├─────┼─────────────────┼─────────┼─────────┼─────────┤
│ 0   │ kso-backend     │ online  │ 0       │ 5m      │
│ 1   │ kso-frontend    │ online  │ 0       │ 5m      │
└─────┴─────────────────┴─────────┴─────────┴─────────┘
```

**If backend shows "stopped" or "errored":**
- Go to Step 2

**If backend shows "online" but still getting error:**
- Go to Step 3

### Step 2: Start/Restart Backend

```bash
# Check backend logs for errors
pm2 logs kso-backend --lines 50

# If backend is stopped, start it
pm2 start kso-backend

# Or restart it
pm2 restart kso-backend

# Check status again
pm2 status
```

**Common errors in logs:**

#### Error: "Cannot find module" or "dist/server.js not found"
**Solution:**
```bash
cd /var/www/nextapp/upload/backend  # or your path
npm run build
pm2 restart kso-backend
```

#### Error: "Database connection failed"
**Solution:**
```bash
# Check if PostgreSQL is running
systemctl status postgresql

# If not running, start it
systemctl start postgresql

# Check .env file has correct DATABASE_URL
cat backend/.env

# Restart backend
pm2 restart kso-backend
```

#### Error: "Port 5000 already in use"
**Solution:**
```bash
# Find what's using port 5000
lsof -i :5000
# or
netstat -tlnp | grep 5000

# Kill the process or change port in ecosystem.config.js
```

### Step 3: Verify Backend is Accessible

```bash
# Test if backend is responding locally
curl http://localhost:5000/api/health

# Should return something like: {"status":"ok"} or similar
```

**If curl fails:**
- Backend is not running properly
- Check logs: `pm2 logs kso-backend`
- See Step 2 for common errors

**If curl works but website still shows error:**
- Problem is with Nginx configuration
- Go to Step 4

### Step 4: Check Nginx Configuration

```bash
# Check Nginx config
nginx -t

# Check if Nginx is proxying to backend correctly
cat /etc/nginx/sites-available/kso

# Should have something like:
# location /api {
#     proxy_pass http://backend;
# }
```

**If Nginx config is wrong, fix it:**

```bash
# Edit Nginx config
nano /etc/nginx/sites-available/kso

# Make sure it has:
upstream backend {
    server localhost:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;
    
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Test and reload
nginx -t
systemctl reload nginx
```

### Step 5: Check Frontend API URL Configuration

```bash
# Check frontend .env file
cat frontend/.env

# Should have:
# NEXT_PUBLIC_API_URL=http://103.60.12.157/api
# or
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**If NEXT_PUBLIC_API_URL is wrong:**
```bash
# Edit frontend .env
nano frontend/.env

# Set to:
NEXT_PUBLIC_API_URL=http://103.60.12.157/api

# Rebuild frontend
cd frontend
npm run build
pm2 restart kso-frontend
```

### Step 6: Check Firewall

```bash
# Check if ports are open
ufw status

# If firewall is active, make sure ports are allowed
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
```

---

## Complete Diagnostic Script

Run this to check everything at once:

```bash
#!/bin/bash
echo "=== Backend Diagnostic ==="
echo ""
echo "1. PM2 Status:"
pm2 status
echo ""
echo "2. Backend Process:"
pm2 describe kso-backend
echo ""
echo "3. Backend Logs (last 20 lines):"
pm2 logs kso-backend --lines 20 --nostream
echo ""
echo "4. Port 5000 Status:"
netstat -tlnp | grep 5000 || echo "Port 5000 not listening"
echo ""
echo "5. Backend Health Check:"
curl -s http://localhost:5000/api/health || echo "Backend not responding"
echo ""
echo "6. PostgreSQL Status:"
systemctl status postgresql --no-pager | head -5
echo ""
echo "7. Nginx Status:"
systemctl status nginx --no-pager | head -5
echo ""
echo "8. Frontend .env API URL:"
grep NEXT_PUBLIC_API_URL frontend/.env || echo "Not found"
echo ""
```

Save this as `check-backend.sh`, make it executable (`chmod +x check-backend.sh`), and run it.

---

## Quick Restart Everything

If you just want to restart everything:

```bash
# Restart all PM2 processes
pm2 restart all

# Reload Nginx
systemctl reload nginx

# Wait a few seconds
sleep 5

# Check status
pm2 status

# Test backend
curl http://localhost:5000/api/health
```

---

## Most Common Solutions

### Solution 1: Backend Not Built
```bash
cd /var/www/nextapp/upload/backend
npm run build
pm2 restart kso-backend
```

### Solution 2: Backend Crashed
```bash
pm2 logs kso-backend --lines 50
# Fix the error shown in logs
pm2 restart kso-backend
```

### Solution 3: Database Not Running
```bash
systemctl start postgresql
pm2 restart kso-backend
```

### Solution 4: Wrong API URL
```bash
# Edit frontend/.env
nano frontend/.env
# Change NEXT_PUBLIC_API_URL to: http://103.60.12.157/api
cd frontend
npm run build
pm2 restart kso-frontend
```

---

## Still Not Working?

1. **Check all logs:**
   ```bash
   pm2 logs --lines 100
   ```

2. **Check Nginx error log:**
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. **Verify backend is actually running:**
   ```bash
   ps aux | grep node
   ```

4. **Test backend directly:**
   ```bash
   cd backend
   node dist/server.js
   # Press Ctrl+C after testing
   ```

---

## Expected Working State

When everything is working:
- ✅ `pm2 status` shows both apps as "online"
- ✅ `curl http://localhost:5000/api/health` returns success
- ✅ `curl http://103.60.12.157/api/health` returns success
- ✅ Website shows your app without backend error

