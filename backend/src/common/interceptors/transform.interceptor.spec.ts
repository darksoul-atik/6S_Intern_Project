import { describe, it, expect } from 'vitest';
import { of, lastValueFrom } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor.js';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();

  it('should wrap raw data into { success: true, data }', async () => {
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of({ test: 'hello' }),
    };

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({
      success: true,
      data: { test: 'hello' },
    });
  });

  it('should not double wrap if already formatted as { success: true, data }', async () => {
    const mockContext = {} as ExecutionContext;
    const preformatted = {
      success: true as const,
      data: { status: 'ok' },
    };
    const mockCallHandler: CallHandler = {
      handle: () => of(preformatted),
    };

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual(preformatted);
  });

  it('should attach message if object provides { data, message }', async () => {
    const mockContext = {} as ExecutionContext;
    const mockCallHandler: CallHandler = {
      handle: () => of({ data: { id: 1 }, message: 'Created successfully' }),
    };

    const result$ = interceptor.intercept(mockContext, mockCallHandler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({
      success: true,
      data: { id: 1 },
      message: 'Created successfully',
    });
  });
});
