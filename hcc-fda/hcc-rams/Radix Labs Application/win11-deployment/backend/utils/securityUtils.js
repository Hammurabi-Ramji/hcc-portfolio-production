"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.verifyPassword = exports.validateSecurityHeaders = exports.validatePassword = exports.validateFileUpload = exports.validateEmail = exports.validateApiKey = exports.sanitizeInput = exports.isTrustedSource = exports.hashPassword = exports.getClientIdentifier = exports.generateSecureToken = void 0;
var _bcryptjs = _interopRequireDefault(require("bcryptjs"));
var _security = require("../config/security.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * Security validation utilities
 */

/**
 * Validate password strength
 */
const validatePassword = password => {
  const errors = [];
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return {
      isValid: false,
      errors
    };
  }
  if (password.length < _security.securityConfig.password.minLength) {
    errors.push(`Password must be at least ${_security.securityConfig.password.minLength} characters long`);
  }
  if (password.length > _security.securityConfig.password.maxLength) {
    errors.push(`Password must not exceed ${_security.securityConfig.password.maxLength} characters`);
  }
  if (_security.securityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (_security.securityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (_security.securityConfig.password.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (_security.securityConfig.password.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  if (_security.securityConfig.password.preventCommonPasswords && _security.securityConfig.password.commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common, please choose a stronger password');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Hash password using bcrypt
 */
exports.validatePassword = validatePassword;
const hashPassword = async password => {
  return await _bcryptjs.default.hash(password, _security.securityConfig.encryption.saltRounds);
};

/**
 * Verify password against hash
 */
exports.hashPassword = hashPassword;
const verifyPassword = async (password, hash) => {
  return await _bcryptjs.default.compare(password, hash);
};

/**
 * Sanitize input to prevent XSS and injection attacks
 */
exports.verifyPassword = verifyPassword;
const sanitizeInput = input => {
  if (typeof input !== 'string') return input;
  return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
};

/**
 * Validate email format and security
 */
exports.sanitizeInput = sanitizeInput;
const validateEmail = email => {
  const errors = [];
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return {
      isValid: false,
      errors
    };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Check for suspicious patterns
  if (email.includes('<') || email.includes('>') || email.includes('script')) {
    errors.push('Invalid email format');
  }

  // Check length
  if (email.length > 254) {
    errors.push('Email is too long');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate file upload security
 */
exports.validateEmail = validateEmail;
const validateFileUpload = file => {
  const errors = [];
  if (!file) {
    errors.push('File is required');
    return {
      isValid: false,
      errors
    };
  }

  // Check file type
  if (!_security.securityConfig.validation.allowedFileTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }

  // Check file size
  if (file.size > _security.securityConfig.validation.maxFileSize) {
    errors.push(`File size exceeds maximum allowed size of ${_security.securityConfig.validation.maxFileSize / (1024 * 1024)}MB`);
  }

  // Check filename for suspicious patterns
  const filename = file.originalname;
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Invalid filename');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate secure random token
 */
exports.validateFileUpload = validateFileUpload;
const generateSecureToken = (length = 32) => {
  return require('crypto').randomBytes(length).toString('hex');
};

/**
 * Validate API key format (if used)
 */
exports.generateSecureToken = generateSecureToken;
const validateApiKey = apiKey => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // API key should be alphanumeric with specific length
  const apiKeyRegex = /^[a-zA-Z0-9]{32,64}$/;
  return apiKeyRegex.test(apiKey);
};

/**
 * Check if request is from a trusted source
 */
exports.validateApiKey = validateApiKey;
const isTrustedSource = req => {
  const trustedOrigins = [_security.securityConfig.cors.origin, 'http://localhost:3000',
  // development
  'http://127.0.0.1:3000' // development
  ];
  const origin = req.get('Origin') || req.get('Referer');
  return trustedOrigins.some(trusted => origin && origin.startsWith(trusted));
};

/**
 * Rate limiting helper functions
 */
exports.isTrustedSource = isTrustedSource;
const getClientIdentifier = req => {
  var _req$get, _req$get$split$;
  // Use X-Forwarded-For if behind proxy, otherwise req.ip
  return ((_req$get = req.get('X-Forwarded-For')) === null || _req$get === void 0 ? void 0 : (_req$get$split$ = _req$get.split(',')[0]) === null || _req$get$split$ === void 0 ? void 0 : _req$get$split$.trim()) || req.get('X-Real-IP') || req.ip || req.connection.remoteAddress;
};

/**
 * Security headers validation
 */
exports.getClientIdentifier = getClientIdentifier;
const validateSecurityHeaders = req => {
  const warnings = [];

  // Check for HTTPS in production
  if (_security.securityConfig.api.requireHttps && process.env.NODE_ENV === 'production') {
    var _req$get2;
    if (req.protocol !== 'https' && !((_req$get2 = req.get('X-Forwarded-Proto')) !== null && _req$get2 !== void 0 && _req$get2.includes('https'))) {
      warnings.push('Request not using HTTPS');
    }
  }

  // Check Content-Type for POST/PUT/PATCH
  const contentTypeMethods = ['POST', 'PUT', 'PATCH'];
  if (contentTypeMethods.includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      warnings.push('Missing or invalid Content-Type header');
    }
  }
  return {
    hasWarnings: warnings.length > 0,
    warnings
  };
};
exports.validateSecurityHeaders = validateSecurityHeaders;