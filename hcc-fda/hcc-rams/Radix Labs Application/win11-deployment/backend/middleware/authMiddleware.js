"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _User = require("../models/User.js");
var _logger = require("../utils/logger.js");
var _auditMiddleware = require("./auditMiddleware.js");
var _security = require("../config/security.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const JWT_SECRET = _security.securityConfig.jwt.secret;

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
        reason: 'no_token'
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify the token
    const decoded = _jsonwebtoken.default.verify(token, JWT_SECRET, {
      issuer: _security.securityConfig.jwt.issuer,
      audience: _security.securityConfig.jwt.audience
    });

    // Get user from database
    const user = await _User.User.findByPk(decoded.id);
    if (!user) {
      (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
        reason: 'user_not_found',
        tokenUserId: decoded.id
      }, req);
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
        reason: 'user_inactive',
        userId: user.id,
        userStatus: user.status
      }, req, user);
      return res.status(401).json({
        success: false,
        message: 'Account is not active'
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      department: user.department,
      firstName: user.first_name,
      lastName: user.last_name
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
        reason: 'invalid_token',
        error: error.message
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
        reason: 'token_expired',
        error: error.message
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    _logger.logger.error('Authentication error:', error);
    (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
      reason: 'server_error',
      error: error.message
    }, req);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
exports.authenticateToken = authenticateToken;
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
        reason: 'no_authentication'
      }, req);
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      (0, _auditMiddleware.auditAuthEvent)('auth_failure', {
        reason: 'insufficient_permissions',
        userRole: req.user.role,
        requiredRoles: allowedRoles
      }, req, req.user);
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
exports.requireRole = requireRole;
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const decoded = _jsonwebtoken.default.verify(token, JWT_SECRET, {
        issuer: _security.securityConfig.jwt.issuer,
        audience: _security.securityConfig.jwt.audience
      });
      const user = await _User.User.findByPk(decoded.id);
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          department: user.department,
          firstName: user.first_name,
          lastName: user.last_name
        };
      }
    }
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};
exports.optionalAuth = optionalAuth;