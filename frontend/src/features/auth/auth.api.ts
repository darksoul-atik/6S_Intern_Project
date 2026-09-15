import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError, ApiResponse } from '@/lib/api';
import type { SignupInput, LoginInput } from './auth.schemas';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface SignupResponseData {
  id?: string;
  user?: AuthUser;
}

export interface LoginResponseData {
  accessToken?: string;
  user: AuthUser;
}

/**
 * Extracts a safe, human-readable error message and field-specific error list
 * from an unknown caught error, specifically handling NestJS and Next.js BFF ApiErrors.
 */
export function extractAuthErrorMessage(err: unknown): {
  message: string;
  errors: string[];
} {
  if (err instanceof ApiError) {
    if (err.statusCode === 409) {
      return {
        message: 'This email address is already registered. Please sign in or use another email.',
        errors: err.errors || [],
      };
    }
    if (err.statusCode === 401) {
      return {
        message: err.message || 'Invalid email or password. Please verify your credentials.',
        errors: err.errors || [],
      };
    }
    if (err.statusCode === 400 && err.errors && err.errors.length > 0) {
      return {
        message: 'Please correct the highlighted errors before continuing.',
        errors: err.errors,
      };
    }
    return {
      message: err.message || 'An error occurred during authentication.',
      errors: err.errors || [],
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message,
      errors: [],
    };
  }

  return {
    message: 'An unexpected network or server error occurred.',
    errors: [],
  };
}

/**
 * TanStack Query mutation hook for user registration.
 */
export function useSignupMutation() {
  return useMutation<ApiResponse<SignupResponseData>, Error, SignupInput>({
    mutationFn: async (data: SignupInput) => {
      return apiClient<SignupResponseData>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });
    },
  });
}

/**
 * TanStack Query mutation hook for user authentication.
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<LoginResponseData>, Error, LoginInput>({
    mutationFn: async (data: LoginInput) => {
      return apiClient<LoginResponseData>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        }),
      });
    },
    onSuccess: (response) => {
      if (response.data?.user) {
        // Optimistically seed current user query in TanStack Query cache
        queryClient.setQueryData(['auth', 'user'], response.data.user);
      }
    },
  });
}

/**
 * TanStack Query mutation hook for user logout.
 * Clears the session cookie via /api/auth/logout and purges all TanStack Query caches.
 */
export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, void>({
    mutationFn: async () => {
      return apiClient<null>('/api/auth/logout', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
    },
  });
}
