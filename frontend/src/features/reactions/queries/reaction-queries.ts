import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { getUserReactions } from "@/services/api/reactions";

import type { ReactionTargetType, UserReactionsMap } from "../types/reaction";
import { getStoredReactions, setStoredReactions } from "../utils/reaction-storage";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeTargetIds(targetIds?: string[]) {
  if (targetIds === undefined) {
    return undefined;
  }

  return [...new Set(targetIds.map((id) => id.trim()).filter(Boolean))].sort();
}

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const reactionKeys = {
  all: ["reactions"] as const,

  mine: (targetType: ReactionTargetType, targetIds?: string[]) => {
    const normalizedIds = normalizeTargetIds(targetIds);

    return [
      ...reactionKeys.all,
      "mine",
      targetType,
      normalizedIds === undefined ? "all" : normalizedIds.join(","),
    ] as const;
  },
};

/*
|--------------------------------------------------------------------------
| Query Hook
|--------------------------------------------------------------------------
*/

export function useUserReactions(
  targetType: ReactionTargetType,
  targetIds?: string[],
  options?: {
    enabled?: boolean;
  },
) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const normalizedIds = normalizeTargetIds(targetIds);

  const hasUsableTargets =
    normalizedIds === undefined || normalizedIds.length > 0;

  const isEnabled =
    (!isAuthLoading ? Boolean(user) : true) &&
    hasUsableTargets &&
    (options?.enabled ?? true);

  return useQuery<UserReactionsMap>({
    queryKey: reactionKeys.mine(targetType, normalizedIds),

    queryFn: async () => {
      const res = await getUserReactions({
        targetType,
        targetIds: normalizedIds,
      });

      const data = res.data ?? {};

      if (normalizedIds === undefined && typeof window !== "undefined") {
        setStoredReactions(targetType, data);
      }

      return data;
    },

    initialData: () => {
      if (typeof window !== "undefined") {
        const stored = getStoredReactions(targetType);
        if (normalizedIds === undefined) {
          return stored;
        }

        const subset: UserReactionsMap = {};
        for (const id of normalizedIds) {
          if (stored[id]) {
            subset[id] = stored[id];
          }
        }
        return Object.keys(subset).length > 0 ? subset : undefined;
      }
      return undefined;
    },

    enabled: isEnabled,

    staleTime: 60 * 1000,
  });
}
