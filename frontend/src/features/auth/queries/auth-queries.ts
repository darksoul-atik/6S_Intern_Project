import { useQuery } from '@tanstack/react-query';
import { getCurrentUser, checkAdminAccess } from '@/services/api/auth';
import { queryKeys } from '@/lib/tanstack/query-keys';

export function useMeQuery() {
  return useQuery({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: async () => {
      const res = await getCurrentUser();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useAdminCheckQuery() {
  return useQuery({
    queryKey: queryKeys.auth.adminCheck(),
    queryFn: checkAdminAccess,
    retry: false,
  });
}
