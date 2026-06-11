import { getSessionExpiryDate } from './auth-utils';

export const SESSION_COOKIE_NAME = 'ramblox_session';

export function createSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: getSessionExpiryDate()
  };
}
