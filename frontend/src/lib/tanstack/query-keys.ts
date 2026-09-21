/**
 * Global TanStack Query Key factory and registry.
 * Feature-specific keys can extend from or live alongside this registry.
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,
    adminCheck: () => [...queryKeys.auth.all, 'adminCheck'] as const,
  },
  users: {
    all: ['users'] as const,
    profile: (idOrUsername?: string) =>
      [...queryKeys.users.all, 'profile', idOrUsername ?? 'me'] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.users.all, 'list', params] as const,
  },
  posts: {
    all: ['posts'] as const,
    feeds: () => [...queryKeys.posts.all, 'feed'] as const,
    feed: (limit: number) => [...queryKeys.posts.feeds(), { limit }] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },
} as const;
