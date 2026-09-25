export type ReactionTargetType = "post" | "comment";

export type ReactionType = "like" | "dislike";

export type ReactionAction = "created" | "removed" | "switched";

export interface ReactionCounts {
  like: number;
  dislike: number;
}

export interface ToggleReactionPayload {
  targetType: ReactionTargetType;
  targetId: string;
  type: ReactionType;
}

export interface ToggleReactionResponse {
  action: ReactionAction;
  reaction: ReactionType | null;
  reactionCounts: ReactionCounts;
}

export interface GetUserReactionsParams {
  targetType: ReactionTargetType;
  targetIds?: string[];
}

export type UserReactionsMap = Record<string, ReactionType>;

export type UserReactionState = ReactionType | null | undefined;

export interface ReactorItem {
  userId: string;
  name: string;
  headline?: string | null;
  avatarUrl?: string | null;
  type: ReactionType;
  createdAt?: string;
}

export interface PaginatedReactorsResult {
  items: ReactorItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetReactorsParams {
  targetType: ReactionTargetType;
  targetId: string;
  type?: ReactionType;
  page?: number;
  limit?: number;
}

