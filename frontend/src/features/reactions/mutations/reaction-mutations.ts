import {
  useMutation,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";

import { toggleReaction } from "@/services/api/reactions";
import { postKeys } from "@/features/posts/queries/post-queries";
import { commentKeys } from "@/features/comments/queries/comment-queries";

import { useAuth } from "@/context/AuthContext";
import { reactionKeys, reactorKeys } from "../queries/reaction-queries";
import { updateStoredReaction } from "../utils/reaction-storage";

import type {
  PaginatedReactorsResult,
  ReactionCounts,
  ReactionTargetType,
  ReactionType,
  ReactorItem,
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

export function updateReactionMap(
  old: UserReactionsMap | undefined,
  targetId: string,
  reaction: ReactionType | null,
): UserReactionsMap {
  const updated: UserReactionsMap = { ...(old ?? {}) };

  if (reaction) {
    updated[targetId] = reaction;
  } else {
    delete updated[targetId];
  }

  return updated;
}

export function computeCountsFromBase(
  serverCounts: ReactionCounts,
  serverReaction: ReactionType | null,
  userReaction: ReactionType | null,
): ReactionCounts {
  // 1. Calculate neutral counts (without this user's reaction)
  let neutralLike = serverCounts.like;
  let neutralDislike = serverCounts.dislike;

  if (serverReaction === "like") {
    neutralLike = Math.max(0, neutralLike - 1);
  } else if (serverReaction === "dislike") {
    neutralDislike = Math.max(0, neutralDislike - 1);
  }

  // 2. Apply userReaction onto neutral counts
  let like = neutralLike;
  let dislike = neutralDislike;

  if (userReaction === "like") {
    like += 1;
  } else if (userReaction === "dislike") {
    dislike += 1;
  }

  return { like, dislike };
}

export function calculateNewCounts(
  currentCounts: ReactionCounts,
  currentReaction: ReactionType | null,
  newReaction: ReactionType | null,
): ReactionCounts {
  return computeCountsFromBase(currentCounts, currentReaction, newReaction);
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
    const post = page.posts.find(
      (item) => item.id === targetId || (item as unknown as { _id?: string })._id === targetId,
    );

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
        post.id === targetId || (post as unknown as { _id?: string })._id === targetId
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
  const { user } = useAuth();

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

      const exactTargetKey = reactionKeys.mine(targetType, [targetId]);
      const exactData = queryClient.getQueryData<UserReactionsMap>(exactTargetKey);

      const reactionQueries = queryClient.getQueriesData<UserReactionsMap>({
        queryKey: [...reactionKeys.all, "mine", targetType],
      });

      const trackedKeys = new Set<string>();

      context.previousReactions = reactionQueries
        .filter(([queryKey]) =>
          isReactionQueryForTarget(queryKey, targetType, targetId),
        )
        .map(([queryKey, data]) => {
          trackedKeys.add(JSON.stringify(queryKey));
          return {
            queryKey,
            previousReaction: data?.[targetId] ?? null,
          };
        });

      if (!trackedKeys.has(JSON.stringify(exactTargetKey))) {
        context.previousReactions.push({
          queryKey: exactTargetKey,
          previousReaction: exactData?.[targetId] ?? null,
        });
      }

      for (const snapshot of context.previousReactions) {
        queryClient.setQueryData<UserReactionsMap>(snapshot.queryKey, (old) =>
          updateReactionMap(old, targetId, nextReaction),
        );
      }

      queryClient.setQueryData<UserReactionsMap>(exactTargetKey, (old) =>
        updateReactionMap(old, targetId, nextReaction),
      );

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

        // Optimistically update reactor summary cache for this post
        if (user) {
          const reactorsKey = reactorKeys.list({
            targetType: "post",
            targetId,
            limit: 3,
          });

          queryClient.setQueryData<PaginatedReactorsResult>(reactorsKey, (old) => {
            const userItem: ReactorItem = {
              userId: user.id,
              name: user.name,
              headline: user.headline ?? null,
              avatarUrl: user.avatarUrl ?? null,
              type: nextReaction ?? "like",
              createdAt: new Date().toISOString(),
            };

            if (!old) {
              if (nextReaction === null) return old;
              return {
                items: [userItem],
                total: 1,
                page: 1,
                limit: 3,
                totalPages: 1,
              };
            }

            const existingIndex = old.items.findIndex(
              (item) => item.userId === user.id,
            );

            if (nextReaction === null) {
              // User removed their reaction
              const newItems = old.items.filter((item) => item.userId !== user.id);
              return {
                ...old,
                items: newItems,
                total: Math.max(0, old.total - (existingIndex >= 0 ? 1 : 0)),
              };
            }

            // User added or switched reaction
            if (existingIndex >= 0) {
              const updatedItems = [...old.items];
              updatedItems[existingIndex] = {
                ...updatedItems[existingIndex],
                type: nextReaction,
              };
              return {
                ...old,
                items: updatedItems,
              };
            }

            return {
              ...old,
              items: [userItem, ...old.items].slice(0, 3),
              total: old.total + 1,
            };
          });
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

    onSuccess: (data, variables) => {
      const exactTargetKey = reactionKeys.mine(variables.targetType, [
        variables.targetId,
      ]);

      // 1. Update exact single-target query cache
      queryClient.setQueryData<UserReactionsMap>(exactTargetKey, (old) =>
        updateReactionMap(old, variables.targetId, data.reaction),
      );

      // 2. D12-7C: Batch-cache consistency fix
      // Update ALL batched and 'all' reaction queries containing this target
      queryClient.setQueriesData<UserReactionsMap>(
        {
          predicate: (query) =>
            isReactionQueryForTarget(
              query.queryKey,
              variables.targetType,
              variables.targetId,
            ),
        },
        (old) => updateReactionMap(old, variables.targetId, data.reaction),
      );

      // 3. Keep local storage in sync with server-confirmed reaction
      if (typeof window !== "undefined") {
        updateStoredReaction(
          variables.targetType,
          variables.targetId,
          data.reaction,
        );
      }

      if (variables.targetType === "post") {
        queryClient.setQueryData<Post>(
          postKeys.detail(variables.targetId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              reactionCounts: data.reactionCounts,
            };
          },
        );

        queryClient.setQueriesData<InfiniteData<PaginatedPostsResponse>>(
          { queryKey: postKeys.feeds() },
          (old) => {
            if (!old) return old;
            return updatePostInFeed(
              old,
              variables.targetId,
              data.reactionCounts,
            );
          },
        );
      }

      if (variables.targetType === "comment" && variables.postId) {
        queryClient.setQueryData<Comment[]>(
          commentKeys.byPost(variables.postId),
          (old) => {
            if (!old) return old;
            return updateCommentInTree(old, variables.targetId, (comment) => ({
              ...comment,
              reactionCounts: data.reactionCounts,
            }));
          },
        );
      }

      // Invalidate reactors queries so all reactor lists and summaries remain fresh
      queryClient.invalidateQueries({
        queryKey: reactorKeys.all,
      });
    },

    onError: (_error, variables, context) => {
      if (!context) {
        return;
      }

      if (typeof window !== "undefined") {
        const prev = context.previousReactions[0]?.previousReaction ?? null;
        updateStoredReaction(variables.targetType, variables.targetId, prev);
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

    onSettled: (_data, error, variables) => {
      // Invalidate reactors queries on settle
      queryClient.invalidateQueries({
        queryKey: reactorKeys.all,
      });

      if (error) {
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
      }
    },
  });
}
