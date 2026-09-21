"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { useParams, useRouter } from "next/navigation";

import {
  FiAlertCircle,
  FiArrowLeft,
  FiEdit3,
  FiRefreshCw,
} from "react-icons/fi";

import { PostForm } from "@/features/posts/PostForm";

import type { PostFormValues } from "@/features/posts/post.schemas";

import { usePost, useUpdatePostMutation } from "@/features/posts/posts.api";

/*
|--------------------------------------------------------------------------
| Loading Skeleton
|--------------------------------------------------------------------------
*/

function EditPostSkeleton() {
  return (
    <div
      aria-label="Loading post"
      aria-live="polite"
      className="animate-pulse rounded-3xl border border-white/10 bg-white/4 p-5 shadow-xl backdrop-blur-xl sm:p-7"
    >
      <div className="h-3 w-20 rounded bg-white/10" />

      <div className="mt-3 h-12 w-full rounded-2xl bg-white/[0.07]" />

      <div className="mt-7 h-3 w-20 rounded bg-white/10" />

      <div className="mt-3 h-72 w-full rounded-2xl bg-white/[0.07]" />

      <div className="mt-6 flex justify-end">
        <div className="h-11 w-36 rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

export default function EditPostPage() {
  const router = useRouter();

  const params = useParams<{
    id: string;
  }>();

  const postId = params.id;

  const {
    data: post,
    isPending: isPostPending,
    isError: isPostError,
    error: postError,
    refetch,
  } = usePost(postId);

  const updateMutation = useUpdatePostMutation();

  const [serverError, setServerError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Stable initial values
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | PostForm uses reset() when initialValues changes.
  |
  | We use useMemo() here so we do NOT create a
  | brand-new object every render.
  |
  | Otherwise the form could keep resetting while
  | the user is typing.
  |--------------------------------------------------------------------------
  */

  const initialValues = useMemo<PostFormValues | undefined>(() => {
    if (!post) {
      return undefined;
    }

    return {
      title: post.title,
      body: post.body,
    };
  }, [post]);

  /*
  |--------------------------------------------------------------------------
  | Update Post
  |--------------------------------------------------------------------------
  */

  const handleUpdate = async (values: PostFormValues) => {
    setServerError(null);

    try {
      const updatedPost = await updateMutation.mutateAsync({
        id: postId,

        data: {
          title: values.title,
          body: values.body,
        },
      });

      /*
       * After successful edit,
       * return to post details.
       */
      router.push(`/posts/${updatedPost.id}`);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to update post.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isPostPending) {
    return (
      <main className="min-h-screen px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <EditPostSkeleton />
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (isPostError || !post || !initialValues) {
    const message =
      postError instanceof Error
        ? postError.message
        : "Could not load this post.";

    return (
      <main className="min-h-screen px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div
            role="alert"
            className="rounded-3xl border border-rose-400/20 bg-rose-500/6 px-6 py-12 text-center"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
              <FiAlertCircle className="h-6 w-6" />
            </div>

            <h1 className="mt-4 font-manrope text-xl font-bold text-white">
              Could not load this post
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
              {message}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void refetch();
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10"
              >
                <FiRefreshCw className="h-4 w-4" />
                Try again
              </button>

              <Link
                href="/posts"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/10"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to feed
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back */}
        <Link
          href={`/posts/${post.id}`}
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/4 hover:text-indigo-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to post
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
              <FiEdit3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Edit Post
              </p>

              <h1 className="mt-1 font-manrope text-3xl font-bold tracking-tight text-white">
                Update your post
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
            Make your changes and save the updated version.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/4 p-5 shadow-xl backdrop-blur-xl sm:p-7">
          <PostForm
            initialValues={initialValues}
            onSubmit={handleUpdate}
            isPending={updateMutation.isPending}
            serverError={serverError}
            submitLabel="Save changes"
            pendingLabel="Saving..."
          />
        </div>
      </div>
    </main>
  );
}
