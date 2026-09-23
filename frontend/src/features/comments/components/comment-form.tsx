"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiMessageCircle,
} from "react-icons/fi";

import {
  commentSchema,
  type CommentFormValues,
} from "../schemas/comment-schema";
import { useCreateCommentMutation } from "../mutations/comment-mutations";

interface CommentFormProps {
  postId: string;
}

export function CommentForm({ postId }: CommentFormProps) {
  const createMutation = useCreateCommentMutation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    mode: "onTouched",
    defaultValues: {
      body: "",
    },
  });

  const bodyValue =
    useWatch({
      control,
      name: "body",
    }) ?? "";

  const isBusy = isSubmitting || createMutation.isPending;

  const onSubmit = async (values: CommentFormValues) => {
    if (isBusy) {
      return;
    }

    setServerError(null);
    setSuccessMessage(null);

    try {
      await createMutation.mutateAsync({
        postId,
        data: {
          body: values.body,
        },
      });

      reset({
        body: "",
      });

      setSuccessMessage("Comment posted successfully.");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to post comment.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-700"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700"
        >
          <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="comment-body"
            className="font-manrope text-xs font-bold uppercase tracking-wider text-slate-700"
          >
            Add a comment
          </label>

          <span className="text-xs font-medium text-slate-500">
            {bodyValue.length}/5000
          </span>
        </div>

        <textarea
          id="comment-body"
          rows={4}
          maxLength={5000}
          placeholder="Write a comment..."
          disabled={isBusy}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "comment-body-error" : undefined}
          {...register("body")}
          className={`w-full resize-y rounded-2xl border bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition-all placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.body
              ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
              : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          }`}
        />

        {errors.body && (
          <p
            id="comment-body-error"
            className="mt-1.5 text-xs font-medium text-rose-600"
          >
            {errors.body.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#090d16] px-4 py-2.5 font-manrope text-xs font-semibold text-white transition-all hover:bg-[#121827] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Posting...</span>
            </>
          ) : (
            <>
              <FiMessageCircle className="h-4 w-4 text-indigo-400" />
              <span>Post comment</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
