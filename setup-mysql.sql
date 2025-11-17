-- MySQL Setup Script for Authentication App
-- Run this as root: mysql -u root -p < setup-mysql.sql

-- Create database
CREATE DATABASE IF NOT EXISTS naai_db;

-- Create user with mysql_native_password (compatible with Prisma)
-- Using a default password 'naai_password_123' - CHANGE THIS IN PRODUCTION!
DROP USER IF EXISTS 'naai_user'@'localhost';
CREATE USER 'naai_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'naai_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON naai_db.* TO 'naai_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Show created user
SELECT User, Host, plugin FROM mysql.user WHERE User = 'naai_user';

-- Show database
SHOW DATABASES LIKE 'naai_db';

