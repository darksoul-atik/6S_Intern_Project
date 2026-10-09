import { apiClient } from "@/lib/axios/client";
import type { ApiResponse } from "@/types/api";
import type {
  ChangelogData,
  ChangelogSyncPayload,
  ChangelogSyncResponse,
} from "../types/changelog";

export async function getChangelog(limit = 20): Promise<ChangelogData> {
  const res = await apiClient.get<ApiResponse<ChangelogData>>("/changelog", {
    params: { limit },
  });

  if (!res.data.data) {
    throw new Error(res.data.message || "Failed to load changelog data");
  }

  return res.data.data;
}

export async function syncChangelog(
  payload?: ChangelogSyncPayload,
): Promise<ChangelogSyncResponse> {
  const res = await apiClient.post<ApiResponse<ChangelogSyncResponse>>(
    "/changelog/sync",
    payload || {},
  );

  if (!res.data.data) {
    throw new Error(res.data.message || "Failed to synchronize changelog");
  }

  return res.data.data;
}
