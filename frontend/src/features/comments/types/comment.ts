export interface CommentAuthor {
  id: string;
  name: string;
  headline?: string | null;
  avatarUrl?: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: CommentAuthor;
  parentCommentId: string | null;
  body: string;
  createdAt?: string;
  updatedAt?: string;
  replies: Comment[];
}

export interface CreateCommentPayload {
  body: string;
}

export interface DeleteCommentResult {
  deletedCount: number;
}
