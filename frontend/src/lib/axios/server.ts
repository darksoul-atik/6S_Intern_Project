import axios, { type AxiosInstance } from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { setupInterceptors } from './interceptors';

/**
 * Server-side Axios client factory.
 *
 * Used for direct server-to-backend communication (e.g., inside
 * Next.js Server Components, Server Actions, or Route Handlers)
 * where cookies can be read via `cookies()` and explicitly attached.
 */
export function createServerApiClient(token?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  setupInterceptors(instance);

  return instance;
}
