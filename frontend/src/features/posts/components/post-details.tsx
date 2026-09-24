"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiMessageCircle,
  FiRefreshCw,
  FiShare2,
  FiTrash2,
} from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import {
  formatDateTime,
  getInitials,
  resolveAvatarUrl,
} from "@/lib/utils/formatters";

import { DeletePostModal } from "./delete-post-modal";
import { usePost } from "../queries/post-queries";
import { useSoftDeletePostMutation } from "../mutations/post-mutations";
import { ReactionButtons } from "@/features/reactions/components/reaction-buttons";

interface PostDetailsProps {
  postId: string;
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
      className="animate-pulse rounded-3xl border border-slate-200/80 bg-white/95 text-slate-900 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-3.5">
        <div className="h-12 w-12 rounded-2xl bg-slate-200/80" />

        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-36 rounded bg-slate-200/80" />
          <div className="h-2.5 w-48 rounded bg-slate-200/50" />
        </div>
      </div>

      <div className="mt-8 h-8 w-3/4 rounded-xl bg-slate-200/80" />

      <div className="mt-6 space-y-3">
        <div className="h-3.5 w-full rounded bg-slate-200/50" />
        <div className="h-3.5 w-full rounded bg-slate-200/50" />
        <div className="h-3.5 w-11/12 rounded bg-slate-200/50" />
        <div className="h-3.5 w-4/5 rounded bg-slate-200/50" />
      </div>
    </div>
  );
}

export function PostDetails({ postId }: PostDetailsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: post, isPending, isError, error, refetch } = usePost(postId);

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const deleteMutation = useSoftDeletePostMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Avatar fallback
  |--------------------------------------------------------------------------
  */

  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Share handler
  |--------------------------------------------------------------------------
  */

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!post) return;

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
  | Delete handlers
  |--------------------------------------------------------------------------
  */

  const handleOpenDelete = () => {
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    if (deleteMutation.isPending) return;
    setDeleteError(null);
    setIsDeleteOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!post) return;
    if (deleteMutation.isPending) return;

    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(post.id);
      setIsDeleteOpen(false);
      router.push("/posts");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete post.",
      );
    }
  };

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
        className="rounded-3xl border border-rose-200/80 bg-white/80 p-8 sm:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <FiAlertCircle className="h-6 w-6" />
        </div>

        <h2 className="mt-4 font-manrope text-xl font-bold text-slate-900">
          Could not load this post
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 font-sans">
          {message}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] px-4 py-2.5 text-xs font-semibold font-manrope text-white shadow-md transition-all"
          >
            <FiRefreshCw className="h-4 w-4" />
            <span>Try again</span>
          </button>

          <Link
            href="/posts"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2.5 text-xs font-semibold font-manrope text-slate-700 hover:bg-slate-100 transition-all shadow-2xs"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span>Back to feed</span>
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
  */

  const canManagePost =
    Boolean(user) && (user?.role === "admin" || user?.id === post.authorId.id);

  return (
    <>
      <article className="rounded-3xl border border-slate-200/80 bg-white/95 text-slate-900 p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        {/* Top Section */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-100">
          {/* Author */}
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs ring-2 ring-white/90">
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc ?? undefined}
                  alt={`${post.authorId.name}'s avatar`}
                  className="h-full w-full object-cover"
                  onError={() => setFailedAvatarSrc(avatarSrc)}
                />
              ) : (
                <div className="h-full w-full bg-linear-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold font-manrope text-sm shadow-inner">
                  {getInitials(post.authorId.name)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-manrope text-base font-bold text-slate-900">
                {post.authorId.name}
              </p>

              {post.authorId.headline && (
                <p className="truncate text-xs font-medium text-slate-600 font-sans">
                  {post.authorId.headline}
                </p>
              )}

              {/* Date and Time */}
              <p className="mt-0.5 text-xs font-medium text-slate-500 font-sans">
                {formatDateTime(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Owner / Admin Actions */}
          {canManagePost && (
            <div className="flex items-center gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                title="Edit"
                aria-label="Edit post"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold font-manrope shadow-2xs backdrop-blur-md transition-all cursor-pointer"
              >
                <FiEdit2 className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden sm:inline">Edit</span>
              </Link>

              <button
                type="button"
                onClick={handleOpenDelete}
                disabled={deleteMutation.isPending}
                title="Delete"
                aria-label="Delete post"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200/90 bg-rose-50/80 hover:bg-rose-100 text-rose-700 hover:text-rose-800 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold font-manrope shadow-2xs backdrop-blur-md transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiTrash2 className="h-3.5 w-3.5 text-rose-600" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-6 font-manrope text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          {post.title}
        </h1>

        {/* Body */}
        <div className="mt-6 whitespace-pre-wrap wrap-break-word text-[15px] sm:text-base leading-8 text-slate-800 font-sans">
          {post.body}
        </div>

        {/* Frosted Glass Counters + Share */}
        <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-5">
          {/* Likes & Dislikes */}
          <ReactionButtons
            targetType="post"
            targetId={post.id}
            counts={post.reactionCounts}
          />

          {/* Comment */}
          <div
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs backdrop-blur-md"
            title="Comments"
          >
            <FiMessageCircle className="h-3.5 w-3.5 text-sky-500" />
            <span className="font-bold text-slate-900">{post.commentCount}</span>
            <span className="hidden sm:inline font-medium">
              {post.commentCount === 1 ? "Comment" : "Comments"}
            </span>
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
                <span className="hidden sm:inline font-semibold text-slate-700">Share</span>
              </>
            )}
          </button>
        </div>
      </article>

      {/* Delete confirmation modal */}
      <DeletePostModal
        isOpen={isDeleteOpen}
        postTitle={post.title}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onClose={handleCloseDelete}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </>
  );
}
