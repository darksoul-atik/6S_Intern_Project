import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException, type ExecutionContext } from '@nestjs/common';

import { CommentOwnerGuard } from './comment-owner.guard.js';
import type { CommentsService } from '../comments.service.js';

describe('CommentOwnerGuard', () => {
  let guard: CommentOwnerGuard;
  let mockCommentsService: Partial<CommentsService>;

  beforeEach(() => {
    mockCommentsService = {
      findCommentByIdOrThrow: vi.fn(),
    };
    guard = new CommentOwnerGuard(mockCommentsService as CommentsService);
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

  it('should allow access if user is the comment author', async () => {
    const authorId = '66e138fc29094e137127e4e1';
    const commentId = '66e138fc29094e137127e4e0';
    vi.mocked(mockCommentsService.findCommentByIdOrThrow!).mockResolvedValue({
      _id: commentId,
      authorId: { toString: () => authorId },
    } as any);

    const context = createMockContext(
      { userId: authorId, role: 'user', email: 'user@devpulse.io' },
      { id: commentId },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockCommentsService.findCommentByIdOrThrow).toHaveBeenCalledWith(commentId);
  });

  it('should throw ForbiddenException if user is an admin but NOT the comment author', async () => {
    const authorId = '66e138fc29094e137127e4e1';
    const adminId = '66e138fc29094e137127e4e9';
    const commentId = '66e138fc29094e137127e4e0';
    vi.mocked(mockCommentsService.findCommentByIdOrThrow!).mockResolvedValue({
      _id: commentId,
      authorId: { toString: () => authorId },
    } as any);

    const context = createMockContext(
      { userId: adminId, role: 'admin', email: 'admin@devpulse.io' },
      { id: commentId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have permission to edit this comment'),
    );
  });

  it('should throw ForbiddenException if standard user does not own the comment', async () => {
    const authorId = '66e138fc29094e137127e4e1';
    const differentUserId = '66e138fc29094e137127e4e2';
    const commentId = '66e138fc29094e137127e4e0';
    vi.mocked(mockCommentsService.findCommentByIdOrThrow!).mockResolvedValue({
      _id: commentId,
      authorId: { toString: () => authorId },
    } as any);

    const context = createMockContext(
      { userId: differentUserId, role: 'user', email: 'other@devpulse.io' },
      { id: commentId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException('You do not have permission to edit this comment'),
    );
  });

  it('should propagate NotFoundException if comment is not found', async () => {
    const commentId = '66e138fc29094e137127e4e0';
    vi.mocked(mockCommentsService.findCommentByIdOrThrow!).mockRejectedValue(
      new NotFoundException(`Comment with ID '${commentId}' not found`),
    );

    const context = createMockContext(
      { userId: 'user-1', role: 'user', email: 'user@devpulse.io' },
      { id: commentId },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });
});
