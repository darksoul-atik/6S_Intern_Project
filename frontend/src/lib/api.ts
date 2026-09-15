import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  errors?: string[];
}

export class ApiError extends Error {
  statusCode: number;
  errors: string[];

  constructor(message: string, statusCode = 400, errors: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export interface RequestOptions extends Partial<AxiosRequestConfig> {
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

/**
 * Configured Axios instance with withCredentials enabled for httpOnly cookies.
 */
export const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor to normalize Axios errors into typed ApiError instances
 * matching the shared DevPulse error envelope.
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const errorData = error.response?.data;
    const statusCode = errorData?.statusCode || error.response?.status || 500;
    const message =
      errorData?.message ||
      error.message ||
      `HTTP Error ${statusCode}`;
    const errors = Array.isArray(errorData?.errors) ? errorData.errors : [];

    return Promise.reject(new ApiError(message, statusCode, errors));
  }
);

/**
 * Typed API client powered by Axios for communicating with the NestJS backend
 * and Next.js internal BFF routes. Reusable across all routes, features, and HTTP verbs.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, body, data, method = 'GET', ...restOptions } = options;

  let requestUrl: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    requestUrl = endpoint;
  } else if (endpoint.startsWith('/api/')) {
    // Internal Next.js BFF Route Handler
    requestUrl = endpoint;
  } else {
    // Direct NestJS backend URL
    requestUrl = `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }

  // Parse body string if JSON string was supplied by caller
  let requestData = data ?? body;
  if (typeof requestData === 'string') {
    try {
      requestData = JSON.parse(requestData);
    } catch {
      // Keep as-is if not valid JSON
    }
  }

  try {
    const response = await axiosInstance.request<ApiResponse<T>>({
      url: requestUrl,
      method,
      params,
      data: requestData,
      headers: headers as Record<string, string>,
      ...restOptions,
    });

    return response.data;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (axios.isAxiosError(err)) {
      const errorData = err.response?.data as ApiResponse | undefined;
      const statusCode = errorData?.statusCode || err.response?.status || 500;
      const message =
        errorData?.message || err.message || `HTTP Error ${statusCode}`;
      const errors = Array.isArray(errorData?.errors) ? errorData.errors : [];
      throw new ApiError(message, statusCode, errors);
    }
    throw new ApiError(
      err instanceof Error ? err.message : 'Unknown network error',
      500,
      []
    );
  }
}
