#!/bin/bash

# Simple monitoring script for KSO application (Native/PM2)

APP_DIR="/opt/kso"
cd "$APP_DIR"

echo "=== KSO Application Status ==="
echo ""

# Check PM2 services
echo "PM2 Services:"
pm2 status
echo ""

# Check disk usage
echo "Disk Usage:"
df -h | grep -E 'Filesystem|/$'
echo ""

# Check memory usage
echo "Memory Usage:"
free -h
echo ""

# Check service health
echo "Service Health:"
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "✓ Backend: Healthy"
else
    echo "✗ Backend: Unhealthy"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Frontend: Healthy"
else
    echo "✗ Frontend: Unhealthy"
fi
echo ""

# Recent logs
echo "Recent Backend Logs (last 10 lines):"
pm2 logs kso-backend --lines 10 --nostream 2>/dev/null || echo "No logs available"
echo ""

echo "Recent Frontend Logs (last 10 lines):"
pm2 logs kso-frontend --lines 10 --nostream 2>/dev/null || echo "No logs available"
echo ""

# Database connection check
echo "Database Status:"
if command -v psql &> /dev/null; then
    if psql -U kso_user -d kso_db -c "SELECT 1;" > /dev/null 2>&1; then
        echo "✓ Database: Connected"
    else
        echo "✗ Database: Connection failed"
    fi
else
    echo "⚠ Database: psql not found"
fi
echo ""
