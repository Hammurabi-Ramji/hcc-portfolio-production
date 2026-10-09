// Security Configuration Module for Radix Labs ERP
// ================================================
// Production-grade security settings, JWT, session management, encryption

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import logger from "../src/utils/logger.js";

// ========================================================================
// HELMET SECURITY HEADERS
// ========================================================================
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imageSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests:
        process.env.NODE_ENV === "production" ? [] : undefined,
    },
  },
  frameguard: { action: "deny" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  noSniff: true,
  xssFilter: true,
});

// ========================================================================
// RATE LIMITING
// ========================================================================

// General rate limiter - all endpoints
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || 900000), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || 100), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/health";
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many requests",
      message: "Please try again after some time.",
      retryAfter: req.get("Retry-After") || 60,
    });
  },
});

// Strict rate limiter - authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later.",
  handler: (req, res) => {
    logger.warn(
      `Auth rate limit exceeded for IP: ${req.ip}, email: ${req.body.email}`
    );
    res.status(429).json({
      error: "Too many login attempts",
      message: "Please try again after 15 minutes.",
    });
  },
});

// Very strict rate limiter - password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: "Too many password reset requests, please try again later.",
  handler: (req, res) => {
    logger.warn(
      `Password reset rate limit exceeded for email: ${req.body.email}`
    );
    res.status(429).json({
      error: "Too many requests",
      message: "Please try again after 1 hour.",
    });
  },
});

// ========================================================================
// CORS CONFIGURATION
// ========================================================================

export const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = (
      process.env.CORS_ORIGIN || "http://localhost:5173"
    ).split(",");

    // Allow requests with no origin (e.g., mobile apps, curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS request rejected from origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === "true",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["X-Total-Count", "X-Page-Number"],
  maxAge: 86400, // 24 hours
};

// ========================================================================
// SESSION CONFIGURATION
// ========================================================================

export const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  name: "radix_session",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: parseInt(process.env.SESSION_TIMEOUT || 3600000), // 1 hour
  },
  store: undefined, // Will be set to Redis store in production
};

// ========================================================================
// JWT CONFIGURATION
// ========================================================================

export const jwtConfig = {
  secret: process.env.JWT_SECRET || "your-jwt-secret-key",
  expiresIn: process.env.JWT_EXPIRATION || "24h",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d",
  algorithm: "HS256",
  issuer: "Radix Labs ERP",
  audience: "radix-erp-users",
};

// ========================================================================
// BCRYPT CONFIGURATION
// ========================================================================

export const bcryptConfig = {
  rounds: parseInt(process.env.BCRYPT_ROUNDS || 10),
  saltSize: 16,
};

// ========================================================================
// TWO-FACTOR AUTHENTICATION
// ========================================================================

export const mfaConfig = {
  enabled: process.env.MFA_ENABLED === "true",
  appName: "Radix Labs ERP",
  window: parseInt(process.env.TOTP_WINDOW || 1), // Allow 1 time window drift
  period: 30, // TOTP period in seconds
};

// ========================================================================
// INPUT VALIDATION & SANITIZATION
// ========================================================================

export const sanitizationConfig = {
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    logger.warn(`Data sanitized in request: ${key}`);
  },
};

// ========================================================================
// SECURITY MIDDLEWARE FACTORY
// ========================================================================

export function createSecurityMiddleware() {
  return {
    helmet: helmetConfig,
    cors: corsConfig,
    generalLimiter,
    authLimiter,
    passwordResetLimiter,
    sanitization: mongoSanitize(sanitizationConfig),
  };
}

// ========================================================================
// PASSWORD POLICY
// ========================================================================

export const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  expiryDays: 90,
  historyCount: 5, // Remember last 5 passwords
};

export function validatePassword(password) {
  const errors = [];

  if (password.length < passwordPolicy.minLength) {
    errors.push(
      `Password must be at least ${passwordPolicy.minLength} characters long`
    );
  }
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (
    passwordPolicy.requireSpecialChars &&
    new RegExp(`[${passwordPolicy.specialChars}]`).test(password) === false
  ) {
    errors.push(
      `Password must contain at least one special character: ${passwordPolicy.specialChars}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ========================================================================
// ENCRYPTION UTILITIES
// ========================================================================

import crypto from "crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.JWT_SECRET || "default-secret",
  "salt",
  32
);

export function encryptSensitiveData(data) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHM,
      ENCRYPTION_KEY,
      iv
    );

    let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      encryptedData: encrypted,
      authTag: authTag.toString("hex"),
    };
  } catch (error) {
    logger.error("Encryption error:", error);
    throw error;
  }
}

export function decryptSensitiveData(encryptedPayload) {
  try {
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(encryptedPayload.iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(encryptedPayload.authTag, "hex"));

    let decrypted = decipher.update(
      encryptedPayload.encryptedData,
      "hex",
      "utf8"
    );
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  } catch (error) {
    logger.error("Decryption error:", error);
    throw error;
  }
}

export default {
  helmetConfig,
  corsConfig,
  sessionConfig,
  jwtConfig,
  bcryptConfig,
  mfaConfig,
  passwordPolicy,
  createSecurityMiddleware,
  validatePassword,
  encryptSensitiveData,
  decryptSensitiveData,
};
