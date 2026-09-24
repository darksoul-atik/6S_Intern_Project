import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";

import { toggleReaction } from "@/services/api/reactions";
import { postKeys } from "@/features/posts/queries/post-queries";
import { commentKeys } from "@/features/comments/queries/comment-queries";
import { reactionKeys } from "../queries/reaction-queries";
import type {
  ReactionType,
  ToggleReactionPayload,
  ToggleReactionResponse,
  UserReactionsMap,
} from "../types/reaction";
import type { Post, PaginatedPostsResponse } from "@/features/posts/types/post";
import type { Comment } from "@/features/comments/types/comment";

export interface ToggleReactionVariables extends ToggleReactionPayload {
  currentReaction?: ReactionType | null;
  postId?: string; // Helpful for comments to locate the right comment cache
}

interface MutationContext {
  previousPostDetail?: Post;
  previousFeeds?: [QueryKey, InfiniteData<PaginatedPostsResponse> | undefined][];
  previousComments?: Comment[];
  previousReactions?: [QueryKey, UserReactionsMap | undefined][];
}

function updateCommentInTree(
  comments: Comment[],
  targetCommentId: string,
  updater: (c: Comment) => Comment,
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === targetCommentId) {
      return updater(comment);
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, targetCommentId, updater),
      };
    }
    return comment;
  });
}

function calculateNewCounts(
  currentCounts: { like: number; dislike: number },
  currentReaction: ReactionType | null,
  newReaction: ReactionType | null,
): { like: number; dislike: number } {
  let { like, dislike } = currentCounts;

  // Remove previous reaction from count
  if (currentReaction === "like") {
    like = Math.max(0, like - 1);
  } else if (currentReaction === "dislike") {
    dislike = Math.max(0, dislike - 1);
  }

  // Add new reaction to count
  if (newReaction === "like") {
    like += 1;
  } else if (newReaction === "dislike") {
    dislike += 1;
  }

  return { like, dislike };
}

export function useToggleReactionMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    ToggleReactionResponse,
    Error,
    ToggleReactionVariables,
    MutationContext
  >({
    mutationFn: async (variables) => {
      const res = await toggleReaction({
        targetType: variables.targetType,
        targetId: variables.targetId,
        type: variables.type,
      });

      if (!res.data) {
        throw new Error(res.message || "Failed to toggle reaction");
      }

      return res.data;
    },

    onMutate: async (variables) => {
      // 1. Cancel outgoing queries that might overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: reactionKeys.all });
      if (variables.targetType === "post") {
        await queryClient.cancelQueries({ queryKey: postKeys.all });
      } else if (variables.postId) {
        await queryClient.cancelQueries({
          queryKey: commentKeys.byPost(variables.postId),
        });
      }

      // 2. Snapshot current data
      const context: MutationContext = {};

      const previousReactions = queryClient.getQueriesData<UserReactionsMap>({
        queryKey: reactionKeys.all,
      });
      context.previousReactions = previousReactions;

      const currentReaction =
        variables.currentReaction !== undefined
          ? variables.currentReaction
          : (previousReactions[0]?.[1]?.[variables.targetId] ?? null);

      // Determine optimistic next reaction: if already clicked same type -> remove (null), else set to new type
      const nextReaction: ReactionType | null =
        currentReaction === variables.type ? null : variables.type;

      // 3. Optimistically update user reaction map in cache
      queryClient.setQueriesData<UserReactionsMap>(
        { queryKey: reactionKeys.all },
        (old) => {
          const updated = { ...(old ?? {}) };
          if (nextReaction) {
            updated[variables.targetId] = nextReaction;
          } else {
            delete updated[variables.targetId];
          }
          return updated;
        },
      );

      // 4. Optimistically update target counters
      if (variables.targetType === "post") {
        // Detail cache
        const detailKey = postKeys.detail(variables.targetId);
        const previousPostDetail = queryClient.getQueryData<Post>(detailKey);
        context.previousPostDetail = previousPostDetail;

        if (previousPostDetail) {
          const nextCounts = calculateNewCounts(
            previousPostDetail.reactionCounts,
            currentReaction,
            nextReaction,
          );
          queryClient.setQueryData<Post>(detailKey, {
            ...previousPostDetail,
            reactionCounts: nextCounts,
          });
        }

        // Feeds cache
        const feedQueries = queryClient.getQueriesData<InfiniteData<PaginatedPostsResponse>>({
          queryKey: postKeys.feeds(),
        });
        context.previousFeeds = feedQueries;

        queryClient.setQueriesData<InfiniteData<PaginatedPostsResponse>>(
          { queryKey: postKeys.feeds() },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                posts: page.posts.map((post) => {
                  if (post.id === variables.targetId) {
                    return {
                      ...post,
                      reactionCounts: calculateNewCounts(
                        post.reactionCounts,
                        currentReaction,
                        nextReaction,
                      ),
                    };
                  }
                  return post;
                }),
              })),
            };
          },
        );
      } else if (variables.targetType === "comment" && variables.postId) {
        // Comment tree cache
        const commentKey = commentKeys.byPost(variables.postId);
        const previousComments = queryClient.getQueryData<Comment[]>(commentKey);
        context.previousComments = previousComments;

        if (previousComments) {
          queryClient.setQueryData<Comment[]>(commentKey, (old) => {
            if (!old) return old;
            return updateCommentInTree(old, variables.targetId, (c) => {
              const currentCounts = c.reactionCounts ?? { like: 0, dislike: 0 };
              return {
                ...c,
                reactionCounts: calculateNewCounts(
                  currentCounts,
                  currentReaction,
                  nextReaction,
                ),
              };
            });
          });
        }
      }

      return context;
    },

    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousReactions) {
        for (const [key, data] of context.previousReactions) {
          queryClient.setQueryData(key, data);
        }
      }

      if (variables.targetType === "post") {
        if (context?.previousPostDetail) {
          queryClient.setQueryData(
            postKeys.detail(variables.targetId),
            context.previousPostDetail,
          );
        }
        if (context?.previousFeeds) {
          for (const [key, data] of context.previousFeeds) {
            queryClient.setQueryData(key, data);
          }
        }
      } else if (variables.targetType === "comment" && variables.postId) {
        if (context?.previousComments) {
          queryClient.setQueryData(
            commentKeys.byPost(variables.postId),
            context.previousComments,
          );
        }
      }
    },

    onSettled: (_data, _error, variables) => {
      // Reconcile and ensure server state consistency
      queryClient.invalidateQueries({ queryKey: reactionKeys.all });

      if (variables.targetType === "post") {
        queryClient.invalidateQueries({
          queryKey: postKeys.detail(variables.targetId),
        });
        queryClient.invalidateQueries({
          queryKey: postKeys.feeds(),
        });
      } else if (variables.postId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.byPost(variables.postId),
        });
      }
    },
  });
}
