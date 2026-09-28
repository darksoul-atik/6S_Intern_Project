"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiArrowRight, FiSmile } from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { useReactors } from "../queries/reaction-queries";
import { ReactorsModal } from "./reactors-modal";
import type { ReactionCounts, ReactorItem } from "../types/reaction";

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

  const renderReactorLink = (reactor?: ReactorItem) => {
    if (!reactor) return null;
    if (!reactor.userId) {
      return (
        <strong className="font-semibold text-slate-800">
          {reactor.name}
        </strong>
      );
    }
    return (
      <Link
        href={`/developers/${reactor.userId}`}
        className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors"
        title={`View ${reactor.name}'s profile`}
      >
        {reactor.name}
      </Link>
    );
  };

  const renderSummaryContent = () => {
    const firstReactor = items[0];
    const secondReactor = items[1];

    // If only 1 reactor item is available
    if (!secondReactor || items.length === 1) {
      if (total <= 1) {
        return (
          <span className="inline-flex items-center gap-1 flex-wrap">
            {renderReactorLink(firstReactor)}
            <span>reacted to this post</span>
          </span>
        );
      }

      const othersCount = total - 1;
      return (
        <span className="inline-flex items-center gap-1 flex-wrap">
          {renderReactorLink(firstReactor)}
          <span>and</span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors cursor-pointer"
            title="View all who reacted"
          >
            {othersCount} {othersCount === 1 ? "other" : "others"}
          </button>
          <span>reacted to this post</span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer ml-0.5"
            title="View all reactors"
          >
            <span>View all</span>
            <FiArrowRight className="h-3 w-3" />
          </button>
        </span>
      );
    }

    // We have at least 2 reactor items
    if (total === 2) {
      return (
        <span className="inline-flex items-center gap-1 flex-wrap">
          {renderReactorLink(firstReactor)}
          <span>and</span>
          {renderReactorLink(secondReactor)}
          <span>reacted to this post</span>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer ml-0.5"
            title="View all reactors"
          >
            <span>View all</span>
            <FiArrowRight className="h-3 w-3" />
          </button>
        </span>
      );
    }

    const remaining = total - 2;
    return (
      <span className="inline-flex items-center gap-1 flex-wrap">
        {renderReactorLink(firstReactor)}
        <span>,</span>
        {renderReactorLink(secondReactor)}
        <span>and</span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors cursor-pointer"
          title="View all who reacted"
        >
          {remaining} {remaining === 1 ? "other" : "others"}
        </button>
        <span>reacted to this post</span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer ml-0.5"
          title="View all reactors"
        >
          <span>View all</span>
          <FiArrowRight className="h-3 w-3" />
        </button>
      </span>
    );
  };

  return (
    <>
      <div
        className={`flex items-center gap-1.5 text-left text-[11px] sm:text-xs text-slate-500 max-w-full flex-wrap ${className}`}
      >
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500/10 to-purple-500/15 text-indigo-600 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all cursor-pointer"
          title="Click to view all reactors"
          aria-label="View all reactors"
        >
          <FiSmile className="h-3 w-3" />
        </button>

        <div className="leading-tight flex-wrap">{renderSummaryContent()}</div>
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
