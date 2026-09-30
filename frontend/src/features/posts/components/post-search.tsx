"use client";

import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiInbox,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";

import { PostCard } from "./post-card";
import { useDebounce } from "@/hooks/use-debounce";
import { usePostSearch } from "../queries/post-queries";
import { useSoftDeletePostMutation } from "../mutations/post-mutations";
import { useUserReactions } from "@/features/reactions/queries/reaction-queries";
import { DeletePostModal } from "./delete-post-modal";

import type { Post } from "../types/post";

const SEARCH_LIMIT = 10;

type PostSearchProps = {
  onSearchActiveChange?: (isActive: boolean) => void;
};

/*
|--------------------------------------------------------------------------
| Post Search
|--------------------------------------------------------------------------
*/

export function PostSearch({ onSearchActiveChange }: PostSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const [deleteError, setDeleteError] = useState<string | null>(null);

  /*
  |--------------------------------------------------------------------------
  | Normalize + debounce
  |--------------------------------------------------------------------------
  */

  const normalizedTerm = useMemo(
    () => searchTerm.trim().toLowerCase(),
    [searchTerm],
  );

  const debouncedTerm = useDebounce(normalizedTerm, 300);

  const isSearchActive = normalizedTerm.length > 0;

  const isWaitingForDebounce =
    normalizedTerm.length >= 2 && normalizedTerm !== debouncedTerm;

  /*
  |--------------------------------------------------------------------------
  | Search query
  |--------------------------------------------------------------------------
  */

  const { data, error, isPending, isError, isFetching, refetch } =
    usePostSearch(debouncedTerm, SEARCH_LIMIT);

  const posts = data?.posts ?? [];

  const { data: userPostReactions = {} } = useUserReactions("post");

  /*
  |--------------------------------------------------------------------------
  | Delete mutation
  |--------------------------------------------------------------------------
  */

  const deleteMutation = useSoftDeletePostMutation();

  const handleDeleteRequest = (post: Post) => {
    setDeleteError(null);
    setPostToDelete(post);
  };

  const handleCloseDelete = () => {
    if (deleteMutation.isPending) {
      return;
    }

    setDeleteError(null);
    setPostToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete || deleteMutation.isPending) {
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
  | Search input
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    const nextNormalizedTerm = value.trim().toLowerCase();

    onSearchActiveChange?.(nextNormalizedTerm.length > 0);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    onSearchActiveChange?.(false);
  };

  /*
  |--------------------------------------------------------------------------
  | Search result state
  |--------------------------------------------------------------------------
  */

  const hasValidSearch = debouncedTerm.length >= 2;

  const isSearching = hasValidSearch && (isPending || isWaitingForDebounce);

  return (
    <>
      <div className="space-y-5">
        {/* Search input */}
        <div className="relative">
          <FiSearch
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => {
              handleSearchChange(event.target.value);
            }}
            placeholder="Search posts..."
            aria-label="Search posts"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-11 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>


        {/* Too-short search */}
        {isSearchActive && normalizedTerm.length < 2 && (
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 text-sm text-slate-600">
            Enter at least 2 characters to search.
          </div>
        )}

        {/* Searching */}
        {isSearchActive && isSearching && (
          <div
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-5 py-8 text-sm font-semibold text-slate-700"
          >
            <FiRefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Searching posts...</span>
          </div>
        )}

        {/* Error */}
        {isSearchActive &&
          hasValidSearch &&
          isError &&
          !isWaitingForDebounce && (
            <div
              role="alert"
              className="rounded-3xl border border-rose-200 bg-white/95 p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                <FiAlertCircle className="h-6 w-6" />
              </div>

              <h2 className="mt-4 font-manrope text-lg font-bold text-slate-900">
                Search failed
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-700">
                {error instanceof Error
                  ? error.message
                  : "Failed to search posts."}
              </p>

              <button
                type="button"
                onClick={() => {
                  void refetch();
                }}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#090d16] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#121827]"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                Try again
              </button>
            </div>
          )}

        {/* No results */}
        {isSearchActive &&
          hasValidSearch &&
          !isSearching &&
          !isError &&
          posts.length === 0 && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <FiInbox className="h-6 w-6" />
              </div>

              <h2 className="mt-4 font-manrope text-lg font-bold text-slate-900">
                No posts found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-700">
                No posts matched &quot;{debouncedTerm}&quot;.
              </p>
            </div>
          )}

        {/* Results */}
        {isSearchActive &&
          hasValidSearch &&
          !isSearching &&
          !isError &&
          posts.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  {data?.total ?? posts.length} result
                  {(data?.total ?? posts.length) === 1 ? "" : "s"} for{" "}
                  <span className="text-slate-950">
                    &quot;{debouncedTerm}&quot;
                  </span>
                </p>

                {isFetching && (
                  <FiRefreshCw
                    className="h-4 w-4 animate-spin text-indigo-600"
                    aria-label="Refreshing search results"
                  />
                )}
              </div>

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
            </div>
          )}
      </div>

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
