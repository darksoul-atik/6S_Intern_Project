import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { getUserReactions } from "@/services/api/reactions";
import type { UserReactionsMap } from "../types/reaction";

/*
|--------------------------------------------------------------------------
| Query Keys
|--------------------------------------------------------------------------
*/

export const reactionKeys = {
  all: ["reactions"] as const,

  mine: (targetIds?: string[]) =>
    [
      ...reactionKeys.all,
      "mine",
      targetIds ? [...targetIds].sort().join(",") : "all",
    ] as const,
};

/*
|--------------------------------------------------------------------------
| Query Hook
|--------------------------------------------------------------------------
*/

export function useUserReactions(targetIds?: string[], options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const isEnabled = Boolean(user) && (options?.enabled ?? true);

  return useQuery<UserReactionsMap>({
    queryKey: reactionKeys.mine(targetIds),
    queryFn: async () => {
      const res = await getUserReactions(targetIds);
      return res.data ?? {};
    },
    enabled: isEnabled,
    staleTime: 60 * 1000,
  });
}
