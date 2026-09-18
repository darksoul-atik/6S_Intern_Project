import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException, type ExecutionContext } from '@nestjs/common';
import { PostOwnerOrAdminGuard } from './post-owner-or-admin.guard.js';
import type { PostsService } from '../posts.service.js';

describe('PostOwnerOrAdminGuard', () => {
  let guard: PostOwnerOrAdminGuard;
  let mockPostsService: Partial<PostsService>;

  beforeEach(() => {
    mockPostsService = {
      findAnyPostByIdOrThrow: vi.fn(),
    };
    guard = new PostOwnerOrAdminGuard(mockPostsService as PostsService);
  });

  const createMockContext = (
    user?: { userId: string; role: string; email: string },
    params?: { id?: string },
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: params || {} }),
      }),
    }) as unknown as ExecutionContext;

  it('should throw ForbiddenException if user is not authenticated', async () => {
    const context = createMockContext(undefined, { id: '66e138fc29094e137127e4e0' });
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('Authentication required'),
    );
  });

  it('should allow access immediately if user has role admin without checking post', async () => {
    const context = createMockContext(
      { userId: 'admin-1', role: 'admin', email: 'admin@devpulse.io' },
      { id: '66e138fc29094e137127e4e0' },
    );
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPostsService.findAnyPostByIdOrThrow).not.toHaveBeenCalled();
  });

  it('should allow access if user is the original post author', async () => {
    const authorId = '66e138fc29094e137127e4e1';
    const postId = '66e138fc29094e137127e4e0';
    vi.mocked(mockPostsService.findAnyPostByIdOrThrow!).mockResolvedValue({
      _id: postId,
      authorId: { toString: () => authorId },
    } as any);

    const context = createMockContext(
      { userId: authorId, role: 'user', email: 'user@devpulse.io' },
      { id: postId },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPostsService.findAnyPostByIdOrThrow).toHaveBeenCalledWith(postId);
  });

  it('should throw ForbiddenException if standard user does not own the post', async () => {
    const authorId = '66e138fc29094e137127e4e1';
    const differentUserId = '66e138fc29094e137127e4e2';
    const postId = '66e138fc29094e137127e4e0';
    vi.mocked(mockPostsService.findAnyPostByIdOrThrow!).mockResolvedValue({
      _id: postId,
      authorId: { toString: () => authorId },
    } as any);

    const context = createMockContext(
      { userId: differentUserId, role: 'user', email: 'other@devpulse.io' },
      { id: postId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have permission to modify this post'),
    );
  });

  it('should propagate NotFoundException if post is not found', async () => {
    const postId = '66e138fc29094e137127e4e0';
    vi.mocked(mockPostsService.findAnyPostByIdOrThrow!).mockRejectedValue(
      new NotFoundException(`Post with ID '${postId}' not found`),
    );

    const context = createMockContext(
      { userId: 'user-1', role: 'user', email: 'user@devpulse.io' },
      { id: postId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });
});
