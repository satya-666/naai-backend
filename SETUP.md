# Quick Setup Guide - Fixing the 500 Error

## Current Issue
You're getting a 500 Internal Server Error because:
1. MySQL authentication plugin is not compatible (`sha256_password`)
2. Database credentials need to be configured
3. Database tables may not exist yet

## Step-by-Step Fix

### Step 1: Fix MySQL Authentication Plugin

Connect to MySQL as root and run:

```sql
mysql -u root -p
```

Then create a new user with the correct authentication plugin:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS naai_db;

-- Create user with mysql_native_password (compatible with Prisma)
CREATE USER 'naai_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON naai_db.* TO 'naai_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

**Note:** Replace `your_secure_password_here` with a secure password of your choice.

### Step 2: Update .env File

Edit `/Users/satyaprakash/Desktop/naai/backend/.env` and update the DATABASE_URL:

```env
DATABASE_URL="mysql://naai_user:your_secure_password_here@localhost:3306/naai_db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"
PORT=3000
```

**Important:** 
- Replace `your_secure_password_here` with the password you used in Step 1
- Change `JWT_SECRET` to a strong random string

### Step 3: Run Prisma Migrations

This will create the database tables:

```bash
cd backend
npx prisma migrate dev --name init
```

If this is the first time, it will:
- Create the database tables
- Generate the Prisma client

### Step 4: Restart the Server

```bash
# Stop the current server (Ctrl+C or kill the process)
# Then start it again:
npm run dev
```

### Step 5: Test

Try signing up again from the frontend. It should work now!

## Alternative: Use Existing MySQL User

If you already have a MySQL user and want to use it:

```sql
mysql -u root -p

-- Change existing user's authentication plugin
ALTER USER 'your_existing_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_existing_password';

-- Grant privileges if needed
GRANT ALL PRIVILEGES ON naai_db.* TO 'your_existing_username'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

Then update `.env` with your existing credentials.

## Verify Setup

Check if everything is working:

1. **Check database connection:**
   ```bash
   cd backend
   npx prisma db pull
   ```

2. **Check server logs:**
   Look for "Database connected successfully" in the server console

3. **Test API:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## Still Having Issues?

1. Make sure MySQL is running:
   ```bash
   # On macOS with Homebrew:
   brew services list | grep mysql
   
   # Or check process:
   ps aux | grep mysql
   ```

2. Verify database exists:
   ```sql
   mysql -u naai_user -p
   SHOW DATABASES;
   USE naai_db;
   SHOW TABLES;
   ```

3. Check Prisma schema is correct:
   ```bash
   cd backend
   npx prisma validate
   ```

