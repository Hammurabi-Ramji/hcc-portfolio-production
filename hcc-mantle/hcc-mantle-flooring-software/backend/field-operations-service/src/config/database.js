'use strict';

const { Sequelize } = require('sequelize');
const { logger } = require('../utils/logger');

const isTest = process.env.NODE_ENV === 'test';

const sequelize = new Sequelize({
  dialect: isTest ? 'sqlite' : 'postgres',
  storage: isTest ? ':memory:' : undefined,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'field_operations',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true,
    freezeTableName: true
  }
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection test successful');
    return true;
  } catch (err) {
    logger.error('Database connection test failed', { error: err.message });
    return false;
  }
};

module.exports = { sequelize, testConnection };