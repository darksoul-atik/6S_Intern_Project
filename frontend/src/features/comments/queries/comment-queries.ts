import { useQuery } from "@tanstack/react-query";

import { getComments } from "@/services/api/comments";
import type { Comment } from "../types/comment";

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const commentKeys = {
  all: ["comments"] as const,

  byPost: (postId: string) => [...commentKeys.all, "post", postId] as const,
};

/*
|--------------------------------------------------------------------------
| Query Function
|--------------------------------------------------------------------------
*/

export async function fetchComments(postId: string): Promise<Comment[]> {
  const res = await getComments(postId);

  if (!res.data) {
    throw new Error(res.message || "Failed to load comments");
  }

  return res.data;
}

/*
|--------------------------------------------------------------------------
| Query Hook
|--------------------------------------------------------------------------
*/

export function useComments(postId: string) {
  return useQuery<Comment[]>({
    queryKey: commentKeys.byPost(postId),
    queryFn: () => fetchComments(postId),
    enabled: Boolean(postId),
  });
}
