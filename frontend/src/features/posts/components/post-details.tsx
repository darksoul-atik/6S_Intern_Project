"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiEdit2,
  FiMessageCircle,
  FiMoreVertical,
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
import { useUserReactions } from "@/features/reactions/queries/reaction-queries";

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

  const { data: userReactions } = useUserReactions("post", [postId], {
    enabled: Boolean(postId),
  });

  const currentReaction =
    userReactions === undefined ? undefined : (userReactions[postId] ?? null);

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const deleteMutation = useSoftDeletePostMutation();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
            <Link
              href={`/developers/${post.authorId.id}`}
              className="group/avatar flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs ring-2 ring-white/90 transition hover:ring-indigo-500/20"
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
                <div className="h-full w-full bg-linear-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white font-bold font-manrope text-sm shadow-inner transition-transform group-hover/avatar:scale-105">
                  {getInitials(post.authorId.name)}
                </div>
              )}
            </Link>

            <div className="min-w-0">
              <Link
                href={`/developers/${post.authorId.id}`}
                className="block truncate font-manrope text-base font-bold text-slate-900 transition-colors hover:text-indigo-600 hover:underline"
              >
                {post.authorId.name}
              </Link>

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

          {/* Owner / Admin Actions (Three-dot menu) */}
          {canManagePost && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="Post options"
                aria-expanded={showMenu}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              >
                <FiMoreVertical className="h-5 w-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 py-1 shadow-lg backdrop-blur-md">
                  <Link
                    href={`/posts/${post.id}/edit`}
                    onClick={() => setShowMenu(false)}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold font-manrope text-slate-700 transition hover:bg-slate-100/80 hover:text-indigo-600"
                  >
                    <FiEdit2 className="h-3.5 w-3.5 text-amber-500" />
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleOpenDelete();
                    }}
                    disabled={deleteMutation.isPending}
                    className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold font-manrope text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FiTrash2 className="h-3.5 w-3.5 text-rose-500" />
                    Delete
                  </button>
                </div>
              )}
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
            currentReaction={currentReaction}
          />

          {/* Comment */}
          <a
            href="#comments"
            onClick={(e) => {
              e.preventDefault();
              const textarea = document.getElementById("comment-body");
              if (textarea) {
                textarea.scrollIntoView({ behavior: "smooth", block: "center" });
                textarea.focus();
              } else {
                document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="group/comment inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/80 hover:bg-sky-50/90 hover:border-sky-300 hover:text-sky-700 px-2.5 sm:px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs backdrop-blur-md transition-all active:scale-95"
            title="Jump to comments"
          >
            <FiMessageCircle className="h-3.5 w-3.5 text-sky-500 transition-transform group-hover/comment:scale-110" />
            <span className="font-bold text-slate-900 group-hover/comment:text-sky-950">{post.commentCount}</span>
            <span className="hidden sm:inline font-medium group-hover/comment:text-sky-800">
              {post.commentCount === 1 ? "Comment" : "Comments"}
            </span>
          </a>

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
