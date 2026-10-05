import axios from "axios";
import type { ApiResponse } from "@/types/api";

/**
 * Low-level session logout request.
 *
 * This intentionally uses the base Axios package instead of apiClient.
 *
 * Reason:
 * apiClient -> interceptors -> session logout
 *
 * Using apiClient here would send the failed logout request back through
 * the same interceptor and could create circular retry behavior.
 */
export async function requestSessionLogout(): Promise<ApiResponse<null>> {
  const response = await axios.post<ApiResponse<null>>(
    "/api/auth/logout",
    undefined,
    {
      withCredentials: true,
    },
  );

  return response.data;
}
