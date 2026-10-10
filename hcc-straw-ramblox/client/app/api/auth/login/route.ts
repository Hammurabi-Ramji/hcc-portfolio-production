import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../server/database';
import { verifyPassword, createSessionToken } from '../../../../../server/auth-utils';
import { createSessionCookieOptions, SESSION_COOKIE_NAME } from '../../../../../server/session';

export const config = {
  runtime: 'nodejs'
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

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
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || typeof user !== 'object' || !('password_hash' in user) || typeof user.password_hash !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials' 
        },
        { status: 401 }
      );
    }

    const authenticatedUser = user as {
      id: string;
      email: string;
      username: string;
      display_name?: string;
      created_at: string;
      password_hash: string;
    };

    // Verify password
    const isValid = await verifyPassword(password, authenticatedUser.password_hash);

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
    const sessionToken = createSessionToken(authenticatedUser.id);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        username: authenticatedUser.username,
        display_name: authenticatedUser.display_name,
        created_at: authenticatedUser.created_at
      },
      token: sessionToken
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, createSessionCookieOptions());

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
