import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiClient } from "@/lib/api";
import { profileKeys } from "@/features/users/users.api";

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
   * Current backend includes avatarUrl
   * when available.
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
   * Normal public post queries return
   * active posts only.
   */
  deletedAt?: string;
  deletedBy?: string;
}

/*
|--------------------------------------------------------------------------
| Pagination response
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
| Infinite feed
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Single post
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
| Create post request
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
| Update post request
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
| Soft-delete request
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| DELETE /posts/:id
|
| NOT:
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
| Create mutation
|--------------------------------------------------------------------------
|
| After create:
|
| 1. Put the returned post into its detail cache.
| 2. Invalidate feed caches.
| 3. Invalidate profile caches because postsCount changed.
|--------------------------------------------------------------------------
*/

export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,

    onSuccess: async (newPost) => {
      /*
       * We already have the new Post returned
       * by the backend.
       *
       * Store it immediately so the detail
       * page has useful cache data.
       */
      queryClient.setQueryData(postKeys.detail(newPost.id), newPost);

      /*
       * The new post belongs in the feed.
       *
       * Instead of manually trying to insert
       * it into page 1 and recalculate all
       * pagination metadata, refetch the feed.
       */
      await queryClient.invalidateQueries({
        queryKey: postKeys.feeds(),
      });

      /*
       * Backend increments User.postsCount
       * when a post is created.
       */
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
  });
}

/*
|--------------------------------------------------------------------------
| Update mutation
|--------------------------------------------------------------------------
|
| After edit:
|
| 1. Update detail cache immediately.
| 2. Update any currently cached feed card immediately.
| 3. Invalidate feed to reconcile with backend.
|--------------------------------------------------------------------------
*/

export function useUpdatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostPayload }) =>
      updatePost(id, data),

    onSuccess: async (updatedPost) => {
      /*
       * Replace stale detail data.
       */
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);

      /*
       * Update the same post inside every
       * cached infinite feed immediately.
       */
      queryClient.setQueriesData<InfiniteData<PaginatedPostsResponse>>(
        {
          queryKey: postKeys.feeds(),
        },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          return {
            ...oldData,

            pages: oldData.pages.map((page) => ({
              ...page,

              posts: page.posts.map((post) =>
                post.id === updatedPost.id ? updatedPost : post,
              ),
            })),
          };
        },
      );

      /*
       * Revalidate against the backend.
       */
      await queryClient.invalidateQueries({
        queryKey: postKeys.feeds(),
      });
    },
  });
}

/*
|--------------------------------------------------------------------------
| Soft-delete mutation
|--------------------------------------------------------------------------
|
| After delete:
|
| 1. Remove deleted Post from feed immediately.
| 2. Remove its detail cache.
| 3. Refetch feed.
| 4. Refresh profile caches because postsCount changed.
|--------------------------------------------------------------------------
*/

export function useSoftDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: softDeletePost,

    onSuccess: async (result) => {
      /*
       * Remove the deleted post immediately
       * from all cached feed pages.
       *
       * This means the card disappears without
       * waiting for a full page reload.
       */
      queryClient.setQueriesData<InfiniteData<PaginatedPostsResponse>>(
        {
          queryKey: postKeys.feeds(),
        },
        (oldData) => {
          if (!oldData) {
            return oldData;
          }

          return {
            ...oldData,

            pages: oldData.pages.map((page) => ({
              ...page,

              posts: page.posts.filter((post) => post.id !== result.id),
            })),
          };
        },
      );

      /*
       * A soft-deleted post is no longer
       * accessible through normal GET /posts/:id.
       *
       * Remove its detail cache completely.
       */
      queryClient.removeQueries({
        queryKey: postKeys.detail(result.id),

        exact: true,
      });

      /*
       * Refetch the feed so pagination,
       * total, totalPages, etc. are brought
       * back in sync with the backend.
       */
      await queryClient.invalidateQueries({
        queryKey: postKeys.feeds(),
      });

      /*
       * Backend decrements the author's
       * postsCount during soft delete.
       *
       * Invalidate all profile caches so this
       * remains correct for:
       *
       * - own post deletion
       * - admin deleting another user's post
       */
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
  });
}
