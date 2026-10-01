"use client";

import axios from "axios";
import { FiAlertCircle, FiRefreshCw, FiZap } from "react-icons/fi";

import { useSummarizePostMutation } from "../mutations/post-mutations";

type PostSummaryPanelProps = {
  postId: string;
};

function getSummaryErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 429) {
      return "The AI service is receiving too many requests. Please try again later.";
    }

    if (status === 502) {
      return "The AI returned an invalid response. Please try again.";
    }

    if (status === 503) {
      return "The AI service is currently unavailable. Please try again later.";
    }

    if (status === 504) {
      return "The AI service took too long to respond. Please try again.";
    }

    if (status === 401) {
      return "Please log in to summarize this post.";
    }

    if (status === 404) {
      return "This post is no longer available.";
    }
  }

  return "Unable to generate a summary. Please try again.";
}

export function PostSummaryPanel({ postId }: PostSummaryPanelProps) {
  const summarizeMutation = useSummarizePostMutation();

  function handleSummarize() {
    if (summarizeMutation.isPending) {
      return;
    }

    summarizeMutation.mutate(postId);
  }

  const summary = summarizeMutation.data;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5"
      aria-labelledby="ai-summary-heading"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FiZap className="h-4 w-4 text-indigo-600" aria-hidden="true" />

              <h2
                id="ai-summary-heading"
                className="text-sm font-semibold text-slate-900"
              >
                AI Summary
              </h2>
            </div>

            {!summary && !summarizeMutation.isError && (
              <p className="mt-1 text-sm text-slate-500">
                Generate a quick summary and technical skill tags for this post.
              </p>
            )}
          </div>

          {!summary && !summarizeMutation.isError && (
            <button
              type="button"
              onClick={handleSummarize}
              disabled={summarizeMutation.isPending}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiZap className="h-4 w-4" aria-hidden="true" />

              {summarizeMutation.isPending ? "Summarizing..." : "Summarize"}
            </button>
          )}
        </div>

        {summarizeMutation.isPending && (
          <div
            className="rounded-xl bg-slate-50 p-4"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm text-slate-600">Generating summary...</p>
          </div>
        )}

        {summarizeMutation.isError && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <FiAlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                aria-hidden="true"
              />

              <div className="min-w-0">
                <p className="text-sm text-red-700">
                  {getSummaryErrorMessage(summarizeMutation.error)}
                </p>

                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={summarizeMutation.isPending}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRefreshCw className="h-4 w-4" aria-hidden="true" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {summary && (
          <div className="space-y-4" aria-live="polite">
            <p className="text-sm leading-6 text-slate-700">
              {summary.summary}
            </p>

            {summary.tags.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Technical skills
                </p>

                <div className="flex flex-wrap gap-2">
                  {summary.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
