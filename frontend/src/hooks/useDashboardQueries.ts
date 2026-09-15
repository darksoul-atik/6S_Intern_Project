import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api';

/**
 * Mutation hook to verify authenticated user identity via GET /api/auth/me
 */
export function useVerifyMeMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<Record<string, unknown>>('/api/auth/me');
      return res;
    },
  });
}

/**
 * Mutation hook to test admin access via GET /api/auth/admin-check
 */
export function useVerifyAdminMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient<Record<string, unknown>>('/api/auth/admin-check');
      return res;
    },
  });
}
