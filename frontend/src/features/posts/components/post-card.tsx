"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiCheck,
  FiEdit2,
  FiMessageCircle,
  FiShare2,
  FiThumbsDown,
  FiThumbsUp,
  FiTrash2,
} from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { formatDateTime, getInitials, resolveAvatarUrl } from "@/lib/utils/formatters";

import type { Post } from "../types/post";

interface PostCardProps {
  post: Post;
  onDelete?: (post: Post) => void;
  isDeleting?: boolean;
}

export function PostCard({
  post,
  onDelete,
  isDeleting = false,
}: PostCardProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

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
      <div className="p-6 sm:p-7">
        {/* --------------------------------
            Author
        -------------------------------- */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            {/* Avatar / Initials */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs ring-2 ring-white/90">
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc ?? undefined}
                  alt={`${post.authorId.name}'s avatar`}
                  className="h-full w-full object-cover"
                  onError={() => setFailedAvatarSrc(avatarSrc)}
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold font-manrope text-xs shadow-inner">
                  {getInitials(post.authorId.name)}
                </div>
              )}
            </div>

            {/* Author information */}
            <div className="min-w-0">
              <p className="truncate font-manrope text-sm font-bold text-slate-900">
                {post.authorId.name}
              </p>

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
              Owner / Admin controls
          -------------------------------- */}
          {canManagePost && (
            <div className="flex shrink-0 items-center gap-2">
              {/* Edit Button */}
              <Link
                href={`/posts/${post.id}/edit`}
                aria-label={`Edit ${post.title}`}
                title="Edit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope shadow-2xs backdrop-blur-md transition-all cursor-pointer"
              >
                <FiEdit2 className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Edit</span>
              </Link>

              {/* Delete Button */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  disabled={isDeleting}
                  aria-label={`Delete ${post.title}`}
                  title="Delete"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/90 bg-rose-50/80 hover:bg-rose-100 text-rose-700 hover:text-rose-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope shadow-2xs backdrop-blur-md transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiTrash2 className="h-3.5 w-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* --------------------------------
            Post content
        -------------------------------- */}
        <div className="mt-5">
          <Link href={`/posts/${post.id}`} className="block">
            <h2 className="font-manrope text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {post.title}
            </h2>
          </Link>

          <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-700 font-sans">
            {post.body}
          </p>
        </div>

        {/* --------------------------------
            Counters + Read Post
        -------------------------------- */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          {/* Frosted Glass Reaction & Comment Counters + Share */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Likes */}
            <div
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs backdrop-blur-md"
              title="Likes"
            >
              <FiThumbsUp className="h-3.5 w-3.5 text-indigo-600" />
              <span className="font-bold text-slate-900">{post.reactionCounts.like}</span>
              <span className="hidden sm:inline text-slate-600 font-medium">Likes</span>
            </div>

            {/* Dislikes */}
            <div
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs backdrop-blur-md"
              title="Dislikes"
            >
              <FiThumbsDown className="h-3.5 w-3.5 text-rose-500" />
              <span className="font-bold text-slate-900">{post.reactionCounts.dislike}</span>
              <span className="hidden sm:inline text-slate-600 font-medium">Dislikes</span>
            </div>

            {/* Comment */}
            <div
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs backdrop-blur-md"
              title="Comments"
            >
              <FiMessageCircle className="h-3.5 w-3.5 text-sky-500" />
              <span className="font-bold text-slate-900">{post.commentCount}</span>
              <span className="hidden sm:inline text-slate-600 font-medium">Comment</span>
            </div>

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
                  <span className="hidden sm:inline font-bold text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <FiShare2 className="h-3.5 w-3.5 text-violet-600 transition-colors group-hover/share:text-violet-700" />
                  <span className="hidden sm:inline font-medium text-slate-700">Share</span>
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
    </article>
  );
}
