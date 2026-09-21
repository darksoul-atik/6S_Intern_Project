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
 *
 * Public:
 *
 * /posts
 * /posts/:id
 *
 * Authenticated users visiting /login or /signup
 * are redirected to /dashboard.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get("devpulse_token")?.value;

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
    isProtectedPostPath(pathname);

  /*
  |--------------------------------------------------------------------------
  | Authentication routes
  |--------------------------------------------------------------------------
  */

  const isAuthPath = pathname === "/login" || pathname === "/signup";

  const hasValidToken = isTokenValid(token);

  /*
  |--------------------------------------------------------------------------
  | Invalid / expired token
  |--------------------------------------------------------------------------
  */

  if (token && !hasValidToken) {
    /*
     * Expired token while trying to access
     * a protected page.
     */
    if (isProtectedPath) {
      const loginUrl = new URL("/login", request.url);

      const targetPath = search ? `${pathname}${search}` : pathname;

      loginUrl.searchParams.set("redirect", targetPath);

      const response = NextResponse.redirect(loginUrl);

      /*
       * Remove the stale cookie.
       */
      response.cookies.delete("devpulse_token");

      return response;
    }

    /*
     * User visits login/signup with an
     * expired cookie.
     *
     * Clear the cookie and allow them
     * to sign in again.
     */
    if (isAuthPath) {
      const response = NextResponse.next();

      response.cookies.delete("devpulse_token");

      return response;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | No valid session + protected route
  |--------------------------------------------------------------------------
  */

  if (isProtectedPath && !hasValidToken) {
    const loginUrl = new URL("/login", request.url);

    /*
     * Preserve where the user was trying
     * to go.
     *
     * Example:
     *
     * /posts/new
     *
     * becomes:
     *
     * /login?redirect=/posts/new
     */
    const targetPath = search ? `${pathname}${search}` : pathname;

    loginUrl.searchParams.set("redirect", targetPath);

    return NextResponse.redirect(loginUrl);
  }

  /*
  |--------------------------------------------------------------------------
  | Already logged in + login/signup
  |--------------------------------------------------------------------------
  */

  if (isAuthPath && hasValidToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /*
   * Everything else continues normally.
   */
  return NextResponse.next();
}

/*
|--------------------------------------------------------------------------
| Middleware matcher
|--------------------------------------------------------------------------
|
| Public post pages are included so the middleware can distinguish
| public routes from protected create/edit routes.
|
| It immediately allows public /posts and /posts/:id through.
|--------------------------------------------------------------------------
*/

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",

    "/posts/:path*",

    "/login",
    "/signup",
  ],
};
