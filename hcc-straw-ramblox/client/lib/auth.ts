import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

import { verifySessionToken } from '../../server/auth-utils';
import { getDb } from '../../server/database';
import { SESSION_COOKIE_NAME } from '../../server/session';

export interface RambloxSession {
  token: string;
  userId: string;
}

/**
 * The signed-in user, or null. The cookie's HMAC signature and expiry must
 * verify and the user must still exist; the cookie alone is never trusted.
 */
export async function getSession(): Promise<RambloxSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);
  if (!session.valid || !session.userId) {
    return null;
  }

  const user = getDb()
    .prepare<[string], { id: string }>('SELECT id FROM users WHERE id = ?')
    .get(session.userId);
  if (!user) {
    return null;
  }

  return {
    token,
    userId: user.id
  };
}

export async function requireSession(redirectPath: string): Promise<RambloxSession> {
  const session = await getSession();

  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return session;
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
}

export interface GameAccess {
  id: string;
  creator_id: string;
  status: string;
}

/** Load a game's ownership fields, or null if it does not exist. */
export function findGame(gameId: unknown): GameAccess | null {
  if (typeof gameId !== 'string' || !gameId.trim()) {
    return null;
  }
  return (
    getDb()
      .prepare<[string], GameAccess>('SELECT id, creator_id, status FROM games WHERE id = ?')
      .get(gameId.trim()) ?? null
  );
}
