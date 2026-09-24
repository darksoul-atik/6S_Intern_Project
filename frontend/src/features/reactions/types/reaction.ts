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

export type UserReactionsMap = Record<string, ReactionType>;
