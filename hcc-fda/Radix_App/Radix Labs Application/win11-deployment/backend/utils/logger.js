"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requestLogger = exports.logger = exports.default = exports.auditLogger = void 0;
var _winston = _interopRequireDefault(require("winston"));
var _path = _interopRequireDefault(require("path"));
var _fs = _interopRequireDefault(require("fs"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Create logs directory path relative to the current working directory
const logsDir = _path.default.join(process.cwd(), 'logs');

// Create logs directory if it doesn't exist

if (!_fs.default.existsSync(logsDir)) {
  _fs.default.mkdirSync(logsDir, {
    recursive: true
  });
}
const logFormat = _winston.default.format.combine(_winston.default.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
}), _winston.default.format.errors({
  stack: true
}), _winston.default.format.json());
const consoleFormat = _winston.default.format.combine(_winston.default.format.colorize(), _winston.default.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
}), _winston.default.format.printf(({
  timestamp,
  level,
  message,
  ...meta
}) => {
  let metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level}]: ${message}${metaStr}`;
}));

// Create logs directory if it doesn't exist
if (!_fs.default.existsSync(logsDir)) {
  _fs.default.mkdirSync(logsDir, {
    recursive: true
  });
}
const logger = exports.logger = _winston.default.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
  // Error log file
  new _winston.default.transports.File({
    filename: _path.default.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5242880,
    // 5MB
    maxFiles: 5
  }),
  // Combined log file
  new _winston.default.transports.File({
    filename: _path.default.join(logsDir, 'combined.log'),
    maxsize: 5242880,
    // 5MB
    maxFiles: 5
  }),
  // Console output for development
  new _winston.default.transports.Console({
    format: consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
  })],
  exceptionHandlers: [new _winston.default.transports.File({
    filename: _path.default.join(logsDir, 'exceptions.log')
  })],
  rejectionHandlers: [new _winston.default.transports.File({
    filename: _path.default.join(logsDir, 'rejections.log')
  })]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user ? req.user.email : 'anonymous'
    });
  });
  next();
};

// Audit logging function
exports.requestLogger = requestLogger;
const auditLogger = (action, details, user = null) => {
  logger.info('AUDIT', {
    action,
    details,
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role
    } : null,
    timestamp: new Date().toISOString(),
    ip: global.currentRequestIP || 'unknown'
  });
};
exports.auditLogger = auditLogger;
var _default = exports.default = logger;