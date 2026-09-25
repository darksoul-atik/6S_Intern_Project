"use client";

import { useState } from "react";
import { FiThumbsUp } from "react-icons/fi";

import { useReactors } from "../queries/reaction-queries";
import { ReactorsModal } from "./reactors-modal";
import type { ReactionCounts } from "../types/reaction";

interface PostReactorsSummaryProps {
  postId: string;
  reactionCounts?: ReactionCounts;
  className?: string;
}

export function PostReactorsSummary({
  postId,
  reactionCounts,
  className = "",
}: PostReactorsSummaryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalReactions =
    (reactionCounts?.like ?? 0) + (reactionCounts?.dislike ?? 0);

  // Lazy fetch reactors only if this post has at least 1 reaction
  const { data } = useReactors(
    {
      targetType: "post",
      targetId: postId,
      limit: 3,
    },
    {
      enabled: totalReactions > 0,
    },
  );

  // If there are no reactions, render nothing
  if (totalReactions === 0 || !data || data.total === 0 || data.items.length === 0) {
    return null;
  }

  const { items, total } = data;

  const renderSummaryText = () => {
    if (total === 1) {
      return (
        <span>
          <strong className="font-semibold text-slate-700">{items[0].name}</strong>{" "}
          reacted to this post
        </span>
      );
    }

    if (total === 2) {
      return (
        <span>
          <strong className="font-semibold text-slate-700">{items[0].name}</strong>{" "}
          and{" "}
          <strong className="font-semibold text-slate-700">{items[1].name}</strong>{" "}
          reacted to this post
        </span>
      );
    }

    const remaining = total - 2;
    return (
      <span>
        <strong className="font-semibold text-slate-700">{items[0].name}</strong>,{" "}
        <strong className="font-semibold text-slate-700">{items[1].name}</strong>{" "}
        and{" "}
        <strong className="font-semibold text-slate-700">
          {remaining} {remaining === 1 ? "other" : "others"}
        </strong>{" "}
        reacted to this post
      </span>
    );
  };

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group inline-flex cursor-pointer items-center gap-1.5 text-left text-xs text-slate-500 transition hover:text-indigo-600 focus:outline-hidden"
          title="Click to view all reactors"
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
            <FiThumbsUp className="h-2.5 w-2.5 fill-indigo-600/30" />
          </div>

          <span className="group-hover:underline">{renderSummaryText()}</span>
        </button>
      </div>

      <ReactorsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetType="post"
        targetId={postId}
        initialType="all"
      />
    </>
  );
}
