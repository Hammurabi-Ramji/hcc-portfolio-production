"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uploadRateLimiter = exports.rateLimiter = exports.authRateLimiter = exports.apiRateLimiter = void 0;
var _expressRateLimit = _interopRequireDefault(require("express-rate-limit"));
var _logger = require("../utils/logger.js");
var _auditMiddleware = require("./auditMiddleware.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// General API rate limiter
const rateLimiter = exports.rateLimiter = (0, _expressRateLimit.default)({
  windowMs: 15 * 60 * 1000,
  // 15 minutes
  max: 100,
  // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    _logger.logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent')
    });
    (0, _auditMiddleware.auditSecurityEvent)('rate_limit_exceeded', {
      url: req.url,
      method: req.method,
      limit: max,
      windowMs
    }, req, req.user);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  },
  skip: req => {
    // Skip rate limiting for health checks
    return req.url === '/health';
  }
});

// Stricter rate limiter for authentication endpoints
const authRateLimiter = exports.authRateLimiter = (0, _expressRateLimit.default)({
  windowMs: 15 * 60 * 1000,
  // 15 minutes
  max: 5,
  // limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    var _req$body, _req$body2;
    _logger.logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      email: (_req$body = req.body) === null || _req$body === void 0 ? void 0 : _req$body.email
    });
    (0, _auditMiddleware.auditSecurityEvent)('rate_limit_exceeded', {
      url: req.url,
      method: req.method,
      limit: max,
      windowMs,
      email: (_req$body2 = req.body) === null || _req$body2 === void 0 ? void 0 : _req$body2.email,
      type: 'auth'
    }, req, req.user);
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Rate limiter for API endpoints
const apiRateLimiter = exports.apiRateLimiter = (0, _expressRateLimit.default)({
  windowMs: 15 * 60 * 1000,
  // 15 minutes
  max: 500,
  // limit each IP to 500 API requests per windowMs
  message: {
    success: false,
    message: 'API rate limit exceeded, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload rate limiter
const uploadRateLimiter = exports.uploadRateLimiter = (0, _expressRateLimit.default)({
  windowMs: 60 * 60 * 1000,
  // 1 hour
  max: 10,
  // limit each IP to 10 uploads per hour
  message: {
    success: false,
    message: 'Upload rate limit exceeded, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});