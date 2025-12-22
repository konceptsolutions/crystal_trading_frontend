# Deployment Steps - After Nginx is Running

## Current Status ✅
- ✅ VPS is accessible at: `103.60.12.157`
- ✅ Nginx is installed and running
- ✅ You can see the default Nginx page

## Next Steps

### Step 1: Upload Files Using WinSCP

1. **Open WinSCP** and connect to your VPS:
   - **Host**: `103.60.12.157`
   - **Port**: `22`
   - **Username**: `root` (or your username)
   - **Password**: Your password
   - **Protocol**: SFTP

2. **Navigate on Server**:
   - On the right side (Remote), navigate to `/opt/`
   - If `kso` folder doesn't exist, create it:
     - Right-click → **New** → **Directory** → Name: `kso`

3. **Upload Files**:
   - On the left side (Local), navigate to: `D:\CTC-KSO\kso\upload`
   - Select ALL contents inside the `upload` folder
   - Drag and drop (or right-click → Upload) to `/opt/kso/` on the server
   - Wait for upload to complete (this may take a few minutes)

### Step 2: SSH into Your VPS

1. **Open PowerShell** or **Command Prompt** on your Windows machine
2. **SSH to your server**:
   ```bash
   ssh root@103.60.12.157
   ```
   (Enter your password when prompted)

### Step 3: Verify Files Are Uploaded

Once connected via SSH, verify the files are there:
```bash
cd /opt/kso
ls -la
```

You should see:
- `backend/` folder
- `frontend/` folder
- `scripts/` folder
- `ecosystem.config.js`
- `nginx.conf`
- `install-production.sh`

### Step 4: Run the Installation Script

```bash
cd /opt/kso
sudo bash install-production.sh
```

**During installation, you'll be asked:**
1. **Domain name**: 
   - Enter your domain if you have one (e.g., `yourdomain.com`)
   - OR press Enter to skip (use IP address only)

2. **Email for SSL** (if you entered domain):
   - Enter your email address

3. **Database password**:
   - Enter a strong password OR press Enter for auto-generated

4. **JWT secret**:
   - Enter a secret key OR press Enter for auto-generated

5. **Create admin user**:
   - Type `y` to create an admin user now
   - Enter username, email, and password

### Step 5: Wait for Installation

The script will:
- Install Node.js, PostgreSQL, PM2
- Set up the database
- Install dependencies
- Build the application
- Configure Nginx
- Start the services

This may take 5-10 minutes.

### Step 6: Verify Installation

After installation completes, check if services are running:
```bash
pm2 status
```

You should see:
- `kso-backend` (status: online)
- `kso-frontend` (status: online)

### Step 7: Access Your Application

1. **If you used a domain**: Visit `https://yourdomain.com`
2. **If using IP only**: Visit `http://103.60.12.157`

You should now see your application instead of the Nginx default page!

---

## Troubleshooting

### If you see "502 Bad Gateway"
- Services might still be starting, wait 1-2 minutes
- Check logs: `pm2 logs`
- Verify services: `pm2 status`

### If you see "Connection refused"
- Check if ports are open: `sudo ufw status`
- Verify services are running: `pm2 status`

### If installation fails
- Check the error message
- Verify all files were uploaded correctly
- Check disk space: `df -h`
- Check logs: `pm2 logs`

### To view application logs
```bash
pm2 logs kso-backend
pm2 logs kso-frontend
```

### To restart services
```bash
pm2 restart all
```

### To stop services
```bash
pm2 stop all
```

---

## Important Notes

1. **Database**: The installation script creates a PostgreSQL database automatically
2. **Environment Variables**: Created automatically in `backend/.env` and `frontend/.env`
3. **SSL Certificate**: Will be set up automatically if you provide a domain
4. **Firewall**: Ports 80, 443, and 22 are opened automatically

---

## After Successful Deployment

Your application will be accessible at:
- **Frontend**: `http://103.60.12.157` (or your domain)
- **Backend API**: `http://103.60.12.157/api`

Login with the admin credentials you created during installation!

