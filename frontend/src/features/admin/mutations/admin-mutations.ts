import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminUser, UpdateAdminUserPayload } from '../types/admin';
import {
  updateAdminUser,
  softDeleteUser,
  restoreUser,
} from '@/services/api/admin';
import { adminKeys } from '../queries/admin-queries';
import { profileKeys } from '@/features/users/queries/user-queries';

/*
|--------------------------------------------------------------------------
| Admin Mutations
|--------------------------------------------------------------------------
*/

export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAdminUserPayload;
    }): Promise<AdminUser> => {
      const res = await updateAdminUser(id, data);
      if (!res.data) {
        throw new Error(res.message || 'Failed to update user');
      }
      return res.data;
    },
    onSuccess: (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.id),
      });
    },
  });
}

export function useSoftDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const res = await softDeleteUser(id);
      if (!res.data) {
        throw new Error(res.message || 'Failed to delete user');
      }
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
    },
  });
}

export function useRestoreUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<{ message: string }> => {
      const res = await restoreUser(id);
      if (!res.data) {
        throw new Error(res.message || 'Failed to restore user');
      }
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(id) });
    },
  });
}
