"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiLoader, FiTrash2, FiX } from "react-icons/fi";

import type { Comment } from "../types/comment";

interface DeleteCommentModalProps {
  isOpen: boolean;
  comment: Comment | null;
  isDeleting: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

const emptySubscribe = () => () => {};

export function DeleteCommentModal({
  isOpen,
  comment,
  isDeleting,
  error = null,
  onClose,
  onConfirm,
}: DeleteCommentModalProps) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const isRootComment = comment?.parentCommentId === null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!mounted || !isOpen || !comment) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-comment-title"
        aria-describedby="delete-comment-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <FiAlertTriangle className="h-5 w-5" />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close delete confirmation"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          <h2
            id="delete-comment-title"
            className="font-manrope text-lg font-bold text-slate-900"
          >
            {isRootComment
              ? "Delete this comment thread?"
              : "Delete this reply?"}
          </h2>

          <p
            id="delete-comment-description"
            className="mt-2 text-sm leading-6 text-slate-600"
          >
            {isRootComment
              ? "This comment and every reply under it will be permanently deleted."
              : "This reply will be permanently deleted."}
          </p>

          <p className="mt-2 text-xs font-medium text-rose-600">
            This action cannot be undone.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <FiLoader className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <FiTrash2 className="h-4 w-4" />
                {isRootComment ? "Delete thread" : "Delete reply"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
