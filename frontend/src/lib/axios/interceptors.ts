import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { ApiError, type ApiResponse } from '@/types/api';

export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (error instanceof ApiError) {
        return Promise.reject(error);
      }

      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const statusCode = errorData?.statusCode || error.response?.status || 500;
        const message =
          errorData?.message || error.message || `HTTP Error ${statusCode}`;
        const errors = Array.isArray(errorData?.errors) ? errorData.errors : [];
        const data = errorData?.data;

        return Promise.reject(new ApiError(message, statusCode, errors, data));
      }

      return Promise.reject(
        new ApiError(
          error instanceof Error ? error.message : 'Unknown network error',
          500,
          []
        )
      );
    }
  );
}
