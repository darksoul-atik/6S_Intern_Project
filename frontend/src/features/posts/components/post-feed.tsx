"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
  FiRefreshCw,
} from "react-icons/fi";

import { DeletePostModal } from "./delete-post-modal";

import { PostCard } from "./post-card";

import type { Post } from "../types/post";
import { useInfinitePosts } from "../queries/post-queries";
import { useSoftDeletePostMutation } from "../mutations/post-mutations";
import { useUserReactions } from "@/features/reactions/queries/reaction-queries";

const POSTS_PER_PAGE = 10;

/*
|--------------------------------------------------------------------------
| Initial feed skeleton
|--------------------------------------------------------------------------
*/

function PostFeedSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading posts" aria-live="polite">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-slate-200/80 bg-white/95 p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-slate-200/80" />

            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-32 rounded bg-slate-200/80" />
              <div className="h-2.5 w-48 rounded bg-slate-200/50" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="h-5 w-3/5 rounded bg-slate-200/80" />
            <div className="h-3 w-full rounded bg-slate-200/50" />
            <div className="h-3 w-11/12 rounded bg-slate-200/50" />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-14 rounded-xl bg-slate-200/60" />
              <div className="h-7 w-14 rounded-xl bg-slate-200/60" />
            </div>
            <div className="h-8 w-24 rounded-xl bg-slate-200/80" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PostFeed() {
  /*
  |--------------------------------------------------------------------------
  | Infinite feed
  |--------------------------------------------------------------------------
  */

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isPending,
    isError,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = useInfinitePosts(POSTS_PER_PAGE);

  const { data: userPostReactions = {} } = useUserReactions("post");

  /*
  |--------------------------------------------------------------------------
  | Delete mutation
  |--------------------------------------------------------------------------
  */

  const deleteMutation = useSoftDeletePostMutation();

  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Observer target
  |--------------------------------------------------------------------------
  */

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Flatten + deduplicate
  |--------------------------------------------------------------------------
  */

  const posts = useMemo(() => {
    if (!data) {
      return [];
    }

    const uniquePosts = new Map<string, Post>();

    for (const page of data.pages) {
      for (const post of page.posts) {
        if (!uniquePosts.has(post.id)) {
          uniquePosts.set(post.id, post);
        }
      }
    }

    return Array.from(uniquePosts.values());
  }, [data]);

  /*
  |--------------------------------------------------------------------------
  | Intersection Observer
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    if (!hasNextPage) {
      return;
    }

    if (isFetchNextPageError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry?.isIntersecting) {
          return;
        }

        if (isFetchingNextPage) {
          return;
        }

        if (!hasNextPage) {
          return;
        }

        void fetchNextPage();
      },
      {
        rootMargin: "300px 0px",

        threshold: 0,
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isFetchNextPageError]);

  /*
  |--------------------------------------------------------------------------
  | Open delete modal
  |--------------------------------------------------------------------------
  */

  const handleDeleteRequest = (post: Post) => {
    setDeleteError(null);

    setPostToDelete(post);
  };

  /*
  |--------------------------------------------------------------------------
  | Close delete modal
  |--------------------------------------------------------------------------
  */

  const handleCloseDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);

    setPostToDelete(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Confirm soft delete
  |--------------------------------------------------------------------------
  */

  const handleConfirmDelete = async () => {
    if (!postToDelete) {
      return;
    }

    if (deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(postToDelete.id);

      setPostToDelete(null);
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete post.",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial loading
  |--------------------------------------------------------------------------
  */

  if (isPending) {
    return <PostFeedSkeleton />;
  }

  /*
  |--------------------------------------------------------------------------
  | Initial error
  |--------------------------------------------------------------------------
  */

  if (isError && posts.length === 0) {
    const message =
      error instanceof Error ? error.message : "Failed to load posts.";

    return (
      <div
        role="alert"
        className="rounded-3xl border border-rose-200 bg-white/95 p-8 sm:p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl text-slate-900"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <FiAlertCircle className="h-6 w-6" />
        </div>

        <h2 className="mt-4 font-manrope text-lg font-bold text-slate-900">
          Could not load the feed
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-700 font-sans">
          {message}
        </p>

        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#090d16] hover:bg-[#121827] px-4 py-2 text-xs font-semibold font-manrope text-white shadow-md hover:shadow-lg transition-all"
        >
          <FiRefreshCw className="h-3.5 w-3.5 text-indigo-400" />
          <span>Try again</span>
        </button>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty feed
  |--------------------------------------------------------------------------
  */

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl text-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
          <FiInbox className="h-6 w-6" />
        </div>

        <h2 className="mt-4 font-manrope text-lg font-bold text-slate-900">
          No posts yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-700 font-sans">
          The DevPulse feed is empty right now. Be the first developer to share an update, architecture insight, or question!
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Feed
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <div className="space-y-5">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentReaction={userPostReactions[post.id] ?? null}
            onDelete={handleDeleteRequest}
            isDeleting={
              deleteMutation.isPending && postToDelete?.id === post.id
            }
          />
        ))}
        {/* Next page loading */}
        {isFetchingNextPage && (
          <div
            aria-live="polite"
            className="flex items-center justify-center gap-2 py-5 text-xs font-semibold font-manrope text-slate-700"
          >
            <FiRefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            <span>Loading more posts...</span>
          </div>
        )}
        {/* Next page error */}
        {isFetchNextPageError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-white/95 px-5 py-4 text-center shadow-xs backdrop-blur-md text-slate-900"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-semibold font-manrope text-rose-600">
              <FiAlertCircle className="h-4 w-4" />
              <span>Could not load more posts</span>
            </div>

            <button
              type="button"
              onClick={() => {
                void fetchNextPage();
              }}
              disabled={isFetchingNextPage}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold font-manrope text-slate-700 shadow-2xs hover:bg-slate-50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw className="h-3 w-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
        {/* End */}
        {!hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
          <div
            className="flex items-center justify-center gap-2 py-6 text-xs font-semibold font-manrope text-slate-600"
            aria-label="End of feed"
          >
            <FiCheckCircle className="h-4 w-4 text-emerald-600" />
            <span>You&apos;re all caught up.</span>
          </div>
        )}
        {/* Observer */}
        {hasNextPage && !isFetchNextPageError && (
          <div ref={loadMoreRef} className="h-10" aria-hidden="true" />
        )}
      </div>

      {/* Delete Modal */}
      <DeletePostModal
        isOpen={Boolean(postToDelete)}
        postTitle={postToDelete?.title ?? ""}
        isDeleting={deleteMutation.isPending}
        error={deleteError}
        onClose={handleCloseDelete}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </>
  );
}
