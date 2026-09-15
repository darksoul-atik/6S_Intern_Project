import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { profileKeys } from './useProfileQueries';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  title?: string;
  avatarUrl?: string | null;
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  skills?: string[];
}

export interface PaginatedResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUsersFilterParams {
  page: number;
  limit: number;
  search?: string;
  includeDeleted?: boolean;
}

/**
 * Centralized query keys for admin users.
 */
export const adminKeys = {
  all: ['admin', 'users'] as const,
  list: (params: AdminUsersFilterParams) => ['admin', 'users', params] as const,
};

/**
 * Fetches paginated user list for admin management with filters and search.
 */
export async function fetchAdminUsers(params: AdminUsersFilterParams): Promise<PaginatedResponse> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    includeDeleted: (params.includeDeleted ?? true).toString(),
  });

  if (params.search && params.search.trim()) {
    queryParams.set('search', params.search.trim());
  }

  const res = await apiClient<PaginatedResponse>(`/api/users?${queryParams.toString()}`);
  if (!res.data) {
    throw new Error(res.message || 'Failed to retrieve users list');
  }
  return res.data;
}

/**
 * Hook to retrieve paginated admin users using keepPreviousData for smooth pagination.
 */
export function useAdminUsers(params: AdminUsersFilterParams, options?: { enabled?: boolean }) {
  return useQuery<PaginatedResponse>({
    queryKey: adminKeys.list(params),
    queryFn: () => fetchAdminUsers(params),
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000, // 30 seconds fresh cache
    gcTime: 5 * 60 * 1000, // 5 minutes cache retention
    enabled: options?.enabled ?? true,
  });
}

export interface UpdateAdminUserPayload {
  name: string;
  email: string;
  role: 'admin' | 'user';
  title?: string;
}

/**
 * Mutation hook to update any user's profile and role as an admin.
 */
export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAdminUserPayload }): Promise<AdminUser> => {
      const res = await apiClient<AdminUser>(`/api/users/${id}/admin`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.data) throw new Error(res.message || 'Failed to update user');
      return res.data;
    },
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.id) });
    },
  });
}

/**
 * Mutation hook to soft-delete a user account.
 */
export function useSoftDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const res = await apiClient<{ message: string }>(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.data) throw new Error(res.message || 'Failed to delete user');
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
    },
  });
}

/**
 * Mutation hook to restore a soft-deleted user account.
 */
export function useRestoreUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const res = await apiClient<{ message: string }>(`/api/users/${id}/restore`, {
        method: 'POST',
      });
      if (!res.data) throw new Error(res.message || 'Failed to restore user');
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
    },
  });
}
