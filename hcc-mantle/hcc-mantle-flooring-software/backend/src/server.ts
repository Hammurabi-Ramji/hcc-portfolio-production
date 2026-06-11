/**
 * HCC Mantle - Flooring ERP System
 * Main Express.js Server with Complete API Implementation
 * Version: 1.0.0
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express App
const app: Application = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Compression
app.use(compression());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user as JWTPayload;
    req.userId = (user as JWTPayload).userId;
    next();
  });
};

const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, companyName, role } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user (password hashing should be done in production)
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        password, // In production, use bcrypt
        firstName,
        lastName,
        role: role || 'customer',
        company: {
          create: {
            id: uuidv4(),
            name: companyName || `${firstName}'s Company`,
            status: 'active'
          }
        }
      },
      include: { company: true }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user || user.password !== password) { // In production, use bcrypt.compare
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================================================
// CUSTOMER ENDPOINTS
// ============================================================================

// Get all customers
app.get('/api/customers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { companyId: req.user!.userId },
      include: {
        projects: { take: 5 },
        quotes: { take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create customer
app.post('/api/customers', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, city, state, zipCode, notes } = req.body;

    const customer = await prisma.customer.create({
      data: {
        id: uuidv4(),
        name,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes,
        companyId: req.userId!,
        status: 'active'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
app.put('/api/customers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: updates
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
app.delete('/api/customers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ============================================================================
// PROJECT ENDPOINTS
// ============================================================================

// Get all projects
app.get('/api/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { companyId: req.userId! },
      include: {
        customer: true,
        quotes: { take: 3 },
        tasks: { take: 5 }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project
app.post('/api/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      name,
      customerId,
      description,
      address,
      city,
      state,
      zipCode,
      squareFootage,
      startDate,
      endDate,
      budget,
      flooringType
    } = req.body;

    const project = await prisma.project.create({
      data: {
        id: uuidv4(),
        name,
        customerId,
        description,
        address,
        city,
        state,
        zipCode,
        squareFootage: parseFloat(squareFootage),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        flooringType,
        companyId: req.userId!,
        status: 'planning'
      },
      include: { customer: true }
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
app.put('/api/projects/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Parse dates and numbers if present
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.squareFootage) updates.squareFootage = parseFloat(updates.squareFootage);
    if (updates.budget) updates.budget = parseFloat(updates.budget);

    const project = await prisma.project.update({
      where: { id },
      data: updates,
      include: { customer: true }
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// ============================================================================
// QUOTE ENDPOINTS
// ============================================================================

// Get quotes for project
app.get('/api/projects/:projectId/quotes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const quotes = await prisma.quote.findMany({
      where: { projectId },
      include: { project: true, items: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: quotes.length,
      data: quotes
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Create quote
app.post('/api/quotes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId, items, laborCost, taxRate, notes } = req.body;

    // Calculate totals
    const materialCost = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const subtotal = materialCost + (laborCost || 0);
    const tax = subtotal * (taxRate || 0.08);
    const total = subtotal + tax;

    const quote = await prisma.quote.create({
      data: {
        id: uuidv4(),
        projectId,
        materialCost,
        laborCost: laborCost || 0,
        taxRate: taxRate || 0.08,
        tax,
        total,
        status: 'pending',
        notes,
        items: {
          create: items.map((item: any) => ({
            id: uuidv4(),
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.quantity * item.unitPrice
          }))
        }
      },
      include: { items: true, project: true }
    });

    res.status(201).json({
      success: true,
      message: 'Quote created successfully',
      data: quote
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// ============================================================================
// INVENTORY ENDPOINTS
// ============================================================================

// Get inventory
app.get('/api/inventory', authenticateToken, async (req: Request, res: Response) => {
  try {
    const inventory = await prisma.inventoryItem.findMany({
      where: { companyId: req.userId! },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add inventory item
app.post('/api/inventory', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, sku, category, quantity, unitPrice, reorderLevel } = req.body;

    const item = await prisma.inventoryItem.create({
      data: {
        id: uuidv4(),
        name,
        sku,
        category,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        reorderLevel: parseInt(reorderLevel) || 10,
        companyId: req.userId!
      }
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: item
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// Update inventory
app.patch('/api/inventory/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: parseInt(quantity) }
    });

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: item
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

// Get dashboard analytics
app.get('/api/analytics/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const companyId = req.userId!;

    // Fetch statistics
    const totalCustomers = await prisma.customer.count({ where: { companyId } });
    const totalProjects = await prisma.project.count({ where: { companyId } });
    const activeProjects = await prisma.project.count({ where: { companyId, status: 'active' } });

    const quotes = await prisma.quote.findMany({ where: { project: { companyId } } });
    const totalRevenue = quotes.reduce((sum, q) => sum + q.total, 0);

    const recentProjects = await prisma.project.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true }
    });

    res.json({
      success: true,
      data: {
        totalCustomers,
        totalProjects,
        activeProjects,
        totalRevenue,
        recentProjects
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
