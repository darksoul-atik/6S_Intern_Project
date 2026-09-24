import { useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  Comment,
  CreateCommentPayload,
  DeleteCommentResult,
  UpdateCommentPayload,
} from "../types/comment";

import {
  createComment as apiCreateComment,
  createReply as apiCreateReply,
  deleteComment as apiDeleteComment,
  updateComment as apiUpdateComment,
} from "@/services/api/comments";

import { commentKeys } from "../queries/comment-queries";
import { postKeys } from "@/features/posts/queries/post-queries";
import { profileKeys } from "@/features/users/queries/user-queries";

/*
|--------------------------------------------------------------------------
| Mutation Functions
|--------------------------------------------------------------------------
*/

export async function createComment(
  postId: string,
  payload: CreateCommentPayload,
): Promise<void> {
  const res = await apiCreateComment(postId, payload);

  if (!res.success) {
    throw new Error(res.message || "Failed to create comment");
  }
}

export async function createReply(
  postId: string,
  parentCommentId: string,
  payload: CreateCommentPayload,
): Promise<void> {
  const res = await apiCreateReply(postId, parentCommentId, payload);

  if (!res.success) {
    throw new Error(res.message || "Failed to create reply");
  }
}

export async function deleteComment(
  commentId: string,
): Promise<DeleteCommentResult> {
  const res = await apiDeleteComment(commentId);

  if (!res.data) {
    throw new Error(res.message || "Failed to delete comment");
  }

  return res.data;
}

export async function updateComment(
  commentId: string,
  payload: UpdateCommentPayload,
): Promise<Comment> {
  const res = await apiUpdateComment(commentId, payload);

  if (!res.data) {
    throw new Error(res.message || "Failed to update comment");
  }

  return res.data;
}

/*
|--------------------------------------------------------------------------
| Mutation Hooks
|--------------------------------------------------------------------------
*/

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      data,
    }: {
      postId: string;
      data: CreateCommentPayload;
    }) => createComment(postId, data),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentKeys.byPost(variables.postId),
        }),

        queryClient.invalidateQueries({
          queryKey: postKeys.detail(variables.postId),
        }),

        queryClient.invalidateQueries({
          queryKey: postKeys.feeds(),
        }),

        queryClient.invalidateQueries({
          queryKey: profileKeys.all,
        }),
      ]);
    },
  });
}

export function useCreateReplyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      parentCommentId,
      data,
    }: {
      postId: string;
      parentCommentId: string;
      data: CreateCommentPayload;
    }) => createReply(postId, parentCommentId, data),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentKeys.byPost(variables.postId),
        }),

        queryClient.invalidateQueries({
          queryKey: postKeys.detail(variables.postId),
        }),

        queryClient.invalidateQueries({
          queryKey: postKeys.feeds(),
        }),

        queryClient.invalidateQueries({
          queryKey: profileKeys.all,
        }),
      ]);
    },
  });
}

export function useDeleteCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string; postId: string }) =>
      deleteComment(commentId),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentKeys.byPost(variables.postId),
        }),

        queryClient.invalidateQueries({
          queryKey: postKeys.detail(variables.postId),
        }),

        queryClient.invalidateQueries({
          queryKey: postKeys.feeds(),
        }),

        queryClient.invalidateQueries({
          queryKey: profileKeys.all,
        }),
      ]);
    },
  });
}

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      postId: string;
      data: UpdateCommentPayload;
    }) => updateComment(commentId, data),

    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: commentKeys.byPost(variables.postId),
      });
    },
  });
}
