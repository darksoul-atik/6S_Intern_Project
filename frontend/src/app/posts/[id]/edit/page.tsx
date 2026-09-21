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

import { PostForm } from "@/features/posts/components/post-form";
import type { PostFormValues } from "@/features/posts/schemas/post-schema";
import { usePost } from "@/features/posts/queries/post-queries";
import { useUpdatePostMutation } from "@/features/posts/mutations/post-mutations";

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
      className="animate-pulse rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl space-y-6"
    >
      <div className="h-4 w-24 rounded bg-slate-200/80" />
      <div className="h-12 w-full rounded-2xl bg-slate-200/50" />
      <div className="h-4 w-24 rounded bg-slate-200/80" />
      <div className="h-64 w-full rounded-2xl bg-slate-200/50" />
      <div className="flex justify-end">
        <div className="h-11 w-36 rounded-xl bg-slate-200/80" />
      </div>
    </div>
  );
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
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
  */

  const initialValues = useMemo<PostFormValues | undefined>(() => {
    if (!post) return undefined;

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

      router.push(`/posts/${updatedPost.id}`);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to update post.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Dot Texture */}
      <div
        className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-size-[24px_24px] opacity-60 pointer-events-none"
        aria-hidden="true"
      />

      {/* Radiant Glow Orbs */}
      <div
        className="absolute top-12 left-1/4 -translate-x-1/2 w-137.5 h-125 rounded-full bg-linear-to-tr from-indigo-300/30 via-emerald-200/20 to-transparent blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute top-28 right-1/4 translate-x-1/3 w-150 h-130 rounded-full bg-linear-to-bl from-emerald-300/25 via-indigo-200/20 to-transparent blur-[130px] pointer-events-none"
        aria-hidden="true"
      />

      <main className="relative z-10 px-4 sm:px-6 md:px-10 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {/* Back */}
          <Link
            href={post ? `/posts/${post.id}` : "/posts"}
            className="inline-flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            <span>Back to {post ? "post" : "feed"}</span>
          </Link>

          {/* Loading */}
          {isPostPending && <EditPostSkeleton />}

          {/* Error */}
          {(isPostError || (!isPostPending && (!post || !initialValues))) && (
            <div
              role="alert"
              className="rounded-3xl border border-rose-200/80 bg-white/80 p-8 sm:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <FiAlertCircle className="h-6 w-6" />
              </div>

              <h1 className="mt-4 font-manrope text-xl font-bold text-slate-900">
                Could not load this post
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 font-sans">
                {postError instanceof Error
                  ? postError.message
                  : "Could not load this post."}
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
          )}

          {/* Form */}
          {!isPostPending && post && initialValues && (
            <>
              {/* Header */}
              <div className="pb-2 border-b border-slate-200/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
                    <FiEdit3 className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 font-manrope">
                      Edit Post
                    </p>

                    <h1 className="mt-0.5 font-manrope text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                      Update your post
                    </h1>
                  </div>
                </div>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 font-sans">
                  Make your adjustments and save the updated version.
                </p>
              </div>

              <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
                <PostForm
                  initialValues={initialValues}
                  onSubmit={handleUpdate}
                  isPending={updateMutation.isPending}
                  serverError={serverError}
                  submitLabel="Save changes"
                  pendingLabel="Saving..."
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
