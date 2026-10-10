import { NextRequest, NextResponse } from 'next/server';

/** Navigation hint only. The Rust API rejects missing, expired, and forged cookies. */
const SESSION_COOKIE = 'straw_session';

export function middleware(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const protectedRoutes = ['/dashboard', '/settings', '/profile', '/projects'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Login, register, logout, and resource APIs authorize themselves.
     * A cookie that is present but expired or forged must still reach /login.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
