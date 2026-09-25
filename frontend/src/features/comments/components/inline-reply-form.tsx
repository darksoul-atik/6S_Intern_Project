"use client";

import { useEffect, useState, type RefObject } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiAlertCircle, FiLoader, FiSend, FiX } from "react-icons/fi";

import {
  commentSchema,
  type CommentFormValues,
} from "../schemas/comment-schema";
import { useCreateReplyMutation } from "../mutations/comment-mutations";

interface InlineReplyFormProps {
  postId: string;
  parentCommentId: string;
  replyingToName?: string;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}

export function InlineReplyForm({
  postId,
  parentCommentId,
  replyingToName,
  onClose,
  returnFocusRef,
}: InlineReplyFormProps) {
  const replyMutation = useCreateReplyMutation();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    mode: "onTouched",
    defaultValues: {
      body: "",
    },
  });

  const isBusy = isSubmitting || replyMutation.isPending;

  /*
   * When the reply form opens,
   * move keyboard focus into the textarea.
   */
  useEffect(() => {
    setFocus("body");
  }, [setFocus]);

  /*
   * Close the form and return focus
   * to the Reply button that opened it.
   */
  const closeAndRestoreFocus = () => {
    onClose();

    requestAnimationFrame(() => {
      returnFocusRef.current?.focus();
    });
  };

  const onSubmit = async (values: CommentFormValues) => {
    if (isBusy) {
      return;
    }

    setServerError(null);

    try {
      await replyMutation.mutateAsync({
        postId,
        parentCommentId,
        data: {
          body: values.body,
        },
      });

      reset();

      closeAndRestoreFocus();
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to post reply.",
      );
    }
  };

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !isBusy) {
          event.preventDefault();
          closeAndRestoreFocus();
        }
      }}
      noValidate
      className="mt-3.5 space-y-3 rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xs"
    >
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700 shadow-xs"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      {replyingToName && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span>Replying to</span>
          <span className="font-bold text-purple-600">@{replyingToName}</span>
        </div>
      )}

      <div>
        <textarea
          rows={3}
          maxLength={5000}
          placeholder={
            replyingToName
              ? `Reply to @${replyingToName}...`
              : "Write a reply..."
          }
          disabled={isBusy}
          aria-label="Write a reply"
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "reply-body-error" : undefined}
          {...register("body")}
          className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.body
              ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          }`}
        />

        {errors.body && (
          <p
            id="reply-body-error"
            className="mt-1.5 text-xs font-medium text-rose-600"
          >
            {errors.body.message}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={closeAndRestoreFocus}
          disabled={isBusy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiX className="h-4 w-4" />
          Cancel
        </button>

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#090d16] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#121827] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin text-indigo-400" />
              Replying...
            </>
          ) : (
            <>
              <FiSend className="h-4 w-4 text-indigo-400" />
              Reply
            </>
          )}
        </button>
      </div>
    </form>
  );
}
