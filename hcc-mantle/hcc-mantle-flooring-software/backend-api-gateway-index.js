// backend/api-gateway/src/index.js
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const serviceRegistry = require('./services/serviceRegistry');
const serviceProxy = require('./services/serviceProxy');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// ─── Security Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true
}));

// ─── Body Parsing ───────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Logging Middleware ─────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  });
  next();
});

// ─── Health Check Endpoints ─────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: serviceRegistry.getStatus()
  });
});

app.get('/health/live', (req, res) => res.json({ live: true }));
app.get('/health/ready', (req, res) => res.json({ ready: true }));

// ─── Service Discovery ───────────────────────────────────────
app.get('/admin/services', authenticateToken, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  res.json(serviceRegistry.listServices());
});

// ─── Authentication Routes ──────────────────────────────────
app.use('/auth', authRoutes);

// ─── Protected API Routes (Service Proxy) ───────────────────
app.use('/api/customers', authenticateToken, serviceProxy('CUSTOMER_SERVICE_URL'));
app.use('/api/estimations', authenticateToken, serviceProxy('ESTIMATION_SERVICE_URL'));
app.use('/api/jobs', authenticateToken, serviceProxy('FIELD_OPERATIONS_SERVICE_URL'));
app.use('/api/crew', authenticateToken, serviceProxy('FIELD_OPERATIONS_SERVICE_URL'));
app.use('/api/leads', authenticateToken, serviceProxy('CRM_SERVICE_URL'));
app.use('/api/opportunities', authenticateToken, serviceProxy('CRM_SERVICE_URL'));
app.use('/api/invoices', authenticateToken, serviceProxy('FINANCIAL_SERVICE_URL'));
app.use('/api/payments', authenticateToken, serviceProxy('FINANCIAL_SERVICE_URL'));
app.use('/api/inventory', authenticateToken, serviceProxy('INVENTORY_SERVICE_URL'));
app.use('/api/documents', authenticateToken, serviceProxy('DOCUMENT_SERVICE_URL'));

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.url,
    method: req.method
  });
});

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────
const startServer = async () => {
  try {
    // Initialize service registry with health checks
    await serviceRegistry.init();
    
    logger.info('✓ API Gateway initialized');
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 API Gateway listening on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        logger.info('API Gateway shut down');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      server.close(() => {
        logger.info('API Gateway shut down');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error('Failed to start API Gateway', { error: err.message });
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
