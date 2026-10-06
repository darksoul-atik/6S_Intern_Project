import { ROUTES } from "@/constants/routes";

/**
 * Validates and sanitizes a redirect URL to prevent:
 * 1. Open redirect / phishing attacks (e.g. `//evil.com`, `https://attacker.com`, `/\evil.com`)
 * 2. Infinite redirect loops (e.g. `/login`, `/login?reason=...`, `/signup`)
 *
 * Returns a guaranteed-safe application-relative path, defaulting to `/dashboard`.
 */
export function getSafeRedirectUrl(target: string | null | undefined): string {
  if (!target) {
    return ROUTES.DASHBOARD;
  }

  const trimmed = target.trim();

  // Must begin with a single slash and not protocol-relative (//) or backslash (/\)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return ROUTES.DASHBOARD;
  }

  // Prevent recursive redirect loops back to auth pages
  const pathnameOnly = trimmed.split("?")[0].toLowerCase();
  if (
    pathnameOnly === "/login" ||
    pathnameOnly === "/signup" ||
    pathnameOnly === "/auth/login" ||
    pathnameOnly === "/auth/signup"
  ) {
    return ROUTES.DASHBOARD;
  }

  return trimmed;
}
