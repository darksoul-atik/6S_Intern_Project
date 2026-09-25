"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheck,
  FiEdit2,
  FiMessageCircle,
  FiMoreVertical,
  FiShare2,
  FiTrash2,
} from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import {
  formatDateTime,
  getInitials,
  resolveAvatarUrl,
} from "@/lib/utils/formatters";
import { ReactionButtons } from "@/features/reactions/components/reaction-buttons";
import { PostReactorsSummary } from "@/features/reactions/components/post-reactors-summary";

import type { Post } from "../types/post";
import type { UserReactionState } from "@/features/reactions/types/reaction";

interface PostCardProps {
  post: Post;
  currentReaction?: UserReactionState;
  onDelete?: (post: Post) => void;
  isDeleting?: boolean;
}

export function PostCard({
  post,
  currentReaction,
  onDelete,
  isDeleting = false,
}: PostCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close three-dot dropdown on outside click or Escape key
  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMenu]);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const postUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/posts/${post.id}`
        : `/posts/${post.id}`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = postUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silent handling
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Avatar
  |--------------------------------------------------------------------------
  */

  const avatarSrc = resolveAvatarUrl(post.authorId.avatarUrl);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);

  const showAvatar = Boolean(avatarSrc && failedAvatarSrc !== avatarSrc);

  /*
  |--------------------------------------------------------------------------
  | Permission
  |--------------------------------------------------------------------------
  */

  const canManagePost =
    Boolean(user) && (user?.role === "admin" || user?.id === post.authorId.id);

  return (
    <article className="group/card overflow-hidden rounded-3xl border border-slate-200/80 bg-white hover:bg-slate-50/80 text-slate-900 shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-200 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-slate-300 hover:-translate-y-0.5">
      <div className="p-4 sm:p-6 md:p-7">
        {/* --------------------------------
            Author
        -------------------------------- */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            {/* Avatar / Initials */}
            <Link
              href={`/developers/${post.authorId.id}`}
              className="group/avatar flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs ring-2 ring-white/90 transition hover:ring-indigo-500/20"
            >
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc ?? undefined}
                  alt={`${post.authorId.name}'s avatar`}
                  className="h-full w-full object-cover transition-transform group-hover/avatar:scale-105"
                  onError={() => setFailedAvatarSrc(avatarSrc)}
                />
              ) : (
                <div className="h-full w-full bg-linear-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold font-manrope text-xs shadow-inner transition-transform group-hover/avatar:scale-105">
                  {getInitials(post.authorId.name)}
                </div>
              )}
            </Link>

            {/* Author information */}
            <div className="min-w-0">
              <Link
                href={`/developers/${post.authorId.id}`}
                className="block truncate font-manrope text-sm font-bold text-slate-900 transition-colors hover:text-indigo-600 hover:underline"
              >
                {post.authorId.name}
              </Link>

              {post.authorId.headline && (
                <p className="truncate text-xs font-medium text-slate-600 font-sans">
                  {post.authorId.headline}
                </p>
              )}

              {/* Timestamp with Date and Time */}
              <p className="mt-0.5 text-xs font-medium text-slate-500 font-sans">
                {formatDateTime(post.createdAt)}
              </p>
            </div>
          </div>

          {/* --------------------------------
              Owner / Admin controls (Three-dot menu)
          -------------------------------- */}
          {canManagePost && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu((prev) => !prev);
                }}
                aria-label="Post options"
                aria-expanded={showMenu}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              >
                <FiMoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-32.5 overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 py-1 shadow-lg backdrop-blur-md">
                  <Link
                    href={`/posts/${post.id}/edit`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold font-manrope text-slate-700 transition hover:bg-slate-100/80 hover:text-indigo-600"
                  >
                    <FiEdit2 className="h-3.5 w-3.5 text-amber-500" />
                    Edit
                  </Link>

                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowMenu(false);
                        onDelete(post);
                      }}
                      disabled={isDeleting}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold font-manrope text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiTrash2 className="h-3.5 w-3.5 text-rose-500" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* --------------------------------
            Post content
        -------------------------------- */}
        <div className="mt-5 flex-1">
          <Link href={`/posts/${post.id}`} className="block">
            <h2 className="font-manrope text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 break-words">
              {post.title}
            </h2>
          </Link>

          <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs sm:text-sm leading-6 text-slate-700 font-sans break-words">
            {post.body}
          </p>
        </div>

        {/* --------------------------------
            Reactors Summary + Counters & Read Post
        -------------------------------- */}
        <div className="mt-4">
          <PostReactorsSummary
            postId={post.id}
            reactionCounts={post.reactionCounts}
            className="mb-1.5"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          {/* Frosted Glass Reaction & Comment Counters + Share */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Likes & Dislikes */}
            <ReactionButtons
              targetType="post"
              targetId={post.id}
              counts={post.reactionCounts}
              currentReaction={currentReaction}
            />

            {/* Comment Link */}
            <Link
              href={`/posts/${post.id}?focus=comment#comments`}
              className="group/comment inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-sky-50/90 hover:border-sky-300 hover:text-sky-700 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs backdrop-blur-md transition-all active:scale-95"
              title="Leave a comment"
              aria-label={`${post.commentCount} comments. Click to view and comment.`}
            >
              <FiMessageCircle className="h-3.5 w-3.5 text-sky-500 transition-transform group-hover/comment:scale-110" />
              <span className="font-bold text-slate-900 group-hover/comment:text-sky-950">
                {post.commentCount}
              </span>
              <span className="hidden sm:inline text-slate-600 font-medium group-hover/comment:text-sky-800">
                {post.commentCount === 1 ? "Comment" : "Comments"}
              </span>
            </Link>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              title={copied ? "Copied!" : "Share post URL"}
              aria-label="Share post"
              className={`group/share inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope shadow-2xs backdrop-blur-md transition-all ${
                copied
                  ? "border-emerald-300 bg-emerald-50/90 text-emerald-700"
                  : "border-slate-200/90 bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              {copied ? (
                <>
                  <FiCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline font-bold text-emerald-700">
                    Copied!
                  </span>
                </>
              ) : (
                <>
                  <FiShare2 className="h-3.5 w-3.5 text-violet-600 transition-colors group-hover/share:text-violet-700" />
                  <span className="hidden sm:inline font-medium text-slate-700">
                    Share
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Read Post Button */}
          <div className="flex w-full sm:w-auto justify-end ml-auto">
            <Link
              href={`/posts/${post.id}`}
              className="group/read inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] text-white px-3.5 py-2 text-xs font-semibold font-manrope shadow-md hover:shadow-lg hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              <span>Read Post</span>
              <FiArrowRight className="h-3.5 w-3.5 text-indigo-400 group-hover/read:text-purple-300 transition-transform group-hover/read:translate-x-0.5" />
            </Link>
          </div>
        </div>
        </div>
      </div>
    </article>
  );
}
