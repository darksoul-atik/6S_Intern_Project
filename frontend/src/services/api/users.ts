import { apiClient } from '@/lib/axios/client';
import type { ApiResponse } from '@/types/api';
import type {
  UserProfile,
  UpdateProfilePayload,
  ExperiencePayload,
  CreatePortfolioProjectPayload,
  UpdatePortfolioProjectPayload,
} from '@/features/users/types/user';

/*
|--------------------------------------------------------------------------
| User Profile API Service
|--------------------------------------------------------------------------
*/

export async function getUserProfile(
  idOrMe: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint = idOrMe === 'me' ? '/profile/me' : `/users/${idOrMe}`;
  const res = await apiClient.get<ApiResponse<UserProfile>>(endpoint);
  return res.data;
}

export async function updateUserProfile(
  targetId: string = 'me',
  payload: UpdateProfilePayload,
): Promise<ApiResponse<UserProfile>> {
  const endpoint = targetId === 'me' ? '/profile/me' : `/users/${targetId}`;

  // Temporary bridge for legacy title -> headline mapping
  const { title, ...profilePayload } = payload;
  const normalizedPayload = {
    ...profilePayload,
    ...(profilePayload.headline === undefined && title !== undefined
      ? {
          headline: title.trim() === '' ? null : title,
        }
      : {}),
  };

  const res = await apiClient.patch<ApiResponse<UserProfile>>(
    endpoint,
    normalizedPayload,
  );
  return res.data;
}

export async function updateUserAvatar(
  targetId: string = 'me',
  avatarUrl: string,
): Promise<ApiResponse<UserProfile>> {
  const endpoint = targetId === 'me' ? '/profile/me' : `/users/${targetId}`;
  const res = await apiClient.patch<ApiResponse<UserProfile>>(endpoint, {
    avatarUrl,
  });
  return res.data;
}

export async function deleteUserAvatar(
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint = targetId === 'me' ? '/profile/me' : `/users/${targetId}`;
  const res = await apiClient.patch<ApiResponse<UserProfile>>(endpoint, {
    avatarUrl: null,
  });
  return res.data;
}

export async function addUserSkill(
  skill: string,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint = targetId === 'me' ? '/users/me/skills' : `/users/${targetId}/skills`;
  const res = await apiClient.post<ApiResponse<UserProfile>>(endpoint, {
    skill,
  });
  return res.data;
}

export async function removeUserSkill(
  skill: string,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint =
    targetId === 'me'
      ? `/users/me/skills/${encodeURIComponent(skill)}`
      : `/users/${targetId}/skills/${encodeURIComponent(skill)}`;
  const res = await apiClient.delete<ApiResponse<UserProfile>>(endpoint);
  return res.data;
}

export async function addUserExperience(
  payload: ExperiencePayload,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint =
    targetId === 'me' ? '/users/me/experiences' : `/users/${targetId}/experiences`;
  const res = await apiClient.post<ApiResponse<UserProfile>>(endpoint, payload);
  return res.data;
}

export async function updateUserExperience(
  id: string,
  payload: ExperiencePayload,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint =
    targetId === 'me'
      ? `/users/me/experiences/${id}`
      : `/users/${targetId}/experiences/${id}`;
  const res = await apiClient.patch<ApiResponse<UserProfile>>(endpoint, payload);
  return res.data;
}

export async function deleteUserExperience(
  id: string,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint =
    targetId === 'me'
      ? `/users/me/experiences/${id}`
      : `/users/${targetId}/experiences/${id}`;
  const res = await apiClient.delete<ApiResponse<UserProfile>>(endpoint);
  return res.data;
}

export async function createPortfolioProject(
  payload: CreatePortfolioProjectPayload,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint =
    targetId === 'me' ? '/profile/me/projects' : `/users/${targetId}/projects`;
  const res = await apiClient.post<ApiResponse<UserProfile>>(endpoint, payload);
  return res.data;
}

export async function updatePortfolioProject(
  projectId: string,
  payload: UpdatePortfolioProjectPayload,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint =
    targetId === 'me'
      ? `/profile/me/projects/${projectId}`
      : `/users/${targetId}/projects/${projectId}`;
  const res = await apiClient.patch<ApiResponse<UserProfile>>(endpoint, payload);
  return res.data;
}

export async function deletePortfolioProject(
  projectId: string,
  targetId: string = 'me',
): Promise<ApiResponse<UserProfile>> {
  const endpoint =
    targetId === 'me'
      ? `/profile/me/projects/${projectId}`
      : `/users/${targetId}/projects/${projectId}`;
  const res = await apiClient.delete<ApiResponse<UserProfile>>(endpoint);
  return res.data;
}
