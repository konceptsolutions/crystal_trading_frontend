#!/bin/bash

# Database Backup Script
# Creates a backup of the PostgreSQL database (Native installation)

set -e

APP_DIR="/opt/kso"
BACKUP_DIR="${APP_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/kso_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "📦 Creating database backup..."

# Get database credentials from .env
cd "$APP_DIR/backend"
if [ -f ".env" ]; then
    source <(grep -E '^DB_|^DATABASE_URL' .env | sed 's/^/export /')
    
    # Extract database info from DATABASE_URL if present
    if [ -n "$DATABASE_URL" ]; then
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    fi
    
    # Use defaults if not set
    DB_USER=${DB_USER:-kso_user}
    DB_NAME=${DB_NAME:-kso_db}
else
    # Default values
    DB_USER="kso_user"
    DB_NAME="kso_db"
fi

# Create backup using pg_dump
pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" || {
    echo "Error: Could not create backup. Make sure PostgreSQL is running and credentials are correct."
    exit 1
}

# Compress backup
gzip "$BACKUP_FILE"

echo "✅ Backup created: ${BACKUP_FILE}.gz"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "kso_backup_*.sql.gz" -mtime +30 -delete
echo "🧹 Removed backups older than 30 days"
