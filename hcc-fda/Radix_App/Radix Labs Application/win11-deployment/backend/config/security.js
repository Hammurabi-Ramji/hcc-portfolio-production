"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateSecurityConfig = exports.securityConfig = exports.getSecurityHeaders = void 0;
/**
 * Security configuration for Radix ERP Backend
 * Centralizes security settings and hardening measures
 */

const securityConfig = exports.securityConfig = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'radix-erp-backend',
    audience: 'radix-erp-client'
  },
  // Password Policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    maxLength: 128,
    preventCommonPasswords: true,
    commonPasswords: ['password', '123456', '123456789', 'qwerty', 'abc123', 'password123', 'admin', 'letmein', 'welcome', 'monkey']
  },
  // Rate Limiting
  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000,
      // 15 minutes
      max: 100 // requests per window
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      // 15 minutes
      max: 5 // login attempts per window
    },
    api: {
      windowMs: 15 * 60 * 1000,
      // 15 minutes
      max: 500 // API requests per window
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      // 1 hour
      max: 10 // uploads per hour
    }
  },
  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'Accept', 'Origin'],
    maxAge: 86400 // 24 hours
  },
  // Helmet Security Headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.stripe.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000,
      // 1 year
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  },
  // Session Security
  session: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  // Input Validation
  validation: {
    sanitizeInput: true,
    maxRequestSize: '50mb',
    maxUrlLength: 2048,
    maxQueryParams: 50,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    maxFileSize: 10 * 1024 * 1024 // 10MB
  },
  // Audit Logging
  audit: {
    enabled: true,
    logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
    sensitiveFields: ['password', 'token', 'secret', 'key', 'ssn', 'credit_card'],
    retentionDays: 90,
    maxLogSize: '10m',
    compressLogs: true
  },
  // Security Monitoring
  monitoring: {
    enabled: true,
    suspiciousActivityThreshold: 5,
    blockDuration: 24 * 60 * 60 * 1000,
    // 24 hours
    alertThresholds: {
      failedLogins: 5,
      suspiciousRequests: 10,
      rateLimitHits: 20
    }
  },
  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltRounds: 12 // for bcrypt
  },
  // API Security
  api: {
    requireHttps: process.env.NODE_ENV === 'production',
    apiKeyRequired: false,
    // Set to true if using API keys
    apiKeyHeader: 'X-API-Key',
    versionRequired: true,
    deprecationPeriod: 30 // days
  }
};

/**
 * Validate security configuration
 */
const validateSecurityConfig = () => {
  const errors = [];

  // Check JWT secret
  if (securityConfig.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
    errors.push('JWT_SECRET must be changed from default value in production');
  }

  // Check password policy
  if (securityConfig.password.minLength < 8) {
    errors.push('Password minimum length should be at least 8 characters');
  }

  // Check CORS origin
  if (securityConfig.cors.origin.includes('localhost') && process.env.NODE_ENV === 'production') {
    errors.push('CORS origin should not allow localhost in production');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get security headers for responses
 */
exports.validateSecurityConfig = validateSecurityConfig;
const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
};
exports.getSecurityHeaders = getSecurityHeaders;