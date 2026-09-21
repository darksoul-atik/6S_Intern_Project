import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  Post,
  PaginatedPostsResponse,
  CreatePostPayload,
  UpdatePostPayload,
  DeletePostResult,
} from '../types/post';
import {
  createPost as apiCreatePost,
  updatePost as apiUpdatePost,
  softDeletePost as apiSoftDeletePost,
} from '@/services/api/posts';
import { postKeys } from '../queries/post-queries';
import { profileKeys } from '@/features/users/queries/user-queries';

/*
|--------------------------------------------------------------------------
| Mutation Functions
|--------------------------------------------------------------------------
*/

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const res = await apiCreatePost(payload);
  if (!res.data) {
    throw new Error(res.message || 'Failed to create post');
  }
  return res.data;
}

export async function updatePost(
  id: string,
  payload: UpdatePostPayload,
): Promise<Post> {
  const res = await apiUpdatePost(id, payload);
  if (!res.data) {
    throw new Error(res.message || 'Failed to update post');
  }
  return res.data;
}

export async function softDeletePost(id: string): Promise<DeletePostResult> {
  const res = await apiSoftDeletePost(id);
  if (!res.data) {
    throw new Error(res.message || 'Failed to delete post');
  }
  return res.data;
}

/*
|--------------------------------------------------------------------------
| Mutation Hooks
|--------------------------------------------------------------------------
*/

export function useCreatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: async (newPost) => {
      queryClient.setQueryData(postKeys.detail(newPost.id), newPost);
      await queryClient.invalidateQueries({
        queryKey: postKeys.feeds(),
      });
      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
  });
}

export function useUpdatePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostPayload }) =>
      updatePost(id, data),
    onSuccess: async (updatedPost) => {
      queryClient.setQueryData(postKeys.detail(updatedPost.id), updatedPost);
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
      await queryClient.invalidateQueries({
        queryKey: postKeys.feeds(),
      });
    },
  });
}

export function useSoftDeletePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: softDeletePost,
    onSuccess: async (result) => {
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

      queryClient.removeQueries({
        queryKey: postKeys.detail(result.id),
        exact: true,
      });

      await queryClient.invalidateQueries({
        queryKey: postKeys.feeds(),
      });

      await queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
  });
}
