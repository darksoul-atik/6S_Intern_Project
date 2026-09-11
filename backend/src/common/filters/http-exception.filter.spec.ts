import { describe, it, expect, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter.js';
import { BadRequestException, ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('should format standard HttpException with single message', () => {
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;

    const exception = new BadRequestException('Invalid credentials');
    filter.catch(exception, mockHost);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: 'Invalid credentials',
      errors: [],
    });
  });

  it('should format validation errors array properly into errors and message', () => {
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    const mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;

    const exception = new BadRequestException({
      statusCode: 400,
      message: ['email must be an email', 'password must be longer than 6 characters'],
      error: 'Bad Request',
    });
    filter.catch(exception, mockHost);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      statusCode: 400,
      message: 'email must be an email',
      errors: [
        'email must be an email',
        'password must be longer than 6 characters',
      ],
    });
  });
});
