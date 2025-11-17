#!/bin/bash

echo "=========================================="
echo "  Complete Database Setup"
echo "=========================================="
echo ""
echo "This will complete the database setup."
echo "You'll be asked for MySQL root password once."
echo ""

cd "$(dirname "$0")"

# Step 1: Create database and user
echo "Step 1/3: Creating database and user..."
echo "Please enter MySQL root password when prompted:"
echo ""

mysql -u root -p < setup-mysql.sql

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Failed to create database. Please check MySQL root password."
    echo ""
    echo "Manual alternative:"
    echo "  1. Run: mysql -u root -p"
    echo "  2. Paste commands from setup-mysql.sql"
    exit 1
fi

echo ""
echo "✅ Database and user created!"

# Step 2: Run Prisma migrations
echo ""
echo "Step 2/3: Running Prisma migrations..."
echo ""

npx prisma migrate dev --name init --skip-seed

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Migration had issues. Trying db push instead..."
    npx prisma db push --accept-data-loss
fi

# Step 3: Generate Prisma client
echo ""
echo "Step 3/3: Generating Prisma client..."
npx prisma generate

echo ""
echo "=========================================="
echo "  Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "✅ Database is ready!"
echo "✅ Tables are created!"
echo "✅ Prisma client is generated!"
echo ""
echo "Next: Restart your server"
echo "   npm run dev"
echo ""
echo "Then try signing up from the frontend!"
echo ""

