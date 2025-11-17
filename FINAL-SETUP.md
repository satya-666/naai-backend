# Final Setup Instructions

The .env file has been updated with the correct database credentials.

## You need to run ONE command to complete setup:

```bash
mysql -u root -p < setup-mysql.sql
```

This will:
1. Create the database `naai_db`
2. Create user `naai_user` with correct authentication plugin
3. Grant all privileges

**Then run:**
```bash
npx prisma migrate dev --name init
```

**Then restart server:**
```bash
npm run dev
```

That's it! The signup will work after this.

---

## Alternative: Interactive Setup

If the SQL file doesn't work, run this manually:

```bash
mysql -u root -p
```

Then paste these commands:
```sql
CREATE DATABASE IF NOT EXISTS naai_db;
DROP USER IF EXISTS 'naai_user'@'localhost';
CREATE USER 'naai_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'naai_password_123';
GRANT ALL PRIVILEGES ON naai_db.* TO 'naai_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then run migrations:
```bash
npx prisma migrate dev --name init
```

