import { apiClient } from "@/lib/axios/client";
import type { ApiResponse } from "@/types/api";
import type {
  Comment,
  CreateCommentPayload,
  DeleteCommentResult,
} from "@/features/comments/types/comment";

/*
|--------------------------------------------------------------------------
| Comments API Service
|--------------------------------------------------------------------------
*/

export async function getComments(
  postId: string,
): Promise<ApiResponse<Comment[]>> {
  const res = await apiClient.get<ApiResponse<Comment[]>>(
    `/posts/${postId}/comments`,
  );

  return res.data;
}

export async function createComment(
  postId: string,
  payload: CreateCommentPayload,
): Promise<ApiResponse<unknown>> {
  const res = await apiClient.post<ApiResponse<unknown>>(
    `/posts/${postId}/comments`,
    payload,
  );

  return res.data;
}

export async function createReply(
  postId: string,
  parentCommentId: string,
  payload: CreateCommentPayload,
): Promise<ApiResponse<unknown>> {
  const res = await apiClient.post<ApiResponse<unknown>>(
    `/posts/${postId}/comments/${parentCommentId}/replies`,
    payload,
  );

  return res.data;
}

export async function deleteComment(
  commentId: string,
): Promise<ApiResponse<DeleteCommentResult>> {
  const res = await apiClient.delete<ApiResponse<DeleteCommentResult>>(
    `/comments/${commentId}`,
  );

  return res.data;
}

export async function updateComment(
  commentId: string,
  payload: { body: string },
): Promise<ApiResponse<Comment>> {
  const res = await apiClient.patch<ApiResponse<Comment>>(
    `/comments/${commentId}`,
    payload,
  );

  return res.data;
}
