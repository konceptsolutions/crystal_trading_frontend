# WinSCP Upload Guide - Files to Upload to VPS

## Overview
This guide lists all files and folders you need to upload to your VPS server using WinSCP.

## Upload Location
Upload all files to: `/opt/kso/` (or your chosen directory)

---

## ✅ FILES TO UPLOAD

### 📁 Root Directory Files
```
✅ ecosystem.config.js
✅ nginx.conf
✅ install-production.sh
✅ build-production.sh
✅ .gitignore
✅ README.md (and other documentation files if needed)
```

### 📁 backend/ Directory (Complete folder structure)
```
✅ backend/
   ✅ package.json
   ✅ package-lock.json
   ✅ tsconfig.json
   ✅ vitest.config.ts
   ✅ vercel.json (if exists)
   
   ✅ src/                    # All TypeScript source files
      ✅ controllers/
      ✅ middleware/
      ✅ routes/
      ✅ scripts/
      ✅ services/
      ✅ utils/
      ✅ server.ts
   
   ✅ prisma/
      ✅ schema.prisma
      ✅ schema.production.prisma (if exists)
      ✅ seed-accounts.ts (if exists)
      ✅ migrations/          # All migration files
         ✅ migration_lock.toml
         ✅ [all .sql files]
   
   ✅ scripts/               # All script files
      ✅ check-partmodel.cjs
      ✅ create-part-with-model.cjs
```

### 📁 frontend/ Directory (Complete folder structure)
```
✅ frontend/
   ✅ package.json
   ✅ package-lock.json
   ✅ tsconfig.json
   ✅ next.config.js
   ✅ postcss.config.js
   ✅ tailwind.config.ts
   ✅ vercel.json (if exists)
   ✅ next-env.d.ts
   
   ✅ app/                    # All Next.js app files
      ✅ (auth)/
      ✅ api/
      ✅ dashboard/
      ✅ globals.css
      ✅ layout.tsx
      ✅ loading.tsx
      ✅ page.tsx
   
   ✅ components/            # All component files
      ✅ charts/
      ✅ console-error-filter.tsx
      ✅ inventory/
      ✅ layout/
      ✅ purchase-orders/
      ✅ ui/
   
   ✅ lib/                   # All library files
      ✅ api.ts
      ✅ auth.ts
      ✅ middleware/
      ✅ store.ts
      ✅ utils/
   
   ✅ data/                  # Data files
      ✅ stock-transfers.json
   
   ✅ prisma/
      ✅ schema.prisma
      ✅ schema.postgresql.prisma (if exists)
      ✅ migrations/          # All migration files
         ✅ migration_lock.toml
         ✅ [all .sql files]
   
   ✅ server/                # Server files
      ✅ src/
         ✅ [all .ts files]
   ✅ server.ts
```

### 📁 scripts/ Directory
```
✅ scripts/
   ✅ backup-database.sh
   ✅ convert-schema-to-postgres.sh
   ✅ deploy.sh
   ✅ monitor.sh
   ✅ prepare-production.sh
   ✅ setup-systemd.sh
   ✅ test-local.sh
   ✅ validate-setup.sh
```

### 📁 systemd/ Directory (if exists)
```
✅ systemd/
   ✅ kso.service
```

---

## ❌ DO NOT UPLOAD (These will be generated/installed on server)

### Build Artifacts (will be built on server)
```
❌ backend/dist/
❌ backend/node_modules/
❌ frontend/.next/
❌ frontend/node_modules/
❌ frontend/tsconfig.tsbuildinfo
```

### Database Files (will be created on server)
```
❌ backend/prisma/dev.db
❌ backend/prisma/dev.db.backup
❌ backend/prisma/dev.db-journal
❌ frontend/backend/prisma/dev.db
❌ frontend/backend/prisma/dev.db-journal
❌ frontend/prisma/dev.db
❌ frontend/prisma/dev.db-journal
```

### Environment Files (will be created on server)
```
❌ .env
❌ .env.local
❌ .env.development
❌ .env.production
❌ backend/.env
❌ frontend/.env
```

### IDE/Editor Files
```
❌ .vscode/
❌ .idea/
❌ *.swp
❌ *.swo
```

### Log Files
```
❌ *.log
❌ server-output.log
❌ logs/
```

### OS Files
```
❌ .DS_Store
❌ Thumbs.db
❌ Desktop.ini
```

### Git Files (optional - only if you want version control on server)
```
❌ .git/ (optional - usually not needed)
```

### Windows-specific Files
```
❌ *.bat
❌ *.ps1
❌ kill-port.bat
❌ kill-port.ps1
❌ start-*.ps1
❌ fix-*.ps1
❌ build-app.ps1
```

---

## 📋 WinSCP Upload Instructions

### Step 1: Connect to Your VPS
1. Open WinSCP
2. Create a new session:
   - **Host name**: Your VPS IP address or domain
   - **Port**: 22 (SSH)
   - **User name**: root (or your username)
   - **Password**: Your password
   - **Protocol**: SFTP
