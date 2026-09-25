"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiMessageCircle, FiRefreshCw } from "react-icons/fi";

import { useAuth } from "@/context/AuthContext";

import type { Comment } from "../types/comment";
import { useComments } from "../queries/comment-queries";
import { useDeleteCommentMutation } from "../mutations/comment-mutations";

import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { DeleteCommentModal } from "./delete-comment-modal";
import { useUserReactions } from "@/features/reactions/queries/reaction-queries";

interface CommentsSectionProps {
  postId: string;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const {
    data: comments = [],
    isPending,
    isError,
    error,
    refetch,
  } = useComments(postId);

  const { data: userCommentReactions = {} } = useUserReactions("comment");

  const deleteMutation = useDeleteCommentMutation();

  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [comments]);

  /*
  |--------------------------------------------------------------------------
  | Delete handlers
  |--------------------------------------------------------------------------
  */

  const handleOpenDelete = (comment: Comment) => {
    setDeleteError(null);
    setCommentToDelete(comment);
  };

  const handleCloseDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);
    setCommentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete || deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync({
        commentId: commentToDelete.id,
        postId,
      });

      setCommentToDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete comment.",
      );
    }
  };

  return (
    <section
      id="comments"
      aria-label="Comments"
      className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 text-slate-900 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl sm:p-6"
    >
      {/* Create top-level comment */}
      <div>
        {!isAuthLoading && user && <CommentForm postId={postId} />}

        {!isAuthLoading && !user && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <p>You need to sign in to join the discussion.</p>

            <Link
              href={`/login?redirect=${encodeURIComponent(`/posts/${postId}?focus=comment#comments`)}`}
              className="mt-2 inline-flex font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              Sign in to comment
            </Link>
          </div>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div
          aria-live="polite"
          aria-label="Loading comments"
          className="mt-6 space-y-3"
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-200" />

                <div className="space-y-2">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="h-2.5 w-20 rounded bg-slate-100" />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-4/5 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center"
        >
          <FiAlertCircle className="mx-auto h-5 w-5 text-rose-600" />

          <p className="mt-2 text-sm font-semibold text-rose-700">
            Could not load comments
          </p>

          <p className="mt-1 text-xs text-rose-600">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading comments."}
          </p>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <FiRefreshCw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!isPending && !isError && comments.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-5 py-8 text-center">
          <FiMessageCircle className="mx-auto h-6 w-6 text-slate-400" />

          <p className="mt-3 font-manrope text-sm font-semibold text-slate-700">
            No comments yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Be the first to start the discussion.
          </p>
        </div>
      )}

      {/* Comment tree */}
      {!isPending && !isError && comments.length > 0 && (
        <div className="mt-6 space-y-4">
          {sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onDelete={handleOpenDelete}
              deletingCommentId={
                deleteMutation.isPending ? (commentToDelete?.id ?? null) : null
              }
              userReactions={userCommentReactions}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <DeleteCommentModal
        isOpen={Boolean(commentToDelete)}
        comment={commentToDelete}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
