import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

export interface StandardErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors: string[];
  code?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal server error occurred';
    let errors: string[] = [];
    let code: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;

        if (Array.isArray(resObj.message)) {
          // Typically class-validator validation errors
          errors = resObj.message.map((msg) => String(msg));
          message = errors[0] || 'Validation failed';
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else if (typeof resObj.error === 'string') {
          message = resObj.error;
        }

        if (typeof resObj.code === 'string') {
          code = resObj.code;
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Security hardening
    |--------------------------------------------------------------------------
    |
    | Never expose raw messages from unknown/internal errors.
    |
    | Example:
    |   MongoDB connection errors
    |   JWT library errors
    |   provider errors
    |   stack/internal implementation details
    |
    | These remain generic to the client.
    |
    */

    if (!(exception instanceof HttpException)) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected internal server error occurred';
      errors = [];
    }

    const errorPayload: StandardErrorResponse = {
      success: false,
      statusCode: status,
      message,
      errors,
      ...(code ? { code } : {}),
    };

    response.status(status).json(errorPayload);
  }
}
