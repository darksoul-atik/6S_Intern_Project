import { apiClient } from '@/lib/axios/client';
import type { ApiResponse } from '@/types/api';
import type {
  Post,
  PaginatedPostsResponse,
  CreatePostPayload,
  UpdatePostPayload,
  DeletePostResult,
} from '@/features/posts/types/post';

/*
|--------------------------------------------------------------------------
| Posts API Service
|--------------------------------------------------------------------------
*/

export async function getPostsPage(
  page: number,
  limit: number = 10,
): Promise<ApiResponse<PaginatedPostsResponse>> {
  const res = await apiClient.get<ApiResponse<PaginatedPostsResponse>>('/posts', {
    params: {
      page,
      limit,
    },
  });
  return res.data;
}

export async function getPostById(id: string): Promise<ApiResponse<Post>> {
  const res = await apiClient.get<ApiResponse<Post>>(`/posts/${id}`);
  return res.data;
}

export async function createPost(
  payload: CreatePostPayload,
): Promise<ApiResponse<Post>> {
  const res = await apiClient.post<ApiResponse<Post>>('/posts', payload);
  return res.data;
}

export async function updatePost(
  id: string,
  payload: UpdatePostPayload,
): Promise<ApiResponse<Post>> {
  const res = await apiClient.patch<ApiResponse<Post>>(`/posts/${id}`, payload);
  return res.data;
}

export async function softDeletePost(
  id: string,
): Promise<ApiResponse<DeletePostResult>> {
  const res = await apiClient.delete<ApiResponse<DeletePostResult>>(`/posts/${id}`);
  return res.data;
}
