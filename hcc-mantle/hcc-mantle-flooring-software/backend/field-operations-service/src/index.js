'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./config/database');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const estimationRoutes = require('./routes/estimationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { initializeMLModels } = require('./services/mlService');

const app = express();
const PORT = process.env.PORT || 8085;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/estimations', estimationRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
const server = app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Initialize ML models
    await initializeMLModels();
    
    logger.info(`Field Operations Service running on port ${PORT}`, {
      environment: process.env.NODE_ENV,
      database: process.env.DB_NAME
    });
  } catch (err) {
    logger.error('Failed to start service', { error: err.message });
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    sequelize.close();
    process.exit(0);
  });
});

module.exports = app;