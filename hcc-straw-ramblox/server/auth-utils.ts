/**
 * Password hashing utilities for SQLite authentication
 * Uses bcrypt for secure password storage
 */

import bcrypt from 'bcrypt';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const SALT_ROUNDS = 12; // Security level: higher = more secure but slower

/**
 * Hash a password
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns true if password meets minimum requirements
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_SECRET_LENGTH = 32;

/**
 * HMAC key for session tokens. Required: without it anyone could mint a
 * session, so there is no fallback. Placeholder values are refused in production.
 */
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be set to a random value of at least ${MIN_SECRET_LENGTH} characters`);
  }
  if (process.env.NODE_ENV === 'production' && /change|your-|example|dev-secret/i.test(secret)) {
    throw new Error('SESSION_SECRET is a placeholder value; generate a random secret for production');
  }
  return secret;
}

function signature(body: string): Buffer {
  return createHmac('sha256', sessionSecret()).update(body).digest();
}

/**
 * Create a signed session token: base64url(payload).base64url(HMAC-SHA256).
 */
export function createSessionToken(userId: string): string {
  const payload = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
    nonce: randomBytes(16).toString('base64url')
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${signature(body).toString('base64url')}`;
}

/**
 * Verify a session token's signature and expiry. Unsigned or tampered tokens,
 * including the old unsigned base64 format, are rejected.
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  userId?: string;
} {
  try {
    const [body, mac, extra] = String(token).split('.');
    if (!body || !mac || extra !== undefined) {
      return { valid: false };
    }
    const expected = signature(body);
    const provided = Buffer.from(mac, 'base64url');
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (typeof payload.userId !== 'string' || !payload.userId) {
      return { valid: false };
    }
    if (typeof payload.expiresAt !== 'number' || payload.expiresAt < Date.now()) {
      return { valid: false };
    }

    return { valid: true, userId: payload.userId };
  } catch {
    return { valid: false };
  }
}

/**
 * Get session token expiry date
 */
export function getSessionExpiryDate(): Date {
  const now = new Date();
  now.setDate(now.getDate() + 7); // 7 days from now
  return now;
}
