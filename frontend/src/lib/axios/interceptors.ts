import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import { ApiError } from "@/types/api";
import { requestSessionLogout } from "@/lib/auth/session";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<void> | null = null;

function normalizeAxiosError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const errorData = error.response?.data;

    const statusCode = errorData?.statusCode || error.response?.status || 500;

    const message =
      errorData?.message || error.message || `HTTP Error ${statusCode}`;

    const errors = Array.isArray(errorData?.errors) ? errorData.errors : [];

    const data = errorData?.data;

    return new ApiError(message, statusCode, errors, data);
  }

  return new ApiError(
    error instanceof Error ? error.message : "Unknown network error",
    500,
    [],
  );
}

async function refreshSession(): Promise<void> {
  await axios.post("/api/auth/refresh", undefined, {
    withCredentials: true,
  });
}

export type SessionExpiredHandler = (url: string) => void;

let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(
  handler: SessionExpiredHandler | null,
): void {
  sessionExpiredHandler = handler;
}

function isPublicPath(pathname: string): boolean {
  if (
    pathname === "/" ||
    pathname === "/status" ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return true;
  }

  // Public /posts and /posts/:id (excluding /posts/new and /posts/:id/edit)
  if (
    pathname === "/posts" ||
    (/^\/posts\/[^/]+$/.test(pathname) && pathname !== "/posts/new")
  ) {
    return true;
  }

  // Public /developers/:id (excluding /developers/:id/edit)
  if (/^\/developers\/[^/]+$/.test(pathname)) {
    return true;
  }

  return false;
}

let failurePromise: Promise<void> | null = null;

async function handleRefreshFailure(originalRequestUrl?: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = window.location.pathname;

  if (currentPath === "/login" || currentPath === "/signup") {
    return;
  }

  if (originalRequestUrl?.includes("/auth/me") && isPublicPath(currentPath)) {
    return;
  }

  if (!failurePromise) {
    failurePromise = (async () => {
      /*
      |--------------------------------------------------------------------------
      | Best-effort logout
      |--------------------------------------------------------------------------
      */
      try {
        await requestSessionLogout();
      } catch {
        // Ignore logout network failure.
      }

      /*
      |--------------------------------------------------------------------------
      | Session-expired redirect
      |--------------------------------------------------------------------------
      */
      const redirectPath = "/login?reason=session-expired";

      if (sessionExpiredHandler) {
        sessionExpiredHandler(redirectPath);
      } else {
        window.location.replace(redirectPath);
      }
    })().finally(() => {
      failurePromise = null;
    });
  }

  await failurePromise;
}

export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
      if (typeof window === "undefined") {
        return Promise.reject(normalizeAxiosError(error));
      }

      const originalRequest = error.config as
        | RetryableRequestConfig
        | undefined;

      const statusCode = error.response?.status;

      /*
      |--------------------------------------------------------------------------
      | Attempt refresh only for an initial 401
      |--------------------------------------------------------------------------
      */

      if (statusCode === 401 && originalRequest && !originalRequest._retry) {
        const requestUrl = originalRequest.url ?? "";

        /*
        |--------------------------------------------------------------------------
        | Never intercept auth lifecycle endpoints
        |--------------------------------------------------------------------------
        |
        | /auth/login: Credential rejections (401) are user input errors, not expired sessions.
        | /auth/signup: Registration rejections should bubble to the form.
        | /auth/refresh: Never refresh the refresh endpoint itself to avoid infinite loops.
        | /auth/logout: Logout rejections should complete cleanly.
        */

        if (
          requestUrl.includes("/auth/login") ||
          requestUrl.includes("/auth/signup") ||
          requestUrl.includes("/auth/refresh") ||
          requestUrl.includes("/auth/logout")
        ) {
          return Promise.reject(normalizeAxiosError(error));
        }

        originalRequest._retry = true;

        try {
          /*
          |--------------------------------------------------------------------------
          | Coalesce simultaneous 401 failures
          |--------------------------------------------------------------------------
          */

          if (!refreshPromise) {
            refreshPromise = refreshSession().finally(() => {
              refreshPromise = null;
            });
          }

          await refreshPromise;

          /*
          |--------------------------------------------------------------------------
          | Retry the original request exactly once
          |--------------------------------------------------------------------------
          */

          return instance(originalRequest);
        } catch (refreshError) {
          await handleRefreshFailure(requestUrl);

          return Promise.reject(normalizeAxiosError(refreshError));
        }
      }

      /*
      |--------------------------------------------------------------------------
      | A retried request also returned 401
      |--------------------------------------------------------------------------
      |
      | Do not refresh again.
      | Treat the session as invalid and log out safely.
      |
      */

      if (statusCode === 401 && originalRequest?._retry) {
        await handleRefreshFailure(originalRequest.url);
      }

      return Promise.reject(normalizeAxiosError(error));
    },
  );
}
