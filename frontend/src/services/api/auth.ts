import { apiClient } from '@/lib/axios/client';
import type { ApiResponse } from '@/types/api';
import type {
  AuthUser,
  LoginResponseData,
  SignupResponseData,
} from '@/features/auth/types/auth';
import type { LoginInput, SignupInput } from '@/features/auth/schemas/auth-schema';

export async function loginUser(
  data: LoginInput
): Promise<ApiResponse<LoginResponseData>> {
  const res = await apiClient.post<ApiResponse<LoginResponseData>>(
    '/auth/login',
    {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    }
  );
  return res.data;
}

export async function signupUser(
  data: SignupInput
): Promise<ApiResponse<SignupResponseData>> {
  const res = await apiClient.post<ApiResponse<SignupResponseData>>(
    '/auth/signup',
    {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    }
  );
  return res.data;
}

export async function logoutUser(): Promise<ApiResponse<null>> {
  const res = await apiClient.post<ApiResponse<null>>('/auth/logout');
  return res.data;
}

export async function getCurrentUser(): Promise<ApiResponse<AuthUser>> {
  const res = await apiClient.get<ApiResponse<AuthUser>>('/auth/me');
  return res.data;
}

export async function checkAdminAccess(): Promise<ApiResponse<Record<string, unknown>>> {
  const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/auth/admin-check'
  );
  return res.data;
}
