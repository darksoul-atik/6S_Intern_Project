import { ApiError } from '@/types/api';

/**
 * Extracts a safe, human-readable error message and field-specific error list
 * from an unknown caught error, specifically handling NestJS and Next.js BFF ApiErrors.
 */
export function extractAuthErrorMessage(err: unknown): {
  message: string;
  errors: string[];
} {
  if (err instanceof ApiError) {
    if (err.statusCode === 409) {
      return {
        message:
          'This email address is already registered. Please sign in or use another email.',
        errors: err.errors || [],
      };
    }
    if (err.statusCode === 401) {
      return {
        message:
          err.message || 'Invalid email or password. Please verify your credentials.',
        errors: err.errors || [],
      };
    }
    if (err.statusCode === 400 && err.errors && err.errors.length > 0) {
      return {
        message: 'Please correct the highlighted errors before continuing.',
        errors: err.errors,
      };
    }
    return {
      message: err.message || 'An error occurred during authentication.',
      errors: err.errors || [],
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message,
      errors: [],
    };
  }

  return {
    message: 'An unexpected network or server error occurred.',
    errors: [],
  };
}
