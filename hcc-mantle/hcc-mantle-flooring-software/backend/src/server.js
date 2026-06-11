const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        customer: true,
        employee: true,
        vendor: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Role-based authorization
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Socket.IO authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = user.id;
    socket.userRole = user.role;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join room for user-specific updates
  socket.join(`user:${socket.userId}`);
  
  // Join role-based rooms
  socket.join(`role:${socket.userRole}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// API Routes

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customer: true,
        employee: true,
        vendor: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo purposes, we'll skip password check
    // In production, use: const validPassword = await bcrypt.compare(password, user.password);
    
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customer: user.customer,
        employee: user.employee,
        vendor: user.vendor
      },
      token,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const session = await prisma.session.findUnique({
      where: { token: refreshToken }
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const newToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { token: refreshToken }
      });
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Dashboard Routes
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    // Base stats for all roles
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({
      where: { status: 'IN_PROGRESS' }
    });
    const totalCustomers = await prisma.customer.count();

    // Role-specific stats
    switch (userRole) {
      case 'SUPER_ADMIN':
      case 'ADMIN':
      case 'MANAGER':
        stats = {
          totalProjects,
          activeProjects,
          totalCustomers,
          totalRevenue: await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'PAID' }
          }),
          pendingInvoices: await prisma.invoice.count({
            where: { status: 'PENDING' }
          }),
          lowStockMaterials: await prisma.material.count({
            where: { currentStock: { lt: prisma.material.fields.minThreshold } }
          })
        };
        break;
      
      case 'EMPLOYEE':
      case 'INSTALLER':
        stats = {
          myProjects: await prisma.project.count({
            where: {
              schedules: {
                some: {
                  employeeId: req.user.employee.id
                }
              }
            }
          }),
          completedJobs: req.user.employee.completedJobs,
          rating: req.user.employee.rating
        };
        break;
      
      case 'CUSTOMER':
        stats = {
          myProjects: await prisma.project.count({
            where: { customerId: req.user.customer.id }
          }),
          totalSpent: await prisma.invoice.aggregate({
            _sum: { totalAmount: true },
            where: {
              customerId: req.user.customer.id,
              status: 'PAID'
            }
          }),
          nextAppointment: await prisma.schedule.findFirst({
            where: { project: { customerId: req.user.customer.id } },
            orderBy: { date: 'asc' }
          })
        };
        break;
      
      case 'VENDOR':
        stats = {
          purchaseOrders: await prisma.purchaseOrder.count({
            where: { vendorId: req.user.vendor.id }
          }),
          materialsSupplied: await prisma.material.count({
            where: { supplierId: req.user.vendor.id }
          }),
          totalValue: await prisma.purchaseOrder.aggregate({
            _sum: { totalAmount: true },
            where: { vendorId: req.user.vendor.id }
          })
        };
        break;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// Project Routes
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = status ? { status } : {};

    const projects = await prisma.project.findMany({
      where,
      include: {
        customer: true,
        schedules: {
          include: {
            employee: true
          }
        },
        _count: {
          select: { materials: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.project.count({ where });

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects', details: error.message });
  }
});

app.post('/api/projects', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const {
      customerId,
      name,
      description,
      address,
      city,
      state,
      zipCode,
      estimatedCost,
      startDate,
      endDate
    } = req.body;

    const project = await prisma.project.create({
      data: {
        projectNumber: `PRJ-${Date.now()}`,
        customerId,
        name,
        description,
        address,
        city,
        state,
        zipCode,
        estimatedCost: parseFloat(estimatedCost),
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      include: {
        customer: true
      }
    });

    // Notify customer via Socket.IO
    io.to(`user:${customerId}`).emit('projectCreated', project);

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
});

// Inventory Routes
app.get('/api/inventory/materials', authenticateToken, async (req, res) => {
  try {
    const { category, status, page = 1, limit = 20 } = req.query;
    
    let where = {};
    if (category && category !== 'all') {
      where.category = category;
    }
    
    if (status && status !== 'all') {
      if (status === 'low-stock') {
        where.currentStock = { lt: prisma.material.fields.minThreshold };
      } else if (status === 'out-of-stock') {
        where.currentStock = { lte: 0 };
      }
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        supplier: true
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });

    const total = await prisma.material.count({ where });

    res.json({
      materials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch materials', details: error.message });
  }
});

app.post('/api/inventory/materials', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), async (req, res) => {
  try {
    const {
      sku,
      name,
      category,
      unit,
      unitCost,
      currentStock,
      minThreshold,
      maxStock,
      supplierId,
      location
    } = req.body;

    const material = await prisma.material.create({
      data: {
        sku,
        name,
        category,
        unit,
        unitCost: parseFloat(unitCost),
        currentStock: parseFloat(currentStock),
        minThreshold: parseFloat(minThreshold),
        maxStock: parseFloat(maxStock),
        supplierId,
        location
      }
    });

    res.status(201).json(material);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create material', details: error.message });
  }
});

// AI Insights Routes
app.get('/api/ai/insights', authenticateToken, async (req, res) => {
  try {
    const insights = await prisma.aIInsight.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI insights', details: error.message });
  }
});

app.post('/api/ai/insights', authenticateToken, async (req, res) => {
  try {
    const { type, title, description, confidence, priority } = req.body;

    const insight = await prisma.aIInsight.create({
      data: {
        type,
        title,
        description,
        confidence: parseFloat(confidence),
        priority
      }
    });

    // Notify relevant users via Socket.IO
    io.to('role:ADMIN').emit('newInsight', insight);
    io.to('role:MANAGER').emit('newInsight', insight);

    res.status(201).json(insight);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create AI insight', details: error.message });
  }
});

// Financial Routes
app.get('/api/financial/overview', authenticateToken, async (req, res) => {
  try {
    const totalRevenue = await prisma.invoice.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'PAID' }
    });

    const totalExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { status: 'APPROVED' }
    });

    const pendingInvoices = await prisma.invoice.count({
      where: { status: 'PENDING' }
    });

    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "paidDate") AS month,
        SUM("totalAmount") AS revenue
      FROM invoices
      WHERE "status" = 'PAID' 
        AND "paidDate" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "paidDate")
      ORDER BY month DESC
    `;

    res.json({
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      pendingInvoices,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch financial overview', details: error.message });
  }
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files (for production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Flooring ERP Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});

module.exports = app;