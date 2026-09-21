"use client";

import { useEffect } from "react";

import { AnimatePresence, motion } from "framer-motion";

import { FiAlertTriangle, FiLoader, FiTrash2, FiX } from "react-icons/fi";

interface DeletePostModalProps {
  isOpen: boolean;

  postTitle: string;

  isDeleting?: boolean;

  error?: string | null;

  onClose: () => void;

  onConfirm: () => void;
}

export function DeletePostModal({
  isOpen,
  postTitle,
  isDeleting = false,
  error = null,
  onClose,
  onConfirm,
}: DeletePostModalProps) {
  /*
  |--------------------------------------------------------------------------
  | Escape key
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (!isDeleting) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            transition={{
              duration: 0.18,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-post-title"
            aria-describedby="delete-post-description"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
            className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white/98 p-6 sm:p-7 shadow-2xl backdrop-blur-2xl text-slate-900"
          >
            {/* Top */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <FiAlertTriangle className="h-6 w-6" />
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                aria-label="Close delete confirmation"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="mt-5">
              <h2
                id="delete-post-title"
                className="font-manrope text-xl font-bold text-slate-900"
              >
                Delete this post?
              </h2>

              <p
                id="delete-post-description"
                className="mt-2 text-sm leading-6 text-slate-600 font-sans"
              >
                This will remove the post from the DevPulse community feed.
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-manrope">
                  Post Title
                </p>

                <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800 font-sans">
                  {postTitle}
                </p>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500 font-sans">
                This is a soft delete. Restore controls can be accessed by administrators.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs font-medium text-rose-800"
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-semibold font-manrope text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <FiLoader className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <FiTrash2 className="h-4 w-4" />
                    <span>Delete post</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
