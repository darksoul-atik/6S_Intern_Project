"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiLoader, FiThumbsDown, FiThumbsUp } from "react-icons/fi";

import { useReactors } from "../queries/reaction-queries";
import type { ReactionTargetType, ReactionType } from "../types/reaction";
import { getInitials, resolveAvatarUrl } from "@/lib/utils/formatters";

interface ReactionPeekPopoverProps {
  targetType: ReactionTargetType;
  targetId: string;
  type: ReactionType;
  count: number;
  isOpen: boolean;
  onOpenModal: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function ReactionPeekPopover({
  targetType,
  targetId,
  type,
  count,
  isOpen,
  onOpenModal,
  onMouseEnter,
  onMouseLeave,
}: ReactionPeekPopoverProps) {
  const isLike = type === "like";

  const { data, isLoading } = useReactors(
    {
      targetType,
      targetId,
      type,
      limit: 3,
    },
    {
      enabled: isOpen && count > 0,
    },
  );

  const reactors = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? count;
  const remaining = Math.max(0, total - reactors.length);

  return (
    <AnimatePresence>
      {isOpen && count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={`absolute bottom-full mb-2 z-40 w-44 sm:w-48 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-xl backdrop-blur-md pointer-events-auto text-left ${
            isLike
              ? "left-0 sm:left-1/2 sm:-translate-x-1/2"
              : "right-0 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto"
          }`}
          role="tooltip"
        >
          {/* Arrow */}
          <div
            className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-slate-200/90 bg-white ${
              isLike
                ? "left-4 sm:left-1/2 sm:-translate-x-1/2"
                : "right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto"
            }`}
          />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              {isLike ? (
                <FiThumbsUp className="h-3.5 w-3.5 text-indigo-600 fill-indigo-600/30" />
              ) : (
                <FiThumbsDown className="h-3.5 w-3.5 text-rose-600 fill-rose-600/30" />
              )}
              <span className="text-[11px] sm:text-xs font-bold text-slate-800">
                {count} {isLike ? (count === 1 ? "Like" : "Likes") : (count === 1 ? "Dislike" : "Dislikes")}
              </span>
            </div>

            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Reactors
            </span>
          </div>

          {/* Body */}
          {isLoading && reactors.length === 0 ? (
            <div className="flex items-center justify-center py-2 text-slate-400">
              <FiLoader className="h-3.5 w-3.5 animate-spin text-indigo-500" />
            </div>
          ) : reactors.length === 0 ? (
            <p className="py-1 text-center text-xs text-slate-400">
              No details available
            </p>
          ) : (
            <ul className="space-y-1.5">
              {reactors.map((reactor) => {
                const avatarSrc = resolveAvatarUrl(reactor.avatarUrl);
                return (
                  <li
                    key={reactor.userId}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc}
                          alt={reactor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-600 to-emerald-500 text-[10px] font-bold text-white">
                          {getInitials(reactor.name)}
                        </div>
                      )}
                    </div>

                    <span className="truncate text-[11px] sm:text-xs font-medium text-slate-700">
                      {reactor.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Remaining count text */}
          {remaining > 0 && (
            <p className="mt-1.5 text-[10px] font-medium text-slate-500 text-center">
              ...and {remaining} {remaining === 1 ? "other" : "others"}
            </p>
          )}

          {/* View all button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal();
            }}
            className="mt-2 block w-full rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 py-1 text-center text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
          >
            View all {count} →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
