"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiEdit2,
  FiMessageCircle,
  FiThumbsDown,
  FiThumbsUp,
  FiTrash2,
} from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import { formatDate, getInitials } from "@/lib/utils/formatters";

import type { Post } from "../types/post";

interface PostCardProps {
  post: Post;

  /*
   * Task 9 will connect this to
   * the custom soft-delete confirmation modal.
   */
  onDelete?: (post: Post) => void;

  /*
   * Later this prevents repeated delete clicks
   * while DELETE /posts/:id is pending.
   */
  isDeleting?: boolean;
}

/*
|--------------------------------------------------------------------------
| Avatar URL
|--------------------------------------------------------------------------
|
| Backend may return:
|
| /users/:userId/avatar
|
| or an external URL:
|
| https://example.com/avatar.jpg
|
| Relative URLs belong to the NestJS backend,
| not the Next.js frontend.
|--------------------------------------------------------------------------
*/

function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl) {
    return null;
  }

  /*
   * Already an absolute URL.
   */
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  /*
   * Example:
   *
   * /users/123/avatar
   *
   * becomes:
   *
   * http://localhost:5000/users/123/avatar
   */
  return `${apiBaseUrl.replace(/\/$/, "")}/${avatarUrl.replace(/^\//, "")}`;
}

export function PostCard({
  post,
  onDelete,
  isDeleting = false,
}: PostCardProps) {
  const { user } = useAuth();

  /*
  |--------------------------------------------------------------------------
  | Avatar
  |--------------------------------------------------------------------------
  */

  const avatarSrc = resolveAvatarUrl(post.authorId.avatarUrl);

  /*
   * Remember which avatar failed.
   *
   * If the URL changes later, the new URL
   * can still be attempted automatically.
   */
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);

  const showAvatar = Boolean(avatarSrc && failedAvatarSrc !== avatarSrc);

  /*
  |--------------------------------------------------------------------------
  | Permission
  |--------------------------------------------------------------------------
  |
  | Backend rules:
  |
  | Author → edit/delete own post
  | Admin  → edit/delete any post
  |--------------------------------------------------------------------------
  */

  const canManagePost =
    Boolean(user) && (user?.role === "admin" || user?.id === post.authorId.id);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/4 shadow-xl backdrop-blur-xl transition-all duration-200 hover:border-white/15 hover:bg-white/5.5">
      <div className="p-5 sm:p-6">
        {/* --------------------------------
            Author
        -------------------------------- */}

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {/* Avatar / Initials */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-indigo-400/20 bg-linear-to-br from-indigo-500/20 to-purple-500/20 text-sm font-bold text-indigo-200 shadow-sm">
              {showAvatar ? (
                /*
                 * Using normal <img> here keeps the
                 * backend/GridFS image handling simple.
                 */
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

            {/* Author information */}
            <div className="min-w-0">
              <p className="truncate font-manrope text-sm font-bold text-white">
                {post.authorId.name}
              </p>

              {post.authorId.headline && (
                <p className="truncate text-xs text-zinc-400">
                  {post.authorId.headline}
                </p>
              )}

              <p className="mt-0.5 text-[11px] text-zinc-500">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* --------------------------------
              Owner / Admin controls
          -------------------------------- */}

          {canManagePost && (
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Edit */}
              <Link
                href={`/posts/${post.id}/edit`}
                aria-label={`Edit ${post.title}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-zinc-400 transition-colors hover:border-indigo-400/30 hover:bg-indigo-500/10 hover:text-indigo-300"
              >
                <FiEdit2 className="h-4 w-4" />
              </Link>

              {/* Delete */}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(post)}
                  disabled={isDeleting}
                  aria-label={`Delete ${post.title}`}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/4 text-zinc-400 transition-colors hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* --------------------------------
            Post content
        -------------------------------- */}

        <div className="mt-5">
          <Link href={`/posts/${post.id}`} className="group block">
            <h2 className="font-manrope text-lg font-bold tracking-tight text-zinc-100 transition-colors group-hover:text-indigo-300 sm:text-xl">
              {post.title}
            </h2>
          </Link>

          <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-zinc-400">
            {post.body}
          </p>
        </div>

        {/* --------------------------------
            Counters + Read Post
        -------------------------------- */}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            {/* Comments */}
            <div className="flex items-center gap-1.5" title="Comments">
              <FiMessageCircle className="h-4 w-4" />

              <span>{post.commentCount}</span>
            </div>

            {/* Likes */}
            <div className="flex items-center gap-1.5" title="Likes">
              <FiThumbsUp className="h-4 w-4" />

              <span>{post.reactionCounts.like}</span>
            </div>

            {/* Dislikes */}
            <div className="flex items-center gap-1.5" title="Dislikes">
              <FiThumbsDown className="h-4 w-4" />

              <span>{post.reactionCounts.dislike}</span>
            </div>
          </div>

          <Link
            href={`/posts/${post.id}`}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10 hover:text-indigo-200"
          >
            Read post →
          </Link>
        </div>
      </div>
    </article>
  );
}
