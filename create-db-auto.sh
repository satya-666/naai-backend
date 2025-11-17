#!/bin/bash

echo "=========================================="
echo "  Automatic Database Setup"
echo "=========================================="
echo ""

DB_USER="naai_user"
DB_PASS="naai_password_123"
DB_NAME="naai_db"

echo "Creating database: $DB_NAME"
echo "Creating user: $DB_USER"
echo ""

# SQL commands
SQL_CMDS="CREATE DATABASE IF NOT EXISTS ${DB_NAME};
DROP USER IF EXISTS '${DB_USER}'@'localhost';
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database and user created successfully!' AS status;"

echo "Please enter MySQL root password when prompted:"
echo "$SQL_CMDS" | mysql -u root -p

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Run: npx prisma migrate dev --name init"
    echo "2. Restart server: npm run dev"
    exit 0
else
    echo ""
    echo "❌ Failed. Please run manually:"
    echo "   mysql -u root -p < setup-mysql.sql"
    exit 1
fi

