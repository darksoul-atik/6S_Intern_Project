import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UserProfile,
  UpdateProfilePayload,
  ExperiencePayload,
  CreatePortfolioProjectPayload,
  UpdatePortfolioProjectPayload,
} from '../types/user';
import {
  updateUserProfile,
  updateUserAvatar,
  deleteUserAvatar,
  addUserSkill,
  removeUserSkill,
  addUserExperience,
  updateUserExperience,
  deleteUserExperience,
  createPortfolioProject,
  updatePortfolioProject,
  deletePortfolioProject,
} from '@/services/api/users';
import { profileKeys, CURRENT_USER_QUERY_KEY } from '../queries/user-queries';

/*
|--------------------------------------------------------------------------
| User Profile Mutations
|--------------------------------------------------------------------------
*/

export function useUpdateProfileMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
      const res = await updateUserProfile(targetId, payload);
      if (!res.data) {
        throw new Error(res.message || 'Failed to update profile');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: CURRENT_USER_QUERY_KEY,
      });
    },
  });
}

export function useUpdateAvatarMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avatarUrl: string): Promise<UserProfile> => {
      const res = await updateUserAvatar(targetId, avatarUrl);
      if (!res.data) {
        throw new Error(res.message || 'Failed to update avatar');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: CURRENT_USER_QUERY_KEY,
      });
    },
  });
}

export function useDeleteAvatarMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<UserProfile> => {
      const res = await deleteUserAvatar(targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to remove avatar');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: CURRENT_USER_QUERY_KEY,
      });
    },
  });
}

export function useAddSkillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await addUserSkill(skill);
      if (!res.data) {
        throw new Error(res.message || 'Failed to add skill');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail('me'),
      });
    },
  });
}

export function useRemoveSkillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await removeUserSkill(skill);
      if (!res.data) {
        throw new Error(res.message || 'Failed to remove skill');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail('me'),
      });
    },
  });
}

export function useAddExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExperiencePayload): Promise<UserProfile> => {
      const res = await addUserExperience(payload);
      if (!res.data) {
        throw new Error(res.message || 'Failed to add experience');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail('me'),
      });
    },
  });
}

export function useUpdateExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ExperiencePayload;
    }): Promise<UserProfile> => {
      const res = await updateUserExperience(id, data);
      if (!res.data) {
        throw new Error(res.message || 'Failed to update experience');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail('me'),
      });
    },
  });
}

export function useDeleteExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expId: string): Promise<UserProfile> => {
      const res = await deleteUserExperience(expId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to delete experience');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail('me'),
      });
    },
  });
}

export function useCreatePortfolioProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreatePortfolioProjectPayload,
    ): Promise<UserProfile> => {
      const res = await createPortfolioProject(payload);
      if (!res.data) {
        throw new Error(res.message || 'Failed to create portfolio project');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
    },
  });
}

export function useUpdatePortfolioProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: UpdatePortfolioProjectPayload;
    }): Promise<UserProfile> => {
      const res = await updatePortfolioProject(projectId, data);
      if (!res.data) {
        throw new Error(res.message || 'Failed to update portfolio project');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
    },
  });
}

export function useDeletePortfolioProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<UserProfile> => {
      const res = await deletePortfolioProject(projectId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to delete portfolio project');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail('me'), updatedProfile);
    },
  });
}
