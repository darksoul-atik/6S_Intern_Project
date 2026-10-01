import { apiClient } from "@/lib/axios/client";
import type { ApiResponse } from "@/types/api";
import type { FeedSort } from "@/features/posts/hooks/use-feed-sort";
import type {
  Post,
  PaginatedPostsResponse,
  CreatePostPayload,
  UpdatePostPayload,
  DeletePostResult,
} from "@/features/posts/types/post";

/*
|--------------------------------------------------------------------------
| Search Types
|--------------------------------------------------------------------------
*/

export type SearchPostsParams = {
  q: string;
  page?: number;
  limit?: number;
};

/*
|--------------------------------------------------------------------------
| Summarization Types
|--------------------------------------------------------------------------
*/

export type PostSummary = {
  summary: string;
  tags: string[];
};

/*
|--------------------------------------------------------------------------
| Posts API Service
|--------------------------------------------------------------------------
*/

export async function getPostsPage(
  page: number,
  limit: number = 10,
  sort: FeedSort = "top",
): Promise<ApiResponse<PaginatedPostsResponse>> {
  const res = await apiClient.get<ApiResponse<PaginatedPostsResponse>>(
    "/posts",
    {
      params: {
        page,
        limit,
        sort,
      },
    },
  );

  return res.data;
}

export async function searchPosts(
  params: SearchPostsParams,
  signal?: AbortSignal,
): Promise<ApiResponse<PaginatedPostsResponse>> {
  const res = await apiClient.get<ApiResponse<PaginatedPostsResponse>>(
    "/posts/search",
    {
      params: {
        q: params.q,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      },
      signal,
    },
  );

  return res.data;
}

export async function getPostById(id: string): Promise<ApiResponse<Post>> {
  const res = await apiClient.get<ApiResponse<Post>>(`/posts/${id}`);

  return res.data;
}

export async function createPost(
  payload: CreatePostPayload,
): Promise<ApiResponse<Post>> {
  const res = await apiClient.post<ApiResponse<Post>>("/posts", payload);

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
  const res = await apiClient.delete<ApiResponse<DeletePostResult>>(
    `/posts/${id}`,
  );

  return res.data;
}

export async function summarizePost(
  id: string,
): Promise<ApiResponse<PostSummary>> {
  const res = await apiClient.post<ApiResponse<PostSummary>>(
    `/posts/${id}/summarize`,
  );

  return res.data;
}
