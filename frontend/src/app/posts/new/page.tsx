"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiEdit3 } from "react-icons/fi";

import { PostForm } from "@/features/posts/components/post-form";
import type { PostFormValues } from "@/features/posts/schemas/post-schema";
import { useCreatePostMutation } from "@/features/posts/mutations/post-mutations";

export default function CreatePostPage() {
  const router = useRouter();
  const createMutation = useCreatePostMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Create Post
  |--------------------------------------------------------------------------
  */

  const handleCreate = async (values: PostFormValues) => {
    setServerError(null);

    try {
      const newPost = await createMutation.mutateAsync({
        title: values.title,
        body: values.body,
      });

      router.push(`/posts/${newPost.id}`);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to create post.",
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
            href="/posts"
            className="inline-flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold font-manrope text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white border border-slate-200/70 rounded-xl px-3 sm:px-3.5 py-2 backdrop-blur-md shadow-xs transition-all"
          >
            <FiArrowLeft className="h-3.5 w-3.5" />
            <span>Back to feed</span>
          </Link>

          {/* Header */}
          <div className="pb-2 border-b border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-2xs">
                <FiEdit3 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 font-manrope">
                  New Post
                </p>

                <h1 className="mt-0.5 font-manrope text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Share with Developers
                </h1>
              </div>
            </div>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 font-sans">
              Share something you learned, built, discovered, or want to discuss
              with the DevPulse community.
            </p>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-white/80 bg-white/75 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl">
            <PostForm
              onSubmit={handleCreate}
              isPending={createMutation.isPending}
              serverError={serverError}
              submitLabel="Publish post"
              pendingLabel="Publishing..."
            />
          </div>
        </div>
      </main>
    </div>
  );
}
