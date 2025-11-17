# Backend API - Authentication with JWT and Prisma

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/naai_db?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port
PORT=3000
```

**Important:** 
- Replace `username`, `password`, `localhost`, `3306`, and `naai_db` with your MySQL database credentials
- Change `JWT_SECRET` to a strong random string in production

### 3. Set Up MySQL Database

Make sure MySQL is running and create a database:

```sql
CREATE DATABASE naai_db;
```

**If you encounter the error "Unknown authentication plugin 'sha256_password'":**

This happens when MySQL uses the `sha256_password` plugin which Prisma doesn't fully support. Fix it by changing the user's authentication plugin:

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Change the user's authentication plugin to mysql_native_password
ALTER USER 'your_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';

-- Flush privileges
FLUSH PRIVILEGES;
```

Or create a new user with the correct authentication plugin:

```sql
CREATE USER 'naai_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
GRANT ALL PRIVILEGES ON naai_db.* TO 'naai_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env` file to use this user:
```env
DATABASE_URL="mysql://naai_user:your_password@localhost:3306/naai_db"
```

### 4. Run Prisma Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Generate the Prisma Client
- Create the database tables based on your schema

### 5. Start the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000` (or the port specified in `.env`)

## API Endpoints

### Signup
- **POST** `/api/auth/signup`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe" // optional
  }
  ```
- **Response:**
  ```json
  {
    "message": "User created successfully",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token-here"
  }
  ```

### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt-token-here"
  }
  ```

### Get Current User (Protected)
- **GET** `/api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer <jwt-token>
  ```
- **Response:**
  ```json
  {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### Health Check
- **GET** `/api/health`
- **Response:**
  ```json
  {
    "status": "OK",
    "message": "Server is running"
  }
  ```

## Technology Stack

- **Express.js** - Web framework
- **Prisma** - ORM for MySQL
- **MySQL** - Database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Request validation
- **cors** - Cross-origin resource sharing

# naai-backend
