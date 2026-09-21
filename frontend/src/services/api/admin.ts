import { apiClient } from '@/lib/axios/client';
import type { ApiResponse } from '@/types/api';
import type {
  AdminUser,
  PaginatedResponse,
  AdminUsersFilterParams,
  UpdateAdminUserPayload,
} from '@/features/admin/types/admin';

/*
|--------------------------------------------------------------------------
| Admin API Service
|--------------------------------------------------------------------------
*/

export async function getAdminUsers(
  params: AdminUsersFilterParams,
): Promise<ApiResponse<PaginatedResponse>> {
  const queryParams: Record<string, string | number | boolean> = {
    page: params.page,
    limit: params.limit,
    includeDeleted: params.includeDeleted ?? true,
  };

  if (params.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }

  const res = await apiClient.get<ApiResponse<PaginatedResponse>>('/users', {
    params: queryParams,
  });
  return res.data;
}

export async function updateAdminUser(
  id: string,
  data: UpdateAdminUserPayload,
): Promise<ApiResponse<AdminUser>> {
  const res = await apiClient.patch<ApiResponse<AdminUser>>(
    `/users/${id}/admin`,
    data,
  );
  return res.data;
}

export async function softDeleteUser(
  id: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await apiClient.delete<ApiResponse<{ message: string }>>(
    `/users/${id}`,
  );
  return res.data;
}

export async function restoreUser(
  id: string,
): Promise<ApiResponse<{ message: string }>> {
  const res = await apiClient.post<ApiResponse<{ message: string }>>(
    `/users/${id}/restore`,
  );
  return res.data;
}
