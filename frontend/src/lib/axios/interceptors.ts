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

async function handleRefreshFailure(): Promise<void> {
  /*
  |--------------------------------------------------------------------------
  | Best-effort logout
  |--------------------------------------------------------------------------
  |
  | The BFF logout route clears both auth cookies even if the backend refresh
  | token is already invalid or expired.
  |
  | Logout failure is intentionally ignored here because the session is already
  | considered invalid.
  |
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
  |
  | Prefer Next.js client-side router navigation via registered handler to
  | avoid full page reloads and state drops.
  |
  | Fall back to window.location.replace() to replace the current history
  | entry without using window.location.assign().
  |
  */

  const redirectPath = "/login?reason=session-expired";

  if (sessionExpiredHandler) {
    sessionExpiredHandler(redirectPath);
    return;
  }

  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace(redirectPath);
  }
}

export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,

    async (error: AxiosError) => {
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
        | Never refresh the refresh request itself
        |--------------------------------------------------------------------------
        */

        if (requestUrl.includes("/auth/refresh")) {
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
          await handleRefreshFailure();

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
        await handleRefreshFailure();
      }

      return Promise.reject(normalizeAxiosError(error));
    },
  );
}
