"use client";

import React from "react";
import { FiExternalLink, FiGitMerge, FiUser, FiClock, FiCheckCircle } from "react-icons/fi";
import type { ChangelogEntry } from "../types/changelog";

function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    }).format(d) + " UTC";
  } catch {
    return dateString;
  }
}

interface ChangelogItemProps {
  entry: ChangelogEntry;
}

export function ChangelogItem({ entry }: ChangelogItemProps) {
  const isMock = entry.source === "mock";
  const safeUrl = entry.htmlUrl && entry.htmlUrl.startsWith("https://")
    ? entry.htmlUrl
    : undefined;

  return (
    <article
      id={`changelog-entry-${entry.prNumber}`}
      className="group relative rounded-2xl border border-white/10 bg-[#0f172a]/70 p-6 shadow-xl backdrop-blur-md transition-all hover:border-indigo-500/40 hover:bg-[#111c38]/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 py-1 font-mono text-xs font-semibold text-indigo-300 border border-indigo-500/30">
            <FiGitMerge className="h-3.5 w-3.5 text-indigo-400" />
            PR #{entry.prNumber}
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs text-emerald-400 border border-emerald-500/20">
            <FiCheckCircle className="h-3 w-3" />
            merged into {entry.baseBranch}
          </span>

          {isMock && (
            <span
              id={`changelog-mock-badge-${entry.prNumber}`}
              className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-300"
            >
              Sample Mock Data
            </span>
          )}
        </div>

        {safeUrl && (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`changelog-pr-link-${entry.prNumber}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-indigo-300"
          >
            <span>View on GitHub</span>
            <FiExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="pt-4">
        <h3 className="font-manrope text-base font-semibold text-white transition-colors group-hover:text-indigo-200">
          {entry.title}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <FiUser className="h-3.5 w-3.5 text-zinc-500" />
            <span>Author:</span>
            <span className="font-mono text-zinc-200">@{entry.authorLogin}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <FiClock className="h-3.5 w-3.5 text-zinc-500" />
            <span>Merged:</span>
            <span className="text-zinc-300">{formatDate(entry.mergedAt)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <span>Synced:</span>
            <span>{formatDate(entry.syncedAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
