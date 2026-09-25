import { apiClient } from "@/lib/axios/client";
import type { ApiResponse } from "@/types/api";

import type {
  GetUserReactionsParams,
  ToggleReactionPayload,
  ToggleReactionResponse,
  UserReactionsMap,
} from "@/features/reactions/types/reaction";

/*
|--------------------------------------------------------------------------
| Reactions API Service
|--------------------------------------------------------------------------
*/

export async function toggleReaction(
  payload: ToggleReactionPayload,
): Promise<ApiResponse<ToggleReactionResponse>> {
  const res = await apiClient.post<ApiResponse<ToggleReactionResponse>>(
    "/reactions",
    payload,
  );

  return res.data;
}

export async function getUserReactions({
  targetType,
  targetIds,
}: GetUserReactionsParams): Promise<ApiResponse<UserReactionsMap>> {
  const params: {
    targetType: string;
    targetIds?: string;
  } = {
    targetType,
  };

  if (targetIds && targetIds.length > 0) {
    params.targetIds = targetIds.join(",");
  }

  const res = await apiClient.get<ApiResponse<UserReactionsMap>>(
    "/reactions/mine",
    {
      params,
    },
  );

  return res.data;
}
