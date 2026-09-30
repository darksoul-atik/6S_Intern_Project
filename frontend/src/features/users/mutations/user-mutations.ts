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

export function useAddSkillMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await addUserSkill(skill, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to add skill');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}

export function useRemoveSkillMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await removeUserSkill(skill, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to remove skill');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}

export function useAddExperienceMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExperiencePayload): Promise<UserProfile> => {
      const res = await addUserExperience(payload, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to add experience');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}

export function useUpdateExperienceMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ExperiencePayload;
    }): Promise<UserProfile> => {
      const res = await updateUserExperience(id, data, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to update experience');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}

export function useDeleteExperienceMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expId: string): Promise<UserProfile> => {
      const res = await deleteUserExperience(expId, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to delete experience');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}

export function useCreatePortfolioProjectMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreatePortfolioProjectPayload,
    ): Promise<UserProfile> => {
      const res = await createPortfolioProject(payload, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to create portfolio project');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}

export function useUpdatePortfolioProjectMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: UpdatePortfolioProjectPayload;
    }): Promise<UserProfile> => {
      const res = await updatePortfolioProject(projectId, data, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to update portfolio project');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}

export function useDeletePortfolioProjectMutation(targetId: string = 'me') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<UserProfile> => {
      const res = await deletePortfolioProject(projectId, targetId);
      if (!res.data) {
        throw new Error(res.message || 'Failed to delete portfolio project');
      }
      return res.data;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(targetId),
      });
      if (targetId === 'me') {
        queryClient.invalidateQueries({
          queryKey: CURRENT_USER_QUERY_KEY,
        });
      }
    },
  });
}
