"use client";

import { useEffect } from "react";

import { useForm, useWatch } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { FiAlertCircle, FiLoader, FiSave } from "react-icons/fi";

import { postFormSchema, type PostFormValues } from "./post.schemas";

interface PostFormProps {
  /*
   * CREATE MODE:
   * No initialValues.
   *
   * EDIT MODE:
   * Pass the existing title and body.
   */
  initialValues?: PostFormValues;

  /*
   * Parent page decides what API action happens.
   *
   * Create:
   * POST /api/posts
   *
   * Edit:
   * PATCH /api/posts/:id
   */
  onSubmit: (values: PostFormValues) => Promise<void>;

  /*
   * TanStack Query mutation pending state.
   */
  isPending?: boolean;

  /*
   * Backend/general submission error.
   */
  serverError?: string | null;

  /*
   * Button text.
   */
  submitLabel?: string;

  /*
   * Button text while submitting.
   */
  pendingLabel?: string;
}

const EMPTY_VALUES: PostFormValues = {
  title: "",
  body: "",
};

export function PostForm({
  initialValues,
  onSubmit,
  isPending = false,
  serverError = null,
  submitLabel = "Save post",
  pendingLabel = "Saving...",
}: PostFormProps) {
  /*
  |--------------------------------------------------------------------------
  | React Hook Form
  |--------------------------------------------------------------------------
  */

  const {
    register,
    handleSubmit,
    reset,
    control,

    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),

    mode: "onTouched",

    defaultValues: initialValues ?? EMPTY_VALUES,
  });

  /*
  |--------------------------------------------------------------------------
  | Edit form hydration
  |--------------------------------------------------------------------------
  |
  | When the edit page finishes loading a post,
  | initialValues changes.
  |
  | reset() puts those values into the form.
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!initialValues) {
      return;
    }

    reset({
      title: initialValues.title,
      body: initialValues.body,
    });
  }, [initialValues, reset]);

  /*
  |--------------------------------------------------------------------------
  | Watch values
  |--------------------------------------------------------------------------
  |
  | useWatch() is used instead of watch().
  |
  | This avoids the React Compiler:
  |
  | react-hooks/incompatible-library
  |
  | warning.
  |--------------------------------------------------------------------------
  */

  const titleValue =
    useWatch({
      control,
      name: "title",
    }) ?? "";

  const bodyValue =
    useWatch({
      control,
      name: "body",
    }) ?? "";

  /*
  |--------------------------------------------------------------------------
  | Duplicate submission protection
  |--------------------------------------------------------------------------
  |
  | isSubmitting:
  | React Hook Form is currently submitting.
  |
  | isPending:
  | TanStack Query mutation is still running.
  |--------------------------------------------------------------------------
  */

  const isBusy = isSubmitting || isPending;

  /*
  |--------------------------------------------------------------------------
  | Submit handler
  |--------------------------------------------------------------------------
  */

  const submitForm = async (values: PostFormValues) => {
    /*
     * Extra protection against repeated submission.
     */
    if (isPending) {
      return;
    }

    await onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} noValidate className="space-y-6">
      {/* --------------------------------
          Server Error
      -------------------------------- */}

      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"
        >
          <FiAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />

          <p>{serverError}</p>
        </div>
      )}

      {/* --------------------------------
          Title
      -------------------------------- */}

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label
            htmlFor="post-title"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-300"
          >
            Title
          </label>

          <span
            className={`text-xs ${
              titleValue.length > 200 ? "text-rose-400" : "text-zinc-500"
            }`}
          >
            {titleValue.length}/200
          </span>
        </div>

        <input
          id="post-title"
          type="text"
          maxLength={200}
          placeholder="What are you building or learning?"
          disabled={isBusy}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "post-title-error" : undefined}
          {...register("title")}
          className={`w-full rounded-2xl border bg-white/4 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.title
              ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
          }`}
        />

        {errors.title && (
          <p id="post-title-error" className="mt-1.5 text-xs text-rose-400">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* --------------------------------
          Body
      -------------------------------- */}

      <div>
        <div className="mb-2 flex items-center justify-between gap-4">
          <label
            htmlFor="post-body"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-300"
          >
            Post
          </label>

          <span
            className={`text-xs ${
              bodyValue.length > 20_000 ? "text-rose-400" : "text-zinc-500"
            }`}
          >
            {bodyValue.length.toLocaleString()}
            /20,000
          </span>
        </div>

        <textarea
          id="post-body"
          rows={14}
          maxLength={20_000}
          placeholder="Share your knowledge, experience, question, or idea..."
          disabled={isBusy}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "post-body-error" : undefined}
          {...register("body")}
          className={`w-full resize-y rounded-2xl border bg-white/4 px-4 py-3 text-sm leading-7 text-white outline-none transition-all placeholder:text-zinc-600 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.body
              ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-white/10 focus:border-indigo-500 focus:ring-indigo-500/20"
          }`}
        />
        {errors.body && (
          <p id="post-body-error" className="mt-1.5 text-xs text-rose-400">
            {errors.body.message}
          </p>
        )}
      </div>

      {/* --------------------------------
          Submit
      -------------------------------- */}

      <div className="flex justify-end border-t border-white/10 pt-5">
        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex min-w-36 cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? (
            <>
              <FiLoader className="h-4 w-4 animate-spin" />

              {pendingLabel}
            </>
          ) : (
            <>
              <FiSave className="h-4 w-4" />

              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
