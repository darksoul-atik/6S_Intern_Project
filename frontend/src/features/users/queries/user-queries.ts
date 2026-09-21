import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/types/api';
import type { AuthUser } from '@/features/auth/types/auth';
import type { UserProfile } from '../types/user';
import { getUserProfile } from '@/services/api/users';
import { getCurrentUser } from '@/services/api/auth';

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const profileKeys = {
  all: ['users'] as const,
  detail: (idOrMe: string = 'me') => ['users', idOrMe] as const,
};

export const CURRENT_USER_QUERY_KEY = ['auth', 'user'] as const;

/*
|--------------------------------------------------------------------------
| Query Functions & Hooks
|--------------------------------------------------------------------------
*/

export async function fetchUserProfile(
  idOrMe: string = 'me',
): Promise<UserProfile> {
  const res = await getUserProfile(idOrMe);
  if (!res.data) {
    throw new Error(res.message || 'Profile data not found');
  }
  return res.data;
}

export function useUserProfile(
  idOrMe: string = 'me',
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery<UserProfile>({
    queryKey: profileKeys.detail(idOrMe),
    queryFn: () => fetchUserProfile(idOrMe),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? Boolean(idOrMe),
  });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await getCurrentUser();
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      return null;
    }
    // Check for axios error status code 401
    if (typeof err === 'object' && err !== null && 'statusCode' in err) {
      const apiErr = err as { statusCode?: number };
      if (apiErr.statusCode === 401) {
        return null;
      }
    }
    throw err;
  }
}

export function useCurrentUser() {
  return useQuery<AuthUser | null>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (
        (error instanceof ApiError && error.statusCode === 401) ||
        (typeof error === 'object' &&
          error !== null &&
          'statusCode' in error &&
          (error as { statusCode?: number }).statusCode === 401)
      ) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true,
  });
}
