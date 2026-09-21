export interface PostAuthor {
  id: string;
  name: string;
  headline?: string | null;
  avatarUrl?: string | null;
}

export interface PostReactionCounts {
  like: number;
  dislike: number;
}

export interface Post {
  id: string;
  authorId: PostAuthor;
  title: string;
  body: string;
  commentCount: number;
  reactionCounts: PostReactionCounts;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface PaginatedPostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
