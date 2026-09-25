import { apiClient } from "@/lib/axios/client";
import type { ApiResponse } from "@/types/api";

import type {
  GetReactorsParams,
  GetUserReactionsParams,
  PaginatedReactorsResult,
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

export async function getReactors(
  params: GetReactorsParams,
): Promise<ApiResponse<PaginatedReactorsResult>> {
  const queryParams: Record<string, string | number> = {
    targetType: params.targetType,
    targetId: params.targetId,
  };

  if (params.type) {
    queryParams.type = params.type;
  }
  if (params.page !== undefined) {
    queryParams.page = params.page;
  }
  if (params.limit !== undefined) {
    queryParams.limit = params.limit;
  }

  const res = await apiClient.get<ApiResponse<PaginatedReactorsResult>>(
    "/reactions",
    {
      params: queryParams,
    },
  );

  return res.data;
}

