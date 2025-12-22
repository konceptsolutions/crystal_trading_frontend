#!/bin/bash
# Fix PM2 Environment Variables
# PM2 caches env vars, need to restart with --update-env

echo "=========================================="
echo "Fixing PM2 Environment Variables"
echo "=========================================="
echo ""

# Stop backend
echo "Stopping backend..."
pm2 stop kso-backend

# Delete and restart with updated env
echo "Restarting with updated environment..."
pm2 delete kso-backend

# Start backend with explicit env file
cd /var/www/nextapp/upload/backend

# Load env and start
pm2 start dist/server.js \
  --name kso-backend \
  --update-env \
  --env production \
  -- \
  --env-file .env

# Or use ecosystem with update-env
cd /var/www/nextapp/upload
pm2 start ecosystem.config.js --update-env

pm2 save

echo ""
echo "Waiting for backend to start..."
sleep 5

echo ""
echo "Checking backend status..."
pm2 status

echo ""
echo "Checking backend logs..."
pm2 logs kso-backend --lines 10 --nostream

echo ""
echo "Testing backend connection..."
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend is responding!"
else
    echo "⚠ Backend not responding yet"
fi

echo ""
echo "Done! Check if database errors are gone."

