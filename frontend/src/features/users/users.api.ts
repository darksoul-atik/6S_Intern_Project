import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api";
import { CURRENT_USER_QUERY_KEY } from "./useCurrentUser";

/*
|--------------------------------------------------------------------------
| Profile types
|--------------------------------------------------------------------------
*/

export interface Experience {
  _id: string;
  id?: string;

  title: string;
  company: string;

  from: string;
  to?: string;

  description?: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface PortfolioProject {
  /*
   * Backend MongoDB subdocument identity.
   *
   * This is NOT React Hook Form's field.id.
   */
  _id?: string;
  id?: string;

  title: string;
  description: string;

  urls: string[];
  technologies: string[];

  startDate: string;
  endDate?: string;

  isCurrent: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  _id?: string;

  name: string;

  /*
   * Day 5 profile fields
   */
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;

  skills: string[];
  experiences: Experience[];
  portfolioProjects: PortfolioProject[];

  /*
   * Temporary compatibility fields.
   *
   * /profile/me and public /users/:id do not guarantee
   * these fields anymore.
   *
   * Existing pre-Day-6 components still reference some
   * of them, so we keep them temporarily until those
   * components are migrated.
   */
  email?: string;
  role?: "user" | "admin";
  title?: string;

  reactionsCount?: number;
  postsCount?: number;
  topRankedCount?: number;

  createdAt?: string;
  updatedAt?: string;
}

/*
|--------------------------------------------------------------------------
| Query keys
|--------------------------------------------------------------------------
*/

/**
 * Centralized query key factory for user profiles.
 */
export const profileKeys = {
  all: ["users"] as const,

  detail: (idOrMe: string) => ["users", idOrMe] as const,
};

/*
|--------------------------------------------------------------------------
| Fetch profile
|--------------------------------------------------------------------------
*/

/**
 * Fetch authenticated profile or public developer profile.
 *
 * me:
 * GET /api/profile/me
 *
 * another user:
 * GET /api/users/:id
 */
export async function fetchUserProfile(
  idOrMe: string = "me",
): Promise<UserProfile> {
  const endpoint = idOrMe === "me" ? "/api/profile/me" : `/api/users/${idOrMe}`;

  const res = await apiClient<UserProfile>(endpoint);

  if (!res.data) {
    throw new Error(res.message || "Profile data not found");
  }

  return res.data;
}

/**
 * Retrieve a developer profile with TanStack Query.
 */
export function useUserProfile(
  idOrMe: string = "me",
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery<UserProfile>({
    queryKey: profileKeys.detail(idOrMe),

    queryFn: () => fetchUserProfile(idOrMe),

    staleTime: 60 * 1000,

    gcTime: 5 * 60 * 1000,

    enabled: options?.enabled ?? Boolean(idOrMe),
  });
}

/*
|--------------------------------------------------------------------------
| Basic profile update
|--------------------------------------------------------------------------
*/

export interface UpdateProfilePayload {
  name?: string;

  headline?: string | null;

  bio?: string | null;

  avatarUrl?: string | null;

  /*
   * TEMPORARY Day 6 migration compatibility.
   *
   * The old ProfileEditForm still sends "title".
   *
   * useUpdateProfileMutation converts:
   *
   * title -> headline
   *
   * before sending the request.
   *
   * Remove this after ProfileEditForm is migrated.
   */
  title?: string;
}

/**
 * Update basic developer profile fields.
 *
 * Current user:
 * PATCH /api/profile/me
 *
 * Another user:
 * PATCH /api/users/:id
 *
 * /profile/me only accepts:
 * name
 * headline
 * bio
 * avatarUrl
 */
export function useUpdateProfileMutation(targetId: string = "me") {
  const queryClient = useQueryClient();

  const endpoint =
    targetId === "me" ? "/api/profile/me" : `/api/users/${targetId}`;

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
      /*
       * Temporary bridge from the old frontend contract:
       *
       * title -> headline
       *
       * "title" itself is NEVER sent to NestJS because
       * forbidNonWhitelisted is enabled on the backend.
       */
      const { title, ...profilePayload } = payload;

      const normalizedPayload = {
        ...profilePayload,

        ...(profilePayload.headline === undefined && title !== undefined
          ? {
              headline: title.trim() === "" ? null : title,
            }
          : {}),
      };

      const res = await apiClient<UserProfile>(endpoint, {
        method: "PATCH",
        body: JSON.stringify(normalizedPayload),
      });

      if (!res.data) {
        throw new Error(res.message || "Failed to update profile");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(targetId), updatedProfile);

      /*
       * name is also used by the authenticated-user
       * query / navbar.
       */
      queryClient.invalidateQueries({
        queryKey: CURRENT_USER_QUERY_KEY,
      });
    },
  });
}

/*
|--------------------------------------------------------------------------
| Avatar
|--------------------------------------------------------------------------
*/

/**
 * Update avatar image.
 */
