"use client";

import { useFeedSort, type FeedSort } from "../hooks/use-feed-sort";

const tabs: { label: string; value: FeedSort }[] = [
  {
    label: "Top Ranked",
    value: "top",
  },
  {
    label: "Latest",
    value: "latest",
  },
  {
    label: "Most Discussed",
    value: "most-discussed",
  },
];

export function FeedTabs() {
  const { sort, setSort } = useFeedSort();

  return (
    <div
      className="flex gap-2 border-b border-gray-200"
      role="tablist"
      aria-label="Feed sorting"
    >
      {tabs.map((tab) => {
        const isActive = sort === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => setSort(tab.value)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
