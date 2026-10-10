// backend/estimation-service/src/index.js
'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const { logger } = require('./utils/logger');
const { sequelize } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');
const Estimation = require('./models/Estimation');
const EstimationLineItem = require('./models/EstimationLineItem');

const app = express();
const PORT = process.env.PORT || 8086;

// ─── Security Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000', credentials: true }));

// ─── Body Parsing ───────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Estimation service request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

// ─── Health Checks ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'estimation-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: sequelize.authenticate ? 'connected' : 'pending'
  });
});

// ─── Protected Routes ───────────────────────────────────────
app.use('/api', authenticateToken);
app.use('/api/estimations', require('./routes/estimationRoutes'));

// ─── Error Handler ──────────────────────────────────────────
app.use(errorHandler);

// ─── Server Startup ─────────────────────────────────────────
const startServer = async () => {
  try {
    // Authenticate with SQLite3
    await sequelize.authenticate();
    logger.info('✓ Database connection established');

    // Sync models (create tables if they don't exist)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      logger.info('✓ Database tables synchronized');
    }

    // Initialize estimation service
    logger.info('✓ Estimation Service initialized');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Estimation Service listening on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down...');
      server.close(async () => {
        await sequelize.close();
        logger.info('Estimation Service shut down');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down...');
      server.close(async () => {
        await sequelize.close();
        logger.info('Estimation Service shut down');
        process.exit(0);
      });
    });
  } catch (err) {
    logger.error('Failed to start Estimation Service', { error: err.message, stack: err.stack });
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
