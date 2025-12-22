#!/bin/bash
# Demo Data Seeding Script
# This script adds 20 products, kits, purchase orders, and all related demo data

echo "=========================================="
echo "Demo Data Seeding Script"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "ERROR: backend/ directory not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Navigate to backend
cd backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "ERROR: backend/.env file not found!"
    echo "Please make sure the backend is configured with database credentials"
    exit 1
fi

echo "Checking Prisma client..."
npx prisma generate

echo ""
echo "Starting demo data seeding..."
echo "This will add:"
echo "  - 20 Products/Parts with complete details"
echo "  - Categories and Brands"
echo "  - Suppliers and Customers"
echo "  - Stores, Racks, and Shelves"
echo "  - Stock for all products"
echo "  - 3 Kits with items"
echo "  - 3 Purchase Orders with items"
echo "  - 2 Sales Invoices"
echo "  - 1 Inventory Adjustment"
echo ""
read -p "Do you want to continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Running seed script..."
npx tsx src/scripts/seed-demo-data.ts

echo ""
echo "=========================================="
echo "Demo data seeding completed!"
echo "=========================================="
echo ""
echo "You can now view the demo data in your application."
echo ""

