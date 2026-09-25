"use client";

import { useMemo, useState } from "react";
import { FiSmile } from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
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
  const { user } = useAuth();
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

  const effectiveData = useMemo(() => {
    if (data && data.total > 0 && data.items.length > 0) {
      return data;
    }

    if (totalReactions > 0 && user) {
      return {
        items: [
          {
            userId: user.id,
            name: user.name,
            headline: user.headline ?? null,
            avatarUrl: user.avatarUrl ?? null,
            type: "like" as const,
            createdAt: new Date().toISOString(),
          },
        ],
        total: totalReactions,
        page: 1,
        limit: 3,
        totalPages: 1,
      };
    }

    return null;
  }, [data, totalReactions, user]);

  // If there are no reactions, render nothing
  if (totalReactions === 0 || !effectiveData || effectiveData.total === 0 || effectiveData.items.length === 0) {
    return null;
  }

  const { items, total } = effectiveData;

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
      <div className={`flex items-center ${className}`}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="group inline-flex cursor-pointer items-center gap-1.5 text-left text-xs text-slate-500 transition hover:text-indigo-600 focus:outline-hidden"
          title="Click to view all reactors"
        >
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500/10 to-purple-500/15 text-indigo-600 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all">
            <FiSmile className="h-3 w-3" />
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
