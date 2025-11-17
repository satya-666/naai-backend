#!/bin/bash

echo "=========================================="
echo "  Quick Database Setup"
echo "=========================================="
echo ""

# Default credentials that we'll use
DB_USER="naai_user"
DB_PASS="naai_password_123"
DB_NAME="naai_db"

echo "Using default credentials:"
echo "  User: $DB_USER"
echo "  Password: $DB_PASS"
echo "  Database: $DB_NAME"
echo ""
echo "⚠️  These are default passwords - change them in production!"
echo ""

# Check if MySQL is running
if ! mysqladmin ping &>/dev/null; then
    echo "❌ MySQL is not running. Starting MySQL..."
    brew services start mysql 2>/dev/null || echo "Please start MySQL manually"
    sleep 3
fi

# Try to connect and create database/user
echo "Creating database and user..."

# Create a temporary SQL file
SQL_FILE=$(mktemp)
cat > "$SQL_FILE" <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
DROP USER IF EXISTS '${DB_USER}'@'localhost';
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo ""
echo "Please enter your MySQL root password when prompted:"
echo ""

# Try to execute
mysql -u root -p < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database and user created successfully!"
    rm "$SQL_FILE"
    
    # Update .env file
    echo ""
    echo "Updating .env file..."
    
    cd "$(dirname "$0")"
    ENV_FILE=".env"
    
    # Update DATABASE_URL
    if grep -q "DATABASE_URL=" "$ENV_FILE"; then
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}\"|" "$ENV_FILE"
        rm -f "$ENV_FILE.bak" 2>/dev/null
    else
        echo "DATABASE_URL=\"mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}\"" >> "$ENV_FILE"
    fi
    
    # Ensure JWT_SECRET is set
    if ! grep -q "JWT_SECRET=" "$ENV_FILE"; then
        JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "your-super-secret-jwt-key-change-this-in-production-$(date +%s)")
        echo "JWT_SECRET=\"$JWT_SECRET\"" >> "$ENV_FILE"
    fi
    
    # Ensure PORT is set
    if ! grep -q "PORT=" "$ENV_FILE"; then
        echo "PORT=3000" >> "$ENV_FILE"
    fi
    
    echo "✅ .env file updated!"
    echo ""
    echo "Next: Running Prisma migrations..."
    echo ""
    
    npx prisma migrate dev --name init
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Setup complete!"
        echo ""
        echo "Restart your server: npm run dev"
    fi
else
    echo ""
    echo "❌ Failed. Please run manually:"
    echo "  mysql -u root -p < setup-mysql.sql"
    rm "$SQL_FILE"
fi

