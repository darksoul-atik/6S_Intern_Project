"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiInbox,
  FiRefreshCw,
} from "react-icons/fi";

import { DeletePostModal } from "./DeletePostModal";

import { PostCard } from "./PostCard";

import {
  type Post,
  useInfinitePosts,
  useSoftDeletePostMutation,
} from "./posts.api";

const POSTS_PER_PAGE = 10;

/*
|--------------------------------------------------------------------------
| Initial feed skeleton
|--------------------------------------------------------------------------
*/

function PostFeedSkeleton() {
  return (
    <div className="space-y-5" aria-label="Loading posts" aria-live="polite">
      {Array.from({
        length: 3,
      }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-white/10 bg-white/4 p-5 shadow-xl backdrop-blur-xl sm:p-6"
        >
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/10" />

            <div className="flex-1">
              <div className="h-3 w-32 rounded bg-white/10" />
              <div className="mt-2 h-2.5 w-44 rounded bg-white/[0.07]" />
              <div className="mt-2 h-2 w-20 rounded bg-white/6" />
            </div>
          </div>

          <div className="mt-6">
            <div className="h-5 w-3/5 rounded bg-white/10" />

            <div className="mt-4 h-3 w-full rounded bg-white/[0.07]" />
            <div className="mt-2 h-3 w-11/12 rounded bg-white/[0.07]" />
            <div className="mt-2 h-3 w-3/4 rounded bg-white/[0.07]" />
          </div>

          <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-4">
            <div className="h-3 w-10 rounded bg-white/[0.07]" />
            <div className="h-3 w-10 rounded bg-white/[0.07]" />
            <div className="h-3 w-10 rounded bg-white/[0.07]" />
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
        className="rounded-3xl border border-rose-400/20 bg-rose-500/6 px-6 py-10 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
          <FiAlertCircle className="h-6 w-6" />
        </div>

        <h2 className="mt-4 font-manrope text-lg font-bold text-white">
          Could not load the feed
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
          {message}
        </p>

        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10"
        >
          <FiRefreshCw className="h-4 w-4" />
          Try again
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
      <div className="rounded-3xl border border-white/10 bg-white/4 px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
          <FiInbox className="h-6 w-6" />
        </div>

        <h2 className="mt-4 font-manrope text-lg font-bold text-white">
          No posts yet
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
          The DevPulse feed is empty right now. New community posts will appear
          here.
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
            className="flex items-center justify-center gap-2 py-5 text-sm text-zinc-400"
          >
            <FiRefreshCw className="h-4 w-4 animate-spin" />

            <span>Loading more posts...</span>
          </div>
        )}
        {/* Next page error */}
        {isFetchNextPageError && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-400/20 bg-rose-500/6 px-5 py-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-rose-300">
              <FiAlertCircle className="h-4 w-4" />
              Could not load more posts
            </div>

            <button
              type="button"
              onClick={() => {
                void fetchNextPage();
              }}
              disabled={isFetchingNextPage}
              className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        )}
        {/* End */}
        {!hasNextPage && !isFetchingNextPage && !isFetchNextPageError && (
          <div
            className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-500"
            aria-label="End of feed"
          >
            <FiCheckCircle className="h-4 w-4 text-emerald-400" />

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
