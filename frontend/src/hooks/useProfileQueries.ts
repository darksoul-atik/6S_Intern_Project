import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { UserProfile, Experience } from '@/types/profile';
import { CURRENT_USER_QUERY_KEY } from '@/hooks/useCurrentUser';

/**
 * Centralized query key factory for user profiles.
 */
export const profileKeys = {
  all: ['users'] as const,
  detail: (idOrMe: string) => ['users', idOrMe] as const,
};

/**
 * Fetches a user profile by ID or 'me' for the authenticated user.
 */
export async function fetchUserProfile(idOrMe: string = 'me'): Promise<UserProfile> {
  const endpoint = idOrMe === 'me' ? '/api/users/me' : `/api/users/${idOrMe}`;
  const res = await apiClient<UserProfile>(endpoint);
  if (!res.data) {
    throw new Error(res.message || 'Profile data not found');
  }
  return res.data;
}

/**
 * Hook to retrieve a user profile with TanStack Query caching and stale time.
 */
export function useUserProfile(idOrMe: string = 'me', options?: { enabled?: boolean }) {
  return useQuery<UserProfile>({
    queryKey: profileKeys.detail(idOrMe),
    queryFn: () => fetchUserProfile(idOrMe),
    staleTime: 60 * 1000, // 1 minute fresh cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    enabled: options?.enabled ?? Boolean(idOrMe),
  });
}

/**
 * Payload for updating basic profile info.
 */
export interface UpdateProfilePayload {
  name?: string;
  title?: string;
  avatarUrl?: string;
}

/**
 * Mutation hook to update profile details (name, title, avatarUrl).
 */
export function useUpdateProfileMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();
  const endpoint = targetId === 'me' ? '/api/users/me' : `/api/users/${targetId}`;

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (!res.data) throw new Error(res.message || 'Failed to update profile');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(targetId) });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

/**
 * Mutation hook to update avatar image.
 */
export function useUpdateAvatarMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();
  const endpoint = targetId === 'me' ? '/api/users/me' : `/api/users/${targetId}`;

  return useMutation({
    mutationFn: async (avatarUrl: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl }),
      });
      if (!res.data) throw new Error(res.message || 'Failed to update avatar');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(targetId) });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

/**
 * Mutation hook to remove avatar image (restoring initials fallback).
 */
export function useDeleteAvatarMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();
  const endpoint = targetId === 'me' ? '/api/users/me' : `/api/users/${targetId}`;

  return useMutation({
    mutationFn: async (): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: '' }),
      });
      if (!res.data) throw new Error(res.message || 'Failed to remove avatar');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(targetId) });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

/**
 * Mutation hook to add a skill to current user profile.
 */
export function useAddSkillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>('/api/users/me/skills', {
        method: 'POST',
        body: JSON.stringify({ skill }),
      });
      if (!res.data) throw new Error(res.message || 'Failed to add skill');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
    },
  });
}

/**
 * Mutation hook to remove a skill from current user profile.
 */
export function useRemoveSkillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(
        `/api/users/me/skills/${encodeURIComponent(skill)}`,
        {
          method: 'DELETE',
        },
      );
      if (!res.data) throw new Error(res.message || 'Failed to remove skill');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
    },
  });
}

/**
 * Payload for adding/updating experience.
 */
export interface ExperiencePayload {
  title: string;
  company: string;
  from: string;
  to?: string;
  description?: string;
}

/**
 * Mutation hook to add a work experience entry.
 */
export function useAddExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExperiencePayload): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>('/api/users/me/experiences', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.data) throw new Error(res.message || 'Failed to add experience');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
    },
  });
}

/**
 * Mutation hook to update a work experience entry.
 */
export function useUpdateExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ExperiencePayload }): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(`/api/users/me/experiences/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.data) throw new Error(res.message || 'Failed to update experience');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
    },
  });
}

/**
 * Mutation hook to delete a work experience entry.
 */
export function useDeleteExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expId: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(`/api/users/me/experiences/${expId}`, {
        method: 'DELETE',
      });
      if (!res.data) throw new Error(res.message || 'Failed to delete experience');
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.detail('me') });
    },
  });
}
