require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n==========================================');
console.log('  Automatic Database Setup');
console.log('==========================================\n');

const DB_USER = 'naai_user';
const DB_PASS = 'naai_password_123';
const DB_NAME = 'naai_db';

// Update .env file
console.log('📝 Step 1: Updating .env file...');
const envPath = path.join(__dirname, '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update DATABASE_URL
envContent = envContent.replace(
  /DATABASE_URL=.*/,
  `DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"`
);

// Ensure JWT_SECRET is set
if (!envContent.includes('JWT_SECRET=')) {
  envContent += `\nJWT_SECRET="your-super-secret-jwt-key-${Date.now()}"\n`;
}

// Ensure PORT is set
if (!envContent.includes('PORT=')) {
  envContent += `\nPORT=3000\n`;
}

fs.writeFileSync(envPath, envContent);
console.log('✅ .env file updated!\n');

// Try to create database using Prisma's db push
console.log('📝 Step 2: Creating database schema...');
console.log('   Attempting to use Prisma db push...\n');

try {
  // First, try to connect and push schema
  execSync('npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env }
  });
  console.log('\n✅ Database schema created successfully!\n');
  
  // Generate Prisma client
  console.log('📝 Step 3: Generating Prisma client...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Prisma client generated!\n');
  
  console.log('==========================================');
  console.log('  Setup Complete! 🎉');
  console.log('==========================================\n');
  console.log('Next steps:');
  console.log('  1. Restart your server: npm run dev');
  console.log('  2. Try signing up from the frontend\n');
  console.log('Note: If you see database connection errors, you may need to:');
  console.log('  1. Run MySQL setup SQL manually: mysql -u root -p < setup-mysql.sql');
  console.log('  2. Or check if MySQL is running: brew services list | grep mysql\n');
  
} catch (error) {
  console.error('\n❌ Failed to create database automatically.\n');
  console.error('You need to create the database and user manually.\n');
  console.error('Run these commands:\n');
  console.error('  1. mysql -u root -p');
  console.error('  2. Then run the SQL commands from setup-mysql.sql\n');
  console.error('Or use the setup script:');
  console.error('  ./create-db-auto.sh\n');
  
  process.exit(1);
}

