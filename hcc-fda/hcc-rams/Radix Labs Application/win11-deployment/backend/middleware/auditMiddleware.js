"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.auditSecurityEvent = exports.auditMiddleware = exports.auditBusinessEvent = exports.auditAuthEvent = void 0;
var _logger = require("../utils/logger.js");
/**
 * Comprehensive audit logging middleware
 * Logs security events, authentication attempts, and sensitive operations
 */
const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  let responseBody = null;

  // Capture response body for audit logging
  res.send = function (body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Log the request after response is sent
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const user = req.user || null;

    // Determine if this is a security-sensitive operation
    const isSecurityEvent = isSecuritySensitiveRequest(req);

    // Determine audit level based on operation type and response
    const auditLevel = determineAuditLevel(req, res, isSecurityEvent);
    if (auditLevel !== 'none') {
      const auditData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: (user === null || user === void 0 ? void 0 : user.id) || null,
        userEmail: (user === null || user === void 0 ? void 0 : user.email) || null,
        userRole: (user === null || user === void 0 ? void 0 : user.role) || null,
        userDepartment: (user === null || user === void 0 ? void 0 : user.department) || null,
        requestSize: req.get('Content-Length') || 0,
        responseSize: res.get('Content-Length') || 0,
        referer: req.get('Referer') || null,
        securityEvent: isSecurityEvent,
        auditLevel,
        // Don't log sensitive data in request/response bodies for security
        hasRequestBody: !!req.body && Object.keys(req.body).length > 0,
        hasResponseBody: !!responseBody
      };

      // Log based on audit level
      switch (auditLevel) {
        case 'critical':
          _logger.logger.error('SECURITY AUDIT - CRITICAL', auditData);
          break;
        case 'warning':
          _logger.logger.warn('SECURITY AUDIT - WARNING', auditData);
          break;
        case 'info':
          _logger.logger.info('AUDIT LOG', auditData);
          break;
      }
    }
  });
  next();
};

/**
 * Determine if a request is security-sensitive
 */
exports.auditMiddleware = auditMiddleware;
function isSecuritySensitiveRequest(req) {
  const securityPaths = ['/api/v1/auth/login', '/api/v1/auth/logout', '/api/v1/auth/refresh', '/api/v1/auth/forgot-password', '/api/v1/auth/reset-password', '/api/v1/users',
  // User management
  '/api/v1/regulatory',
  // Compliance data
  '/api/v1/quality' // Quality control data
  ];
  const isSecurityPath = securityPaths.some(path => req.originalUrl.includes(path));

  // Also check for sensitive HTTP methods on any endpoint
  const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  const isSensitiveMethod = sensitiveMethods.includes(req.method);

  // Check for admin/management roles in URL
  const adminPaths = ['/admin', '/management', '/config', '/settings'];
  const isAdminPath = adminPaths.some(path => req.originalUrl.includes(path));
  return isSecurityPath || isSensitiveMethod && isAdminPath;
}

/**
 * Determine audit logging level based on request/response characteristics
 */
function determineAuditLevel(req, res, isSecurityEvent) {
  // Critical security events
  if (res.statusCode >= 400 && res.statusCode < 500) {
    // Authentication failures
    if (req.originalUrl.includes('/auth/login') && res.statusCode === 401) {
      return 'critical';
    }
    // Authorization failures
    if (res.statusCode === 403) {
      return 'warning';
    }
    // Bad requests that might indicate attacks
    if (res.statusCode === 400 && isSecurityEvent) {
      return 'warning';
    }
  }

  // Server errors
  if (res.statusCode >= 500) {
    return 'critical';
  }

  // Security-sensitive operations
  if (isSecurityEvent) {
    return 'info';
  }

  // Successful operations on sensitive endpoints
  if (res.statusCode >= 200 && res.statusCode < 300 && isSecurityEvent) {
    return 'info';
  }

  // Default: no audit logging for routine operations
  return 'none';
}

/**
 * Specific audit logging functions for different types of events
 */
const auditAuthEvent = (eventType, details, req, user = null) => {
  const auditData = {
    eventType,
    // 'login_success', 'login_failure', 'logout', 'password_change', etc.
    details,
    ip: req === null || req === void 0 ? void 0 : req.ip,
    userAgent: req === null || req === void 0 ? void 0 : req.get('User-Agent'),
    userId: (user === null || user === void 0 ? void 0 : user.id) || null,
    userEmail: (user === null || user === void 0 ? void 0 : user.email) || null,
    userRole: (user === null || user === void 0 ? void 0 : user.role) || null,
    timestamp: new Date().toISOString()
  };
  switch (eventType) {
    case 'login_failure':
    case 'auth_failure':
      _logger.logger.warn('AUTH AUDIT - FAILURE', auditData);
      break;
    case 'login_success':
    case 'logout':
    case 'password_change':
    case 'password_reset':
      _logger.logger.info('AUTH AUDIT - SUCCESS', auditData);
      break;
    default:
      _logger.logger.info('AUTH AUDIT', auditData);
  }
};
exports.auditAuthEvent = auditAuthEvent;
const auditSecurityEvent = (eventType, details, req, user = null) => {
  const auditData = {
    eventType,
    // 'rate_limit_exceeded', 'suspicious_activity', 'data_access', etc.
    details,
    ip: req === null || req === void 0 ? void 0 : req.ip,
    userAgent: req === null || req === void 0 ? void 0 : req.get('User-Agent'),
    userId: (user === null || user === void 0 ? void 0 : user.id) || null,
    userEmail: (user === null || user === void 0 ? void 0 : user.email) || null,
    userRole: (user === null || user === void 0 ? void 0 : user.role) || null,
    timestamp: new Date().toISOString()
  };
  switch (eventType) {
    case 'rate_limit_exceeded':
    case 'suspicious_activity':
    case 'security_violation':
      _logger.logger.warn('SECURITY AUDIT - VIOLATION', auditData);
      break;
    case 'data_access':
    case 'config_change':
      _logger.logger.info('SECURITY AUDIT - ACCESS', auditData);
      break;
    default:
      _logger.logger.info('SECURITY AUDIT', auditData);
  }
};
exports.auditSecurityEvent = auditSecurityEvent;
const auditBusinessEvent = (eventType, details, req, user = null) => {
  const auditData = {
    eventType,
    // 'record_created', 'record_updated', 'record_deleted', etc.
    details,
    ip: req === null || req === void 0 ? void 0 : req.ip,
    userAgent: req === null || req === void 0 ? void 0 : req.get('User-Agent'),
    userId: (user === null || user === void 0 ? void 0 : user.id) || null,
    userEmail: (user === null || user === void 0 ? void 0 : user.email) || null,
    userRole: (user === null || user === void 0 ? void 0 : user.role) || null,
    timestamp: new Date().toISOString()
  };
  _logger.logger.info('BUSINESS AUDIT', auditData);
};
exports.auditBusinessEvent = auditBusinessEvent;