3. Click **Login**

### Step 2: Navigate to Upload Directory
1. On the **Remote** side (right panel), navigate to `/opt/`
2. If `kso` folder doesn't exist, create it:
   - Right-click → **New** → **Directory** → Name: `kso`

### Step 3: Upload Files
1. On the **Local** side (left panel), navigate to your project folder: `D:\CTC-KSO\kso`
2. Select the following folders/files:
   - `backend/` (entire folder, but exclude `node_modules` and `dist`)
   - `frontend/` (entire folder, but exclude `node_modules` and `.next`)
   - `scripts/` (entire folder)
   - `systemd/` (if exists)
   - Root files: `ecosystem.config.js`, `nginx.conf`, `install-production.sh`, etc.

3. **Right-click** → **Upload** (or drag and drop)

### Step 4: Configure WinSCP to Exclude Files
Before uploading, configure WinSCP to exclude unnecessary files:

1. Go to **Options** → **Preferences** → **Transfer** → **Exclude**
2. Add these exclusion patterns:
   ```
   node_modules
   .next
   dist
   *.db
   *.db-journal
   *.db.backup
   .env*
   *.log
   .git
   .vscode
   .idea
   *.bat
   *.ps1
   .DS_Store
   Thumbs.db
   tsconfig.tsbuildinfo
   ```

### Alternative: Upload Everything Then Clean Up
If you prefer to upload everything first:

1. Upload the entire project
2. On the server, run these commands to remove unnecessary files:
   ```bash
   cd /opt/kso
   find . -name "node_modules" -type d -exec rm -rf {} +
   find . -name ".next" -type d -exec rm -rf {} +
   find . -name "dist" -type d -exec rm -rf {} +
   find . -name "*.db" -type f -delete
   find . -name "*.db-journal" -type f -delete
   find . -name "*.db.backup" -type f -delete
   find . -name "*.log" -type f -delete
   find . -name "*.bat" -type f -delete
   find . -name "*.ps1" -type f -delete
   ```

---

## ✅ Verification Checklist

After uploading, verify these files exist on the server:

- [ ] `/opt/kso/backend/package.json`
- [ ] `/opt/kso/backend/src/server.ts`
- [ ] `/opt/kso/backend/prisma/schema.prisma`
- [ ] `/opt/kso/frontend/package.json`
- [ ] `/opt/kso/frontend/app/page.tsx`
- [ ] `/opt/kso/frontend/prisma/schema.prisma`
- [ ] `/opt/kso/ecosystem.config.js`
- [ ] `/opt/kso/nginx.conf`
- [ ] `/opt/kso/install-production.sh`
- [ ] `/opt/kso/scripts/` directory exists

---

## 🚀 Next Steps After Upload

1. **SSH into your VPS**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Navigate to the project**:
   ```bash
   cd /opt/kso
   ```

3. **Run the installation script**:
   ```bash
   sudo bash install-production.sh
   ```

4. **Follow the prompts** to complete setup.

---

## 📝 Quick Reference: Essential Files Only

If you want to upload only the absolutely essential files:

### Must Have:
- `backend/src/` - All source code
- `backend/package.json` & `package-lock.json`
- `backend/tsconfig.json`
- `backend/prisma/schema.prisma` & `migrations/`
- `frontend/app/` - All app code
- `frontend/components/` - All components
- `frontend/lib/` - All library files
- `frontend/package.json` & `package-lock.json`
- `frontend/tsconfig.json`
- `frontend/next.config.js`
- `frontend/tailwind.config.ts`
- `frontend/postcss.config.js`
- `frontend/prisma/schema.prisma` & `migrations/`
- `ecosystem.config.js`
- `nginx.conf`
- `install-production.sh`

---

## ⚠️ Important Notes

1. **File Permissions**: After uploading, you may need to set correct permissions:
   ```bash
   sudo chown -R kso:kso /opt/kso
   sudo chmod +x /opt/kso/install-production.sh
   sudo chmod +x /opt/kso/scripts/*.sh
   ```

2. **Line Endings**: If you encounter issues, convert Windows line endings to Unix:
   ```bash
   find /opt/kso -type f -name "*.sh" -exec dos2unix {} \;
   ```

3. **Database**: The installation script will create the database on the server. Don't upload local database files.

4. **Environment Variables**: The installation script will create `.env` files. Don't upload your local `.env` files.

---

## 🆘 Troubleshooting

### Upload is too slow
- Use compression: **Options** → **Preferences** → **Transfer** → Enable **Compression**

### Permission denied errors
- Make sure you're uploading to a directory you have write access to
- Use `sudo` when running installation script

### Files missing after upload
- Check WinSCP exclusion settings
- Verify you selected all necessary folders
- Check upload log in WinSCP

---

**Good luck with your deployment! 🚀**

