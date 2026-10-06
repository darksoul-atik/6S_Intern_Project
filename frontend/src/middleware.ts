import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Validates JWT structure and checks whether exp has expired.
 *
 * This is only used for frontend route/session handling.
 * The NestJS backend remains responsible for real JWT
 * authentication and authorization.
 */
function isTokenValid(token?: string): boolean {
  if (!token) return false;

  const parts = token.split(".");

  if (parts.length !== 3) {
    return false;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");

    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);

    if (!payload || typeof payload !== "object") {
      return false;
    }

    /*
     * JWT exp is stored in seconds.
     */
    if (typeof payload.exp === "number") {
      const currentTimeInSeconds = Math.floor(Date.now() / 1000);

      if (payload.exp <= currentTimeInSeconds) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Checks whether the current Posts route
 * requires authentication.
 *
 * Public:
 *
 * /posts
 * /posts/:id
 *
 * Protected:
 *
 * /posts/new
 * /posts/:id/edit
 */
function isProtectedPostPath(pathname: string): boolean {
  /*
   * Create Post
   */
  if (pathname === "/posts/new") {
    return true;
  }

  /*
   * Edit Post
   *
   * Examples:
   *
   * /posts/123/edit
   * /posts/68d123abc/edit
   */
  return /^\/posts\/[^/]+\/edit\/?$/.test(pathname);
}

function isProtectedDeveloperPath(pathname: string): boolean {
  return /^\/developers\/[^/]+\/edit\/?$/.test(pathname);
}

/**
 * DevPulse Protected Route & Auth Middleware
 *
 * Protected:
 *
 * /dashboard
 * /profile
 * /admin
 * /posts/new
 * /posts/:id/edit
 * /developers/:id/edit
 *
 * Public:
 *
 * /posts
 * /posts/:id
 * /developers/:id
 *
 * Authenticated users visiting /login or /signup
 * are redirected to /dashboard.
 */
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("devpulse_token")?.value;
  const refreshToken = request.cookies.get("devpulse_refresh_token")?.value;

  const { pathname, search } = request.nextUrl;

  /*
  |--------------------------------------------------------------------------
  | Protected routes
  |--------------------------------------------------------------------------
  */

  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin") ||
    isProtectedPostPath(pathname) ||
    isProtectedDeveloperPath(pathname);

  /*
  |--------------------------------------------------------------------------
  | Authentication routes
  |--------------------------------------------------------------------------
  */

  const isAuthPath = pathname === "/login" || pathname === "/signup";

  const hasValidAccessToken = isTokenValid(accessToken);
  const hasValidRefreshToken = isTokenValid(refreshToken);

  /*
  |--------------------------------------------------------------------------
  | Active session verification
  |--------------------------------------------------------------------------
  |
  | A session is active if the short-lived access token is valid OR if the
  | long-lived refresh token is valid (which the client-side Axios interceptor
  | will exchange for a fresh access token on its first API request).
  |
  */

  const hasActiveSession = hasValidAccessToken || hasValidRefreshToken;

  /*
  |--------------------------------------------------------------------------
  | Protected route without an active session
  |--------------------------------------------------------------------------
  */

  if (isProtectedPath && !hasActiveSession) {
    const loginUrl = new URL("/login", request.url);

    const targetPath = search ? `${pathname}${search}` : pathname;

    // Prevent recursive redirect loops
    if (targetPath !== "/login" && targetPath !== "/signup") {
      loginUrl.searchParams.set("redirect", targetPath);
    }

    const response = NextResponse.redirect(loginUrl);

    // Clean up dead cookies
    if (accessToken) {
      response.cookies.delete("devpulse_token");
    }
    if (refreshToken) {
      response.cookies.delete("devpulse_refresh_token");
    }

    return response;
  }

  /*
  |--------------------------------------------------------------------------
  | Already logged in + navigating to login or signup
  |--------------------------------------------------------------------------
  */

  if (isAuthPath && hasActiveSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /*
  |--------------------------------------------------------------------------
  | Visiting login/signup with expired cookies
  |--------------------------------------------------------------------------
  |
  | Clear stale cookies to ensure clean form submission without residual state.
  |
  */

  if (isAuthPath && (accessToken || refreshToken) && !hasActiveSession) {
    const response = NextResponse.next();

    if (accessToken) {
      response.cookies.delete("devpulse_token");
    }
    if (refreshToken) {
      response.cookies.delete("devpulse_refresh_token");
    }

    return response;
  }

  /*
  |--------------------------------------------------------------------------
  | Pass-through for public routes
  |--------------------------------------------------------------------------
  */

  return NextResponse.next();
}

/*
|--------------------------------------------------------------------------
| Middleware matcher
|--------------------------------------------------------------------------
*/

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/posts/:path*",
    "/developers/:path*",
    "/login",
    "/signup",
  ],
};
