"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sequelize = exports.disconnectDatabase = exports.default = exports.connectDatabase = exports.checkDatabaseHealth = void 0;
var _sequelize = require("sequelize");
var _dotenv = _interopRequireDefault(require("dotenv"));
var _logger = require("../utils/logger.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Load environment variables - use current .env or migration config
_dotenv.default.config();
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Database configuration - SQLite for local development, can be overridden by DB_DIALECT env var
const dialect = process.env.DB_DIALECT || 'sqlite';
const dbConfig = {
  ...(dialect === 'sqlite' ? {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite'
  } : {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'radix_erp',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    dialect: 'postgres',
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }),
  logging: isProduction ? false : msg => _logger.logger.debug(msg),
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true,
    // Soft deletes
    defaultScope: {
      attributes: {
        exclude: ['created_at', 'updated_at', 'deleted_at']
      }
    }
  }
};

// Create Sequelize instance
const sequelize = exports.sequelize = new _sequelize.Sequelize(dbConfig);

// Test database connection
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    _logger.logger.info('✅ Database connection established successfully');

    // Note: Migrations should be run manually using npm run db:migrate
    // Do not use sync() in production - use migrations instead
    if (!isProduction && !isTest && process.env.DB_FORCE_SYNC === 'true') {
      await sequelize.sync({
        force: false,
        alter: false
      });
      _logger.logger.info('✅ Database synchronized successfully (forced by DB_FORCE_SYNC)');
    }
  } catch (error) {
    _logger.logger.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Close database connection
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
  try {
    await sequelize.close();
    _logger.logger.info('✅ Database connection closed');
  } catch (error) {
    _logger.logger.error('❌ Error closing database connection:', error);
  }
};

// Health check
exports.disconnectDatabase = disconnectDatabase;
const checkDatabaseHealth = async () => {
  try {
    await sequelize.authenticate();
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connection: {
        host: dbConfig.host,
        database: dbConfig.database,
        dialect: dbConfig.dialect
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
var _default = exports.default = sequelize;