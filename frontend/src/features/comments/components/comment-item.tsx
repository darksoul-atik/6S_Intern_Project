"use client";

import { useRef, useState } from "react";
import { FiCornerUpLeft, FiTrash2 } from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";
import {
  formatDateTime,
  getInitials,
  resolveAvatarUrl,
} from "@/lib/utils/formatters";

import type { Comment } from "../types/comment";
import { InlineReplyForm } from "./inline-reply-form";

interface CommentItemProps {
  comment: Comment;
  postId: string;
  level?: number;
  onDelete?: (comment: Comment) => void;
  deletingCommentId?: string | null;
}

export function CommentItem({
  comment,
  postId,
  level = 0,
  onDelete,
  deletingCommentId = null,
}: CommentItemProps) {
  const { user } = useAuth();

  const [showReplyForm, setShowReplyForm] = useState(false);
  const [failedAvatarSrc, setFailedAvatarSrc] = useState<string | null>(null);

  const replyButtonRef = useRef<HTMLButtonElement>(null);

  const isRootComment = comment.parentCommentId === null;

  const canDelete =
    Boolean(user) &&
    (user?.role === "admin" || user?.id === comment.authorId.id);

  const isDeleting = deletingCommentId === comment.id;

  const avatarSrc = resolveAvatarUrl(comment.authorId.avatarUrl);

  const showAvatar = Boolean(avatarSrc && failedAvatarSrc !== avatarSrc);

  const handleReplyToggle = () => {
    setShowReplyForm((current) => !current);
  };

  return (
    <article
      className={
        level > 0 ? "ml-4 border-l border-slate-200 pl-3 sm:ml-10 sm:pl-5" : ""
      }
    >
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
        {/* Author */}
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

              <p className="mt-0.5 text-xs text-slate-400">
                {formatDateTime(comment.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Comment body */}
        <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
          {comment.body}
        </p>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Only root comments can receive replies */}
          {user && isRootComment && (
            <button
              ref={replyButtonRef}
              type="button"
              onClick={handleReplyToggle}
              aria-expanded={showReplyForm}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <FiCornerUpLeft className="h-3.5 w-3.5" />
              Reply
            </button>
          )}

          {canDelete && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment)}
              disabled={isDeleting}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiTrash2 className="h-3.5 w-3.5" />

              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        {/* Inline reply form */}
        {showReplyForm && isRootComment && (
          <InlineReplyForm
            postId={postId}
            parentCommentId={comment.id}
            onClose={() => setShowReplyForm(false)}
            returnFocusRef={replyButtonRef}
          />
        )}
      </div>

      {/* Recursive replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              level={level + 1}
              onDelete={onDelete}
              deletingCommentId={deletingCommentId}
            />
          ))}
        </div>
      )}
    </article>
  );
}
