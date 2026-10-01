import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it, vi } from 'vitest';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PostsController } from './posts.controller.js';

describe('PostsController - summarization', () => {
  it('should delegate post summarization to PostsService', async () => {
    const postsService = {
      summarizePost: vi.fn().mockResolvedValue({
        summary: 'The post explains NestJS and MongoDB.',
        tags: ['NestJS', 'MongoDB'],
      }),
    };

    const controller = new PostsController(postsService as any);

    const result = await controller.summarizePost('64f1a2b3c4d5e6f7a8b9c0d1');

    expect(postsService.summarizePost).toHaveBeenCalledOnce();

    expect(postsService.summarizePost).toHaveBeenCalledWith(
      '64f1a2b3c4d5e6f7a8b9c0d1',
    );

    expect(result).toEqual({
      summary: 'The post explains NestJS and MongoDB.',
      tags: ['NestJS', 'MongoDB'],
    });
  });

  it('should protect the summarize endpoint with JwtAuthGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PostsController.prototype.summarizePost,
    ) as unknown[];

    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
  });

  it('should propagate errors from PostsService', async () => {
    const error = new Error('Summarization failed');

    const postsService = {
      summarizePost: vi.fn().mockRejectedValue(error),
    };

    const controller = new PostsController(postsService as any);

    await expect(
      controller.summarizePost('64f1a2b3c4d5e6f7a8b9c0d1'),
    ).rejects.toBe(error);
  });
});
