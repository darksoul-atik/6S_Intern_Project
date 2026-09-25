"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiThumbsDown, FiThumbsUp } from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { useUserReactions } from "../queries/reaction-queries";
import {
  computeCountsFromBase,
  useToggleReactionMutation,
} from "../mutations/reaction-mutations";
import {
  getStoredReactions,
  updateStoredReaction,
} from "../utils/reaction-storage";

import type {
  ReactionCounts,
  ReactionTargetType,
  ReactionType,
  UserReactionState,
} from "../types/reaction";

interface ReactionButtonsProps {
  targetType: ReactionTargetType;
  targetId: string;
  postId?: string;
  counts: ReactionCounts;
  currentReaction?: UserReactionState;
  size?: "sm" | "md";
  showLabels?: boolean;
  className?: string;
}

export function ReactionButtons({
  targetType,
  targetId,
  postId,
  counts,
  currentReaction: propReaction,
  size = "md",
  showLabels,
  className = "",
}: ReactionButtonsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: isAuthLoading } = useAuth();
  const toggleMutation = useToggleReactionMutation();

  const { data: userReactions = {}, isLoading: isReactionsLoading } =
    useUserReactions(targetType, [targetId], {
      enabled: propReaction === undefined,
    });

  const serverReaction =
    propReaction !== undefined
      ? propReaction
      : (userReactions[targetId] ?? null);

  // Initialize from props, query cache, or stored reactions (instant 0ms on refresh!)
  const [currentReaction, setCurrentReaction] = useState<UserReactionState>(() => {
    if (propReaction !== undefined) {
      return propReaction;
    }
    if (userReactions[targetId] !== undefined) {
      return userReactions[targetId];
    }
    if (typeof window !== "undefined") {
      const stored = getStoredReactions(targetType);
      return stored[targetId] ?? null;
    }
    return null;
  });

  const [currentCounts, setCurrentCounts] = useState<ReactionCounts>(counts);

  // Synchronous refs to prevent ANY stale closure on rapid clicking
  const currentReactionRef = useRef<UserReactionState>(currentReaction);
  currentReactionRef.current = currentReaction;

  const serverReactionRef = useRef<ReactionType | null>(serverReaction);
  serverReactionRef.current = serverReaction;

  const baseCountsRef = useRef<ReactionCounts>(counts);
  baseCountsRef.current = counts;

  // Track in-flight mutation and desired user target state
  const isMutatingRef = useRef(false);
  const desiredReactionRef = useRef<ReactionType | null>(
    currentReaction ?? null,
  );

  // Synchronize state when server reaction changes externally
  useEffect(() => {
    const next =
      propReaction !== undefined
        ? propReaction
        : (userReactions[targetId] ?? null);

    serverReactionRef.current = next;

    // Only update local UI if no in-flight or pending user interaction is active
    if (
      !isMutatingRef.current &&
      desiredReactionRef.current === currentReactionRef.current
    ) {
      setCurrentReaction(next);
      currentReactionRef.current = next;
      desiredReactionRef.current = next ?? null;
      updateStoredReaction(targetType, targetId, next);
    }
  }, [propReaction, userReactions, targetId, targetType]);

  useEffect(() => {
    baseCountsRef.current = counts;
    if (!isMutatingRef.current) {
      const computed = computeCountsFromBase(
        counts,
        serverReactionRef.current,
        currentReactionRef.current ?? null,
      );
      setCurrentCounts(computed);
    }
  }, [counts]);

  const executeMutation = (targetReaction: ReactionType | null) => {
    isMutatingRef.current = true;

    // The backend is a toggle endpoint.
    // If targetReaction is not null, send targetReaction (which sets or switches to it).
    // If targetReaction is null, send serverReactionRef.current (which removes/untoggles it).
    const actionType: ReactionType | null =
      targetReaction !== null ? targetReaction : serverReactionRef.current;

    if (!actionType) {
      isMutatingRef.current = false;
      return;
    }

    toggleMutation.mutate(
      {
        targetType,
        targetId,
        postId: targetType === "comment" ? postId : undefined,
        type: actionType,
        currentReaction: serverReactionRef.current,
      },
      {
        onSuccess: (data) => {
          serverReactionRef.current = data.reaction;
          baseCountsRef.current = data.reactionCounts;
        },
        onError: () => {
          // Revert to known server state on network error
          const reverted = serverReactionRef.current;
          setCurrentReaction(reverted);
          currentReactionRef.current = reverted;
          desiredReactionRef.current = reverted;
          const revertedCounts = computeCountsFromBase(
            baseCountsRef.current,
            reverted,
            reverted,
          );
          setCurrentCounts(revertedCounts);
          updateStoredReaction(targetType, targetId, reverted);
        },
        onSettled: () => {
          isMutatingRef.current = false;

          // If the user clicked again while the request was in flight, reconcile
          const desired = desiredReactionRef.current;
          const server = serverReactionRef.current;

          if (desired !== server) {
            executeMutation(desired);
          } else {
            const finalCounts = computeCountsFromBase(
              baseCountsRef.current,
              server,
              desired,
            );
            setCurrentCounts(finalCounts);
          }
        },
      },
    );
  };

  const handleReactionClick = (
    event: MouseEvent<HTMLButtonElement>,
    type: ReactionType,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // 1. Read current state from the synchronous ref (NEVER stale, even on 1ms clicks)
    const current = currentReactionRef.current ?? null;
    const nextReaction: ReactionType | null = current === type ? null : type;

    // 2. Immediately update the synchronous refs (0ms!)
    currentReactionRef.current = nextReaction;
    desiredReactionRef.current = nextReaction;

    // 3. Compute deterministic counts from baseline (STRICTLY bounded by [neutral, neutral + 1])
    const nextCounts = computeCountsFromBase(
      baseCountsRef.current,
      serverReactionRef.current,
      nextReaction,
    );

    // 4. Instant UI updates (0ms!)
    setCurrentReaction(nextReaction);
    setCurrentCounts(nextCounts);
    updateStoredReaction(targetType, targetId, nextReaction);

    // 5. If no request is in-flight, execute mutation; otherwise onSettled will execute the latest desired state
    if (!isMutatingRef.current) {
      executeMutation(nextReaction);
    }
  };

  const isLikeActive = currentReaction === "like";
  const isDislikeActive = currentReaction === "dislike";

  const isSm = size === "sm";
  const shouldShowLabels = showLabels !== undefined ? showLabels : !isSm;

  const buttonBaseClass = isSm
    ? "inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border px-2 text-xs font-semibold transition-all active:scale-95 "
    : "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope shadow-2xs backdrop-blur-md transition-all active:scale-95 ";

  const likeActiveClass = isSm
    ? "border-indigo-300 bg-indigo-50/90 text-indigo-700"
    : "border-indigo-300 bg-indigo-50/90 text-indigo-700 shadow-indigo-500/10 ring-2 ring-indigo-500/20";

  const likeInactiveClass = isSm
    ? "border-slate-200/80 bg-slate-50/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300"
    : "border-slate-200/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300";

  const dislikeActiveClass = isSm
    ? "border-rose-300 bg-rose-50/90 text-rose-700"
    : "border-rose-300 bg-rose-50/90 text-rose-700 shadow-rose-500/10 ring-2 ring-rose-500/20";

  const dislikeInactiveClass = isSm
    ? "border-slate-200/80 bg-slate-50/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300"
    : "border-slate-200/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300";

  const getButtonTitle = (type: ReactionType, isActive: boolean) => {
    if (!user) {
      return "Log in to react";
    }

    if (isReactionsLoading && currentReaction === null) {
      return "Loading reaction...";
    }

    if (type === "like") {
      return isActive ? "Liked" : "Like";
    }

    return isActive ? "Disliked" : "Dislike";
  };

  return (
    <div
      className={`inline-flex items-center ${
        isSm ? "gap-1" : "gap-1.5"
      } ${className}`}
    >
      <button
        type="button"
        onClick={(event) => handleReactionClick(event, "like")}
        disabled={isAuthLoading}
        aria-label={isLikeActive ? "Remove like" : "Like"}
        aria-pressed={isLikeActive}
        title={getButtonTitle("like", isLikeActive)}
        className={`group/like ${buttonBaseClass} ${
          isLikeActive ? likeActiveClass : likeInactiveClass
        }`}
      >
        <FiThumbsUp
          className={`h-3.5 w-3.5 transition-colors ${
            isLikeActive
              ? "text-indigo-600 fill-indigo-600/30"
              : "text-indigo-600 group-hover/like:scale-110 transition-transform"
          }`}
        />

        <span
          className={`font-bold tabular-nums ${
            isLikeActive ? "text-indigo-900" : "text-slate-900"
          }`}
        >
          {currentCounts.like}
        </span>

        {shouldShowLabels && (
          <span
            className={`hidden sm:inline font-medium ${
              isLikeActive ? "text-indigo-700" : "text-slate-600"
            }`}
          >
            Likes
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={(event) => handleReactionClick(event, "dislike")}
        disabled={isAuthLoading}
        aria-label={isDislikeActive ? "Remove dislike" : "Dislike"}
        aria-pressed={isDislikeActive}
        title={getButtonTitle("dislike", isDislikeActive)}
        className={`group/dislike ${buttonBaseClass} ${
          isDislikeActive ? dislikeActiveClass : dislikeInactiveClass
        }`}
      >
        <FiThumbsDown
          className={`h-3.5 w-3.5 transition-colors ${
            isDislikeActive
              ? "text-rose-600 fill-rose-600/30"
              : "text-rose-500 group-hover/dislike:scale-110 transition-transform"
          }`}
        />

        <span
          className={`font-bold tabular-nums ${
            isDislikeActive ? "text-rose-900" : "text-slate-900"
          }`}
        >
          {currentCounts.dislike}
        </span>

        {shouldShowLabels && (
          <span
            className={`hidden sm:inline font-medium ${
              isDislikeActive ? "text-rose-700" : "text-slate-600"
            }`}
          >
            Dislikes
          </span>
        )}
      </button>
    </div>
  );
}
