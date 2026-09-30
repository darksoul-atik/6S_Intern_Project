import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPostById, getPostsPage, searchPosts } from "@/services/api/posts";
import type { FeedSort } from "@/features/posts/hooks/use-feed-sort";
import type { PaginatedPostsResponse, Post } from "@/features/posts/types/post";

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const postKeys = {
  all: ["posts"] as const,

  feeds: () => [...postKeys.all, "feed"] as const,

  feed: (sortOrLimit?: FeedSort | number, limitOrSort?: number | FeedSort) => {
    const sort: FeedSort =
      typeof sortOrLimit === "string"
        ? sortOrLimit
        : typeof limitOrSort === "string"
          ? limitOrSort
          : "top";

    const limit: number =
      typeof sortOrLimit === "number"
        ? sortOrLimit
        : typeof limitOrSort === "number"
          ? limitOrSort
          : 10;

    return [...postKeys.feeds(), sort, { limit }] as const;
  },

  searches: () => [...postKeys.all, "search"] as const,

  search: (normalizedTerm: string, limit: number = 10) =>
    [...postKeys.searches(), normalizedTerm, { limit }] as const,

  details: () => [...postKeys.all, "detail"] as const,

  detail: (id: string) => [...postKeys.details(), id] as const,
};

/*
|--------------------------------------------------------------------------
| Post Feed Query
|--------------------------------------------------------------------------
*/

export async function fetchPostsPage(
  page: number,
  limit: number = 10,
  sort: FeedSort = "top",
): Promise<PaginatedPostsResponse> {
  const res = await getPostsPage(page, limit, sort);

  if (!res.data) {
    throw new Error(res.message || "Failed to load posts");
  }

  return res.data;
}

export function useInfinitePosts(
  sortOrLimit: FeedSort | number = "top",
  maybeLimit: number = 10,
) {
  const sort: FeedSort = typeof sortOrLimit === "string" ? sortOrLimit : "top";

  const limit: number =
    typeof sortOrLimit === "number" ? sortOrLimit : maybeLimit;

  return useInfiniteQuery<PaginatedPostsResponse, Error>({
    queryKey: postKeys.feed(sort, limit),
    initialPageParam: 1,

    queryFn: ({ pageParam }) =>
      fetchPostsPage(pageParam as number, limit, sort),

    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) {
        return undefined;
      }

      return lastPage.page + 1;
    },

    staleTime: 30 * 1000,
  });
}

/*
|--------------------------------------------------------------------------
| Post Search Query
|--------------------------------------------------------------------------
*/

export async function fetchSearchPosts(
  normalizedTerm: string,
  limit: number = 10,
  signal?: AbortSignal,
): Promise<PaginatedPostsResponse> {
  const res = await searchPosts(
    {
      q: normalizedTerm,
      page: 1,
      limit,
    },
    signal,
  );

  if (!res.data) {
    throw new Error(res.message || "Failed to search posts");
  }

  return res.data;
}

export function usePostSearch(normalizedTerm: string, limit: number = 10) {
  const isValidSearch = normalizedTerm.length >= 2;

  return useQuery<PaginatedPostsResponse, Error>({
    queryKey: postKeys.search(normalizedTerm, limit),

    queryFn: ({ signal }) => fetchSearchPosts(normalizedTerm, limit, signal),

    enabled: isValidSearch,

    staleTime: 30 * 1000,
  });
}

/*
|--------------------------------------------------------------------------
| Post Detail Query
|--------------------------------------------------------------------------
*/

export async function fetchPostById(id: string): Promise<Post> {
  const res = await getPostById(id);

  if (!res.data) {
    throw new Error(res.message || "Post not found");
  }

  return res.data;
}

export function usePost(
  id: string,
  options?: {
    enabled?: boolean;
  },
) {
  return useQuery<Post, Error>({
    queryKey: postKeys.detail(id),
    queryFn: () => fetchPostById(id),
    enabled: options?.enabled ?? Boolean(id),
  });
}
