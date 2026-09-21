"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiEdit2,
  FiMessageCircle,
  FiRefreshCw,
  FiThumbsDown,
  FiThumbsUp,
  FiTrash2,
} from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { formatDate, getInitials } from "@/lib/formatters";

import { type Post, usePost } from "./posts.api";

interface PostDetailsProps {
  postId: string;

  /*
   * Task 9 will connect this to the
   * custom delete confirmation modal.
   */
  onDelete?: (post: Post) => void;

  isDeleting?: boolean;
}

function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) {
    return null;
  }

  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  return `${apiBaseUrl.replace(/\/$/, "")}/${avatarUrl.replace(/^\//, "")}`;
}

/*
|--------------------------------------------------------------------------
| Loading skeleton
|--------------------------------------------------------------------------
*/

function PostDetailsSkeleton() {
  return (
    <div
      aria-label="Loading post"
      aria-live="polite"
      className="animate-pulse rounded-3xl border border-white/10 bg-white/4 p-6 shadow-xl backdrop-blur-xl sm:p-8"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-white/10" />

        <div className="flex-1">
          <div className="h-3 w-32 rounded bg-white/10" />
          <div className="mt-2 h-2.5 w-44 rounded bg-white/[0.07]" />
          <div className="mt-2 h-2 w-20 rounded bg-white/6" />
        </div>
      </div>

      <div className="mt-8 h-8 w-3/4 rounded bg-white/10" />

      <div className="mt-6 space-y-3">
        <div className="h-3 w-full rounded bg-white/[0.07]" />
        <div className="h-3 w-full rounded bg-white/[0.07]" />
        <div className="h-3 w-11/12 rounded bg-white/[0.07]" />
        <div className="h-3 w-4/5 rounded bg-white/[0.07]" />
      </div>
    </div>
  );
}

export function PostDetails({
  postId,
  onDelete,
  isDeleting = false,
}: PostDetailsProps) {
  const { user } = useAuth();

  const { data: post, isPending, isError, error, refetch } = usePost(postId);

  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isPending) {
    return <PostDetailsSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (isError || !post) {
    const message =
      error instanceof Error ? error.message : "Could not load this post.";

    return (
      <div
        role="alert"
        className="rounded-3xl border border-rose-400/20 bg-rose-500/6 px-6 py-12 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
          <FiAlertCircle className="h-6 w-6" />
        </div>

        <h2 className="mt-4 font-manrope text-xl font-bold text-white">
          Could not load this post
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
          {message}
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10"
          >
            <FiRefreshCw className="h-4 w-4" />
            Try again
          </button>

          <Link
            href="/posts"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to feed
          </Link>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Avatar
  |--------------------------------------------------------------------------
  */

  const avatarSrc = resolveAvatarUrl(post.authorId.avatarUrl);

  const showAvatar = Boolean(avatarSrc && failedAvatarSrc !== avatarSrc);

  /*
  |--------------------------------------------------------------------------
  | Permission
  |--------------------------------------------------------------------------
  |
  | Author can manage own post.
  | Admin can manage any post.
  |--------------------------------------------------------------------------
  */

  const canManagePost =
    Boolean(user) && (user?.role === "admin" || user?.id === post.authorId.id);

  return (
    <article className="rounded-3xl border border-white/10 bg-white/4 shadow-xl backdrop-blur-xl">
      <div className="p-6 sm:p-8">
        {/* Top row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Author */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-400/20 bg-linear-to-br from-indigo-500/20 to-purple-500/20 text-sm font-bold text-indigo-200">
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc ?? undefined}
                  alt={`${post.authorId.name}'s avatar`}
                  className="h-full w-full object-cover"
                  onError={() => setFailedAvatarSrc(avatarSrc)}
                />
              ) : (
                <span>{getInitials(post.authorId.name)}</span>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-manrope text-sm font-bold text-white">
                {post.authorId.name}
              </p>

              {post.authorId.headline && (
                <p className="truncate text-xs text-zinc-400">
                  {post.authorId.headline}
                </p>
              )}

              <p className="mt-1 text-xs text-zinc-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Owner / Admin actions */}
          {canManagePost && (
            <div className="flex items-center gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-300"
              >
                <FiEdit2 className="h-4 w-4" />
                Edit
              </Link>

              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  disabled={isDeleting}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3.5 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-8 font-manrope text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {post.title}
        </h1>

        {/* Full body */}
        <div className="mt-6 whitespace-pre-wrap wrap-break-word text-[15px] leading-8 text-zinc-300">
          {post.body}
        </div>

        {/* Counters */}
        <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-white/10 pt-5 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <FiMessageCircle className="h-4 w-4" />

            <span>{post.commentCount}</span>

            <span className="text-zinc-500">comments</span>
          </div>

          <div className="flex items-center gap-2">
            <FiThumbsUp className="h-4 w-4" />

            <span>{post.reactionCounts.like}</span>

            <span className="text-zinc-500">likes</span>
          </div>

          <div className="flex items-center gap-2">
            <FiThumbsDown className="h-4 w-4" />

            <span>{post.reactionCounts.dislike}</span>

            <span className="text-zinc-500">dislikes</span>
          </div>
        </div>
      </div>
    </article>
  );
}
