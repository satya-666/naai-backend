#!/bin/bash

echo "=========================================="
echo "  MySQL Database Setup for Authentication App"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will help you set up MySQL for the authentication app.${NC}"
echo ""
echo "You'll need to:"
echo "  1. Enter MySQL root password"
echo "  2. Choose a password for the 'naai_user' database user"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo -e "${YELLOW}Step 1: Creating database and user...${NC}"
echo ""

# Get MySQL root password
read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""

# Get password for naai_user
read -sp "Enter password for 'naai_user' (remember this!): " NAAI_PASSWORD
echo ""
read -sp "Confirm password: " NAAI_PASSWORD_CONFIRM
echo ""

if [ "$NAAI_PASSWORD" != "$NAAI_PASSWORD_CONFIRM" ]; then
    echo -e "${RED}Passwords don't match! Exiting...${NC}"
    exit 1
fi

# Create SQL commands
SQL_COMMANDS=$(cat <<EOF
CREATE DATABASE IF NOT EXISTS naai_db;
CREATE USER IF NOT EXISTS 'naai_user'@'localhost' IDENTIFIED WITH mysql_native_password BY '${NAAI_PASSWORD}';
GRANT ALL PRIVILEGES ON naai_db.* TO 'naai_user'@'localhost';
FLUSH PRIVILEGES;
EOF
)

# Execute SQL
echo "$SQL_COMMANDS" | mysql -u root -p"${MYSQL_ROOT_PASSWORD}" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database and user created successfully!${NC}"
    echo ""
    
    # Update .env file
    echo -e "${YELLOW}Step 2: Updating .env file...${NC}"
    
    ENV_FILE=".env"
    if [ -f "$ENV_FILE" ]; then
        # Backup existing .env
        cp "$ENV_FILE" "$ENV_FILE.backup"
        
        # Update DATABASE_URL
        if grep -q "DATABASE_URL=" "$ENV_FILE"; then
            # Use sed to replace DATABASE_URL
            sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"mysql://naai_user:${NAAI_PASSWORD}@localhost:3306/naai_db\"|" "$ENV_FILE"
            rm -f "$ENV_FILE.bak"
        else
            echo "DATABASE_URL=\"mysql://naai_user:${NAAI_PASSWORD}@localhost:3306/naai_db\"" >> "$ENV_FILE"
        fi
        
        echo -e "${GREEN}✅ .env file updated!${NC}"
        echo ""
        
        echo -e "${YELLOW}Step 3: Running Prisma migrations...${NC}"
        npx prisma migrate dev --name init
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}=========================================="
            echo "  Setup Complete! 🎉"
            echo "==========================================${NC}"
            echo ""
            echo "Next steps:"
            echo "  1. Restart your server: npm run dev"
            echo "  2. Try signing up from the frontend"
            echo ""
            echo "Database credentials saved in .env file"
            echo ""
        else
            echo -e "${RED}❌ Migration failed. Please run manually:${NC}"
            echo "   npx prisma migrate dev --name init"
        fi
    else
        echo -e "${YELLOW}⚠️  .env file not found. Creating it...${NC}"
        cat > "$ENV_FILE" <<EOF
DATABASE_URL="mysql://naai_user:${NAAI_PASSWORD}@localhost:3306/naai_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-$(openssl rand -hex 16)"
PORT=3000
EOF
        echo -e "${GREEN}✅ .env file created!${NC}"
        echo ""
        echo -e "${YELLOW}Now run:${NC}"
        echo "  npx prisma migrate dev --name init"
    fi
else
    echo -e "${RED}❌ Failed to create database/user.${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Wrong root password"
    echo "  2. MySQL service not running (run: brew services start mysql)"
    echo "  3. User already exists - try running this command manually:"
    echo ""
    echo "mysql -u root -p"
    echo "DROP USER IF EXISTS 'naai_user'@'localhost';"
    echo "CREATE USER 'naai_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';"
    echo "CREATE DATABASE IF NOT EXISTS naai_db;"
    echo "GRANT ALL PRIVILEGES ON naai_db.* TO 'naai_user'@'localhost';"
    echo "FLUSH PRIVILEGES;"
    exit 1
fi

