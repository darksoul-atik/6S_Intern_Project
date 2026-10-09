"use client";

import React, { useState } from "react";
import {
  FiGitPullRequest,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiInfo,
} from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import {
  useChangelogQuery,
  useSyncChangelogMutation,
} from "@/features/changelog/queries/use-changelog";
import { ChangelogItem } from "@/features/changelog/components/changelog-item";

function formatTimestamp(dateString?: string | null): string {
  if (!dateString) return "Never";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return (
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }).format(d) + " UTC"
    );
  } catch {
    return dateString;
  }
}

export default function ChangelogPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data, isLoading, isError, error, refetch } = useChangelogQuery();
  const syncMutation = useSyncChangelogMutation();

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSync = async () => {
    setFeedback(null);
    try {
      const res = await syncMutation.mutateAsync(undefined);
      if (res.entry) {
        setFeedback({
          type: "success",
          message: `Successfully synchronized PR #${res.entry.prNumber}: "${res.entry.title}"`,
        });
      } else {
        setFeedback({
          type: "info" as any,
          message: res.message || "No new merged pull requests found on main.",
        });
      }
    } catch (err: unknown) {
      let errMsg = "Failed to synchronize changelog from GitHub.";
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as any).response?.data?.message
      ) {
        errMsg = (err as any).response.data.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setFeedback({
        type: "error",
        message: `Sync failed: ${errMsg}`,
      });
    }
  };

  const entries = data?.entries ?? [];
  const lastSyncedAt = data?.lastSyncedAt;
  const isPending = syncMutation.isPending;

  return (
    <main className="min-h-screen bg-[#090d16] text-white">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        {/* Header Section */}
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider">
              <FiGitPullRequest className="h-4 w-4" />
              <span>Changelog from Main</span>
            </div>
            <h1 className="mt-2 font-manrope text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Project Changelog
            </h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
              Automated release notes and patch updates synchronized directly from merged Pull Requests targeting the <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-indigo-300">main</code> branch.
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 font-mono">
              <FiClock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Last synchronized: </span>
              <span className="text-zinc-300">
                {formatTimestamp(lastSyncedAt)}
              </span>
            </div>
          </div>

          {/* Admin Sync Action */}
          {isAdmin && (
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                id="changelog-sync-btn"
                onClick={handleSync}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-manrope text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
                />
                <span>{isPending ? "Synchronizing PR..." : "Sync latest PR"}</span>
              </button>
            </div>
          )}
        </header>

        {/* Sync Feedback Message */}
        {feedback && (
          <div
            id="changelog-sync-feedback"
            className={`mb-8 flex items-start gap-3 rounded-xl border p-4 text-xs font-medium backdrop-blur-md ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : feedback.type === "error"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  : "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
            }`}
          >
            {feedback.type === "success" && (
              <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            )}
            {feedback.type === "error" && (
              <FiAlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            {feedback.type !== "success" && feedback.type !== "error" && (
              <FiInfo className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
            )}
            <div className="flex-1">
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="ml-auto text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Section: Loading / Error / Empty / List */}
        <section aria-label="Changelog feed">
          {isLoading && (
            <div className="space-y-4" id="changelog-loading-state">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-white/5 bg-[#0f172a]/50 p-6 space-y-4"
                >
                  <div className="flex gap-2">
                    <div className="h-5 w-20 rounded bg-white/10" />
                    <div className="h-5 w-32 rounded bg-white/10" />
                  </div>
                  <div className="h-6 w-3/4 rounded bg-white/10" />
                  <div className="flex gap-4">
                    <div className="h-4 w-24 rounded bg-white/5" />
                    <div className="h-4 w-32 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div
              id="changelog-error-state"
              className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center"
            >
              <FiAlertTriangle className="mx-auto h-8 w-8 text-rose-400" />
              <h3 className="mt-3 text-sm font-semibold text-rose-200">
                Failed to load changelog
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                {error instanceof Error ? error.message : "An unexpected network error occurred."}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
              >
                <FiRefreshCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {!isLoading && !isError && entries.length === 0 && (
            <div
              id="changelog-empty-state"
              className="rounded-2xl border border-dashed border-white/10 bg-[#0f172a]/40 p-12 text-center"
            >
              <FiGitPullRequest className="mx-auto h-10 w-10 text-zinc-500" />
              <h3 className="mt-4 text-base font-semibold text-zinc-300">
                No changelog entries yet
              </h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                No merged pull requests targeting <code className="text-zinc-400 font-mono">main</code> have been saved to the database.
                {isAdmin && " Click the 'Sync latest PR' button above to fetch the latest merged PR."}
              </p>
            </div>
          )}

          {!isLoading && !isError && entries.length > 0 && (
            <div className="space-y-4" id="changelog-entries-list">
              {entries.map((entry) => (
                <ChangelogItem
                  key={entry.id || entry._id || `${entry.source}-${entry.prNumber}`}
                  entry={entry}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
