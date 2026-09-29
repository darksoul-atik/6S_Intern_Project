"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const FEED_SORTS = ["top", "latest", "most-discussed"] as const;

export type FeedSort = (typeof FEED_SORTS)[number];

const DEFAULT_FEED_SORT: FeedSort = "top";

function isFeedSort(value: string | null): value is FeedSort {
  return FEED_SORTS.includes(value as FeedSort);
}

export function useFeedSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sortParam = searchParams.get("sort");

  const sort: FeedSort = isFeedSort(sortParam) ? sortParam : DEFAULT_FEED_SORT;

  useEffect(() => {
    if (sortParam === null || isFeedSort(sortParam)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", DEFAULT_FEED_SORT);

    router.replace(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams, sortParam]);

  function setSort(nextSort: FeedSort) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSort);

    router.push(`${pathname}?${params.toString()}`);
  }

  return {
    sort,
    setSort,
  };
}
