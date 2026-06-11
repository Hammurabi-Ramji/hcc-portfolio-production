/**
 * Authentication API Routes
 * 
 * Real implementation with SQLite and bcrypt
 */

import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { getDb } from './database';
import { 
  getUserByEmail, 
  getUserByUsername, 
  createUser as createUserStmt 
} from './database-types';
import { 
  hashPassword, 
  verifyPassword, 
  validatePasswordStrength,
  createSessionToken 
} from './auth-utils';

// Configure for Node.js runtime (not Edge)
export const config = {
  runtime: 'nodejs'
};

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, username, display_name } = await request.json();

    // Validate required fields
    if (!email || !password || !username) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: email, password, username' 
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password validation failed',
          details: passwordValidation.errors
        },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if email already exists
    const existingEmail = getUserByEmail(db).get(email);
    if (existingEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already registered' 
        },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = getUserByUsername(db).get(username);
    if (existingUsername) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Username already taken' 
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const insertResult = createUserStmt.run(
      Date.now().toString(36) + Math.random().toString(36).substr(2),
      email,
      username,
      passwordHash,
      display_name || username,
      new Date().toISOString(),
      new Date().toISOString()
    );

    if (insertResult.changes === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate session token
    const sessionToken = createSessionToken(insertResult.lastInsertRowid as string);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: insertResult.lastInsertRowid as string,
        email,
        username,
        display_name: display_name || username,
        created_at: new Date().toISOString()
      },
      token: sessionToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function login(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing email or password' 
        },
        { status: 400 }
      );
    }

    const db = getDb();

    // Find user by email
    const user = getUserByEmail(db).get(email);

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }

    // Generate session token
    const sessionToken = createSessionToken(user.id as string);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        created_at: user.created_at
      },
      token: sessionToken
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/logout
 * Invalidate session
 */
export async function logout() {
  // For stateless tokens, client just removes token
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully'
  });
}

// Default handler (redirects to login/register)
export async function GET() {
  return NextResponse.json({
    message: 'Authentication endpoints available',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout'
    }
  });
}
