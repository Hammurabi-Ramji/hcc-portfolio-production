'use strict';

/**
 * NORTHSTAR INSTALLATIONS - INVENTORY SERVICE
 * Port: 8089 | Database: SQLite3 (inventory.db)
 * Manages material inventory, stock levels, reordering
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const { sequelize } = require('./config/database');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken, authorize } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8089;

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000' }));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info('Inventory service request', { method: req.method, url: req.url });
  next();
});

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'inventory-service', timestamp: new Date() }));
app.get('/health/live', (req, res) => res.json({ live: true }));
app.get('/health/ready', (req, res) => res.json({ ready: true }));

app.use('/api', authenticateToken);
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV !== 'production') await sequelize.sync({ alter: true });
    app.listen(PORT, () => logger.info(`🚀 Inventory Service initialized on ${PORT}`));
  } catch (err) {
    logger.error('Fatal startup error', { error: err.message });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => { await sequelize.close(); process.exit(0); });
process.on('SIGINT', async () => { await sequelize.close(); process.exit(0); });

if (require.main === module) startServer();

// ═════════════════════════════════════════════════════════════════════════════
// MODELS
// ═════════════════════════════════════════════════════════════════════════════

class Material {
  static fields = {
    id: { type: 'TEXT PRIMARY KEY' },
    name: { type: 'VARCHAR(200) NOT NULL' },
    category: { type: 'VARCHAR(100) NOT NULL' },
    supplier: { type: 'VARCHAR(200)' },
    sku: { type: 'VARCHAR(100) UNIQUE' },
    unit: { type: 'VARCHAR(20) NOT NULL' },
    costPerUnit: { type: 'DECIMAL(10,2)' },
    minStockLevel: { type: 'INTEGER DEFAULT 10' },
    reorderQuantity: { type: 'INTEGER DEFAULT 50' },
    currentStock: { type: 'INTEGER DEFAULT 0' },
    lastRestocked: { type: 'DATE' },
    isActive: { type: 'BOOLEAN DEFAULT 1' },
    createdAt: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
  };
}

class StockMovement {
  static fields = {
    id: { type: 'TEXT PRIMARY KEY' },
    materialId: { type: 'TEXT NOT NULL' },
    type: { type: 'ENUM', values: ['in', 'out', 'adjustment', 'damage', 'return'] },
    quantity: { type: 'INTEGER NOT NULL' },
    reason: { type: 'VARCHAR(200)' },
    jobId: { type: 'TEXT' },
    reference: { type: 'VARCHAR(100)' },
    movedBy: { type: 'TEXT' },
    movedAt: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
  };
}

class PurchaseOrder {
  static fields = {
    id: { type: 'TEXT PRIMARY KEY' },
    supplier: { type: 'VARCHAR(200) NOT NULL' },
    orderNumber: { type: 'VARCHAR(100) UNIQUE' },
    items: { type: 'JSON' },
    totalCost: { type: 'DECIMAL(12,2)' },
    status: { type: 'ENUM', values: ['draft', 'sent', 'confirmed', 'received', 'cancelled'] },
    orderDate: { type: 'DATE' },
    expectedDelivery: { type: 'DATE' },
    actualDelivery: { type: 'DATE' },
    createdAt: { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTROLLERS
// ═════════════════════════════════════════════════════════════════════════════

const materialController = {
  async createMaterial(req, res, next) {
    try {
      const { name, category, supplier, sku, unit, costPerUnit, minStockLevel, reorderQuantity } = req.body;
      if (!name || !category || !unit) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const material = { id: require('crypto').randomUUID(), name, category, supplier, sku, unit, costPerUnit, minStockLevel, reorderQuantity, currentStock: 0 };
      logger.info('Material created', { materialId: material.id });
      res.status(201).json(material);
    } catch (err) { next(err); }
  },

  async getMaterials(req, res, next) {
    try {
      const { category, lowStock } = req.query;
      // In production: Query database
      res.json({ materials: [] });
    } catch (err) { next(err); }
  },

  async updateStock(req, res, next) {
    try {
      const { materialId, quantity, type, reason } = req.body;
      if (!materialId || typeof quantity !== 'number') {
        return res.status(400).json({ error: 'Invalid input' });
      }
      const movement = { id: require('crypto').randomUUID(), materialId, quantity, type: type || 'in', reason };
      logger.info('Stock updated', { materialId, quantity });
      res.json(movement);
    } catch (err) { next(err); }
  },

  async checkLowStock(req, res, next) {
    try {
      // Return materials below minimum stock level
      res.json({ lowStockItems: [] });
    } catch (err) { next(err); }
  }
};

const purchaseOrderController = {
  async createOrder(req, res, next) {
    try {
      const { supplier, items, expectedDelivery } = req.body;
      if (!supplier || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Invalid order data' });
      }
      const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
      const order = { id: require('crypto').randomUUID(), supplier, items, totalCost, status: 'draft', expectedDelivery, orderDate: new Date().toISOString().split('T')[0] };
      logger.info('Purchase order created', { orderId: order.id });
      res.status(201).json(order);
    } catch (err) { next(err); }
  },

  async confirmReceipt(req, res, next) {
    try {
      const { orderId, receivedItems } = req.body;
      // Update inventory based on received items
      logger.info('Order receipt confirmed', { orderId });
      res.json({ orderId, status: 'received', actualDelivery: new Date().toISOString().split('T')[0] });
    } catch (err) { next(err); }
  }
};

module.exports = app;
