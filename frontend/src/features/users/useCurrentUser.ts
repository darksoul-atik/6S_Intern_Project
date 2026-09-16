import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api';
import type { AuthUser } from '@/features/auth/auth.api';

export const CURRENT_USER_QUERY_KEY = ['auth', 'user'] as const;

/**
 * Hydrates and returns current authenticated user from Next.js BFF endpoint /api/auth/me
 * which validates the httpOnly devpulse_token cookie against NestJS backend.
 *
 * Explicitly distinguishes between unauthenticated status (401 -> null) and infrastructure/server
 * failures (5xx, network offline -> throws so TanStack Query enters isError state).
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await apiClient<AuthUser>('/api/auth/me');
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    // 401 specifically denotes unauthenticated / no session (valid null state)
    if (err instanceof ApiError && err.statusCode === 401) {
      return null;
    }
    // Any other error (500, 503, network offline) is re-thrown so UI/TanStack Query
    // accurately knows the infrastructure failed, rather than falsely treating the user as logged out!
    throw err;
  }
}

/**
 * Centralized TanStack Query hook managing the current logged-in user and role.
 * Prevents redundant fetches and automatically caches the session across components.
 */
export function useCurrentUser() {
  return useQuery<AuthUser | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes cache lifetime
    gcTime: 10 * 60 * 1000, // 10 minutes cache persistence
    retry: (failureCount, error) => {
      // Never retry on 401 unauthenticated
      if (error instanceof ApiError && error.statusCode === 401) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
  });
}
