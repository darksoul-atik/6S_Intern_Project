import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getChangelog, syncChangelog } from "../services/changelog-api";
import type {
  ChangelogData,
  ChangelogSyncPayload,
  ChangelogSyncResponse,
} from "../types/changelog";

export const changelogKeys = {
  all: ["changelog"] as const,
  list: (limit: number = 20) => [...changelogKeys.all, "list", limit] as const,
};

export function useChangelogQuery(limit: number = 20) {
  return useQuery<ChangelogData>({
    queryKey: changelogKeys.list(limit),
    queryFn: () => getChangelog(limit),
    staleTime: 30_000,
  });
}

export function useSyncChangelogMutation() {
  const queryClient = useQueryClient();

  return useMutation<ChangelogSyncResponse, Error, ChangelogSyncPayload | undefined>({
    mutationFn: (payload) => syncChangelog(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: changelogKeys.all });
    },
  });
}
