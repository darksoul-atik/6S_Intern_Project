const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Generic API client for communicating with the Dev Community backend.
 * Reusable across all routes, features, and HTTP verbs.
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, ...restOptions } = options;

  const url = new URL(
    endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
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
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}
