"use client";

import { usePathname, useRouter } from "next/navigation";
import { FiThumbsDown, FiThumbsUp } from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { useUserReactions } from "../queries/reaction-queries";
import { useToggleReactionMutation } from "../mutations/reaction-mutations";
import type { ReactionCounts, ReactionTargetType, ReactionType } from "../types/reaction";

interface ReactionButtonsProps {
  targetType: ReactionTargetType;
  targetId: string;
  postId?: string; // Parent post ID when targetType is 'comment'
  counts: ReactionCounts;
  size?: "sm" | "md";
  showLabels?: boolean;
  className?: string;
}

export function ReactionButtons({
  targetType,
  targetId,
  postId,
  counts,
  size = "md",
  showLabels,
  className = "",
}: ReactionButtonsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: userReactions = {} } = useUserReactions(targetType, [targetId]);
  const currentReaction = userReactions[targetId] ?? null;

  const toggleMutation = useToggleReactionMutation();
  const isBusy = toggleMutation.isPending;

  const handleReactionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    type: ReactionType,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (isBusy) return;

    toggleMutation.mutate({
      targetType,
      targetId,
      postId: targetType === "comment" ? postId : undefined,
      type,
      currentReaction,
    });
  };

  const isLikeActive = currentReaction === "like";
  const isDislikeActive = currentReaction === "dislike";

  const isSm = size === "sm";
  const shouldShowLabels = showLabels !== undefined ? showLabels : !isSm;

  const buttonBaseClass = isSm
    ? "inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border px-2 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
    : "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope shadow-2xs backdrop-blur-md transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";

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

  return (
    <div className={`inline-flex items-center ${isSm ? "gap-1" : "gap-1.5"} ${className}`}>
      {/* Like Button */}
      <button
        type="button"
        onClick={(e) => handleReactionClick(e, "like")}
        disabled={isBusy}
        aria-label={isLikeActive ? "Remove like" : "Like"}
        title={isLikeActive ? "Liked" : "Like"}
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
          {counts.like}
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

      {/* Dislike Button */}
      <button
        type="button"
        onClick={(e) => handleReactionClick(e, "dislike")}
        disabled={isBusy}
        aria-label={isDislikeActive ? "Remove dislike" : "Dislike"}
        title={isDislikeActive ? "Disliked" : "Dislike"}
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
          {counts.dislike}
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
