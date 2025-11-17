require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();

// Initialize Prisma Client with better error handling
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch((error) => {
    console.error('Database connection error:', error.message);
    console.error('\nIf you see "Unknown authentication plugin \'sha256_password\'":');
    console.error('1. Connect to MySQL as root');
    console.error('2. Run: ALTER USER \'your_username\'@\'localhost\' IDENTIFIED WITH mysql_native_password BY \'your_password\';');
    console.error('3. Run: FLUSH PRIVILEGES;');
  });

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Signup Route
app.post('/api/auth/signup',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').optional().trim().isLength({ min: 1 }).withMessage('Name must not be empty'),
    body('role').optional().isIn(['customer', 'barber']).withMessage('Role must be either customer or barber'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, name, role } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with role (default to 'customer' if not provided)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          role: role || 'customer',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User created successfully',
        user,
        token,
      });
    } catch (error) {
      console.error('Signup error:', error);
      
      // Provide better error messages
      if (error.code === 'P1001' || error.message.includes('sha256_password')) {
        return res.status(500).json({ 
          error: 'Database connection failed',
          message: 'Please fix MySQL authentication plugin. See server logs for details.'
        });
      }
      
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Login Route
app.post('/api/auth/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Provide better error messages
      if (error.code === 'P1001' || error.message.includes('sha256_password')) {
        return res.status(500).json({ 
          error: 'Database connection failed',
          message: 'Please fix MySQL authentication plugin. See server logs for details.'
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Protected route example
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Authentication API',
    endpoints: {
      'POST /api/auth/signup': 'Create a new user account',
      'POST /api/auth/login': 'Login and get JWT token',
      'GET /api/auth/me': 'Get current user info (requires authentication)',
      'GET /api/health': 'Health check endpoint',
    },
    example: {
      signup: {
        method: 'POST',
        url: '/api/auth/signup',
        body: {
          email: 'user@example.com',
          password: 'password123',
          name: 'John Doe',
        },
      },
      login: {
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
    },
  });
});

// Get all active shops (for customers to browse)
app.get('/api/shops', async (req, res) => {
  try {
    const { city, search } = req.query;
    
    const where = {
      isActive: true,
    };
    
    if (city) {
      where.city = { contains: city };
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
      ];
    }
    
    const shops = await prisma.shop.findMany({
      where,
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    });
    
    res.json({ shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single shop by ID
app.get('/api/shops/:id', async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: true,
      },
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    res.json({ shop });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update shop (barber only)
app.post('/api/shops', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    
    if (user.role !== 'barber') {
      return res.status(403).json({ error: 'Only barbers can create shops' });
    }
    
    // Check if barber already has a shop
    const existingShop = await prisma.shop.findUnique({
      where: { barberId: user.id },
    });
    
    if (existingShop) {
      return res.status(400).json({ error: 'You already have a shop. Use update endpoint.' });
    }
    
    const {
      name,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      latitude,
      longitude,
      imageUrl,
      services, // Array of services
    } = req.body;
    
    const shop = await prisma.shop.create({
      data: {
        name,
        description,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        latitude,
        longitude,
        imageUrl,
        barberId: user.id,
        services: services ? {
          create: services.map(service => ({
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
          })),
        } : undefined,
      },
      include: {
        services: true,
        barber: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    res.status(201).json({ shop, message: 'Shop created successfully' });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update shop (barber only, their own shop)
app.put('/api/shops/:id', authenticateToken, async (req, res) => {
  try {
    const shopId = parseInt(req.params.id);
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    if (shop.barberId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own shop' });
    }
    
    const {
      name,
      description,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      latitude,
      longitude,
      imageUrl,
    } = req.body;
    
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        name,
        description,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        latitude,
        longitude,
        imageUrl,
      },
      include: {
        services: true,
      },
    });
    
    res.json({ shop: updatedShop, message: 'Shop updated successfully' });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get barber's own shop
app.get('/api/barber/shop', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    
    if (user.role !== 'barber') {
      return res.status(403).json({ error: 'Only barbers can access this endpoint' });
    }
    
    const shop = await prisma.shop.findUnique({
      where: { barberId: user.id },
      include: {
        services: true,
      },
    });
    
    res.json({ shop });
  } catch (error) {
    console.error('Get barber shop error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add service to shop (barber only)
app.post('/api/shops/:id/services', authenticateToken, async (req, res) => {
  try {
    const shopId = parseInt(req.params.id);
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });
    
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    
    if (shop.barberId !== req.user.userId) {
      return res.status(403).json({ error: 'You can only add services to your own shop' });
    }
    
    const { name, description, price, duration } = req.body;
    
    const service = await prisma.service.create({
      data: {
        name,
        description,
        price,
        duration,
        shopId,
      },
    });
    
    res.status(201).json({ service, message: 'Service added successfully' });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

