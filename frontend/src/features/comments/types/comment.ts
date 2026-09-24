export interface CommentAuthor {
  id: string;
  name: string;
  headline?: string | null;
  avatarUrl?: string | null;
}

export interface CommentReactionCounts {
  like: number;
  dislike: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: CommentAuthor;
  parentCommentId: string | null;
  body: string;
  reactionCounts?: CommentReactionCounts;
  createdAt?: string;
  updatedAt?: string;
  replies: Comment[];
}

export interface CreateCommentPayload {
  body: string;
}

export interface UpdateCommentPayload {
  body: string;
}

export interface DeleteCommentResult {
  deletedCount: number;
}
