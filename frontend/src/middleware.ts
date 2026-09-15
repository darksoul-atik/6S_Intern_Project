import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * DevPulse Protected Route & Auth Middleware
 * Intercepts incoming requests at the Edge:
 * - Redirects unauthenticated requests accessing protected routes (/dashboard, /profile, /admin)
 *   to /login?redirect=<target_route>
 * - Redirects authenticated users accessing auth routes (/login, /signup) to /dashboard
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('devpulse_token')?.value;
  const { pathname, search } = request.nextUrl;

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin');

  const isAuthPath = pathname === '/login' || pathname === '/signup';

  // If visiting a protected route without a valid token, redirect to /login with redirect param
  if (isProtectedPath && !token) {
    const loginUrl = new URL('/login', request.url);
    const targetPath = search ? `${pathname}${search}` : pathname;
    loginUrl.searchParams.set('redirect', targetPath);
    return NextResponse.redirect(loginUrl);
  }

  // If visiting login/signup while already authenticated, redirect to /dashboard
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
  ],
};
