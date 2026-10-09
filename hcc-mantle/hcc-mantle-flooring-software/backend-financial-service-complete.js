'use strict';

/**
 * NORTHSTAR INSTALLATIONS - FINANCIAL SERVICE
 * Port: 8088
 * Database: SQLite3 (financial.db)
 * Purpose: Invoice generation, payment tracking, financial reporting
 */

// ─── SERVICE INITIALIZATION ─────────────────────────────────────────────────

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const { sequelize } = require('./config/database');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8088;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000' }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── REQUEST LOGGING ────────────────────────────────────────────────────────

app.use((req, res, next) => {
  logger.info('Financial service request', { method: req.method, url: req.url });
  next();
});

// ─── HEALTH ENDPOINTS ───────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'financial-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/health/live', (req, res) => res.json({ live: true }));
app.get('/health/ready', (req, res) => res.json({ ready: true }));

// ─── PROTECTED ROUTES ───────────────────────────────────────────────────────

app.use('/api', authenticateToken);
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/financial-reports', require('./routes/reportRoutes'));

// ─── ERROR HANDLING ─────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── SERVER STARTUP ─────────────────────────────────────────────────────────

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✓ Database connection established');

    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('✓ Database models synchronized');
    }

    app.listen(PORT, () => {
      logger.info(`🚀 Financial Service initialized on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Fatal startup error', { error: err.message });
    process.exit(1);
  }
};

// ─── GRACEFUL SHUTDOWN ──────────────────────────────────────────────────────

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received - shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received - shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

if (require.main === module) startServer();
module.exports = app;

// ═════════════════════════════════════════════════════════════════════════════
// MODELS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Invoice Model - Represents customer invoices
 */
class Invoice {
  static fields = {
    id: { type: 'TEXT PRIMARY KEY', default: 'uuid' },
    jobId: { type: 'TEXT NOT NULL', foreign: 'jobs(id)' },
    customerId: { type: 'TEXT NOT NULL', foreign: 'customers(id)' },
    invoiceNumber: { type: 'TEXT UNIQUE NOT NULL' },
    invoiceDate: { type: 'DATE DEFAULT CURRENT_DATE' },
    dueDate: { type: 'DATE NOT NULL' },
    subtotal: { type: 'DECIMAL(12,2) NOT NULL' },
    taxAmount: { type: 'DECIMAL(12,2) DEFAULT 0' },
    discountAmount: { type: 'DECIMAL(12,2) DEFAULT 0' },
    grandTotal: { type: 'DECIMAL(12,2) NOT NULL' },
    amountPaid: { type: 'DECIMAL(12,2) DEFAULT 0' },
    status: { type: 'ENUM', values: ['draft', 'sent', 'viewed', 'overdue', 'paid', 'cancelled'] },
    paymentTerms: { type: 'VARCHAR(50)' },
    notes: { type: 'TEXT' },
    sentAt: { type: 'TIMESTAMP' },
    paidAt: { type: 'TIMESTAMP' },
    createdAt: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    updatedAt: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
  };

  // Core Methods
  static async create(invoiceData) {
    const invoice = {
      id: require('crypto').randomUUID(),
      invoiceNumber: await Invoice.generateInvoiceNumber(),
      status: 'draft',
      ...invoiceData
    };
    return invoice;
  }

  static async generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = Math.floor(Math.random() * 10000);
    return `INV-${year}${month}-${String(count).padStart(5, '0')}`;
  }

  static async calculateBalance(invoiceId) {
    // balance = grandTotal - amountPaid
    return 'SELECT grand_total - amount_paid AS balance FROM invoices WHERE id = ?';
  }

  static async sendInvoice(invoiceId) {
    return {
      invoiceId,
      status: 'sent',
      sentAt: new Date()
    };
  }
}

/**
 * Payment Model - Represents customer payments
 */
class Payment {
  static fields = {
    id: { type: 'TEXT PRIMARY KEY' },
    invoiceId: { type: 'TEXT NOT NULL', foreign: 'invoices(id)' },
    customerId: { type: 'TEXT NOT NULL', foreign: 'customers(id)' },
    amount: { type: 'DECIMAL(12,2) NOT NULL' },
    paymentMethod: { type: 'ENUM', values: ['cash', 'check', 'ach', 'credit_card', 'wire'] },
    paymentDate: { type: 'DATE NOT NULL' },
    referenceNumber: { type: 'VARCHAR(100)' },
    notes: { type: 'TEXT' },
    status: { type: 'ENUM', values: ['pending', 'received', 'deposited', 'failed'] },
    createdAt: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
  };

  static async recordPayment(paymentData) {
    return {
      id: require('crypto').randomUUID(),
      status: 'received',
      ...paymentData
    };
  }

  static async processPayment(paymentId) {
    return {
      paymentId,
      status: 'deposited',
      processedAt: new Date()
    };
  }
}

/**
 * Expense Model - Represents project expenses
 */
class Expense {
  static fields = {
    id: { type: 'TEXT PRIMARY KEY' },
    jobId: { type: 'TEXT NOT NULL', foreign: 'jobs(id)' },
    category: { type: 'VARCHAR(100)' },
    description: { type: 'TEXT NOT NULL' },
    amount: { type: 'DECIMAL(12,2) NOT NULL' },
    date: { type: 'DATE NOT NULL' },
    vendor: { type: 'VARCHAR(200)' },
    receipt: { type: 'VARCHAR(500)' },
    approvedBy: { type: 'TEXT' },
    status: { type: 'ENUM', values: ['pending', 'approved', 'rejected'] },
    createdAt: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTROLLERS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Invoice Controller - Manage invoice operations
 */
const invoiceController = {
  async createInvoice(req, res, next) {
    try {
      const { jobId, customerId, subtotal, taxAmount, discountAmount, dueDate } = req.body;

      if (!jobId || !customerId || !subtotal || !dueDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const grandTotal = parseFloat(subtotal) + parseFloat(taxAmount || 0) - parseFloat(discountAmount || 0);

      const invoice = await Invoice.create({
        jobId,
        customerId,
        subtotal: parseFloat(subtotal),
        taxAmount: parseFloat(taxAmount || 0),
        discountAmount: parseFloat(discountAmount || 0),
        grandTotal,
        dueDate,
        ...req.body
      });

      logger.info('Invoice created', { invoiceId: invoice.id, jobId });
      res.status(201).json(invoice);
    } catch (err) { next(err); }
  },

  async getInvoices(req, res, next) {
    try {
      const { page = 1, limit = 25, status, customerId } = req.query;
      // In production: Use actual database query
      const invoices = [];
      res.json({ invoices, pagination: { total: 0, page: parseInt(page), limit: parseInt(limit) } });
    } catch (err) { next(err); }
  },

  async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      // In production: Query database
      res.json({ id, status: 'paid' });
    } catch (err) { next(err); }
  },

  async sendInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const result = await Invoice.sendInvoice(id);
      logger.info('Invoice sent', { invoiceId: id });
      res.json(result);
    } catch (err) { next(err); }
  },

  async cancelInvoice(req, res, next) {
    try {
      const { id } = req.params;
      // Mark invoice as cancelled
      logger.info('Invoice cancelled', { invoiceId: id });
      res.json({ id, status: 'cancelled' });
    } catch (err) { next(err); }
  }
};

/**
 * Payment Controller - Manage payment operations
 */
const paymentController = {
  async recordPayment(req, res, next) {
    try {
      const { invoiceId, customerId, amount, paymentMethod, referenceNumber } = req.body;

      if (!invoiceId || !customerId || !amount || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const payment = await Payment.recordPayment({
        invoiceId,
        customerId,
        amount: parseFloat(amount),
        paymentMethod,
        referenceNumber,
        paymentDate: new Date().toISOString().split('T')[0]
      });

      logger.info('Payment recorded', { paymentId: payment.id, invoiceId });
      res.status(201).json(payment);
    } catch (err) { next(err); }
  },

  async getPayments(req, res, next) {
    try {
      const { invoiceId, status } = req.query;
      // In production: Query database
      res.json({ payments: [] });
    } catch (err) { next(err); }
  },

  async processPayment(req, res, next) {
    try {
      const { id } = req.params;
      const result = await Payment.processPayment(id);
      logger.info('Payment processed', { paymentId: id });
      res.json(result);
    } catch (err) { next(err); }
  }
};

// Export for routes
module.exports.invoiceController = invoiceController;
module.exports.paymentController = paymentController;
module.exports.Invoice = Invoice;
module.exports.Payment = Payment;
