"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiThumbsDown,
  FiThumbsUp,
  FiX,
} from "react-icons/fi";

import { useReactors } from "../queries/reaction-queries";
import type { ReactionTargetType, ReactionType } from "../types/reaction";
import { getInitials, resolveAvatarUrl } from "@/lib/utils/formatters";

interface ReactorsModalProps {
  targetType: ReactionTargetType;
  targetId: string;
  initialType?: ReactionType | "all";
  isOpen: boolean;
  onClose: () => void;
}

const emptySubscribe = () => () => {};

export function ReactorsModal(props: ReactorsModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!props.isOpen || !mounted) return null;

  return createPortal(
    <ReactorsModalContent
      key={`${props.targetId}-${props.initialType ?? "all"}`}
      {...props}
    />,
    document.body,
  );
}

function ReactorsModalContent({
  targetType,
  targetId,
  initialType = "all",
  onClose,
}: ReactorsModalProps) {
  const [selectedType, setSelectedType] = useState<ReactionType | "all">(
    initialType,
  );
  const [page, setPage] = useState(1);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent background scrolling while modal is mounted
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const { data, isLoading, isError, error, refetch } = useReactors({
    targetType,
    targetId,
    type: selectedType === "all" ? undefined : selectedType,
    page,
    limit: 15,
  });

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleTabChange = (type: ReactionType | "all") => {
    setSelectedType(type);
    setPage(1);
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reactors-modal-title"
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs sm:backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          ref={modalRef}
          className="relative flex max-h-[85vh] sm:max-h-[80vh] w-full max-w-[calc(100%-1.5rem)] sm:max-w-md flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-3.5">
            <div className="flex items-center gap-2">
              <h2
                id="reactors-modal-title"
                className="font-manrope text-sm sm:text-base font-bold text-slate-900"
              >
                {targetType === "comment" ? "Comment Reactions" : "Post Reactions"}
              </h2>
              {data && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-slate-600">
                  {data.total}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Reaction Type Tabs */}
          <div className="flex border-b border-slate-100 px-4 sm:px-6 pt-1 sm:pt-1.5">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`border-b-2 px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                selectedType === "all"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("like")}
              className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                selectedType === "like"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FiThumbsUp className="h-3.5 w-3.5" />
              <span>Likes</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("dislike")}
              className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                selectedType === "dislike"
                  ? "border-rose-600 text-rose-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FiThumbsDown className="h-3.5 w-3.5" />
              <span>Dislikes</span>
            </button>
          </div>

          {/* Reactors List Body */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <FiLoader className="h-5 w-5 animate-spin text-indigo-500" />
                <p className="mt-2 text-xs font-medium">Loading reactors...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FiAlertCircle className="h-7 w-7 text-rose-500" />
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load reactors"}
                </p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-3 cursor-pointer rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Retry
                </button>
              </div>
            ) : !data || data.items.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No reactions yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.items.map((reactor) => {
                  const avatarSrc = resolveAvatarUrl(reactor.avatarUrl);
                  return (
                    <li
                      key={reactor.userId}
                      className="flex items-center justify-between py-2.5 sm:py-3 first:pt-0 last:pb-0"
                    >
                      <Link
                        href={`/developers/${reactor.userId}`}
                        onClick={onClose}
                        className="group flex flex-1 min-w-0 items-center gap-2.5 sm:gap-3"
                      >
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition group-hover:ring-2 group-hover:ring-indigo-500/20">
                          {avatarSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarSrc}
                              alt={`${reactor.name}'s avatar`}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-600 to-emerald-500 font-manrope text-xs font-bold text-white transition group-hover:scale-105">
                              {getInitials(reactor.name)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-manrope text-xs sm:text-sm font-bold text-slate-900 transition group-hover:text-indigo-600 group-hover:underline">
                            {reactor.name}
                          </p>
                          {reactor.headline && (
                            <p className="truncate text-[11px] sm:text-xs text-slate-500">
                              {reactor.headline}
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Reaction Type Badge */}
                      <div className="ml-2.5 shrink-0">
                        {reactor.type === "like" ? (
                          <div
                            title="Liked"
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"
                          >
                            <FiThumbsUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-indigo-600/20" />
                          </div>
                        ) : (
                          <div
                            title="Disliked"
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600"
                          >
                            <FiThumbsDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-rose-600/20" />
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Pagination Footer */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2 sm:px-6 sm:py-2.5">
              <span className="text-[11px] sm:text-xs text-slate-500">
                Page {data.page} of {data.totalPages}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  aria-label="Previous page"
                  className="inline-flex h-6 w-6 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronLeft className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages || isLoading}
                  aria-label="Next page"
                  className="inline-flex h-6 w-6 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
