"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiChevronRight, FiSmile } from "react-icons/fi";

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
        <strong className="font-semibold text-slate-800 shrink-0">
          {reactor.name}
        </strong>
      );
    }
    return (
      <Link
        href={`/developers/${reactor.userId}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors shrink-0"
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
          <div className="inline-flex items-center gap-1.5 flex-wrap">
            {renderReactorLink(firstReactor)}
            <span className="text-slate-500">reacted to this post</span>
          </div>
        );
      }

      const othersCount = total - 1;
      return (
        <div className="inline-flex items-center gap-1.5 flex-wrap">
          {renderReactorLink(firstReactor)}
          <span className="text-slate-500">and</span>
          <span className="font-semibold text-slate-800">
            {othersCount} {othersCount === 1 ? "other" : "others"}
          </span>
          <span className="text-slate-500">reacted to this post</span>
        </div>
      );
    }

    // We have at least 2 reactor items
    if (total === 2) {
      return (
        <div className="inline-flex items-center gap-1.5 flex-wrap">
          {renderReactorLink(firstReactor)}
          <span className="text-slate-500">and</span>
          {renderReactorLink(secondReactor)}
          <span className="text-slate-500">reacted to this post</span>
        </div>
      );
    }

    const remaining = total - 2;
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        {renderReactorLink(firstReactor)}
        <span className="text-slate-500">,</span>
        {renderReactorLink(secondReactor)}
        <span className="text-slate-500">and</span>
        <span className="font-semibold text-slate-800">
          {remaining} {remaining === 1 ? "other" : "others"}
        </span>
        <span className="text-slate-500">reacted to this post</span>
      </div>
    );
  };

  return (
    <>
      <div className={`flex items-center ${className}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
          className="group/badge inline-flex items-center gap-2 rounded-full bg-slate-100/70 hover:bg-slate-100/90 backdrop-blur-md px-3 py-1 text-[11px] sm:text-xs text-slate-600 shadow-2xs cursor-pointer transition-colors"
          title="Click to see who reacted"
          aria-label="Click to see who reacted to this post"
        >
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100/80 text-indigo-600 group-hover/badge:scale-105 transition-transform">
            <FiSmile className="h-2.5 w-2.5" />
          </div>

          <div className="leading-tight flex items-center">
            {renderSummaryContent()}
          </div>

          <FiChevronRight className="h-3 w-3 text-slate-400 group-hover/badge:text-indigo-600 group-hover/badge:translate-x-0.5 transition-all shrink-0 ml-0.5" />
        </div>
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
