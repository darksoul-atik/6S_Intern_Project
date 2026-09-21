import axios from 'axios';
import { setupInterceptors } from './interceptors';

/**
 * Browser-side Axios instance.
 *
 * CRITICAL ARCHITECTURE CONSTRAINT:
 * baseURL is configured to `/api` (same-origin Next.js BFF proxy routes).
 * Because the JWT lives in an `httpOnly` cookie (`devpulse_token`),
 * browser-side JavaScript cannot and should not read or attach it directly.
 * Instead, requests hit our Next.js BFF route handlers under `src/app/api/*`,
 * which extract the cookie on the server, attach the Bearer token,
 * and proxy securely to the NestJS backend.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupInterceptors(apiClient);
