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
  ReactionCounts,
  ReactionTargetType,
  ReactionType,
  ToggleReactionPayload,
  ToggleReactionResponse,
  UserReactionsMap,
} from "../types/reaction";

import type { Post, PaginatedPostsResponse } from "@/features/posts/types/post";

import type { Comment } from "@/features/comments/types/comment";

export interface ToggleReactionVariables extends ToggleReactionPayload {
  currentReaction: ReactionType | null;
  postId?: string;
}

interface ReactionSnapshot {
  queryKey: QueryKey;
  previousReaction: ReactionType | null;
}

interface FeedSnapshot {
  queryKey: QueryKey;
  previousCounts: ReactionCounts;
}

interface MutationContext {
  previousReactions: ReactionSnapshot[];
  previousPostCounts?: ReactionCounts;
  previousFeeds: FeedSnapshot[];
  previousCommentCounts?: ReactionCounts;
}

function isReactionQueryForTarget(
  queryKey: QueryKey,
  targetType: ReactionTargetType,
  targetId: string,
) {
  if (
    queryKey[0] !== "reactions" ||
    queryKey[1] !== "mine" ||
    queryKey[2] !== targetType
  ) {
    return false;
  }

  const scope = queryKey[3];

  if (scope === "all") {
    return true;
  }

  if (typeof scope !== "string") {
    return false;
  }

  return scope.split(",").includes(targetId);
}

function updateReactionMap(
  old: UserReactionsMap | undefined,
  targetId: string,
  reaction: ReactionType | null,
) {
  if (!old) {
    return old;
  }

  const updated = { ...old };

  if (reaction) {
    updated[targetId] = reaction;
  } else {
    delete updated[targetId];
  }

  return updated;
}

function calculateNewCounts(
  currentCounts: ReactionCounts,
  currentReaction: ReactionType | null,
  newReaction: ReactionType | null,
): ReactionCounts {
  let { like, dislike } = currentCounts;

  if (currentReaction === "like") {
    like = Math.max(0, like - 1);
  }

  if (currentReaction === "dislike") {
    dislike = Math.max(0, dislike - 1);
  }

  if (newReaction === "like") {
    like += 1;
  }

  if (newReaction === "dislike") {
    dislike += 1;
  }

  return { like, dislike };
}

function updateCommentInTree(
  comments: Comment[],
  targetId: string,
  updater: (comment: Comment) => Comment,
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === targetId) {
      return updater(comment);
    }

    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, targetId, updater),
      };
    }

    return comment;
  });
}

function findCommentInTree(
  comments: Comment[],
  targetId: string,
): Comment | undefined {
  for (const comment of comments) {
    if (comment.id === targetId) {
      return comment;
    }

    const found = findCommentInTree(comment.replies, targetId);

    if (found) {
      return found;
    }
  }

  return undefined;
}

function findPostInFeed(
  data: InfiniteData<PaginatedPostsResponse>,
  targetId: string,
): Post | undefined {
  for (const page of data.pages) {
    const post = page.posts.find((item) => item.id === targetId);

    if (post) {
      return post;
    }
  }

  return undefined;
}

