require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('\n=== Testing Database Connection ===\n');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'));
  
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully!\n');
    
    // Try a simple query
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Query test successful:', result);
    } catch (queryError) {
      console.log('⚠️  Connection works but query failed:', queryError.message);
    }
    
    // Check if User table exists
    try {
      const tables = await prisma.$queryRaw`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
      `;
      console.log('\n📊 Existing tables:');
      console.log(tables);
      
      const hasUserTable = tables.some(t => t.TABLE_NAME === 'User');
      if (!hasUserTable) {
        console.log('\n⚠️  User table does not exist. Run migrations:');
        console.log('   npx prisma migrate dev --name init\n');
      } else {
        console.log('\n✅ User table exists!');
      }
    } catch (err) {
      console.log('⚠️  Could not check tables:', err.message);
    }
    
    await prisma.$disconnect();
    console.log('\n✅ Test completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('sha256_password')) {
      console.error('\n🔧 SOLUTION: Fix MySQL authentication plugin\n');
      console.error('Run these commands in MySQL:');
      console.error('  mysql -u root -p');
      console.error('  CREATE USER \'naai_user\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'your_password\';');
      console.error('  CREATE DATABASE IF NOT EXISTS naai_db;');
      console.error('  GRANT ALL PRIVILEGES ON naai_db.* TO \'naai_user\'@\'localhost\';');
      console.error('  FLUSH PRIVILEGES;');
      console.error('  EXIT;');
      console.error('\nThen update your .env file:');
      console.error('  DATABASE_URL="mysql://naai_user:your_password@localhost:3306/naai_db"\n');
    } else if (error.message.includes('Access denied')) {
      console.error('\n🔧 SOLUTION: Invalid credentials\n');
      console.error('Update your .env file with correct MySQL credentials\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔧 SOLUTION: MySQL server is not running\n');
      console.error('Start MySQL service:\n  brew services start mysql\n');
    } else if (error.message.includes('Unknown database')) {
      console.error('\n🔧 SOLUTION: Database does not exist\n');
      console.error('Create the database:\n  mysql -u root -p -e "CREATE DATABASE naai_db;"\n');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();

