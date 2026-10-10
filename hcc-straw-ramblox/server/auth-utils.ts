/**
 * Password hashing utilities for SQLite authentication
 * Uses bcrypt for secure password storage
 */

import bcrypt from 'bcrypt';

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

/**
 * Create session token (simple JWT-like token)
 * For production, use proper JWT library
 */
export function createSessionToken(userId: string): string {
  const payload = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  userId?: string;
} {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (payload.expiresAt && payload.expiresAt < Date.now()) {
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