export function useUpdateAvatarMutation(targetId: string = "me") {
  const queryClient = useQueryClient();

  const endpoint =
    targetId === "me" ? "/api/profile/me" : `/api/users/${targetId}`;

  return useMutation({
    mutationFn: async (avatarUrl: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(endpoint, {
        method: "PATCH",

        body: JSON.stringify({
          avatarUrl,
        }),
      });

      if (!res.data) {
        throw new Error(res.message || "Failed to update avatar");
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

/**
 * Remove avatar.
 *
 * null is used because Day 5 UpdateProfileDto
 * supports clearing avatarUrl with null.
 */
export function useDeleteAvatarMutation(targetId: string = "me") {
  const queryClient = useQueryClient();

  const endpoint =
    targetId === "me" ? "/api/profile/me" : `/api/users/${targetId}`;

  return useMutation({
    mutationFn: async (): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(endpoint, {
        method: "PATCH",

        body: JSON.stringify({
          avatarUrl: null,
        }),
      });

      if (!res.data) {
        throw new Error(res.message || "Failed to remove avatar");
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

/*
|--------------------------------------------------------------------------
| Skills
|--------------------------------------------------------------------------
*/

/**
 * Add a skill to current user.
 *
 * Day 5 did not move skill endpoints.
 */
export function useAddSkillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>("/api/users/me/skills", {
        method: "POST",

        body: JSON.stringify({
          skill,
        }),
      });

      if (!res.data) {
        throw new Error(res.message || "Failed to add skill");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);

      queryClient.invalidateQueries({
        queryKey: profileKeys.detail("me"),
      });
    },
  });
}

/**
 * Remove a skill from current user.
 */
export function useRemoveSkillMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (skill: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(
        `/api/users/me/skills/${encodeURIComponent(skill)}`,
        {
          method: "DELETE",
        },
      );

      if (!res.data) {
        throw new Error(res.message || "Failed to remove skill");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);

      queryClient.invalidateQueries({
        queryKey: profileKeys.detail("me"),
      });
    },
  });
}

/*
|--------------------------------------------------------------------------
| Experience
|--------------------------------------------------------------------------
*/

export interface ExperiencePayload {
  title: string;

  company: string;

  from: string;

  to?: string;

  description?: string;
}

/**
 * Add work experience.
 */
export function useAddExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExperiencePayload): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>("/api/users/me/experiences", {
        method: "POST",

        body: JSON.stringify(payload),
      });

      if (!res.data) {
        throw new Error(res.message || "Failed to add experience");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);

      queryClient.invalidateQueries({
        queryKey: profileKeys.detail("me"),
      });
    },
  });
}

/**
 * Update work experience.
 */
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
      const res = await apiClient<UserProfile>(
        `/api/users/me/experiences/${id}`,
        {
          method: "PATCH",

          body: JSON.stringify(data),
        },
      );

      if (!res.data) {
        throw new Error(res.message || "Failed to update experience");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);

      queryClient.invalidateQueries({
        queryKey: profileKeys.detail("me"),
      });
    },
  });
}

/**
 * Delete work experience.
 */
export function useDeleteExperienceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expId: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(
        `/api/users/me/experiences/${expId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.data) {
        throw new Error(res.message || "Failed to delete experience");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);

      queryClient.invalidateQueries({
        queryKey: profileKeys.detail("me"),
      });
    },
  });
}

/*
|--------------------------------------------------------------------------
| Portfolio project payloads
|--------------------------------------------------------------------------
*/

export interface CreatePortfolioProjectPayload {
  title: string;

  description: string;

  urls?: string[];

  technologies: string[];

  startDate: string;

  endDate?: string;

  isCurrent: boolean;
}

export interface UpdatePortfolioProjectPayload {
  title?: string;

  description?: string;

  urls?: string[];

  technologies?: string[];

  startDate?: string;

  endDate?: string;

  isCurrent?: boolean;
}

/*
|--------------------------------------------------------------------------
| Portfolio project mutations
|--------------------------------------------------------------------------
*/

/**
 * Add a new portfolio project.
 *
 * POST /api/profile/me/projects
 */
export function useCreatePortfolioProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreatePortfolioProjectPayload,
    ): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>("/api/profile/me/projects", {
        method: "POST",

        body: JSON.stringify(payload),
      });

      if (!res.data) {
        throw new Error(res.message || "Failed to create portfolio project");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      /*
       * Backend returns the complete canonical profile,
       * including the newly generated MongoDB project ID.
       */
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);
    },
  });
}

/**
 * Update an existing portfolio project.
 *
 * PATCH /api/profile/me/projects/:projectId
 */
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
      const res = await apiClient<UserProfile>(
        `/api/profile/me/projects/${projectId}`,
        {
          method: "PATCH",

          body: JSON.stringify(data),
        },
      );

      if (!res.data) {
        throw new Error(res.message || "Failed to update portfolio project");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);
    },
  });
}

/**
 * Delete an existing portfolio project.
 *
 * DELETE /api/profile/me/projects/:projectId
 */
export function useDeletePortfolioProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<UserProfile> => {
      const res = await apiClient<UserProfile>(
        `/api/profile/me/projects/${projectId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.data) {
        throw new Error(res.message || "Failed to delete portfolio project");
      }

      return res.data;
    },

    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail("me"), updatedProfile);
    },
  });
}
