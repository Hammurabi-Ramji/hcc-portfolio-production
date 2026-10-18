"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _dotenv = _interopRequireDefault(require("dotenv"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Load environment variables
_dotenv.default.config();
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Database configuration for migrations
const config = {
  development: {
    username: null,
    password: null,
    database: null,
    host: null,
    port: null,
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: !isProduction,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    }
  },
  test: {
    username: null,
    password: null,
    database: null,
    host: null,
    port: null,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    }
  }
};
var _default = exports.default = config;