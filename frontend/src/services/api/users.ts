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
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.post<ApiResponse<UserProfile>>('/users/me/skills', {
    skill,
  });
  return res.data;
}

export async function removeUserSkill(
  skill: string,
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.delete<ApiResponse<UserProfile>>(
    `/users/me/skills/${encodeURIComponent(skill)}`,
  );
  return res.data;
}

export async function addUserExperience(
  payload: ExperiencePayload,
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.post<ApiResponse<UserProfile>>(
    '/users/me/experiences',
    payload,
  );
  return res.data;
}

export async function updateUserExperience(
  id: string,
  payload: ExperiencePayload,
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.patch<ApiResponse<UserProfile>>(
    `/users/me/experiences/${id}`,
    payload,
  );
  return res.data;
}

export async function deleteUserExperience(
  id: string,
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.delete<ApiResponse<UserProfile>>(
    `/users/me/experiences/${id}`,
  );
  return res.data;
}

export async function createPortfolioProject(
  payload: CreatePortfolioProjectPayload,
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.post<ApiResponse<UserProfile>>(
    '/profile/me/projects',
    payload,
  );
  return res.data;
}

export async function updatePortfolioProject(
  projectId: string,
  payload: UpdatePortfolioProjectPayload,
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.patch<ApiResponse<UserProfile>>(
    `/profile/me/projects/${projectId}`,
    payload,
  );
  return res.data;
}

export async function deletePortfolioProject(
  projectId: string,
): Promise<ApiResponse<UserProfile>> {
  const res = await apiClient.delete<ApiResponse<UserProfile>>(
    `/profile/me/projects/${projectId}`,
  );
  return res.data;
}
