import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SummarizerRateLimitError,
  SummarizerUnavailableError,
} from './errors/summarizer.errors.js';
import type { SummarizerProvider } from './providers/summarizer-provider.interface.js';
import { SummarizerService } from './summarizer.service.js';

describe('SummarizerService', () => {
  let provider: SummarizerProvider;
  let service: SummarizerService;

  beforeEach(() => {
    provider = {
      summarize: vi.fn(),
    };

    service = new SummarizerService(provider);
  });

  it('should return a valid summarizer result', async () => {
    vi.mocked(provider.summarize).mockResolvedValue({
      summary: 'The post explains how to build an API with NestJS.',
      tags: ['NestJS', 'MongoDB'],
    });

    const result = await service.summarize({
      title: 'Building a NestJS API',
      body: 'I built an API using NestJS and MongoDB.',
    });

    expect(result).toEqual({
      summary: 'The post explains how to build an API with NestJS.',
      tags: ['NestJS', 'MongoDB'],
    });

    expect(provider.summarize).toHaveBeenCalledOnce();

    expect(provider.summarize).toHaveBeenCalledWith({
      title: 'Building a NestJS API',
      body: 'I built an API using NestJS and MongoDB.',
    });
  });

  it('should reject malformed provider output with 502', async () => {
    vi.mocked(provider.summarize).mockResolvedValue({
      summary: 123,
      tags: 'NestJS',
    });

    await expect(
      service.summarize({
        title: 'Test post',
        body: 'Test body',
      }),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('should return 503 when the provider is unavailable', async () => {
    vi.mocked(provider.summarize).mockRejectedValue(
      new SummarizerUnavailableError(),
    );

    await expect(
      service.summarize({
        title: 'Test post',
        body: 'Test body',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('should return 429 when the provider rate limit is reached', async () => {
    vi.mocked(provider.summarize).mockRejectedValue(
      new SummarizerRateLimitError(),
    );

    try {
      await service.summarize({
        title: 'Test post',
        body: 'Test body',
      });

      throw new Error('Expected summarize() to throw');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);

      if (!(error instanceof HttpException)) {
        throw error;
      }

      expect(error.getStatus()).toBe(429);
    }
  });

  it('should return 504 when the provider takes longer than 8 seconds', async () => {
    vi.useFakeTimers();

    try {
      vi.mocked(provider.summarize).mockImplementation(
        () => new Promise(() => undefined),
      );

      const resultPromise = service.summarize({
        title: 'Slow post',
        body: 'This provider never responds.',
      });

      const expectation = expect(resultPromise).rejects.toBeInstanceOf(
        GatewayTimeoutException,
      );

      await vi.advanceTimersByTimeAsync(8_000);

      await expectation;
    } finally {
      vi.useRealTimers();
    }
  });
});
