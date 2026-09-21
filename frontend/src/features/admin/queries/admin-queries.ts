import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { PaginatedResponse, AdminUsersFilterParams } from '../types/admin';
import { getAdminUsers } from '@/services/api/admin';

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const adminKeys = {
  all: ['admin', 'users'] as const,
  list: (params: AdminUsersFilterParams) => ['admin', 'users', params] as const,
};

/*
|--------------------------------------------------------------------------
| Query Functions & Hooks
|--------------------------------------------------------------------------
*/

export async function fetchAdminUsers(
  params: AdminUsersFilterParams,
): Promise<PaginatedResponse> {
  const res = await getAdminUsers(params);
  if (!res.data) {
    throw new Error(res.message || 'Failed to retrieve users list');
  }
  return res.data;
}

export function useAdminUsers(
  params: AdminUsersFilterParams,
  options?: { enabled?: boolean },
) {
  return useQuery<PaginatedResponse>({
    queryKey: adminKeys.list(params),
    queryFn: () => fetchAdminUsers(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
