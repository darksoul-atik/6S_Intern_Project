import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api";

/*
|--------------------------------------------------------------------------
| Post types
|--------------------------------------------------------------------------
*/

export interface PostAuthor {
  id: string;
  name: string;
  headline?: string | null;

  /*
   * GET /posts does NOT include avatarUrl.
   * GET /posts/:id may include avatarUrl.
   */
  avatarUrl?: string | null;
}

export interface PostReactionCounts {
  like: number;
  dislike: number;
}

export interface Post {
  id: string;

  /*
   * The backend keeps the populated author
   * inside the field named authorId.
   */
  authorId: PostAuthor;

  title: string;
  body: string;

  commentCount: number;

  reactionCounts: PostReactionCounts;

  createdAt: string;
  updatedAt: string;

  /*
   * Normal Day 8 post reads only return active posts,
   * so these fields are normally absent.
   */
  deletedAt?: string;
  deletedBy?: string;
}

/*
|--------------------------------------------------------------------------
| Pagination response
|--------------------------------------------------------------------------
|
| Backend:
|
| {
|   posts: [],
|   total: 20,
|   page: 1,
|   limit: 10,
|   totalPages: 2
| }
|--------------------------------------------------------------------------
*/

export interface PaginatedPostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/*
|--------------------------------------------------------------------------
| Mutation payloads
|--------------------------------------------------------------------------
*/

export interface CreatePostPayload {
  title: string;
  body: string;
}

export interface UpdatePostPayload {
  title?: string;
  body?: string;
}

export interface DeletePostResult {
  id: string;
  message: string;
}

/*
|--------------------------------------------------------------------------
| Query keys
|--------------------------------------------------------------------------
*/

export const postKeys = {
  all: ["posts"] as const,

  feeds: () => [...postKeys.all, "feed"] as const,

  feed: (limit: number) => [...postKeys.feeds(), { limit }] as const,

  details: () => [...postKeys.all, "detail"] as const,

  detail: (id: string) => [...postKeys.details(), id] as const,
};

/*
|--------------------------------------------------------------------------
| Fetch one page of posts
|--------------------------------------------------------------------------
*/

export async function fetchPostsPage(
  page: number,
  limit: number = 10,
): Promise<PaginatedPostsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const res = await apiClient<PaginatedPostsResponse>(
    `/api/posts?${params.toString()}`,
  );

  if (!res.data) {
    throw new Error(res.message || "Failed to load posts");
  }

  return res.data;
}

/*
|--------------------------------------------------------------------------
| Fetch one post
|--------------------------------------------------------------------------
*/

export async function fetchPostById(id: string): Promise<Post> {
  const res = await apiClient<Post>(`/api/posts/${id}`);

  if (!res.data) {
    throw new Error(res.message || "Post not found");
  }

  return res.data;
}

/*
|--------------------------------------------------------------------------
| Infinite feed hook
|--------------------------------------------------------------------------
*/

export function useInfinitePosts(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: postKeys.feed(limit),

    /*
     * Backend pagination starts from page 1.
     */
    initialPageParam: 1,

    /*
     * pageParam will be:
     *
     * 1
     * 2
     * 3
     * ...
     */
    queryFn: ({ pageParam }) => fetchPostsPage(pageParam, limit),

    /*
     * Example:
     *
     * current page = 1
     * totalPages = 3
     *
     * next page = 2
     *
     * When:
     *
     * page === totalPages
     *
     * return undefined.
     *
     * TanStack Query then knows there
     * are no more pages.
     */
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
| Single post hook
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Create post
|--------------------------------------------------------------------------
*/

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const res = await apiClient<Post>("/api/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to create post");
  }

  return res.data;
}

/*
|--------------------------------------------------------------------------
| Update post
|--------------------------------------------------------------------------
*/

export async function updatePost(
  id: string,
  payload: UpdatePostPayload,
): Promise<Post> {
  const res = await apiClient<Post>(`/api/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to update post");
  }

  return res.data;
}

/*
|--------------------------------------------------------------------------
| Soft-delete post
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| DELETE /posts/:id
|
| This is the normal soft-delete route.
|
| We are NOT using:
|
| DELETE /posts/:id/permanent
|--------------------------------------------------------------------------
*/

export async function softDeletePost(id: string): Promise<DeletePostResult> {
  const res = await apiClient<DeletePostResult>(`/api/posts/${id}`, {
    method: "DELETE",
  });

  if (!res.data) {
    throw new Error(res.message || "Failed to delete post");
  }

  return res.data;
}

/*
|--------------------------------------------------------------------------
| Mutation hooks
|--------------------------------------------------------------------------
|
| These only perform the requests for now.
|
| Cache invalidation/update will be added later
| in Task 10.
|--------------------------------------------------------------------------
*/

export function useCreatePostMutation() {
  return useMutation({
    mutationFn: createPost,
  });
}

export function useUpdatePostMutation() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostPayload }) =>
      updatePost(id, data),
  });
}

export function useSoftDeletePostMutation() {
  return useMutation({
    mutationFn: softDeletePost,
  });
}
