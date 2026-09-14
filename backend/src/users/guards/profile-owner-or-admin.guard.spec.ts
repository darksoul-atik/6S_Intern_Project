import { describe, it, expect } from 'vitest';
import { ProfileOwnerOrAdminGuard } from './profile-owner-or-admin.guard.js';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('ProfileOwnerOrAdminGuard', () => {
  let guard: ProfileOwnerOrAdminGuard;

  beforeEach(() => {
    guard = new ProfileOwnerOrAdminGuard();
  });

  const createMockContext = (
    user?: { userId: string; role: string },
    params?: { id?: string },
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params: params || {} }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access when user is modifying their own profile', () => {
    const context = createMockContext(
      { userId: 'user-123', role: 'user' },
      { id: 'user-123' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user is admin modifying another user profile', () => {
    const context = createMockContext(
      { userId: 'admin-1', role: 'admin' },
      { id: 'user-456' },
    );
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when target user ID is not specified in params', () => {
    const context = createMockContext({ userId: 'user-123', role: 'user' }, {});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException when user tries to modify another profile and is not admin', () => {
    const context = createMockContext(
      { userId: 'user-123', role: 'user' },
      { id: 'user-456' },
    );
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException(
        'You do not have permission to modify this profile',
      ),
    );
  });

  it('should throw ForbiddenException when user is missing in request', () => {
    const context = createMockContext(undefined, { id: 'user-123' });
    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Authentication required'),
    );
  });
});
