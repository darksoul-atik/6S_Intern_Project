import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { AuthUser } from './useAuthMutations';

export const CURRENT_USER_QUERY_KEY = ['auth', 'user'] as const;

/**
 * Hydrates and returns current authenticated user from Next.js BFF endpoint /api/auth/me
 * which validates the httpOnly devpulse_token cookie against NestJS backend.
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await apiClient<AuthUser>('/api/auth/me');
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch {
    return null;
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
    retry: false,
    refetchOnWindowFocus: true,
  });
}
