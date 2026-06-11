import 'server-only';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { verifySessionToken } from '../../server/auth-utils';
import { SESSION_COOKIE_NAME } from '../../server/session';

export interface RambloxSession {
  token: string;
  userId: string;
}

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

  return {
    token,
    userId: session.userId
  };
}

export async function requireSession(redirectPath: string): Promise<RambloxSession> {
  const session = await getSession();

  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return session;
}
