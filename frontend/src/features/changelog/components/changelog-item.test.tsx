import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ChangelogItem } from "./changelog-item";
import type { ChangelogEntry } from "../types/changelog";

describe("ChangelogItem", () => {
  const mockEntry: ChangelogEntry = {
    prNumber: 42,
    title: "fix login cookie flags",
    authorLogin: "alice",
    mergedAt: "2026-01-15T10:30:00.000Z",
    htmlUrl: "https://github.com/darksoul-atik/6S_Intern_Project/pull/42",
    baseBranch: "main",
    source: "mock",
    syncedAt: "2026-01-15T11:00:00.000Z",
    owner: "darksoul-atik",
    repo: "6S_Intern_Project",
  };

  const realEntry: ChangelogEntry = {
    prNumber: 1,
    title: "test: verify GitHub changelog integration",
    authorLogin: "darksoul-atik",
    mergedAt: "2026-10-09T09:55:05.000Z",
    htmlUrl: "https://github.com/darksoul-atik/6S_Intern_Project/pull/1",
    baseBranch: "main",
    source: "github-app",
    syncedAt: "2026-10-09T10:00:00.000Z",
    owner: "darksoul-atik",
    repo: "6S_Intern_Project",
  };

  it("renders PR details safely for a mock entry with Sample Mock Data indicator", () => {
    render(<ChangelogItem entry={mockEntry} />);

    expect(screen.getByText("PR #42")).toBeInTheDocument();
    expect(screen.getByText("fix login cookie flags")).toBeInTheDocument();
    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText(/merged into main/i)).toBeInTheDocument();
    expect(screen.getByText("Sample Mock Data")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /view on github/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/darksoul-atik/6S_Intern_Project/pull/42",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders real GitHub PR entry without Sample Mock Data badge", () => {
    render(<ChangelogItem entry={realEntry} />);

    expect(screen.getByText("PR #1")).toBeInTheDocument();
    expect(screen.getByText("test: verify GitHub changelog integration")).toBeInTheDocument();
    expect(screen.getByText("@darksoul-atik")).toBeInTheDocument();
    expect(screen.queryByText("Sample Mock Data")).not.toBeInTheDocument();
  });
});
