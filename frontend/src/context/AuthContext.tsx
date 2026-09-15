'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from '@/features/users/useCurrentUser';
import { useLogoutMutation, type AuthUser } from '@/features/auth/auth.api';

export type UserSession = AuthUser;

interface AuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserSession) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading, refetch } = useCurrentUser();
  const logoutMutation = useLogoutMutation();

  const login = useCallback(
    (userData: UserSession) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, userData);
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error('Logout error:', err);
      // Guarantee query cache purge even on network disconnect
      queryClient.removeQueries({ queryKey: ['auth'] });
      queryClient.clear();
    } finally {
      router.replace('/');
    }
  }, [logoutMutation, queryClient, router]);

  const checkAuth = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
