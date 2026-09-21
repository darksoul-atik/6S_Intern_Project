"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiEdit3 } from "react-icons/fi";

import { PostForm } from "@/features/posts/PostForm";

import type { PostFormValues } from "@/features/posts/post.schemas";

import { useCreatePostMutation } from "@/features/posts/posts.api";

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

      /*
       * User decision:
       *
       * After creating a post,
       * go directly to its detail page.
       */
      router.push(`/posts/${newPost.id}`);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Failed to create post.",
      );
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Back */}
        <Link
          href="/posts"
          className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-white/4 hover:text-indigo-300"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to feed
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
              <FiEdit3 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                New Post
              </p>

              <h1 className="mt-1 font-manrope text-3xl font-bold tracking-tight text-white">
                Share something
              </h1>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400">
            Share something you learned, built, discovered, or want to discuss
            with the DevPulse community.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-3xl border border-white/10 bg-white/4 p-5 shadow-xl backdrop-blur-xl sm:p-7">
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
  );
}
