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

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Generic API client for communicating with the Dev Community backend
 * and Next.js internal BFF routes. Reusable across all routes, features, and HTTP verbs.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, ...restOptions } = options;

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

  const url = new URL(
    requestUrl,
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url.toString(), {
    ...restOptions,
    headers: {
      ...defaultHeaders,
      ...(headers as Record<string, string>),
    },
    // Include cookies for same-origin and cross-origin requests
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.message || `HTTP ${response.status}: ${response.statusText}`;
    const errors = Array.isArray(errorBody.errors) ? errorBody.errors : [];
    throw new ApiError(
      message,
      errorBody.statusCode || response.status,
      errors
    );
  }

  return response.json();
}
