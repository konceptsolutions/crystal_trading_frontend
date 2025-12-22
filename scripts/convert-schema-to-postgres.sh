#!/bin/bash

# Script to convert Prisma schema from SQLite to PostgreSQL
# This should be run before deploying to production

set -e

SCHEMA_FILE="backend/prisma/schema.prisma"
BACKUP_FILE="backend/prisma/schema.prisma.backup"

echo "Converting Prisma schema from SQLite to PostgreSQL..."

# Backup original schema
if [ ! -f "$BACKUP_FILE" ]; then
    cp "$SCHEMA_FILE" "$BACKUP_FILE"
    echo "✓ Backed up original schema"
fi

# Convert datasource
sed -i.bak 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA_FILE"
sed -i.bak 's|url      = "file:./dev.db"|url      = env("DATABASE_URL")|' "$SCHEMA_FILE"

# Remove backup file created by sed
rm -f "${SCHEMA_FILE}.bak"

echo "✓ Schema converted to PostgreSQL"
echo "✓ Updated DATABASE_URL to use environment variable"
echo ""
echo "Next steps:"
echo "1. Update your .env file with PostgreSQL DATABASE_URL"
echo "2. Run: npx prisma migrate deploy"
echo "3. Run: npx prisma generate"

