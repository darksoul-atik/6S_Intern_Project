import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Validates JWT structure and verifies that exp has not expired at the Edge
 * without requiring heavy external crypto dependencies.
 */
function isTokenValid(token?: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload || typeof payload !== 'object') return false;

    // Check expiration claim if present (exp is in seconds)
    if (typeof payload.exp === 'number') {
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp <= currentTimeInSeconds) {
        return false; // Token expired
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * DevPulse Protected Route & Auth Middleware
 * Intercepts incoming requests at the Edge:
 * - Redirects unauthenticated or expired-session visitors accessing protected routes (/dashboard, /profile, /admin)
 *   to /login?redirect=<target_route> and clears stale cookies.
 * - Redirects authenticated users accessing auth routes (/login, /signup) to /dashboard.
 * - Automatically evicts invalid or expired cookies on auth pages so users can sign in fresh.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('devpulse_token')?.value;
  const { pathname, search } = request.nextUrl;

  const isProtectedPath =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/admin');

  const isAuthPath = pathname === '/login' || pathname === '/signup';
  const hasValidToken = isTokenValid(token);

  // If user has a token but it is invalid or expired
  if (token && !hasValidToken) {
    // If attempting to visit a protected route with an expired token
    if (isProtectedPath) {
      const loginUrl = new URL('/login', request.url);
      const targetPath = search ? `${pathname}${search}` : pathname;
      loginUrl.searchParams.set('redirect', targetPath);

      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('devpulse_token');
      return response;
    }

    // If attempting to visit login or signup with a stale token, clear it and allow page view
    if (isAuthPath) {
      const response = NextResponse.next();
      response.cookies.delete('devpulse_token');
      return response;
    }
  }

  // If visiting a protected route without any token
  if (isProtectedPath && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    const targetPath = search ? `${pathname}${search}` : pathname;
    loginUrl.searchParams.set('redirect', targetPath);
    return NextResponse.redirect(loginUrl);
  }

  // If visiting login/signup while already having an active, valid session
  if (isAuthPath && hasValidToken) {
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
