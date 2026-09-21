import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type { Post, PaginatedPostsResponse } from '../types/post';
import { getPostsPage, getPostById } from '@/services/api/posts';

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const postKeys = {
  all: ['posts'] as const,
  feeds: () => [...postKeys.all, 'feed'] as const,
  feed: (limit: number) => [...postKeys.feeds(), { limit }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
};

/*
|--------------------------------------------------------------------------
| Query Functions & Hooks
|--------------------------------------------------------------------------
*/

export async function fetchPostsPage(
  page: number,
  limit: number = 10,
): Promise<PaginatedPostsResponse> {
  const res = await getPostsPage(page, limit);
  if (!res.data) {
    throw new Error(res.message || 'Failed to load posts');
  }
  return res.data;
}

export async function fetchPostById(id: string): Promise<Post> {
  const res = await getPostById(id);
  if (!res.data) {
    throw new Error(res.message || 'Post not found');
  }
  return res.data;
}

export function useInfinitePosts(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: postKeys.feed(limit),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam, limit),
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) {
        return undefined;
      }
      return lastPage.page + 1;
    },
    staleTime: 30 * 1000,
  });
}

export function usePost(
  id: string,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery<Post>({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPostById(id),
    enabled: options?.enabled ?? Boolean(id),
  });
}