function updatePostInFeed(
  data: InfiniteData<PaginatedPostsResponse>,
  targetId: string,
  counts: ReactionCounts,
): InfiniteData<PaginatedPostsResponse> {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      posts: page.posts.map((post) =>
        post.id === targetId
          ? {
              ...post,
              reactionCounts: counts,
            }
          : post,
      ),
    })),
  };
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
      const { targetType, targetId, currentReaction, postId } = variables;

      const nextReaction: ReactionType | null =
        currentReaction === variables.type ? null : variables.type;

      await queryClient.cancelQueries({
        predicate: (query) =>
          isReactionQueryForTarget(query.queryKey, targetType, targetId),
      });

      if (targetType === "post") {
        await Promise.all([
          queryClient.cancelQueries({
            queryKey: postKeys.detail(targetId),
          }),
          queryClient.cancelQueries({
            queryKey: postKeys.feeds(),
          }),
        ]);
      }

      if (targetType === "comment" && postId) {
        await queryClient.cancelQueries({
          queryKey: commentKeys.byPost(postId),
        });
      }

      const context: MutationContext = {
        previousReactions: [],
        previousFeeds: [],
      };

      const reactionQueries = queryClient.getQueriesData<UserReactionsMap>({
        queryKey: [...reactionKeys.all, "mine", targetType],
      });

      context.previousReactions = reactionQueries
        .filter(
          ([queryKey, data]) =>
            data !== undefined &&
            isReactionQueryForTarget(queryKey, targetType, targetId),
        )
        .map(([queryKey, data]) => ({
          queryKey,
          previousReaction: data?.[targetId] ?? null,
        }));

      for (const snapshot of context.previousReactions) {
        queryClient.setQueryData<UserReactionsMap>(snapshot.queryKey, (old) =>
          updateReactionMap(old, targetId, nextReaction),
        );
      }

      if (targetType === "post") {
        const detailKey = postKeys.detail(targetId);

        const previousPost = queryClient.getQueryData<Post>(detailKey);

        if (previousPost) {
          context.previousPostCounts = {
            ...previousPost.reactionCounts,
          };

          const nextCounts = calculateNewCounts(
            previousPost.reactionCounts,
            currentReaction,
            nextReaction,
          );

          queryClient.setQueryData<Post>(detailKey, {
            ...previousPost,
            reactionCounts: nextCounts,
          });
        }

        const feedQueries = queryClient.getQueriesData<
          InfiniteData<PaginatedPostsResponse>
        >({
          queryKey: postKeys.feeds(),
        });

        for (const [queryKey, data] of feedQueries) {
          if (!data) {
            continue;
          }

          const post = findPostInFeed(data, targetId);

          if (!post) {
            continue;
          }

          context.previousFeeds.push({
            queryKey,
            previousCounts: {
              ...post.reactionCounts,
            },
          });

          const nextCounts = calculateNewCounts(
            post.reactionCounts,
            currentReaction,
            nextReaction,
          );

          queryClient.setQueryData<InfiniteData<PaginatedPostsResponse>>(
            queryKey,
            updatePostInFeed(data, targetId, nextCounts),
          );
        }
      }

      if (targetType === "comment" && postId) {
        const commentKey = commentKeys.byPost(postId);

        const previousComments =
          queryClient.getQueryData<Comment[]>(commentKey);

        if (previousComments) {
          const targetComment = findCommentInTree(previousComments, targetId);

          if (targetComment) {
            const previousCounts = targetComment.reactionCounts ?? {
              like: 0,
              dislike: 0,
            };

            context.previousCommentCounts = {
              ...previousCounts,
            };

            const nextCounts = calculateNewCounts(
              previousCounts,
              currentReaction,
              nextReaction,
            );

            queryClient.setQueryData<Comment[]>(commentKey, (old) => {
              if (!old) {
                return old;
              }

              return updateCommentInTree(old, targetId, (comment) => ({
                ...comment,
                reactionCounts: nextCounts,
              }));
            });
          }
        }
      }

      return context;
    },

    onError: (_error, variables, context) => {
      if (!context) {
        return;
      }

      for (const snapshot of context.previousReactions) {
        queryClient.setQueryData<UserReactionsMap>(snapshot.queryKey, (old) =>
          updateReactionMap(old, variables.targetId, snapshot.previousReaction),
        );
      }

      if (variables.targetType === "post" && context.previousPostCounts) {
        queryClient.setQueryData<Post>(
          postKeys.detail(variables.targetId),
          (old) => {
            if (!old) {
              return old;
            }

            return {
              ...old,
              reactionCounts: context.previousPostCounts!,
            };
          },
        );
      }

      for (const snapshot of context.previousFeeds) {
        queryClient.setQueryData<InfiniteData<PaginatedPostsResponse>>(
          snapshot.queryKey,
          (old) => {
            if (!old) {
              return old;
            }

            return updatePostInFeed(
              old,
              variables.targetId,
              snapshot.previousCounts,
            );
          },
        );
      }

      if (
        variables.targetType === "comment" &&
        variables.postId &&
        context.previousCommentCounts
      ) {
        queryClient.setQueryData<Comment[]>(
          commentKeys.byPost(variables.postId),
          (old) => {
            if (!old) {
              return old;
            }

            return updateCommentInTree(old, variables.targetId, (comment) => ({
              ...comment,
              reactionCounts: context.previousCommentCounts!,
            }));
          },
        );
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          isReactionQueryForTarget(
            query.queryKey,
            variables.targetType,
            variables.targetId,
          ),
      });

      if (variables.targetType === "post") {
        queryClient.invalidateQueries({
          queryKey: postKeys.detail(variables.targetId),
        });

        queryClient.invalidateQueries({
          queryKey: postKeys.feeds(),
        });
      }

      if (variables.targetType === "comment" && variables.postId) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.byPost(variables.postId),
        });
      }
    },
  });
}
