"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCornerUpLeft, FiEdit2, FiMenu, FiTrash2 } from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import {
  formatDateTime,
  getInitials,
  resolveAvatarUrl,
} from "@/lib/utils/formatters";

import type { Comment } from "../types/comment";
import { InlineReplyForm } from "./inline-reply-form";
import { ReactionButtons } from "@/features/reactions/components/reaction-buttons";
import type { UserReactionsMap } from "@/features/reactions/types/reaction";
import { useUpdateCommentMutation } from "../mutations/comment-mutations";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  level?: number;
  userReactions?: UserReactionsMap;
  onDelete?: (comment: Comment) => void;
  deletingCommentId?: string | null;
}

export function CommentItem({
  comment,
  postId,
  level = 0,
  userReactions,
  onDelete,
  deletingCommentId = null,
}: CommentItemProps) {
  const { user } = useAuth();

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);

  // Hamburger dropdown & editing states
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [editError, setEditError] = useState<string | null>(null);

  const replyButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const updateMutation = useUpdateCommentMutation();
  const isUpdating = updateMutation.isPending;

  const isRootComment = comment.parentCommentId === null;

  const currentReaction =
    userReactions === undefined
      ? undefined
      : userReactions[comment.id] ?? null;

  // Only the author can edit their own comment or reply
  const canEdit = Boolean(user) && user?.id === comment.authorId.id;

  // Author or admin can delete
  const canDelete =
    Boolean(user) &&
    (user?.role === "admin" || user?.id === comment.authorId.id);

  const hasMenuActions = canEdit || (canDelete && Boolean(onDelete));
  const isDeleting = deletingCommentId === comment.id;

  // Close hamburger dropdown on outside click or Escape key
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

  const handleStartEdit = () => {
    setShowMenu(false);
    setEditBody(comment.body);
    setEditError(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editBody.trim();
    if (!trimmed || isUpdating) return;

    if (trimmed === comment.body) {
      setIsEditing(false);
      return;
    }

    setEditError(null);
    try {
      await updateMutation.mutateAsync({
        commentId: comment.id,
        postId,
        data: { body: trimmed },
      });
      setIsEditing(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update comment";
      setEditError(message);
    }
  };

  const sortedReplies = useMemo(() => {
    return [...comment.replies].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeA - timeB;
    });
  }, [comment.replies]);

  const avatarSrc = resolveAvatarUrl(comment.authorId.avatarUrl);
  const showAvatar = Boolean(avatarSrc && failedAvatarSrc !== avatarSrc);

  const handleReplyToggle = () => {
    setShowReplyForm((current) => !current);
  };

  return (
    <article
      className={
        level > 0
          ? "ml-3 border-l-2 border-slate-200/80 pl-3 sm:ml-8 sm:pl-4"
          : ""
      }
    >
      <div
        className={`rounded-2xl border transition-all ${
          level > 0
            ? "border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
            : "border-slate-200/90 bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.09)]"
        }`}
      >
        {/* Header: Author Info + Top-Right Hamburger Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc ?? undefined}
                  alt={`${comment.authorId.name}'s avatar`}
                  className="h-full w-full object-cover"
                  onError={() => setFailedAvatarSrc(avatarSrc)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-indigo-600 to-emerald-500 font-manrope text-xs font-bold text-white">
                  {getInitials(comment.authorId.name)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-manrope text-sm font-bold text-slate-900">
                {comment.authorId.name}
              </p>

              {comment.authorId.headline && (
                <p className="truncate text-xs text-slate-500">
                  {comment.authorId.headline}
                </p>
              )}

              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                <span>{formatDateTime(comment.createdAt)}</span>
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <span className="text-2xs italic text-slate-400 font-normal">
                    (edited)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Top-Right Hamburger Menu */}
          {hasMenuActions && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                aria-label="Comment options"
                aria-expanded={showMenu}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              >
                <FiMenu className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 py-1 shadow-lg backdrop-blur-md">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100/80 hover:text-indigo-600"
                    >
                      <FiEdit2 className="h-3.5 w-3.5 text-indigo-500" />
                      Edit
                    </button>
                  )}

                  {canDelete && onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(comment);
                      }}
                      disabled={isDeleting}
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Comment Body or Inline Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="mt-3 space-y-2">
            {editError && (
              <p className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
                {editError}
              </p>
            )}
            <textarea
              ref={editTextareaRef}
              autoFocus
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditBody(comment.body);
                }
              }}
              maxLength={5000}
              rows={3}
              disabled={isUpdating}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-2xs text-slate-400">
                {editBody.length} / 5000
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditBody(comment.body);
                  }}
                  disabled={isUpdating}
                  className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editBody.trim()}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
            {comment.body}
          </p>
        )}

        {/* Bottom Actions Row: Like, Dislike, and Reply moved to Bottom Right Corner */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {/* Reactions (Likes & Dislikes) */}
          <ReactionButtons
            targetType="comment"
            targetId={comment.id}
            postId={postId}
            counts={comment.reactionCounts ?? { like: 0, dislike: 0 }}
            currentReaction={currentReaction}
            size="sm"
          />

          {/* Only root comments can receive replies */}
          {user && isRootComment && (
            <button
              ref={replyButtonRef}
              type="button"
              onClick={handleReplyToggle}
              aria-expanded={showReplyForm}
              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            >
              <FiCornerUpLeft className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Recursive replies (chronological stack with latest reply at bottom) */}
      {sortedReplies.length > 0 && (
        <div className="mt-3 space-y-3">
          {sortedReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              level={level + 1}
              userReactions={userReactions}
              onDelete={onDelete}
              deletingCommentId={deletingCommentId}
            />
          ))}
        </div>
      )}

      {/* Inline reply form at bottom of the reply stack */}
      {showReplyForm && isRootComment && (
        <div className="mt-3 ml-3 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-slate-200/80">
          <InlineReplyForm
            postId={postId}
            parentCommentId={comment.id}
            onClose={() => setShowReplyForm(false)}
            returnFocusRef={replyButtonRef}
          />
        </div>
      )}
    </article>
  );
}
