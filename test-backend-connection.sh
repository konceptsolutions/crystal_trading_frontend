#!/bin/bash
# Test Backend Connection Script
# Run this on your server to diagnose the backend connection issue

echo "=========================================="
echo "Backend Connection Diagnostic"
echo "=========================================="
echo ""

echo "1. Testing Backend on Localhost (Port 5000):"
echo "--------------------------------------------"
curl -v http://localhost:5000/api/health 2>&1 | head -20
echo ""
echo ""

echo "2. Testing Backend via IP (Port 5000):"
echo "--------------------------------------------"
curl -v http://103.60.12.157:5000/api/health 2>&1 | head -20
echo ""
echo ""

echo "3. Testing Backend via Nginx (/api):"
echo "--------------------------------------------"
curl -v http://103.60.12.157/api/health 2>&1 | head -20
echo ""
echo ""

echo "4. Checking if Port 5000 is Listening:"
echo "--------------------------------------------"
netstat -tlnp | grep 5000 || echo "Port 5000 is NOT listening"
echo ""

echo "5. Checking if Port 3000 is Listening:"
echo "--------------------------------------------"
netstat -tlnp | grep 3000 || echo "Port 3000 is NOT listening"
echo ""

echo "6. Backend Process Details:"
echo "--------------------------------------------"
pm2 describe kso-backend | head -30
echo ""

echo "7. Recent Backend Logs (last 30 lines):"
echo "--------------------------------------------"
pm2 logs kso-backend --lines 30 --nostream
echo ""

echo "8. Frontend API URL Configuration:"
echo "--------------------------------------------"
grep NEXT_PUBLIC_API_URL frontend/.env || echo "NEXT_PUBLIC_API_URL not found in frontend/.env"
echo ""

echo "9. Nginx Configuration Check:"
echo "--------------------------------------------"
if [ -f /etc/nginx/sites-available/kso ]; then
    echo "Nginx config exists"
    grep -A 5 "location /api" /etc/nginx/sites-available/kso || echo "No /api location found"
else
    echo "Nginx config file not found at /etc/nginx/sites-available/kso"
fi
echo ""

echo "10. Testing Backend Directly (Node Process):"
echo "--------------------------------------------"
ps aux | grep "dist/server.js" | grep -v grep || echo "Backend process not found"
echo ""

echo "=========================================="
echo "Diagnostic Complete"
echo "=========================================="

