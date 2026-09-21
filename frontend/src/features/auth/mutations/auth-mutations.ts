import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/types/api';
import type {
  LoginResponseData,
  SignupResponseData,
} from '../types/auth';
import type { LoginInput, SignupInput } from '../schemas/auth-schema';
import {
  loginUser,
  signupUser,
  logoutUser,
  getCurrentUser,
  checkAdminAccess,
} from '@/services/api/auth';
import { queryKeys } from '@/lib/tanstack/query-keys';

export function useSignupMutation() {
  return useMutation<ApiResponse<SignupResponseData>, Error, SignupInput>({
    mutationFn: signupUser,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LoginResponseData>, Error, LoginInput>({
    mutationFn: loginUser,
    onSuccess: (response) => {
      if (response.data?.user) {
        queryClient.setQueryData(queryKeys.auth.currentUser(), response.data.user);
        // Also seed legacy query key for backward compatibility
        queryClient.setQueryData(['currentUser'], response.data.user);
      }
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.clear();
    },
  });
}

export function useVerifyMeMutation() {
  return useMutation({
    mutationFn: getCurrentUser,
  });
}

export function useVerifyAdminMutation() {
  return useMutation({
    mutationFn: checkAdminAccess,
  });
}
