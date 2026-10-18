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
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Express App
const app: Application = express();
const PORT = process.env.PORT || 3001;

/**
 * Signing key for access tokens. There is no fallback: a committed default
 * would let anyone forge tokens, so the server refuses to start without one.
 */
function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || /change|your[-_]|example|dev_secret/i.test(secret)) {
    console.error('✗ JWT_SECRET must be set to a random value of at least 32 characters');
    process.exit(1);
  }
  return secret;
}
const JWT_SECRET = requireJwtSecret();

// ============================================================================
// PASSWORD HASHING
// ============================================================================

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const HASH_PREFIX = 'scrypt$';
const MIN_PASSWORD_LENGTH = 12;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `${HASH_PREFIX}${salt.toString('hex')}$${hash.toString('hex')}`;
}

/**
 * Verify a password. Rows created before hashing was added hold plaintext;
 * they still verify (in constant time) and are re-hashed by the caller.
 */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith(HASH_PREFIX)) {
    const [saltHex, hashHex] = stored.slice(HASH_PREFIX.length).split('$');
    const expected = Buffer.from(hashHex ?? '', 'hex');
    if (!saltHex || expected.length === 0) return false;
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
    return timingSafeEqual(actual, expected);
  }
  const a = Buffer.from(password);
  const b = Buffer.from(stored);
  return a.length === b.length && timingSafeEqual(a, b);
}

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
  iat: number;
  exp: number;
}

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  companyId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      userId?: string;
      companyId?: string;
    }
  }
}

/**
 * Verify the token, then load the user: role, status and company come from the
 * database on every request, never from the token payload.
 */
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  let payload: JWTPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, status: true, companyId: true }
    });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (!user.companyId) {
      return res.status(403).json({ error: 'User is not assigned to a company' });
    }
    req.user = { userId: user.id, email: user.email, role: user.role, companyId: user.companyId };
    req.userId = user.id;
    req.companyId = user.companyId;
    next();
  } catch (error) {
    next(error);
  }
};

const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

/** Copy only the listed fields, so clients cannot set ids, companyId or status. */
function pick<T extends string>(source: any, fields: readonly T[]): Partial<Record<T, any>> {
  const out: Partial<Record<T, any>> = {};
  for (const field of fields) {
    if (source && source[field] !== undefined) out[field] = source[field];
  }
  return out;
}

const CUSTOMER_FIELDS = ['name', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'notes', 'status'] as const;
const PROJECT_FIELDS = [
  'name', 'customerId', 'description', 'address', 'city', 'state', 'zipCode',
  'squareFootage', 'startDate', 'endDate', 'budget', 'flooringType', 'status'
] as const;

const signToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET, { algorithm: 'HS256', expiresIn: '24h' });

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
    // `role` is deliberately not read: self-registration always gets the
    // default role. Elevated roles must be granted by an administrator.
    const { email, password, firstName, lastName, companyName } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Registration creates a new company owned by this user; it never joins an existing one.
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
        role: 'customer',
        company: {
          create: {
            id: uuidv4(),
            name: companyName || `${firstName}'s Company`,
            email,
            status: 'active'
          }
        }
      },
      include: { company: true }
    });

    res.status(201).json({
      message: 'User registered successfully',
      token: signToken(user.id),
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
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Replace any legacy plaintext password with a hash.
    if (!user.password.startsWith(HASH_PREFIX)) {
      await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(password) } });
    }

    res.json({
      message: 'Login successful',
      token: signToken(user.id),
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
      where: { companyId: req.companyId! },
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
        companyId: req.companyId!,
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

// Update customer (own company only)
app.put('/api/customers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await prisma.customer.updateMany({
      where: { id, companyId: req.companyId! },
      data: pick(req.body, CUSTOMER_FIELDS)
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const customer = await prisma.customer.findFirst({ where: { id, companyId: req.companyId! } });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer (own company only)
app.delete('/api/customers/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await prisma.customer.deleteMany({ where: { id, companyId: req.companyId! } });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

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

const customerInCompany = (customerId: unknown, companyId: string) =>
  typeof customerId === 'string'
    ? prisma.customer.findFirst({ where: { id: customerId, companyId }, select: { id: true } })
    : Promise.resolve(null);

// Get all projects
app.get('/api/projects', authenticateToken, async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { companyId: req.companyId! },
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

    if (!(await customerInCompany(customerId, req.companyId!))) {
      return res.status(404).json({ error: 'Customer not found' });
    }

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
        companyId: req.companyId!,
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

// Update project (own company only)
app.put('/api/projects/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = pick(req.body, PROJECT_FIELDS);

    // Parse dates and numbers if present
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);
    if (updates.squareFootage) updates.squareFootage = parseFloat(updates.squareFootage);
    if (updates.budget) updates.budget = parseFloat(updates.budget);

    if (updates.customerId !== undefined && !(await customerInCompany(updates.customerId, req.companyId!))) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const result = await prisma.project.updateMany({
      where: { id, companyId: req.companyId! },
      data: updates
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = await prisma.project.findFirst({
      where: { id, companyId: req.companyId! },
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

// Get quotes for project (own company only)
app.get('/api/projects/:projectId/quotes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const quotes = await prisma.quote.findMany({
      where: { projectId, companyId: req.companyId! },
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

// Create quote for a project in the caller's company
app.post('/api/quotes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { projectId, items, laborCost, taxRate, notes } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }
    const project = typeof projectId === 'string'
      ? await prisma.project.findFirst({ where: { id: projectId, companyId: req.companyId! }, select: { id: true } })
      : null;
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Calculate totals
    const materialCost = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const subtotal = materialCost + (laborCost || 0);
    const tax = subtotal * (taxRate || 0.08);
    const total = subtotal + tax;

    const quote = await prisma.quote.create({
      data: {
        id: uuidv4(),
        quoteNumber: `Q-${Date.now()}-${randomBytes(3).toString('hex')}`,
        projectId: project.id,
        companyId: req.companyId!,
        userId: req.userId!,
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
      where: { companyId: req.companyId! },
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
        companyId: req.companyId!
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

// Update inventory (own company only)
app.patch('/api/inventory/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const result = await prisma.inventoryItem.updateMany({
      where: { id, companyId: req.companyId! },
      data: { quantity: parseInt(quantity) }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    const item = await prisma.inventoryItem.findFirst({ where: { id, companyId: req.companyId! } });

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
    const companyId = req.companyId!;

    // Fetch statistics
    const totalCustomers = await prisma.customer.count({ where: { companyId } });
    const totalProjects = await prisma.project.count({ where: { companyId } });
    const activeProjects = await prisma.project.count({ where: { companyId, status: 'active' } });

    const quotes = await prisma.quote.findMany({ where: { companyId } });
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

export { authorizeRole };
export default app;
