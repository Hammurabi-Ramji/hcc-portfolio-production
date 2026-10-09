import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../server/database';
import { 
  validatePasswordStrength,
  createSessionToken,
  hashPassword 
} from '../../../../../server/auth-utils';
import { createSessionCookieOptions, SESSION_COOKIE_NAME } from '../../../../../server/session';

export const config = {
  runtime: 'nodejs'
};

export async function POST(request: NextRequest) {
  try {
    const { email, password, username, display_name } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: email, password, username' 
        },
        { status: 400 }
      );
    }

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
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email already registered' 
        },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
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
    const userId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, email, username, passwordHash, display_name || username, now, now);

    // Generate session token
    const sessionToken = createSessionToken(userId);

    const response = NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        username,
        display_name: display_name || username,
        created_at: now
      },
      token: sessionToken
    }, { status: 201 });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, createSessionCookieOptions());

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
